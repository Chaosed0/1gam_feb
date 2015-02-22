
define(['crafty', './Util'], function(Crafty, u) {

    var LocalInputs = function(vis, gui) {
        this.vis = vis;
        this.gui = gui;

        this.lastSelectCallback = null;
    }

    LocalInputs.prototype.setSelectCallback = function(cb) {
        if(this.lastSelectCallback) {
            this.vis.unbind("CellSelected", this.lastSelectCallback);
        }

        this.lastSelectCallback = cb;

        if(cb) {
            this.vis.bind("CellSelected", cb);
        }
    }

    LocalInputs.prototype.setActions = function(actions) {
        this.gui.setButtons(actions);
    }
    
    return LocalInputs;
});
