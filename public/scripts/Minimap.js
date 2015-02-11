
define(['crafty', 'util',], function(Crafty, u) {

    var draw = function(e) {
        if(e.type == 'canvas') {
            /* Save drawing transform, including whatever translations/scaling
             * the viewport may have, then reset to the identity transform to
             * draw the minimap */
            e.ctx.save();
            e.ctx.setTransform(1, 0, 0, 1, 0, 0);

            e.ctx.fillStyle = '#000000';
            e.ctx.fillRect(this._clientbounds.x, this._clientbounds.y,
                    this._clientbounds.w, this._clientbounds.h);
            e.ctx.drawImage(this._prerender, this._interiorbounds.x, this._interiorbounds.y,
                    this._interiorbounds.w, this._interiorbounds.h);

            var cameraBounds = viewportToMinimap(this._mapbounds, this._interiorbounds);

            e.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            e.ctx.strokeStyle = 'black';
            e.ctx.rect(cameraBounds.x, cameraBounds.y, cameraBounds.w, cameraBounds.h);
            e.ctx.fill();
            e.ctx.stroke();
            /* Restore the original transform for whatever comes after */
            e.ctx.restore();
        }
    }

    var viewportchanged = function() {
        /* Set our position in "world coordinates" so that we can still
         * listen to events and don't get culled */
        this.w = this._clientbounds.w / Crafty.viewport._scale;
        this.h = this._clientbounds.h / Crafty.viewport._scale;
        this.x = -Crafty.viewport.x + Crafty.viewport.width / Crafty.viewport._scale - this.w;
        this.y = -Crafty.viewport.y + Crafty.viewport.height / Crafty.viewport._scale  - this.h;
    }

    var pointToMapPos = function(point, mapbounds, rect) {
        if(point.x >= rect.x && point.y >= rect.y &&
                point.x <= rect.x + rect.w && point.y <= rect.y + rect.h) {
            return {x: (point.x - rect.x) / rect.w * mapbounds.w,
                    y: (point.y - rect.y) / rect.h * mapbounds.h};
        }

        //Uh oh
        return null;
    }

    var minimapclick = function(e) {
        var pos = {x: e.clientX, y: e.clientY};
        var point = pointToMapPos(pos, this._mapbounds, this._interiorbounds);
        
        /* Ensure the point isn't outside the minimap */
        if(point) {
            this.trigger("MinimapDown", point);
        }
    }

    var mousedown = function(e) {
        if(e.mouseButton == 0) {
            this._dragging = true;
            minimapclick.call(this, e);
        }
    }

    var mousemove = function(e) {
        if(this._dragging) {
            minimapclick.call(this, e);
        }
    }

    var mouseup = function(e) {
        if(this._dragging) {
            this._dragging = false;
            this.trigger("MinimapUp");
        }
    }

    var viewportToMinimap = function(mapbounds, minimapbounds) {
        return {
            x: Math.max(minimapbounds.x + -Crafty.viewport.x / mapbounds.w * minimapbounds.w, minimapbounds.x),
            y: Math.max(minimapbounds.y + -Crafty.viewport.y / mapbounds.h * minimapbounds.h, minimapbounds.y),
            w: Math.min(Crafty.viewport.width / Crafty.viewport._scale / mapbounds.w * minimapbounds.w,
                    minimapbounds.w),
            h: Math.min(Crafty.viewport.height / Crafty.viewport._scale / mapbounds.h * minimapbounds.h,
                    minimapbounds.h)
        };
    }

    /* So here's the deal about HUD elements in Crafty.
     * On one hand, they should be completely divorced from the normal viewport
     * transforms/scaling.
     * On the other, if we don't set our position/size in "real coordinates",
     * Crafty thinks the element is outside the viewport. The element will
     * get culled during drawing, and we'll also miss out on events.
     * The result is that we have a dual thing going on; this.pos is going to be
     * set only so that the element doesn't get culled, but we're going to draw
     * the element using this._clientbounds.
     */
    Crafty.c("Minimap", {
        _prerender: null,
        _lastmouse: {x: 0, y: 0},
        _mapbounds: {x: 0, y: 0, w: 100, h: 100},
        _clientbounds: {x: 0, y: 0, w: 0, h: 0},
        _interiorbounds: {x: 0, y: 0, w: 0, h: 0},
        _dragging: false,
        ready: false,

        init: function() {
            this.ready = true;

            this.bind("Draw", draw);
            this.bind("MouseDown", mousedown);
            this.bind("MouseMove", mousemove);
            this.bind("MouseUp", mouseup);
            this.bind("MouseOut", mouseup);
            this.bind("InvalidateViewport", viewportchanged);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", draw);
            this.unbind("MouseDown", mousedown);
            this.unbind("MouseMove", mousemove);
            this.unbind("MouseUp", mouseup);
            this.unbind("MouseOut", mouseup);
            this.unbind("InvalidateViewport", viewportchanged);
            this.trigger("Invalidate");
        },

        minimap: function(prerender, mapbounds) {
            this._prerender = prerender;
            this._mapbounds = mapbounds;
            this._clientbounds = {
                x: Crafty.viewport.width - this.w,
                y: Crafty.viewport.height - this.h,
                w: this.w, h: this.h
            };
            viewportchanged.call(this);

            /* We want the actual minimap to be the same scale as the real map, but we want
             * it to fit inside the bounding box specified by (this.x, this.y, this.w, this.h).
             * Calculate these interior bounds. */
            if(mapbounds.w > mapbounds.h) {
                this._interiorbounds.h = this.h * mapbounds.h / mapbounds.w;
                this._interiorbounds.w = this.w;
            } else {
                this._interiorbounds.w = this.w * mapbounds.w / mapbounds.h;
                this._interiorbounds.h = this.h;
            }
            this._interiorbounds.x = this._clientbounds.x + this._clientbounds.w/2.0 - this._interiorbounds.w/2.0;
            this._interiorbounds.y = this._clientbounds.y + this._clientbounds.h/2.0 - this._interiorbounds.h/2.0;

            return this;
        }
    });
});
