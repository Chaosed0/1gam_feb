
define(['crafty'], function(Crafty) {
    var mousemove = function(e) {
        if(this._lastmouse) {
            var scroll = {x: this._lastmouse.x - e.clientX, y: this._lastmouse.y - e.clientY};
            Crafty.viewport.pan(scroll.x / Crafty.viewport._scale,
                                scroll.y / Crafty.viewport._scale, 0.0);
            this._lastmouse = {x: e.clientX, y: e.clientY};
        }
    }

    var mousedown = function(e) {
        if(e.mouseButton == 0) {
            this._lastmouse = {x: e.clientX, y: e.clientY};
        }
    }

    var mouseup = function(e) {
        if(e.mouseButton == 0) {
            this._lastmouse = null;
        }
    }

    Crafty.c('CameraControls', {
        _lastmouse: null,
        init: function() {
            Crafty.addEvent(this, Crafty.stage.elem, "mousemove", mousemove);
            Crafty.addEvent(this, Crafty.stage.elem, "mouseup", mouseup);
            Crafty.addEvent(this, Crafty.stage.elem, "mousedown", mousedown);
        },

        remove: function() {
            Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", mousemove);
            Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", mouseup);
            Crafty.removeEvent(this, Crafty.stage.elem, "mousedown", mousedown);
        },
    });
});
