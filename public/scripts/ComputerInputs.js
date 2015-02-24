
define(['crafty', './Util'], function(Crafty, u) {

    /* Amount of time the computer "thinks", in milliseconds */
    const thinkTime = 300;

    var ComputerInputs = function(thisFaction, enemyFaction) {
        this.selectCallback = null;

        this.faction = thisFaction;
        this.enemyFaction = enemyFaction;

        this.actions = {};
        this.selectCallback = null;

        this.unitStates = {};
        this.numActions = 0;
    }

    ComputerInputs.prototype.setSelectCallback = function(cb) {
        this.selectCallback = cb;
    }

    ComputerInputs.prototype.setActions = function(actions_in) {
        if(actions_in === null) {
            /* Nothing to do */
            return;
        }

        for(var i = 0; i < actions_in.length; i++) {
            /* We don't take nulls, we never cancel */
            if(actions_in[i] !== null &&
                    actions_in[i].callback !== null && 
                    actions_in[i].name !== 'Cancel') {
                u.assert(actions_in[i].name);
                this.actions[actions_in[i].name] = actions_in[i].callback;
                this.numActions++;
            }
        }
    }

    ComputerInputs.prototype.newUnitState = function(unitManager) {
        var self = this;
        var unitState = {};
        unitState.target = u.randomElem(unitManager.getUnitListForFaction(this.enemyFaction));
        unitState.attackTarget = null;
        unitState.state = 'idle';

        /* Event triggered when the target dies */
        var targetDied = function() {
            /* Ensure there's another unit to target */
            var enemyUnits = unitManager.getUnitListForFaction(self.enemyFaction);
            if(enemyUnits.length > 0 ||
                    (enemyUnits.length === 1 && enemyUnits[0] !== unitState.target)) {
                unitState.target = u.randomElem(enemyUnits);
                /* Bind event to the new target */
                unitState.target.bind("Remove", targetDied);
            } else {
                unitState.target = null;
            }
        }

        /* Bind removal case to the first target */
        unitState.target.bind("Remove", targetDied);
        
        return unitState
    }

    ComputerInputs.prototype.findClosestIn = function(reversed_path, highlight) {
        var index;
        for(var i = 1; i < reversed_path.length; i++) {
            index = highlight.indexOf(reversed_path[i]);
            if(index >= 0) {
                return index;
            }
        }
        return -1;
    }

    ComputerInputs.prototype.doAction = function(objects, state) {
        var curUnit = state.selectedUnit;
        var unitState;

        /* If we've received a unit to control, we'd better have received some
         * possible actions to take with it */
        u.assert(!curUnit || (curUnit && (this.numActions > 0 || this.selectCallback)));

        if(!curUnit) {
            /* Nothing to do */
            return;
        }

        if(!(curUnit.id in this.unitStates)) {
            unitState = this.newUnitState(objects.unitManager);
            this.unitStates[curUnit.id] = unitState;
        } else {
            unitState = this.unitStates[curUnit.id];
        }

        var takeAction = function() {
            var targetEnemyUnit = unitState.target;
            var actionCallback = null;
            var curValue = -100;

            /* Only select a cell if there's nothing else we can do */
            if(this.numActions <= 0) {
                var selectCallback = this.selectCallback;
                /* Check why we're selecting this cell */
                u.assert(this.selectCallback);
                u.assert(unitState.state && unitState.state !== 'idle');
                if(unitState.state === 'moving') {
                    /* Assert that we have somewhere to move to */
                    u.assert(state.highlight.main.length > 0);

                    /* Figure out the fastest way to our target */
                    var reversed_path = objects.terrain.astar(curUnit.getCell(), targetEnemyUnit.getCell(), -1,
                        function(terrain, cell) {
                            return terrain.isGround(cell.site);
                        });
                    /* Find the closest cell along the path within the highlight */
                    var index = this.findClosestIn(reversed_path, state.highlight.main);

                    if(index < 0) {
                        /* If we didn't find a path to the target unit, it's
                         * possible that our path is blocked by units; try
                         * again, except path around all units including our
                         * own */
                        reversed_path = objects.terrain.astar(curUnit.getCell(),
                                    targetEnemyUnit.getCell(), -1, function(terrain, cell) {
                                /* We should still keep the cell the current unit resides on */
                                var unitOnCell = objects.unitManager.getUnitForCell(cell);
                                return terrain.isGround(cell.site) &&
                                    (!unitOnCell || unitOnCell === curUnit);
                            });
                        if(reversed_path === null) {
                            /* We are likely blocked in by units - we're going to play
                             * dumb and move to a random cell */
                            index = u.getRandom(state.highlight.main.length);
                        } else {
                            index = this.findClosestIn(reversed_path, state.highlight.main);
                        }
                    }
                    u.assert(index >= 0, "We didn't find a path to target unit");
                    actionCallback = function() {
                        selectCallback({cell: state.highlight.main[index]});
                    }
                    unitState.state = 'confirming';
                } else if(unitState.state === 'attacking') {
                    /* Attack the targeted unit */
                    u.assert(unitState.attackTarget,
                            "Unit is in the attacking state, but it doesn't know what to attack");
                    var attackCell = unitState.attackTarget.getCell();
                    u.assert(state.highlight !== null && state.highlight.indexOf(attackCell) >= 0,
                            "We thought we could attack a target, but we can't");
                    actionCallback = function() {
                        selectCallback({cell: attackCell});
                    }
                    unitState.state = 'confirming';
                } else if(unitState.state === 'confirming') {
                    /* Confirm our action */
                    actionCallback = function() {
                        selectCallback({cell: state.selection});
                    }
                    unitState.state = 'idle';
                }
            }

            /* Consider each of the actions we can take */
            for(var action in this.actions) {
                if(action === 'Move') {
                    if(curValue < 0) {
                        var moveCallback = this.actions.Move;
                        actionCallback = function() {
                            unitState.state = 'moving';
                            moveCallback();
                        }
                    }
                } else if(action === 'Attack') {
                    /* Check if we can attack the target unit right now */
                    var attackableCells = [];
                    objects.terrain.bfs(curUnit.getCell(), curUnit.getAttack().range,
                        function(terrain, cell) {
                            return terrain.isGround(cell.site);
                        }, function(cell) {
                            attackableCells.push(cell);
                        });
                    if(attackableCells.indexOf(targetEnemyUnit.getCell()) > 0) {
                        /* We can reach the target; attacking it is our top priority */
                        actionCallback = this.actions.Attack;
                        unitState.state = 'attacking';
                        unitState.attackTarget = targetEnemyUnit;
                        curValue = 100;
                    } else {
                        /* If we have moved and there's a unit in range, there's
                         * no reason not to attack it */
                        if(curUnit.hasMoved()) {
                            for(var i = 0; i < attackableCells.length; i++) {
                                var unitOnCell = objects.unitManager.getUnitForCell(attackableCells[i]);
                                if(unitOnCell !== null && unitOnCell.getFaction() !== curUnit.getFaction()) {
                                    actionCallback = this.actions.Attack;
                                    unitState.state = 'attacking';
                                    unitState.attackTarget = unitOnCell;
                                }
                            }
                        }
                    }
                } else if(action === 'Skip') {
                    if(actionCallback == null) {
                        actionCallback = this.actions.Skip;
                    }
                } 
            }
            /* Clear actions for the next time*/
            this.actions = {};
            this.numActions = 0;
            this.selectCallback = null;

            /* Assert that we found an action to take */
            u.assert(actionCallback !== null, "AI couldn't find anything to do");
            /* Take the action */
            actionCallback.call(this);
        }
        
        /* Make it look like we're considering a move - someday this may
         * actually take the form of another thread that makes decisions */
        var self = this;
        window.setTimeout(function() { takeAction.call(self); }, thinkTime);
    }
    
    return ComputerInputs;
});
