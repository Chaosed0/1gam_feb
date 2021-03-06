
define(['crafty', './Util'], function(Crafty, u) {

    var LocalInputs = function() {
        var self = this;
        this.actions = null;
        this.lastSelectCallback = null;
        this.selectCallback = null;
        Crafty.bind("KeyDown", function(e) { self.actionShortcut(e) });
    }

    LocalInputs.prototype.setSelectCallback = function(cb) {
        this.selectCallback = cb;
    }

    LocalInputs.prototype.setActions = function(actions) {
        this.actions = actions;
    }

    LocalInputs.prototype.doAction = function(objects, state) {
        /* For us, "do action" means "wait for the user to decide which action to do" */
        objects.gui.setButtons(this.actions);
        if(this.lastSelectCallback) {
            objects.vis.unbind("CellSelected", this.lastSelectCallback);
        }
        this.lastSelectCallback = this.selectCallback;
        if(this.selectCallback) {
            objects.vis.bind("CellSelected", this.selectCallback);
        }
    }

    LocalInputs.prototype.actionShortcut = function(e) {
        if(!this.actions) {
            return;
        }

        if(e.key >= Crafty.keys['1'] && e.key <= Crafty.keys['4']) {
            var index = e.key - Crafty.keys['1'];
            var action = this.actions[index];
            if(action && action.callback) {
                action.callback();
            }
        } else if(e.key === Crafty.keys.ESC) {
            /* Find cancel and do that */
            var cancel = this.findAction('Cancel');
            if(cancel !== null) { cancel(); }
        } else if(e.key === Crafty.keys.SPACE) {
            var skip = this.findAction('Skip');
            if(skip !== null) { skip(); }
        }
    }

    LocalInputs.prototype.findAction = function(name) {
        for(var i = 0; i < this.actions.length; i++) {
            if(this.actions[i] !== null && 
                    this.actions[i].name === name) {
                return this.actions[i].callback;
            }
        }
        return null;
    }
    
    return LocalInputs;
});
