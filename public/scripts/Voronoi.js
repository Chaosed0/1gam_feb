
define(['crafty', 'util', 'voronoi', 'noise'], function(Crafty, u, Voronoi, Noise) {
    var vec2 = Crafty.math.Vector2D;

    var generatePoints = function(width, height, density) {
        var gridSize = new vec2(width / density, height / density);
        var gridDimensions = new vec2(Math.floor(width / gridSize.x), Math.floor(height / gridSize.y));
        var points = new Array(gridDimensions.x * gridDimensions.y);

        for (var y = 0; y < gridDimensions.y; y++) {
            for (var x = 0; x < gridDimensions.x; x++) {
                var point = new vec2((x + 0.5) * gridSize.x, (y + 0.5) * gridSize.y);
                var perturb = new vec2(u.getRandom(-gridSize.x / 3.0, gridSize.x / 3.0),
                                       u.getRandom(-gridSize.y / 3.0, gridSize.y / 3.0));
                point.add(perturb);
                points[y * gridDimensions.x + x] = point;
            }
        }
        return points;
    }

    var draw = function(e) {
        if(e.type == 'canvas') {
            var points = this._points;
            var edges = this._diagram.edges;

            e.ctx.beginPath();
            e.ctx.fillStyle = 'black';
            for(var i = 0; i < points.length; i++) {
                var point = points[i];
                e.ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
            }
            e.ctx.fill();

            e.ctx.beginPath();
            e.ctx.strokeStyle = 'red';
            for(var i = 0; i < edges.length; i++) {
                var edge = edges[i];
                e.ctx.moveTo(edge.va.x, edge.va.y);
                e.ctx.lineTo(edge.vb.x, edge.vb.y);
            }
            e.ctx.stroke();
        }
    }

    Crafty.c("Voronoi", {
        _points: [],
        _diagram: [],
        ready: false,

        init: function() {
            this.ready = true;
            this.bind("Draw", draw);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", draw);
            this.trigger("Invalidate");
        },

        voronoi: function(density) {
            var v = new Voronoi();

            if (!v) {
                console.log("Couldn't find Javascript-Voronoi");
                return;
            }

            this._points = generatePoints(this.w, this.h, density);
            this._diagram = v.compute(this._points,
                    {xl: this.x, xr: this.x + this.w, yt: this.y, yb: this.y + this.h});
            console.log(this._diagram);
            return this;
        }
    });
});
