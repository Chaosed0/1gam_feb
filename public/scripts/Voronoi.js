
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
        var numOctaves = 16;
        var octaves = new Array(numOctaves);
        for(var i = 0; i < numOctaves; i++) {
            var octave = new Noise();
            octave.seed(Math.random());
            octaves[i] = octave;
        }

        var range = {min: 0, max: 0};

        var dimensions = data.dimensions;
        var size = data.size;
        var points = data.points;
        for(var x = 0; x < dimensions.x; x++) {
            for(var y = 0; y < dimensions.y; y++) {
                var elevation = 0;
                var point = data.points[y * dimensions.x + x];
                for(var i = 0; i < numOctaves; i++) {
                    var frequency = Math.pow(2, i);
                    elevation += octaves[i].perlin2(x / frequency, y / frequency);
                }
                diagram.cells[point.voronoiId].elevation = elevation;

                if(range.min > elevation) {
                    range.min = elevation;
                }
                if(range.max < elevation) {
                    range.max = elevation;
                }
            }
        }

        return range;
    }

    var elevationToColor = function(elevation, range) {
        var red, green, blue;
        var waterLine = range.min + (range.max - range.min)/2.0;
        var mountainLine = waterLine + (range.max - range.min) / 4.0;

        if(elevation < waterLine) {
            var scale = (elevation - range.min) / (waterLine - range.min);
            red = Math.floor(scale * 100);
            green = Math.floor(scale * 100);
            blue = 255;
        } else if(elevation >= waterLine && elevation < mountainLine) {
            var scale = (elevation - waterLine) / (mountainLine - waterLine);
            red = Math.floor((1 - scale) * 200);
            green = 200;
            blue = 0;
        } else {
            var scale = (elevation - mountainLine) / (range.max - mountainLine);
            red = Math.floor(scale * 200);
            green = 200;
            blue = Math.floor(scale * 200);
        }

        return {r: red, g: green, b: blue};
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
                var halfEdges = cell.halfedges;
                var color = elevationToColor(elevation, this._elevationRange);
                var textColor = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';

                e.ctx.beginPath();
                e.ctx.fillStyle = textColor;
                e.ctx.strokeStyle = textColor;

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
                e.ctx.stroke();

                if(this._drawElevations) {
                    e.ctx.fillStyle = 'rgb(' + (255 - color.r) + ',' + (255 - color.g) + ',' + (255 - color.b) + ')';
                    e.ctx.font = "8px";
                    e.ctx.textAlign = 'center';
                    e.ctx.fillText(elevation.toFixed(2), cell.site.x, cell.site.y);
                }
            }

            if(this._drawSites) {
                e.ctx.beginPath();
                e.ctx.fillStyle = 'black';
                for(var i = 0; i < points.length; i++) {
                    var point = points[i];
                    e.ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
                e.ctx.fill();
            }

            if(this._drawEdges) {
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
    }

    Crafty.c("Voronoi", {
        _points: [],
        _diagram: [],
        _elevationRange: {min: 0, max: 0},
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
            this._elevationRange = annotateElevation(this._points, this._diagram);
            return this;
        }
    });
});
