
define(['crafty', './Util'], function(Crafty, u) {

    var states = {
        INITIAL_STATE: 0,
        MOVING: 1,
        ATTACKING: 2,
    }

    var ComputerInputs = function(vis) {
        this.selectCallback = null;
        this.actions = null;

        this.state = states.INITIAL_STATE;
    }

    ComputerInputs.prototype.setSelectCallback = function(cb) {
        this.selectCallback = cb;
    }

    ComputerInputs.prototype.setActions = function(actions) {
        this.actions = actions;

        if(actions != null) {
            window.setTimeout(function() {
                actions[3].callback();
            }, 500);
        }
    }
    
    return ComputerInputs;
});
