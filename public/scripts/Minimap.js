
define(['crafty', 'util',], function(Crafty, u) {

    var draw = function(e) {
        if(e.type == 'canvas') {
            this.x = -Crafty.viewport.x + Crafty.viewport.width - this.w;
            this.y = -Crafty.viewport.y + Crafty.viewport.height - this.h;
            e.ctx.drawImage(this._prerender, this.x, this.y, this.w, this.h);

            var cameraBounds = viewportToMinimap(this._mapbounds, {x: this.x, y: this.y, w: this.w, h: this.h});

            e.ctx.save();
            e.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            e.ctx.strokeStyle = 'black';
            e.ctx.rect(cameraBounds.x, cameraBounds.y, cameraBounds.w, cameraBounds.h);
            e.ctx.fill();
            e.ctx.stroke();
            e.ctx.restore();
        }
    }

    var mousedown = function(e) {
        var pos = {x: e.realX, y: e.realY};
        if(pos.x > this.x && pos.y > this.y &&
                pos.x < this.x + this.w && pos.y < this.y + this.h) {
            this.trigger("MinimapClick", {x: (pos.x - this.x) / this.w, y: (pos.y - this.y) / this.h});
        }
    }

    var mousemove = function(e) {
        var pos = {x: e.realX, y: e.realY};
        if(pos.x > this.x && pos.y > this.y &&
                pos.x < this.x + this.w && pos.y < this.y + this.h) {
            this.trigger("MinimapClick", {x: (pos.x - this.x) / this.w, y: (pos.y - this.y) / this.h});
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
        ready: false,

        init: function() {
            this.ready = true;
            this.bind("Draw", draw);
            this.bind("MouseDown", mousedown);
            this.bind("MouseMove", mousemove);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", draw);
            this.unbind("MouseDown", mousedown);
            this.unbind("MouseMove", mousemove);
            this.trigger("Invalidate");
        },

        minimap: function(prerender, mapbounds) {
            this._prerender = prerender;
            this._mapbounds = mapbounds;

            this.x = -Crafty.viewport.x + Crafty.viewport.width - this.w;
            this.y = -Crafty.viewport.y + Crafty.viewport.height - this.h;
            return this;
        }
    });
});
