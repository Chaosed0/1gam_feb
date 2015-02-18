
define(['crafty', './Util'], function(Crafty, u) {
    var GameController = function(unitManager, terrain, gui, vis) {
        var stack = [];

        var currentSelectCallback;
        var selectedUnit = null;
        var enemyUnit = null;
        var lastBFSResult = null;
        var currentButtons = null;

        var cancelButton = {
            text: 'Cancel',
            callback: null
        };

        var setButtons = function(buttons) {
            currentButtons = buttons;
            gui.setButtons(currentButtons);
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
            gui.setButtons(state.buttons);
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

        /* ---- */

        /* Callback for when "move" button is hit in gui. Transitions to 
         * moveSelectCallback */
        var guiMoveCallback = function() {
            hideButtons();
            highlightedCells = [];
            lastBFSResult = terrain.bfs(selectedUnit.getCell(), selectedUnit.getSpeed(), function(terrain, cell) {
                var unitOnPoint = unitManager.getUnitForCell(cell);
                var passable = terrain.isGround(cell.site);
                var skip = false;
                if (passable && unitOnPoint) {
                    if(selectedUnit.getFaction() !== unitOnPoint.getFaction()) {
                        /* Other unit is not of our faction, we cannot pass this tile */
                        passable = false;
                    } else {
                        /* Other unit is of our faction; we can't move here but we can
                         * pass through it */
                        skip = true;
                    }
                }

                if(skip) {
                    return -1;
                } else {
                    return passable;
                }
            }, function(cell) {
                highlightedCells.push(cell);
            });

            setButtons([ cancelButton ]);
            vis.highlight(highlightedCells);
            vis.selectMode('highlight');
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
                    gui.setButtons([{
                        text: 'Move',
                        callback: guiMoveCallback
                    }, {
                        text: 'Attack',
                        callback: guiAttackCallback
                    }]);
                } else {
                    selectedUnit = null;
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
                enemyUnit = unitOnCell;
                vis.selection(cell);
                vis.selectMode('confirm');
                vis.highlight(null);
                setButtons([ cancelButton ]);
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

        currentSelectCallback = freeSelectCallback;
        vis.bind("CellSelected", currentSelectCallback);
        /* Push initial state */
        pushState();
    };

    return GameController;
});
