
define(['crafty'], function(Crafty) {

    var CameraControls = function(bounds, padding) {
        this.lastmouse = null;
        this.bounds = bounds;
        this.padding = padding;
        this.maxScale = Math.max(Crafty.viewport.width / bounds.w, Crafty.viewport.height / bounds.h);
        this.mouselookactive = false;
    }

    var mousemove = function(e) {
        if(this._lastmouse) {
            var scroll = {x: this._lastmouse.x - e.clientX, y: this._lastmouse.y - e.clientY};
            Crafty.viewport.x -= scroll.x / Crafty.viewport._scale
            Crafty.viewport.y -= scroll.y / Crafty.viewport._scale;
            this.clampViewportPos();
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
        var oldScale = Crafty.viewport._scale;
        var scaleFactor = (1 - Math.sign(e.deltaY) * 0.1);
        Crafty.viewport.scale(Crafty.viewport._scale * scaleFactor);
        this.clampViewportScale();

        //After clamping, we might not actually have scaled; correct accordingly
        scaleFactor = Crafty.viewport._scale / oldScale;
        //Zoom in on a point, i.e. keep that point at the same place on the screen
        Crafty.viewport.x = - (e.realX - (Crafty.viewport.x + e.realX) / scaleFactor);
        Crafty.viewport.y = - (e.realY - (Crafty.viewport.y + e.realY) / scaleFactor);

        this.clampViewportPos();
    }

    CameraControls.prototype.clampViewportPos = function() {
        if(this.bounds) {
            var bounds;
            if(this.padding) {
                bounds = {
                    x: this.bounds.x,
                    y: this.bounds.y,
                    w: this.bounds.w,
                    h: this.bounds.h
                };
                if(this.padding.l) {
                    var realPadding = this.padding.l / Crafty.viewport._scale
                    bounds.x -= realPadding;
                    bounds.w += realPadding;
                }
                if(this.padding.r) {
                    var realPadding = this.padding.r / Crafty.viewport._scale
                    bounds.w += realPadding;
                }
                if(this.padding.t) {
                    var realPadding = this.padding.t / Crafty.viewport._scale
                    bounds.y -= realPadding;
                    bounds.h += realPadding;
                }
                if(this.padding.b) {
                    var realPadding = this.padding.b / Crafty.viewport._scale
                    bounds.h += realPadding;
                }
            } else {
                bounds = this.bounds;
            }

            Crafty.viewport.x = Math.min(Crafty.viewport.x, bounds.x);
            Crafty.viewport.y = Math.min(Crafty.viewport.y, bounds.y);
            Crafty.viewport.x = Math.max(Crafty.viewport.x,
                    Crafty.viewport.width / Crafty.viewport._scale - bounds.w);
            Crafty.viewport.y = Math.max(Crafty.viewport.y,
                    Crafty.viewport.height / Crafty.viewport._scale - bounds.h);
        }
    }
    
    CameraControls.prototype.clampViewportScale = function() {
        if(Crafty.viewport._scale > 1.0) {
            Crafty.viewport.scale(1.0);
        } else if(Crafty.viewport._scale < this.maxScale) {
            Crafty.viewport.scale(this.maxScale);
        }
    }

    CameraControls.prototype.centerOn = function(point) {
        Crafty.viewport.x = -point.x + (Crafty.viewport.width / Crafty.viewport._scale) / 2.0;
        Crafty.viewport.y = -point.y + (Crafty.viewport.height / Crafty.viewport._scale) / 2.0;
        this.clampViewportPos();
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
