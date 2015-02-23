
define(['crafty', './Util'], function(Crafty, u) {
    const activateAnnounceTime = 3000;
    const unitAnnounceTime = 500;

    const damageTextExpireTime = 1000;

    var attack = function(aggressor, defender, callback) {
        /* Do the attack */
        var magnitude = aggressor.attack(defender);

        /* Make damage numbers */
        var text = Crafty.e("2D, Canvas, Text, Expires, Tween")
            .attr({x: defender.x + defender.w/2, y: defender.y})
            .text(magnitude)
            .textFont({family: 'Georgia', size: '20px', weight: '900'})
            .expires(damageTextExpireTime)
            .bind("Expired", callback);
        text.tween({y: text.y - text.h - 10}, damageTextExpireTime/4, 'easeOutQuad');

        /* Check if we need to kill the unit off */
        if(defender.isDead()) {
            defender.addComponent("Tween");
            defender.tween({alpha: 0}, damageTextExpireTime/2, 'easeOutQuad');
            defender.bind("TweenEnd", function() {
                this.destroy();
            });
        }
    }

    var GameController = function(faction, inputs, objects, doneCallback) {
        var self = this;

        var unitManager = objects.unitManager;
        var terrain = objects.terrain;
        var gui = objects.gui;
        var vis = objects.vis;
        var camera = objects.camera;

        u.assert(unitManager, 'No UnitManager passed to GameController');
        u.assert(terrain, 'No Terrain passed to GameController');
        u.assert(gui, 'No GUI passed to GameController');
        u.assert(vis, 'No TerrainVisualizer passed to GameController');
        u.assert(camera, 'No CameraControls passed to GameController');

        var stack = [];

        /* Overarching state for the controller; stays around
         * when the temp state changes */
        var unitList = null;
        var curUnit = null;
        var curUnitIndex = 0;
        var lastBFSResult = null;

        /* Variables comprising the state; changes nearly every time
         * the selected cell on the map changes, or when a button
         * is pressed */
        var selectMode = null;
        var selection = null;
        var highlight = null;
        var actions = null;
        var centerText = null;
        var selectedUnit = null;
        var enemyUnit = null;
        var selectCallback = null;

        /* Called when the current unit's turn is over, and
         * we should change to the next one */
        var nextUnit = function() {
            curUnitIndex++;
            if(curUnitIndex < unitList.length) {
                curUnit = unitList[curUnitIndex];

                var cameraAnimationDone = function() {
                    /* Select new unit */
                    stack[0].selection = curUnit.getCell();
                    stack[0].selectedUnit = curUnit;
                    /* Go back to initial state */
                    useState(rewindStates());
                    Crafty.unbind("CameraAnimationDone", cameraAnimationDone);
                }

                if(!camera.inBounds(curUnit)) {
                    /* Center camera on new unit over some time */
                    camera.centerOn(curUnit, unitAnnounceTime);
                    /* Only pass control back when animation is done */
                    Crafty.bind("CameraAnimationDone", cameraAnimationDone);
                } else {
                    /* If the camera didn't have to animate, just pass control */
                    cameraAnimationDone();
                }
            } else {
                /* This faction's turn is done, we're passing off control.
                 * Go back to initial state, but don't use it */
                rewindStates();
                /* Null out the current state */
                useState({
                    selectMode: null,
                    selection: null,
                    highlight: null,
                    actions: null,
                    centerText: null,
                    selectedUnit: null,
                    enemyUnit: null,
                    selectCallback: null,
                });
                /* We're done */
                doneCallback();
            }
        }

        /* Cancel button; it's the same for all cancels */
        var cancelAction = {
            name: 'Cancel',
            callback: null
        };

        var useState = function(state) {
            selectMode = state.selectMode;
            selection = state.selection;
            highlight = state.highlight;
            actions = state.actions;
            centerText = state.centerText;
            selectedUnit = state.selectedUnit;
            enemyUnit = state.enemyUnit;
            selectCallback = state.selectCallback;

            vis.selectMode(selectMode);
            vis.selection(selection);
            vis.highlight(highlight);
            gui.setCenterText(centerText);
            inputs.setActions(actions);
            inputs.setSelectCallback(selectCallback);

            if(selectedUnit) {
                gui.displayUnitInfo(selectedUnit, 'left');
            } else {
                gui.hideInfo('left');
            }

            if(state.enemyUnit) {
                gui.displayUnitInfo(enemyUnit, 'right');
            } else {
                gui.hideInfo('right');
            }

            inputs.doAction(objects, state);
        }

        var pushState = function() {
            var tmpstate = {
                selectMode: selectMode,
                selection: selection,
                highlight: highlight,
                actions: actions,
                centerText: centerText,
                selectCallback: selectCallback,
                selectedUnit: selectedUnit,
                enemyUnit: enemyUnit
            }
            stack.push(tmpstate);
            useState(tmpstate);
        }
        
        var popState = function() {
            /* Never pop the initial state */
            if(stack.length > 1) {
                var state = stack.pop();
                return state;
            } else {
                return stack[0];
            }
        }

        var rewindStates = function() {
            while(stack.length > 1) {
                stack.pop();
            }
            return stack[0];
        }

        /* Now that we have popState, set the cancel button callback */
        cancelAction.callback = function() {
            popState();
            useState(stack[stack.length-1]);
        }

        var getMoveAndAttack = function(unit) {
            highlightedCells = {main: [], extra: []};
            var totalLimit = unit.getMoveRange() + unit.getAttack().range;
            lastBFSResult = terrain.bfs(unit.getCell(), totalLimit, function(terrain, cell, num) {
                var unitOnPoint = unitManager.getUnitForCell(cell);
                var passable = terrain.isGround(cell.site);
                var skip = false;
                if (passable && unitOnPoint) {
                    /* We want to show that we can attack units of other factions, but
                     * not attack units of our faction; additionally, we want to move
                     * through units of our faction, but not through units of other factions */
                    if(num <= unit.getMoveRange()) {
                        if((selectedUnit.getFaction() !== unitOnPoint.getFaction())) {
                            passable = false;
                        } else {
                            skip = true;
                        }
                    } else if((selectedUnit.getFaction() === unitOnPoint.getFaction())) {
                        skip = true;
                    }
                }

                if(skip) {
                    return -1;
                } else {
                    return passable;
                }
            }, function(cell, num) {
                if(num <= unit.getMoveRange()) {
                    highlightedCells.main.push(cell);
                } else {
                    highlightedCells.extra.push(cell);
                }
            });
            return highlightedCells;
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * moveSelectCallback */
        var guiMoveCallback = function() {
            highlightedCells = getMoveAndAttack(selectedUnit);
            highlight = highlightedCells;
            selectMode = 'highlight';
            actions = [ cancelAction ];
            selectCallback = moveSelectCallback;

            pushState();
        }

        /* Callback for when "attack" button is hit in gui. Transitions to 
         * freeSelectCallback. */
        var guiAttackCallback = function() {
            highlightedCells = [];
            terrain.bfs(selectedUnit.getCell(),
                    selectedUnit.getAttack().range, function(terrain, cell) {
                /* Allow target to be anything passable */
                return terrain.isGround(cell.site);
            }, function(cell) {
                highlightedCells.push(cell);
            });

            actions = [cancelAction]; 
            highlight = highlightedCells;
            selectMode = 'highlight';
            selectCallback = attackSelectCallback;
            pushState();
        }

        /* Callback when user selects any cell, during free select mode. */
        var freeSelectCallback = function(data) {
            var cell = data.cell;

            selectCallback = freeSelectCallback;
            selectMode = 'free';
            selection = cell;
            var unitOnCell = unitManager.getUnitForCell(cell);

            if(unitOnCell !== null) {
                selectedUnit = unitOnCell;
                if(selectedUnit === curUnit) {
                    actions = [{
                        name: 'Move',
                        callback: selectedUnit.hasMoved() ? null : guiMoveCallback,
                    }, {
                        name: 'Attack',
                        callback: selectedUnit.hasAttacked() ? null : guiAttackCallback
                    },
                    null,
                    {
                        name: 'Skip',
                        callback: nextUnit
                    }];
                    highlight = null;
                } else {
                    highlightedCells = getMoveAndAttack(selectedUnit);
                    highlight = highlightedCells;
                    actions = [ cancelAction ];
                }
            } else {
                selectedUnit = null;
                highlight = null;
                actions = [ cancelAction ];
            }
            /* If we had selected a different cell, we don't want to push more
             * states onto the stack - pop the previous one */
            popState();
            pushState();
        }

        /* Callback when user selects a cell to move a unit to.
         * Note that we don't need to check if it's a valid cell; we only
         * receive the callback if it's a highlighted cell. */
        var moveSelectCallback = function(data) {
            var path = terrain.reconstructPath(selectedUnit.getCell(), data.cell, lastBFSResult);
            highlight = path;
            selection = data.cell;
            selectMode = 'confirm';
            actions = [ cancelAction ];
            selectCallback = moveConfirmCallback;
            pushState();
        }

        /* Callback when user confirms a cell to move a unit to. */
        var moveConfirmCallback = function(data) {
            unitManager.moveUnit(selectedUnit, data.cell);
            rewindStates();
            /* Check if the unit's turn is over */
            if(curUnit.isTurnOver()) {
                /* It's time to advance to the next unit */
                nextUnit();
            } else {
                /* Reselect the current unit */
                freeSelectCallback({cell: selectedUnit.getCell()});
            }
        }

        /* Callback when user chooses a unit to attack.
         * XXX: Only supports single-target attacks for now.
         */
        var attackSelectCallback = function(data) {
            var cell = data.cell;
            var unitOnCell = unitManager.getUnitForCell(cell);
            if(unitOnCell) {
                var attack = selectedUnit.getAttack();
                enemyUnit = unitOnCell;
                selection = cell;
                selectMode = 'confirm';
                highlight = null;
                actions = [ cancelAction ];
                centerText = attack.magnitude + " " + attack.type + " damage";
                selectCallback = attackConfirmCallback;
                pushState();
            } else {
                /* XXX: Actually display an error to user */
                console.log('No unit!');
            }
        }

        /* Callback when user confirms the unit he's attacking. */
        var attackConfirmCallback = function(data) {
            u.assert(enemyUnit);
            var attacker = curUnit;
            var defender = enemyUnit;

            /* Null the state before we display time-consuming attack effects
             * so that the user can't control */
            selectMode = null;
            selection = null;
            highlight = null;
            actions = null;
            centerText = null;
            selectedUnit = null;
            enemyUnit = null;
            selectCallback = null;
            pushState();

            /* Do attack effects, like damage numbers */
            attack(attacker, defender, function() {
                /* Check if the unit's turn is over */
                if(curUnit.isTurnOver()) {
                    /* It's time to advance to the next unit */
                    nextUnit();
                } else {
                    /* Reselect the current unit */
                    freeSelectCallback({cell: curUnit.getCell()});
                }
            });
        }

        /* Sets this GameController to active. Announces the faction that was
         * set active, then selects the first unit in the player's turn order. */
        this.setActive = function() {
            /* Turn mouselook off for the announcement */
            camera.mouselook(false);
            /* Give all our controlled units a new turn */
            for(var i = 0; i < unitList.length; i++) {
                unitList[i].newTurn();
            }
            /* First unit is the unit with the highest speed */
            curUnitIndex = 0;
            curUnit = unitList[curUnitIndex];
            /* Center on the new unit being controlled */
            camera.centerOn(curUnit, activateAnnounceTime/3);

            /* Announce the new faction's turn */
            gui.announce(faction, activateAnnounceTime, function() {
                /* This is the callback when the announcement is finished
                 * Turn mouselook back on */
                camera.mouselook(true);
                /* Act as if we just selected the first unit's cell */
                freeSelectCallback({cell: curUnit.getCell()});
            });
        }

        this.init = function() {
            /* Grab the unit list for this faction and copy it */
            unitList = unitManager.getUnitListForFaction(faction).slice();
            u.assert(unitList.length > 0, 'Tried to create a controller for ' + faction + ' but it has no units');
            /* Sort it by descending speed (this, incidentally, is why we copied) */
            unitList.sort(function(u1,u2) {
                return u2.getSpeed() - u1.getSpeed();
            });

            /* Bind events occuring on unit deaths */
            for(var i = 0 ; i < unitList.length; i++) {
                unitList[i].bind("Remove", function() {
                    /* Remove the dead unit from our list */
                    var index = unitList.indexOf(this);
                    u.assert(index >= 0);
                    unitList.splice(index, 1);
                });
            }
        }

        this.init();
    };

    return GameController;
});
