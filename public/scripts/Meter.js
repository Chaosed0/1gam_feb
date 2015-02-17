
define(['crafty', './Util'], function(Crafty, u) {
    var Vec2d = Crafty.math.Vector2D;

    Crafty.c("Meter", {
        _fill: 0,
        _color: '#0000BB',
        _fullcolor: '#BB3333',
        ready: true,

        _draw: function(e) {
            if(e.type == 'canvas') {
                e.ctx.strokeStyle = '#000000';
                e.ctx.strokeRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);

                if(this._fill >= 1.0) {
                    e.ctx.fillStyle = this._fullcolor;
                } else {
                    e.ctx.fillStyle = this._color;
                }
                e.ctx.fillRect(e.pos._x, e.pos._y, this._fill * e.pos._w, e.pos._h);
            } else {
                e.destroy();
                console.log("Meter component doesn't support DOM!");
            }
        },

        init: function() {
            this.bind("Draw", this._draw);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", this._draw);
            this.trigger("Invalidate");
        },

        meter: function(color, fullcolor) {
            this._color = color;
            if(fullcolor === undefined) {
                this._fullcolor = this._color;
            } else {
                this._fullcolor = fullcolor;
            }
            this.trigger('Invalidate');
            return this;
        },

        fill: function(fill) {
            u.assert(fill >= 0 && fill <= 1.0);
            this._fill = fill;
            this.trigger('Invalidate');
            return this;
        }
    });
});
