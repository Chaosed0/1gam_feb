
define(['crafty'], function(Crafty) {

    var CameraControls = function(bounds, padding) {
        this._lastmouse = null;
        this.bounds = bounds;
        this.padding = padding;
        this.maxScale = Math.max(Crafty.viewport.width / bounds.w, Crafty.viewport.height / bounds.h);
        this.mouselookactive = false;

        /* Correct padding, if the user didn't specify everything */
        if(!padding.l) {
            padding.l = 0;
        }
        if(!padding.r) {
            padding.r = 0;
        }
        if(!padding.b) {
            padding.b = 0;
        }
        if(!padding.t) {
            padding.t = 0;
        }
    }

    var mousemove = function(e) {
        if(this._lastmouse) {
            var scroll = {x: this._lastmouse.x - e.clientX, y: this._lastmouse.y - e.clientY};
            var newPos = {
                x: Crafty.viewport.x - scroll.x / Crafty.viewport._scale,
                y: Crafty.viewport.y - scroll.y / Crafty.viewport._scale
            };
            newPos = this.clampViewportPos(newPos);
            
            Crafty.viewport.x = newPos.x;
            Crafty.viewport.y = newPos.y;

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
        var newScale = oldScale * scaleFactor;
        newScale = this.clampViewportScale(newScale);
        //After clamping, we might not have scaled as much; correct accordingly
        scaleFactor = newScale / oldScale;

        /* Zoom in on the point the cursor is on, i.e. keep that point at the
         * same place on the screen */
        var newPos = {
            x: - (e.realX - (Crafty.viewport.x + e.realX) / scaleFactor),
            y: - (e.realY - (Crafty.viewport.y + e.realY) / scaleFactor),
        }
        newPos = this.clampViewportPos(newPos, newScale);

        Crafty.viewport.x = newPos.x;
        Crafty.viewport.y = newPos.y;
        Crafty.viewport.scale(newScale);
    }

    CameraControls.prototype.clampViewportPos = function(newPos, newScale) {
        if(newScale === undefined) {
            newScale = Crafty.viewport._scale;
        }

        if(this.bounds) {
            var bounds;
            if(this.padding) {
                bounds = {
                    x: this.bounds.x,
                    y: this.bounds.y,
                    w: this.bounds.w,
                    h: this.bounds.h
                };
                var realPadding = this.padding.l / Crafty.viewport._scale;
                bounds.x -= realPadding;
                bounds.w += realPadding;
                realPadding = this.padding.r / Crafty.viewport._scale;
                bounds.w += realPadding;
                realPadding = this.padding.t / Crafty.viewport._scale;
                bounds.y -= realPadding;
                bounds.h += realPadding;
                realPadding = this.padding.b / Crafty.viewport._scale;
                bounds.h += realPadding;
            } else {
                bounds = this.bounds;
            }

            newPos.x = Math.min(newPos.x, bounds.x);
            newPos.y = Math.min(newPos.y, bounds.y);
            newPos.x = Math.max(newPos.x, Crafty.viewport.width / newScale - bounds.w);
            newPos.y = Math.max(newPos.y, Crafty.viewport.height / newScale - bounds.h);
        }
        return newPos;
    }
    
    CameraControls.prototype.clampViewportScale = function(newScale) {
        if(newScale > 1.0) {
            newScale = 1.0;
        } else if(newScale < this.maxScale) {
            newScale = this.maxScale;
        }
        return newScale;
    }

    CameraControls.prototype.centerOn = function(point) {
        var newPos = {
            x: -point.x + ((Crafty.viewport.width + this.padding.l - this.padding.r)/ Crafty.viewport._scale) / 2.0,
            y: -point.y + ((Crafty.viewport.height + this.padding.t - this.padding.b)/ Crafty.viewport._scale) / 2.0
        }
        newPos = this.clampViewportPos(newPos);

        Crafty.viewport.x = newPos.x;
        Crafty.viewport.y = newPos.y;
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
            this._lastmouse = null;
            Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", mousemove);
            Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", mouseup);
            Crafty.removeEvent(this, Crafty.stage.elem, "mousedown", mousedown);
            Crafty.removeEvent(this, Crafty.stage.elem, "wheel", wheel);
        }
    }

    return CameraControls;
});
