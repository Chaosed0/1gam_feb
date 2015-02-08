
define(['crafty', 'util',], function(Crafty, u) {

    var draw = function(e) {
        if(e.type == 'canvas') {
            e.ctx.drawImage(this._prerender, this.x, this.y, this.w, this.h);

            var cameraBounds = viewportToMinimap(this._mapbounds,
                    {x: this.x, y: this.y, w: this.w, h: this.h});

            e.ctx.save();
            e.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            e.ctx.strokeStyle = 'black';
            e.ctx.rect(cameraBounds.x, cameraBounds.y, cameraBounds.w, cameraBounds.h);
            e.ctx.fill();
            e.ctx.stroke();
            e.ctx.restore();
        }
    }

    var viewportchanged = function() {
        this.w = this._originalsize.w / Crafty.viewport._scale;
        this.h = this._originalsize.h / Crafty.viewport._scale;
        this.x = -Crafty.viewport.x + Crafty.viewport.width / Crafty.viewport._scale - this.w;
        this.y = -Crafty.viewport.y + Crafty.viewport.height / Crafty.viewport._scale  - this.h;
    }

    var pointToMapPos = function(point, rect, mapbounds) {
        if(point.x >= rect.x && point.y >= rect.y &&
                point.x <= rect.x + rect.w && point.y <= rect.y + rect.h) {
            return {x: (point.x - rect.x) / rect.w * mapbounds.w,
                    y: (point.y - rect.y) / rect.h * mapbounds.h};
        }

        //Uh oh
        return {x: 0, y: 0};
    }

    var minimapclick = function(e) {
        var pos = {x: e.realX, y: e.realY};
        var point = pointToMapPos(pos, this, this._mapbounds);
        this.trigger("MinimapDown", point);
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
            x: minimapbounds.x + -Crafty.viewport.x / mapbounds.w * minimapbounds.w,
            y: minimapbounds.y + -Crafty.viewport.y / mapbounds.h * minimapbounds.h,
            w: Crafty.viewport.width / mapbounds.w * minimapbounds.w,
            h: Crafty.viewport.height / mapbounds.h * minimapbounds.h
        };
    }

    Crafty.c("Minimap", {
        _prerender: null,
        _lastmouse: {x: 0, y: 0},
        _mapbounds: {x: 0, y: 0, w: 100, h: 100},
        _originalsize: {w: 0, h: 0},
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
            this._originalsize.w = this.w;
            this._originalsize.h = this.h;
            viewportchanged.call(this);
            return this;
        }
    });
});
