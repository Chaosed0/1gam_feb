
define(['crafty', './Util'], function(Crafty, u) {

    var LocalInputs = function() {
        this.actions = null;
        this.lastSelectCallback = null;
        this.selectCallback = null;
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
    
    return LocalInputs;
});
