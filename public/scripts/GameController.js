
define(['crafty', './Util'], function(Crafty, u) {
    var GameController = function(unitManager, terrain, gui, vis, camera, faction) {
        var stack = [];

        var currentSelectCallback;
        var selectedUnit = null;
        var enemyUnit = null;
        var lastBFSResult = null;
        var currentButtons = null;
        var centerText = null;

        var cancelButton = {
            text: 'Cancel',
            callback: null
        };

        var setButtons = function(buttons) {
            currentButtons = buttons;
            gui.setButtons(currentButtons);
        }

        var setCenterText = function(text) {
            centerText = text;
            gui.setCenterText(centerText);
        }

        var hideButtons = function(buttons) {
            currentButtons = [];
            gui.hideButtons();
        }

        var newSelectCallback = function(cb) {
            vis.unbind("CellSelected", currentSelectCallback);
            currentSelectCallback = cb;
            vis.bind("CellSelected", currentSelectCallback);
        }

        var useState = function(state) {
            vis.selectMode(state.selectmode);
            vis.selection(state.selection);
            vis.highlight(state.highlight);
            setButtons(state.buttons);
            setCenterText(state.centertext);
            newSelectCallback(state.selectcb);
            selectedUnit = state.selectedunit;
            enemyUnit = state.enemyunit;

            if(selectedUnit) {
                gui.displayUnitInfo(selectedUnit, 'left');
            } else {
                gui.hideInfo('left');
            }

            if(enemyUnit) {
                gui.displayUnitInfo(enemyUnit, 'right');
            } else {
                gui.hideInfo('right');
            }
        }

        var pushState = function() {
            var state = {
                selectmode: vis.selectMode(),
                selection: vis.selection(),
                highlight: vis.highlight(),
                buttons: currentButtons,
                centertext: centerText,
                selectedunit: selectedUnit,
                enemyunit: enemyUnit,
                selectcb: currentSelectCallback,
            }
            stack.push(state);
            useState(state);
        }
        
        var popState = function() {
            /* Never pop the initial state */
            if(stack.length > 1) {
                var state = stack.pop();
                useState(stack[stack.length-1]);
                return state;
            } else {
                useState(stack[0]);
                return stack[0];
            }
        }

        var rewindStates = function() {
            while(stack.length > 1) {
                stack.pop();
            }
            useState(stack[0]);
        }

        cancelButton.callback = popState;

        var getMoveAndAttack = function(unit) {
            highlightedCells = {main: [], extra: []};
            var totalLimit = unit.getSpeed() + unit.getAttack().range;
            lastBFSResult = terrain.bfs(unit.getCell(), totalLimit, function(terrain, cell, num) {
                var unitOnPoint = unitManager.getUnitForCell(cell);
                var passable = terrain.isGround(cell.site);
                var skip = false;
                if (passable && unitOnPoint) {
                    /* We want to show that we can attack units of other factions, but
                     * not attack units of our faction; additionally, we want to move
                     * through units of our faction, but not through units of other factions */
                    if(num <= unit.getSpeed()) {
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
                if(num <= unit.getSpeed()) {
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
            hideButtons();
            highlightedCells = getMoveAndAttack(selectedUnit);
            vis.highlight(highlightedCells);
            vis.selectMode('highlight');

            setButtons([ cancelButton ]);
            newSelectCallback(moveSelectCallback);
            pushState();
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * freeSelectCallback, eventually. */
        var guiAttackCallback = function() {
            hideButtons();
            highlightedCells = [];
            came_from = terrain.bfs(selectedUnit.getCell(), selectedUnit.getAttack().range, function(terrain, cell) {
                /* Allow target to be anything passable */
                return terrain.isGround(cell.site);
            }, function(cell) {
                highlightedCells.push(cell);
            });

            setButtons([cancelButton]); 
            vis.highlight(highlightedCells);
            vis.selectMode('highlight');
            newSelectCallback(attackSelectCallback);
            pushState();
        }

        /* Select callback when user is selecting any tile. If a unit is selected,
         * adds the unit's available actions to the gui menu. */
        var freeSelectCallback = function(data) {
            var cell = data.cell;

            if(data.mouseButton == 0) {
                /* Left click, highlight the map cell */
                vis.selection(cell);
                var unitOnCell = unitManager.getUnitForCell(cell);

                if(unitOnCell !== null) {
                    selectedUnit = unitOnCell;
                    gui.displayUnitInfo(selectedUnit, 'left');
                    if(selectedUnit.getFaction() === faction) {
                        gui.setButtons([{
                            text: 'Move',
                            callback: guiMoveCallback
                        }, {
                            text: 'Attack',
                            callback: guiAttackCallback
                        }]);
                        vis.highlight(null);
                    } else {
                        highlightedCells = getMoveAndAttack(selectedUnit);
                        vis.highlight(highlightedCells);
                        gui.setButtons(null);
                    }
                } else {
                    selectedUnit = null;
                    vis.highlight(null);
                    gui.hideInfo();
                    gui.setButtons(null);
                }
            }
        }

        /* Select callback when user has chosen to move the unit. Moves the
         * selected unit to the selected cell, then newSelectCallbacks to
         * freeSelectCallback.
         * Note that we don't need to check if it's a valid cell; we only
         * receive the callback if it's a highlighted cell. */
        var moveSelectCallback = function(data) {
            var path = terrain.reconstructPath(selectedUnit.getCell(), data.cell, lastBFSResult);
            vis.highlight(path);
            vis.selection(data.cell);
            vis.selectMode('confirm');
            setButtons([ cancelButton ]);
            newSelectCallback(moveConfirmCallback);
            pushState();
        }

        /* Selection callback when the user has selected a cell to move a
         * unit to and we're waiting on confirmation. Transitions to
         * freeSelectCallback. */
        var moveConfirmCallback = function(data) {
            unitManager.moveUnit(selectedUnit, data.cell);
            selectedUnit = null;
            vis.selection(null);
            vis.selectMode('free');
            newSelectCallback(freeSelectCallback);
            rewindStates();
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
                vis.selection(cell);
                vis.selectMode('confirm');
                vis.highlight(null);
                setButtons([ cancelButton ]);
                setCenterText(attack.magnitude + " " + attack.type + " damage");
                newSelectCallback(attackConfirmCallback);
                pushState();
            } else {
                /* XXX: Actually display an error to user */
                console.log('No unit!');
            }
        }

        var attackConfirmCallback = function(data) {
            u.assert(enemyUnit);

            enemyUnit.damage(selectedUnit.getAttack().magnitude);
            rewindStates();
        }

        this.setActive = function(active) {
            if(active) {
                gui.overlay('rgba(0,0,0,0.3)');
                camera.mouselook(false);
                gui.announce(faction, function() {
                    vis.bind("CellSelected", currentSelectCallback);
                    gui.overlay(null);
                    camera.mouselook(true);
                });
            } else {
                vis.unbind("CellSelected", currentSelectCallback);
            }
        }

        currentSelectCallback = freeSelectCallback;
        /* Push initial state */
        pushState();
        vis.unbind("CellSelected", currentSelectCallback);
    };

    return GameController;
});
