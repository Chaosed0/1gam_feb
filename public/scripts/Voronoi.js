
define(['crafty', 'util', 'voronoi', 'noise'], function(Crafty, u, Voronoi, Noise) {
    var vec2 = Crafty.math.Vector2D;

    var close = function(v1, v2) {
        return Math.abs(v1.x - v2.x) < .001 && Math.abs(v1.y - v2.y) < .001;
    }

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
        return { size: gridSize,
            dimensions: gridDimensions,
            points: points };
    }

    var annotateElevation = function(data, diagram) {
        var noiseGen = new Noise();
        noiseGen.seed(Math.random());

        var dimensions = data.dimensions;
        var size = data.size;
        var points = data.points;
        for(var x = 0; x < dimensions.x; x++) {
            for(var y = 0; y < dimensions.y; y++) {
                var elevation = noiseGen.perlin2(x / dimensions.x, y / dimensions.y);
                var point = data.points[y * dimensions.x + x];
                diagram.cells[point.voronoiId].elevation = elevation;
            }
        }
    }

    var draw = function(e) {
        if(e.type == 'canvas') {
            var points = this._points.points;
            var diagram = this._diagram;
            var edges = diagram.edges;
            var cells = diagram.cells;

            for(var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                var elevation = cell.elevation;
                var red = 0;
                var blue = 0;
                var green = Math.floor((elevation + 1)/2 * 255);
                var halfEdges = cell.halfedges;

                e.ctx.beginPath();
                e.ctx.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';

                var prevPoint = null;
                if(halfEdges[0].edge.va == halfEdges[1].edge.va ||
                   halfEdges[0].edge.va == halfEdges[1].edge.vb) {
                    prevPoint = halfEdges[0].edge.va;
                } else {
                    prevPoint = halfEdges[0].edge.vb;
                }
                e.ctx.moveTo(prevPoint.x, prevPoint.y);

                for(var j = 1; j < halfEdges.length; j++) {
                    var edge = halfEdges[j].edge;
                    if(close(prevPoint, edge.vb)) {
                        e.ctx.lineTo(edge.va.x, edge.va.y);
                        prevPoint = edge.va;
                    } else {
                        e.ctx.lineTo(edge.vb.x, edge.vb.y);
                        prevPoint = edge.vb;
                    }
                }
                e.ctx.closePath();
                e.ctx.fill();
            }

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
            this._diagram = v.compute(this._points.points,
                    {xl: this.x, xr: this.x + this.w, yt: this.y, yb: this.y + this.h});
            annotateElevation(this._points, this._diagram);
            return this;
        }
    });
});
