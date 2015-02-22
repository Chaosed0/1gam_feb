
define(['crafty', './Util'], function(Crafty, u) {

    var ComputerInputs = function(vis, terrain) {
        this.selectCallback = null;
        this.actions = {};
        this.unitStates = {};
        this.numActions = 0;
    }

    ComputerInputs.prototype.setSelectCallback = function(cb) {
        u.assert(!('select' in this.actions));
        if(cb) {
            this.numActions++;
            this.actions['select'] = this.selectCallback;
        }
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

    ComputerInputs.prototype.doAction = function(objects, state) {
        var self = this;

        if(!state.selectedUnit || this.numActions <= 0) {
            /* Nothing to do */
            return;
        }

        if(!(state.selectedUnit.name in this.unitStates)) {
            this.unitStates[state.selectedUnit.name] = {};
        }

        var unitState = this.unitStates[state.selectedUnit.name];

        var takeAction = function() {
            var actionCallback = null;
            /* Consider each of the actions we can take */
            for(var action in self.actions) {
                if(action === 'Move') {
                } else if(action === 'Attack') {
                } else if(action === 'Skip') {
                    actionCallback = self.actions['Skip'];
                }
            }
            /* Clear actions for the next time*/
            self.actions = {};

            /* Assert that we found an action to take */
            u.assert(action !== null);
            /* Take the action */
            actionCallback();
        }
        
        /* Make it look like we're considering a move - someday this may
         * actually take the form of another thread that makes decisions */
        window.setTimeout(takeAction, 500);
    }
    
    return ComputerInputs;
});
