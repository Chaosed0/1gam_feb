
define(['crafty'], function(Crafty) {
    var mousemove = function(e) {
        if(this._lastmouse) {
            var scroll = {x: this._lastmouse.x - e.clientX, y: this._lastmouse.y - e.clientY};
            Crafty.viewport.x -= scroll.x / Crafty.viewport._scale
            Crafty.viewport.y -= scroll.y / Crafty.viewport._scale;
            Crafty.viewport.x = Math.min(Crafty.viewport.x, this._bounds.x);
            Crafty.viewport.y = Math.min(Crafty.viewport.y, this._bounds.y);
            Crafty.viewport.x = Math.max(Crafty.viewport.x, - this._bounds.w + Crafty.viewport.width);
            Crafty.viewport.y = Math.max(Crafty.viewport.y, - this._bounds.h + Crafty.viewport.height);
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
        _bounds: null,
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

        cameracontrols: function(bounds) {
            this._bounds = bounds;
            return this;
        }
    });
});
