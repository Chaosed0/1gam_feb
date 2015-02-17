
define(['crafty', './Util'], function(Crafty, u) {
    var GameController = function(unitManager, terrain, gui, vis) {
        var selectedUnit = null;
        var currentSelectCallback;

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

        var unhighlightButKeepSelected = function() {
            /* We want to keep the previously selected unit selected */
            var savedUnit = selectedUnit;
            guiCancelHighlight();
            selectUnit(savedUnit);
            transition(freeSelectCallback);
        }

        /* Callback for when "cancel" button is hit in gui. Transitions to
         * freeSelectCallback and deselects the selected unit. */
        var guiCancelHighlight = function() {
            gui.hideButtons();
            vis.clearHighlight();
            selectedUnit = null;
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * moveSelectCallback */
        var guiMoveCallback = function() {
            gui.hideButtons();
            highlightedCells = [];
            terrain.bfs(selectedUnit.getCell(), selectedUnit.getSpeed(), function(terrain, cell) {
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
                callback: unhighlightButKeepSelected
            }]);

            vis.highlightCells(highlightedCells);
            transition(moveSelectCallback);
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * freeSelectCallback, eventually. */
        var guiAttackCallback = function() {
            gui.hideButtons();
            highlightedCells = [];
            terrain.bfs(selectedUnit.getCell(), selectedUnit.getAttack().range, function(terrain, cell) {
                /* Allow target to be anything passable */
                return terrain.isGround(cell.site);
            }, function(cell) {
                highlightedCells.push(cell);
            });

            gui.setButtons([{
                text: 'Cancel',
                callback: unhighlightButKeepSelected
            }]);

            vis.highlightCells(highlightedCells);
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
                guiCancelHighlight();
            }
        }

        /* Select callback when user has chosen to move the unit. Moves the
         * selected unit to the selected cell, then transitions to
         * freeSelectCallback.
         * Note that we don't need to check if it's a valid cell; we only
         * receive the callback if it's a highlighted cell. */
        var moveSelectCallback = function(data) {
            unitManager.moveUnit(selectedUnit, data.cell);
            guiCancelHighlight();
            vis.deselect();
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
                unitOnCell.damage(selectedUnit.getAttack().damage);
                guiCancelHighlight();
                vis.deselect();
                transition(freeSelectCallback);
            } else {
                /* XXX: Actually display an error to user */
                console.log('No unit!');
            }
        }

        currentSelectCallback = freeSelectCallback;
        vis.bind("CellSelected", currentSelectCallback);
    };

    return GameController;
});
