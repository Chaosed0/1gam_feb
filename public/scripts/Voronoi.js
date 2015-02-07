
define(['crafty', 'util', 'voronoi', 'noise', 'prioq'], function(Crafty, u, Voronoi, Noise, PriorityQueue) {
    var vec2 = Crafty.math.Vector2D;
    const waterPercent = 0.5;
    const groundPercent = 0.25;
    const numRivers = 10;
    const riverTooClose = 4;

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
                    var frequency = Math.pow(5, i);
                    elevation += octaves[i].perlin2(x / frequency, y / frequency);
                }
                point.elevation = elevation;
                //diagram.cells[point.voronoiId].elevation = elevation;

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
        var waterLine = range.min + (range.max - range.min) * waterPercent;
        var mountainLine = waterLine + (range.max - range.min) * groundPercent;

        if(elevation < waterLine) {
            var scale = (elevation - range.min) / (waterLine - range.min);
            red = Math.floor(scale * 100);
            green = Math.floor(scale * 100);
            blue = 255;
        } else if(elevation >= waterLine && elevation < mountainLine) {
            var scale = (elevation - waterLine) / (mountainLine - waterLine);
            red = Math.floor((1 - scale) * 200);
            green = 200;
            blue = Math.floor((1 - scale) * 150);
        } else {
            var scale = (elevation - mountainLine) / (range.max - mountainLine);
            red = Math.floor(scale * 150);
            green = 200;
            blue = Math.floor(scale * 200);
        }

        return {r: red, g: green, b: blue};
    }

    var generateRivers = function(data, diagram, waterLine, numRivers) {
        var prioq = new PriorityQueue({
            comparator: function(a, b) {
                return b.elevation - a.elevation;
            }
        });

        for(var i = 0; i < data.points.length; i++) {
            //We'll need the point index for later
            prioq.queue(data.points[i]);
        }

        var rivers = [];

        while(rivers.length < numRivers) {
            if(prioq.length <= 0) {
                // Uh oh, that's really bad - either the map is too small or the
                // close-spawn avoidance is acting up too much
                throw "WE RAN OUT OF RIVER CANDIDATES!?";
            }

            var point = prioq.dequeue();
            var skip = false;

            // Don't spawn rivers too close to each other
            for(var j = 0; j < rivers.length && !skip; j++) {
                var p1 = {x: rivers[j][0].x / data.size.x, y: rivers[j][0].y / data.size.y};
                var p2 = {x: point.x / data.size.x, y: point.y / data.size.y};
                var rel = {x: p2.x - p1.x, y: p2.y - p1.y};
                if(Math.abs(rel.x) + Math.abs(rel.y) < riverTooClose) {
                    skip = true;
                }
            }

            if(skip) {
                continue;
            }

            var cell = diagram.cells[point.voronoiId];
            var elevation = point.elevation;
            var halfedge = Math.floor(u.getRandom(cell.halfedges.length));
            var river = [];

            while(elevation > waterLine) {
                var halfEdges = cell.halfedges;
                var nextPoint = halfEdges[0].edge.rSite;
                var nextHalfedge = 0;
                if(halfEdges[0].edge.rSite === point) {
                    nextPoint = halfEdges[0].edge.lSite;
                }
                for(var j = 0; j < halfEdges.length; j++) {
                    var thisPoint = halfEdges[j].edge.rSite;
                    if(halfEdges[j].edge.rSite === point) {
                        thisPoint = halfEdges[j].edge.lSite;
                    }
                    if(thisPoint) {
                        var thisElevation = thisPoint.elevation;
                        var gradient = elevation - thisElevation;
                        if(elevation - nextPoint.elevation < gradient) {
                            nextPoint = thisPoint;
                            nextHalfedge = j;
                        }
                    }
                }

                //If the next-lowest elevation actually goes up,
                // we're stuck in a valley; erode it
                if(nextPoint.elevation > point.elevation) {
                    nextPoint.elevation = point.elevation - 0.01;
                }

                //We have the site now, but we need to find the path
                // around the cell borders
                var j = halfedge;
                while(j != nextHalfedge) {
                    var vertex;
                    if(nextHalfedge - halfedge < halfEdges.length - nextHalfedge + halfedge) {
                        // CW
                        vertex = halfEdges[j].getEndpoint();
                        j = (j+1)%halfEdges.length;
                    } else {
                        // CCW
                        vertex = halfEdges[j].getStartpoint();
                        j = (halfEdges.length + j - 1) % halfEdges.length;
                    }
                    river.push(vertex);
                }

                point = nextPoint;
                cell = diagram.cells[point.voronoiId];
                elevation = point.elevation;
                
                //Now, we have to find the dual halfedge on the next site
                // since nextHalfedge was the halfedge on the previous cell
                var foundDual = false;
                for(var j = 0; j < cell.halfedges.length; j++) {
                    if(cell.halfedges[j].edge === halfEdges[nextHalfedge].edge) {
                        foundDual = true;
                        halfedge = j;
                        break;
                    } 
                }

                if(!foundDual) {
                    throw "DUAL EDGE NOT FOUND";
                }
            }

            if(river.length > 0) {
                rivers.push(river);
            }
        }

        return rivers;
    }

    var draw = function(e) {
        if(e.type == 'canvas') {
            var points = this._pointdata.points;
            var diagram = this._diagram;
            var edges = diagram.edges;
            var cells = diagram.cells;

            for(var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                var elevation = cell.site.elevation;
                var halfEdges = cell.halfedges;
                var color = elevationToColor(elevation, this._elevationRange);
                var textColor = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';

                e.ctx.beginPath();
                e.ctx.fillStyle = textColor;
                e.ctx.strokeStyle = textColor;

                var point = halfEdges[0].getStartpoint();
                e.ctx.moveTo(point.x, point.y);

                for(var j = 1; j < halfEdges.length; j++) {
                    point = halfEdges[j].getStartpoint();
                    e.ctx.lineTo(point.x, point.y);
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

            for(var i = 0; i < this._rivers.length; i++) {
                var river = this._rivers[i];
                
                e.ctx.save();
                e.ctx.beginPath();
                e.ctx.strokeStyle = '#0000FF';
                e.ctx.lineWidth = 3;
                e.ctx.lineCap = 'round';
                e.ctx.lineJoin = 'round';
                e.ctx.moveTo(river[0].x, river[0].y);
                for(var j = 1; j < river.length; j++) {
                    var point = river[j];
                    e.ctx.lineTo(point.x, point.y);
                }
                e.ctx.stroke();
                e.ctx.restore();
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
        _pointdata: [],
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

            this._pointdata = generatePoints(this.w, this.h, density);
            this._diagram = v.compute(this._pointdata.points,
                    {xl: this.x, xr: this.x + this.w, yt: this.y, yb: this.y + this.h});
            this._elevationRange = annotateElevation(this._pointdata, this._diagram);
            console.log(this._diagram);
            this._rivers = generateRivers(this._pointdata, this._diagram,
                    this._elevationRange.min + (this._elevationRange.max - this._elevationRange.min) / 2.0, numRivers);
            return this;
        }
    });
});
