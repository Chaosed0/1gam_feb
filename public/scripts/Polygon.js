
define(['crafty'], function(Crafty) {
    Crafty.c("Polygon", {
        _points: null,
        _color: '#0000BB',
        ready: false,

        _draw: function(e) {
            if (!this._points || !this._color) {
                return;
            }

            if(!e.type === "canvas") {
                e.destroy();
                console.log("Polygon doesn't support anything other than canvas");
            }

            e.ctx.fillStyle = this._color;

            e.ctx.beginPath();
            e.ctx.moveTo(this._x + this._points[0][0], this._y + this._points[0][1]);

            for(var i = 1; i < this._points.length; i++) {
                var p = this._points[i];
                e.ctx.lineTo(this._x + p[0], this._y + p[1]);
            }

            e.ctx.closePath();
            e.ctx.fill();
        },

        init: function() {
            this.ready = true;
            this.bind("Draw", this._draw);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", this._draw);
            this.trigger("Invalidate");
        },

        polygon: function(polygon, color) {
            //Collision modifies the polygon by reference, so
            // clone the polygon
            //XXX: Try to remember to submit a crafty bug report
            // for this, collision really shouldn't modify
            this._points = polygon.points.map(function(i) {
                return i.map(function(j) { return j; });
            });
            this._color = color;
            this.trigger('Invalidate');

            return this;
        },
    });
});
