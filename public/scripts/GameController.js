
define(['crafty', './Util'], function(Crafty, u) {
    var GameController = function(unitManager, terrain, gui, vis) {
        var selectedUnit = null;
        var currentSelectCallback;
        var lastBFSResult = null;

        var transition = function(cb) {
            vis.unbind("CellSelected", currentSelectCallback);
            currentSelectCallback = cb;
            vis.bind("CellSelected", currentSelectCallback);
        }

        var selectUnit = function(unit) {
            selectedUnit = unit;
            gui.displayUnitInfo(selectedUnit);
            gui.setButtons([{
                text: 'Move',
                callback: guiMoveCallback
            }, {
                text: 'Attack',
                callback: guiAttackCallback
            }]);
        }

        /* Callback for when "cancel" button is hit in gui. Transitions to
         * freeSelectCallback and deselects the selected unit. */
        var cancelHighlight = function() {
            gui.hideButtons();
            vis.clearHighlight();
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * moveSelectCallback */
        var guiMoveCallback = function() {
            gui.hideButtons();
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

            gui.setButtons([{
                text: 'Cancel',
                callback: function() {
                    cancelHighlight();
                    vis.selectmode('free');
                    transition(freeSelectCallback);
                }
            }]);

            vis.highlightCells(highlightedCells);
            vis.selectMode('highlight');
            transition(moveSelectCallback);
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * freeSelectCallback, eventually. */
        var guiAttackCallback = function() {
            gui.hideButtons();
            highlightedCells = [];
            came_from = terrain.bfs(selectedUnit.getCell(), selectedUnit.getAttack().range, function(terrain, cell) {
                /* Allow target to be anything passable */
                return terrain.isGround(cell.site);
            }, function(cell) {
                highlightedCells.push(cell);
            });

            gui.setButtons([{
                text: 'Cancel',
                callback: function() {
                    cancelHighlight();
                    vis.selectmode('free');
                    transition(freeSelectCallback);
                }
            }]);

            vis.highlightCells(highlightedCells);
            vis.selectMode('highlight');
            transition(attackSelectCallback);
        }

        /* Select callback when user is selecting any tile. If a unit is selected,
         * adds the unit's available actions to the gui menu. */
        var freeSelectCallback = function(data) {
            var cell = data.cell;
            var unitOnCell = unitManager.getUnitForCell(cell);

            /*gui.displayCellInfo(cell); */

            if(data.mouseButton == 0) {
                /* Left click, highlight the map cell */
                vis.selectCell(cell);
            }

            if(unitOnCell !== null) {
                selectUnit(unitOnCell);
            } else {
                cancelHighlight();
                selectedUnit = null;
            }
        }

        /* Select callback when user has chosen to move the unit. Moves the
         * selected unit to the selected cell, then transitions to
         * freeSelectCallback.
         * Note that we don't need to check if it's a valid cell; we only
         * receive the callback if it's a highlighted cell. */
        var moveSelectCallback = function(data) {
            var savedUnit = selectedUnit;
            cancelHighlight();
            vis.deselect();
            var path = terrain.reconstructPath(savedUnit.getCell(), data.cell, lastBFSResult);
            vis.highlightCells(path);
            vis.selectCell(data.cell);
            vis.selectMode('confirm');
            transition(moveConfirmCallback);
        }

        /* Selection callback when the user has selected a cell to move a
         * unit to and we're waiting on confirmation. Transitions to
         * freeSelectCallback. */
        var moveConfirmCallback = function(data) {
            unitManager.moveUnit(selectedUnit, data.cell);
            cancelHighlight();
            selectedUnit = null;
            vis.deselect();
            vis.selectMode('free');
            transition(freeSelectCallback);
        }

        /* Select callback when user has chosen to attack a unit. Deals
         * damage depending on the selected unit's attack, then transitions
         * to freeSelectCallback.
         * XXX: Only supports single-target attacks for now.
         */
        var attackSelectCallback = function(data) {
            var cell = data.cell;
            var unitOnCell = unitManager.getUnitForCell(cell);
            if(unitOnCell) {
                vis.
                vis.deselect();
                vis.selectCell(cell);
                vis.selectMode('confirm');
                transition(attackConfirmCallback);
            } else {
                /* XXX: Actually display an error to user */
                console.log('No unit!');
            }
        }

        var attackConfirmCallback = function(data) {
            var unitOnCell = unitManager.getUnitForCell(cell);
            u.assert(unitOnCell);

            unitOnCell.damage(selectedUnit.getAttack().damage);
            cancelHighlight();
            selectedUnit = null;
            vis.deselect();
            vis.selectMode('free');
            transition(freeSelectCallback);
        }

        currentSelectCallback = freeSelectCallback;
        vis.bind("CellSelected", currentSelectCallback);
    };

    return GameController;
});
