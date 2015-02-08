
define(['crafty'], function(Crafty) {

    var CameraControls = function(bounds) {
        this.lastmouse = null;
        this.bounds = bounds;
        this.mouselookactive = false;
    }

    var mousemove = function(e) {
        if(this._lastmouse) {
            var scroll = {x: this._lastmouse.x - e.clientX, y: this._lastmouse.y - e.clientY};
            Crafty.viewport.x -= scroll.x / Crafty.viewport._scale
            Crafty.viewport.y -= scroll.y / Crafty.viewport._scale;
            this.constrainViewportPos();
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

    var wheel = function(e) {
        Crafty.viewport.scale(Crafty.viewport._scale - e.deltaY / 1000);
        this.constrainViewportScale();
    }

    CameraControls.prototype.constrainViewportPos = function() {
        if(this.bounds) {
            Crafty.viewport.x = Math.min(Crafty.viewport.x, this.bounds.x);
            Crafty.viewport.y = Math.min(Crafty.viewport.y, this.bounds.y);
            Crafty.viewport.x = Math.max(Crafty.viewport.x, - this.bounds.w + Crafty.viewport.width);
            Crafty.viewport.y = Math.max(Crafty.viewport.y, - this.bounds.h + Crafty.viewport.height);
        }
    }
    
    CameraControls.prototype.constrainViewportScale = function() {
        Crafty.viewport.scale(Math.min(Crafty.viewport._scale, 1.0));
        Crafty.viewport.scale(Math.max(Crafty.viewport._scale, 1.0/8.0));
    }

    CameraControls.prototype.centerOn = function(point) {
        Crafty.viewport.x = -point.x + Crafty.viewport.width / 2.0;
        Crafty.viewport.y = -point.y + Crafty.viewport.width / 2.0;
        this.constrainViewportPos();
    }

    CameraControls.prototype.mouselook = function(active) {
        if(active && !this.mouselookactive) {
            this.mouselookactive = true;
            Crafty.addEvent(this, Crafty.stage.elem, "mousemove", mousemove);
            Crafty.addEvent(this, Crafty.stage.elem, "mouseup", mouseup);
            Crafty.addEvent(this, Crafty.stage.elem, "mousedown", mousedown);
            Crafty.addEvent(this, Crafty.stage.elem, "wheel", wheel);
        } else if(!active && this.mouselookactive) {
            this.mouselookactive = false;
            Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", mousemove);
            Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", mouseup);
            Crafty.removeEvent(this, Crafty.stage.elem, "mousedown", mousedown);
            Crafty.removeEvent(this, Crafty.stage.elem, "wheel", wheel);
        }
    }

    return CameraControls;
});
