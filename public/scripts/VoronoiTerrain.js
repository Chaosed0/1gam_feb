
//Terrain generator using voronoi cells
// http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/
define(['crafty', 'util', 'voronoi', 'noise', 'prioq'], function(Crafty, u, Voronoi, Noise, PriorityQueue) {
    var vec2 = Crafty.math.Vector2D;

    const numRivers = 10;
    const riverTooClose = 4;
    const numOctaves = 16;
    const frequencyConst = 5;
    const perturbConst = 3.0;
    const epsilon = 0.001;

    var VoronoiTerrain = function() {
        this.diagram = null;
        this.pointData = null;
        this.elevationRange = null;
        this.rivers = null;
    }

    var close = function(v1, v2) {
        return Math.abs(v1.x - v2.x) < epsilon && Math.abs(v1.y - v2.y) < epsilon;
    }

    VoronoiTerrain.prototype.generatePoints = function(width, height, density) {
        var gridSize = new vec2(width / density, height / density);
        var gridDimensions = new vec2(Math.floor(width / gridSize.x), Math.floor(height / gridSize.y));
        var points = new Array(gridDimensions.x * gridDimensions.y);

        for (var y = 0; y < gridDimensions.y; y++) {
            for (var x = 0; x < gridDimensions.x; x++) {
                var point = new vec2((x + 0.5) * gridSize.x, (y + 0.5) * gridSize.y);
                var perturb = new vec2(u.getRandom(-gridSize.x / perturbConst, gridSize.x / perturbConst),
                                       u.getRandom(-gridSize.y / perturbConst, gridSize.y / perturbConst));
                point.add(perturb);
                points[y * gridDimensions.x + x] = point;
            }
        }
        this.pointData = { size: gridSize,
            dimensions: gridDimensions,
            points: points };
    }

    VoronoiTerrain.prototype.generateDiagram = function(width, height) {
        var v = new Voronoi();
        this.diagram = v.compute(this.pointData.points, {xl: 0, xr: width, yt: 0, yb: height});
    }

    VoronoiTerrain.prototype.annotateElevation = function() {
        var octaves = new Array(numOctaves);
        for(var i = 0; i < numOctaves; i++) {
            var octave = new Noise();
            octave.seed(Math.random());
            octaves[i] = octave;
        }

        var range = {min: 0, max: 0};

        var dimensions = this.pointData.dimensions;
        var size = this.pointData.size;
        var points = this.pointData.points;
        for(var x = 0; x < dimensions.x; x++) {
            for(var y = 0; y < dimensions.y; y++) {
                var elevation = 0;
                var point = points[y * dimensions.x + x];
                for(var i = 0; i < numOctaves; i++) {
                    var frequency = Math.pow(frequencyConst, i);
                    elevation += octaves[i].perlin2(x / frequency, y / frequency);
                }
                point.elevation = elevation;

                if(range.min > elevation) {
                    range.min = elevation;
                }
                if(range.max < elevation) {
                    range.max = elevation;
                }
            }
        }

        this.elevationRange = range;
    }

    VoronoiTerrain.prototype.generateRivers = function(waterPercent) {
        var waterLine = this.elevationRange.min +
            (this.elevationRange.max - this.elevationRange.min) * waterPercent;
        var prioq = new PriorityQueue({
            comparator: function(a, b) {
                return b.elevation - a.elevation;
            }
        });

        for(var i = 0; i < this.pointData.points.length; i++) {
            prioq.queue(this.pointData.points[i]);
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
                var p1 = {x: rivers[j][0].x / this.pointData.size.x, y: rivers[j][0].y / this.pointData.size.y};
                var p2 = {x: point.x / this.pointData.size.x, y: point.y / this.pointData.size.y};
                var rel = {x: p2.x - p1.x, y: p2.y - p1.y};
                if(Math.abs(rel.x) + Math.abs(rel.y) < riverTooClose) {
                    skip = true;
                }
            }

            if(skip) {
                continue;
            }

            //Initial state
            var cell = this.diagram.cells[point.voronoiId];
            var elevation = point.elevation;
            var halfedge = Math.floor(u.getRandom(cell.halfedges.length));
            var river = [];

            while(elevation > waterLine) {
                //Find the neighbor cell with the lowest elevation
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
                // we're stuck in a valley; just make a path
                if(nextPoint.elevation > point.elevation) {
                    nextPoint.elevation = point.elevation - 0.01;
                }

                //We now have the next site for the river, but we need
                // to find the path around the cell edges
                //(I tried cell-center to cell center; it just doesn't look
                // as good)
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

                    //Annotate the edge for later, saying that there's a river here
                    halfEdges[j].edge.isRiver = true;
                }

                //Update state
                point = nextPoint;
                cell = this.diagram.cells[point.voronoiId];
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

        this.rivers = rivers;
    }

    VoronoiTerrain.prototype.getElevationRange = function() {
        return this.elevationRange;
    }

    VoronoiTerrain.prototype.getPointData = function() {
        return this.pointData;
    }

    VoronoiTerrain.prototype.getDiagram = function() {
        return this.diagram;
    }

    VoronoiTerrain.prototype.getRivers = function() {
        return this.rivers;
    }

    VoronoiTerrain.prototype.generateTerrain = function(width, height, density, waterPercent) {
        this.generatePoints(width, height, density);
        this.generateDiagram(width, height);
        this.annotateElevation();
        this.generateRivers(waterPercent);
    }
    
    return VoronoiTerrain;
});
