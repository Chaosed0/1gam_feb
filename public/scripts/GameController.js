
define(['crafty', './Util'], function(Crafty, u) {
    var GameController = function(faction, objects, doneCallback) {
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
        var lastSelectCallback = null;
        var lastBFSResult = null;

        /* Variables comprising the state; changes nearly every time
         * the selected cell on the map changes, or when a button
         * is pressed */
        var selectMode = null;
        var selection = null;
        var highlight = null;
        var buttons = null;
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
                /* Center camera on new unit over some time */
                camera.centerOn(curUnit, 1000);
                /* Select new unit */
                stack[0].selection = curUnit.getCell();
                stack[0].selectedUnit = curUnit;
                /* Go back to initial state */
                useState(rewindStates());
            } else {
                /* This faction's turn is done, we're passing off control.
                 * Go back to initial state, but don't use it */
                rewindStates();
                /* Null out the current state */
                useState({
                    selectMode: null,
                    selection: null,
                    highlight: null,
                    buttons: null,
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
        var cancelButton = {
            text: 'Cancel',
            callback: null
        };

        var newSelectCallback = function(cb) {
            if(lastSelectCallback) {
                vis.unbind("CellSelected", lastSelectCallback);
            }

            lastSelectCallback = cb;

            if(cb) {
                vis.bind("CellSelected", cb);
            }
        }

        var useState = function(state) {
            selectMode = state.selectMode;
            selection = state.selection;
            highlight = state.highlight;
            buttons = state.buttons;
            centerText = state.centerText;
            selectedUnit = state.selectedUnit;
            enemyUnit = state.enemyUnit;
            selectCallback = state.selectCallback;

            vis.selectMode(selectMode);
            vis.selection(selection);
            vis.highlight(highlight);
            gui.setButtons(buttons);
            gui.setCenterText(centerText);
            newSelectCallback(selectCallback);

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
        }

        var pushState = function() {
            var tmpstate = {
                selectMode: selectMode,
                selection: selection,
                highlight: highlight,
                buttons: buttons,
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

        cancelButton.callback = function() {
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

        /* ---- */

        /* Callback for when "move" button is hit in gui. Transitions to 
         * moveSelectCallback */
        var guiMoveCallback = function() {
            highlightedCells = getMoveAndAttack(selectedUnit);
            highlight = highlightedCells;
            selectMode = 'highlight';
            buttons = [ cancelButton ];
            selectCallback = moveSelectCallback;

            pushState();
        }

        /* Callback for when "attack" button is hit in gui. Transitions to 
         * freeSelectCallback, eventually. */
        var guiAttackCallback = function() {
            highlightedCells = [];
            terrain.bfs(selectedUnit.getCell(),
                    selectedUnit.getAttack().range, function(terrain, cell) {
                /* Allow target to be anything passable */
                return terrain.isGround(cell.site);
            }, function(cell) {
                highlightedCells.push(cell);
            });

            buttons = [cancelButton]; 
            highlight = highlightedCells;
            selectMode = 'highlight';
            selectCallback = attackSelectCallback;
            pushState();
        }

        /* Select callback when user is selecting any tile. If a unit is selected,
         * adds the unit's available actions to the gui menu. */
        var freeSelectCallback = function(data) {
            var cell = data.cell;

            if(data.mouseButton == 0) {
                /* Left click, highlight the map cell */
                selection = cell;
                var unitOnCell = unitManager.getUnitForCell(cell);

                if(unitOnCell !== null) {
                    selectedUnit = unitOnCell;
                    if(selectedUnit === curUnit) {
                        buttons = [{
                            text: 'Move',
                            callback: selectedUnit.hasMoved() ? null : guiMoveCallback,
                        }, {
                            text: 'Attack',
                            callback: guiAttackCallback
                        },
                        null,
                        {
                            text: 'Skip Unit',
                            callback: nextUnit
                        }];
                        highlight = null;
                    } else {
                        highlightedCells = getMoveAndAttack(selectedUnit);
                        highlight = highlightedCells;
                        buttons = [ cancelButton ];
                    }
                } else {
                    selectedUnit = null;
                    highlight = null;
                    buttons = [ cancelButton ];
                }
                /* If we selected another cell, we don't want to push more
                 * states onto the stack - pop the previous one */
                popState();
                pushState();
            }
        }

        /* Select callback when user has chosen to move the unit. Moves the
         * selected unit to the selected cell, then newSelectCallbacks to
         * freeSelectCallback.
         * Note that we don't need to check if it's a valid cell; we only
         * receive the callback if it's a highlighted cell. */
        var moveSelectCallback = function(data) {
            var path = terrain.reconstructPath(selectedUnit.getCell(), data.cell, lastBFSResult);
            highlight = path;
            selection = data.cell;
            selectMode = 'confirm';
            buttons = [ cancelButton ];
            selectCallback = moveConfirmCallback;
            pushState();
        }

        /* Selection callback when the user has selected a cell to move a
         * unit to and we're waiting on confirmation. Rewinds to initial state. */
        var moveConfirmCallback = function(data) {
            unitManager.moveUnit(selectedUnit, data.cell);
            rewindStates();
            /* Cheat and call freeSelectCallback, because we need to re-select
             * the current unit */
            freeSelectCallback({mouseButton: 0, cell: selectedUnit.getCell()});
        }

        /* Select callback when user has chosen to attack a unit. Deals
         * damage depending on the selected unit's attack, then newSelectCallbacks
         * to freeSelectCallback.
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
                buttons = [ cancelButton ];
                centerText = attack.magnitude + " " + attack.type + " damage";
                selectCallback = attackConfirmCallback;
                pushState();
            } else {
                /* XXX: Actually display an error to user */
                console.log('No unit!');
            }
        }

        var attackConfirmCallback = function(data) {
            u.assert(enemyUnit);
            curUnit.attack(enemyUnit);
            /* This unit has attacked, it's time to advance to the next unit */
            nextUnit();
        }

        this.setActive = function() {
            /* Turn mouselook off for the announcement */
            camera.mouselook(false);
            /* Init state */
            /* First unit is the unit with the highest speed */
            curUnitIndex = 0;
            curUnit = unitList[curUnitIndex];
            selectCallback = freeSelectCallback;
            selectMode = 'free';
            selection = curUnit.getCell();
            lastSelectCallback = null;
            /* Center on the new unit being controlled */
            camera.centerOn(curUnit, 2000);

            /* Announce the new faction's turn */
            gui.announce(faction, function() {
                /* This is the callback when the announcement is finished
                 * Turn mouselook back on */
                camera.mouselook(true);
                /* Act as if we just selected the first unit's cell */
                selectCallback({mouseButton: 0, cell: selection});
                /* Give all our controlled units a new turn */
                for(var i = 0; i < unitList.length; i++) {
                    unitList[i].newTurn();
                }
            });
        }

        this.init = function() {
            /* Grab the unit list for this faction */
            unitList = unitManager.getUnitListForFaction(faction);
            u.assert(unitList.length > 0, 'Tried to create a controller for ' + faction + ' but it has no units');
            /* Sort it by descending speed */
            unitList.sort(function(u1,u2) {
                return u2.getSpeed() - u1.getSpeed();
            });
        }

        this.init();
    };

    return GameController;
});
