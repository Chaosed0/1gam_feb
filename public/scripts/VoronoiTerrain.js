
//Terrain generator using voronoi cells
// http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/
define(['crafty', './Util', 'voronoi', 'noise', 'prioq'], function(Crafty, u, Voronoi, Noise, PriorityQueue) {
    var vec2 = Crafty.math.Vector2D;

    const numRivers = 10;
    const riverTooClose = 4;
    const numOctaves = 16;
    const frequencyConst = 5;
    const perturbConst = 3.0;

    const oceanThreshold = 100;
    const continentThreshold = 100;

    var VoronoiTerrain = function() {
        this.diagram = null;
        this.pointData = null;
        this.elevationRange = null;
        this.rivers = null;
        this.size = {w: 0, h: 0}
        this.waterline = 0.0;
        this.bodies = {};
    }

    VoronoiTerrain.prototype.inCell = function(point, cell) {
        var halfedges = cell.halfedges;
        var result = false;
        for (var i = 0; i < halfedges.length; i++) {
            var halfedge = halfedges[i];
            var p1 = halfedge.getStartpoint();
            var p2 = halfedge.getEndpoint();
            if ((p1.y > point.y) != (p2.y > point.y) &&
                    (point.x < (p2.x - p1.x) * (point.y - p1.y) / (p2.y - p1.y) + p1.x)) {
                result = !result;
            }
        }
        return result;
    }

    VoronoiTerrain.prototype.generatePoints = function(width, height, density) {
        var gridSize = new vec2(width / density, height / density);
        var gridDimensions = new vec2(Math.round(width / gridSize.x), Math.floor(height / gridSize.y));
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
        console.log(this.diagram);
    }

    //Annotates land and sea coast tiles with isCoast, and the edges
    // of the land coastlines with isCoastline.
    VoronoiTerrain.prototype.annotateCoasts = function() {
        /* NOTE: we're assuming generateRivers was already called */
        var cells = this.diagram.cells;
        for(var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var halfedges = cell.halfedges;

            if(cell.site.elevation < this.waterLine) {
                /* Skip this one, we're in water */
                continue;
            }

            for(var j = 0; j < halfedges.length; j++) {
                var halfedge = halfedges[j];
                var lsite = halfedge.edge.lSite;
                var rsite = halfedge.edge.rSite;
                var othersite;

                if(rsite == cell.site) {
                    othersite = lsite;
                } else {
                    othersite = rsite;
                }

                //We want to count cells bordering the edge of the map as coasts as well
                if(othersite == null || othersite.elevation < this.waterLine) {
                    if(othersite) {
                        othersite.isCoast = true;
                    }
                    cell.site.isCoast = true;
                    halfedge.edge.isCoastline = true;
                }
            }
        }
    }

    // Creates bodies from the tile data. Large bodies of water are of
    // type 'ocean', small ones 'lake', small bodies of land 'island', and
    // large ones 'continent'.
    VoronoiTerrain.prototype.makeBodies = function() {
        var points = this.pointData.points;
        var dimensions = this.pointData.dimensions;
        var size = this.pointData.size;

        /* Floodfill everything, but don't fill things that are already filled */
        var set = new Set();
        for(var y = 0; y < dimensions.y; y++) {
            for(var x = 0; x < dimensions.x; x++) {
                var point = points[y * dimensions.x + x];
                var cell = this.getCellForId(point.voronoiId);
                var cells = [];

                this.floodFill(cell, set, function(terrain, ocell) {
                    if(point.elevation > terrain.waterLine) {
                        return ocell.site.elevation > terrain.waterLine;
                    } else {
                        return ocell.site.elevation < terrain.waterLine;
                    }
                }, function(cell) {
                    cells.push(cell);
                });

                if(cells.length <= 0) {
                    // We've likely already been here
                    continue;
                }

                var type, land;
                if(point.elevation < this.waterLine) {
                    if(cells.length > oceanThreshold) {
                        //Large body of water
                        type = 'oceans';
                    } else {
                        type = 'lakes';
                    }
                    land = false;
                } else {
                    if(cells.length > continentThreshold) {
                        type = 'continents';
                    } else {
                        type = 'islands';
                    }
                    land = true;
                }

                this.makeBody(cells, type, land);
                point.type = type;
            }
        }
        console.log(this.bodies);
    }
    
    VoronoiTerrain.prototype.aboveWater = function(point) {
        return point.elevation > this.waterLine;
    }

    VoronoiTerrain.prototype.floodFill = function(cell, set, condition, action) {
        var stack = [cell];

        while(stack.length > 0) {
            var cell = stack.pop();
            if(!condition(this, cell) || set.has(cell)) {
                continue;
            } 

            action(cell);
            set.add(cell);

            var halfedges = cell.halfedges;
            for(var i = 0; i < halfedges.length; i++) {
                var othersite = this.getOtherSite(halfedges[i].edge, cell.site);
                if(othersite) {
                    var othercell = this.getCellForId(othersite.voronoiId);
                    stack.push(othercell);
                }
            }
        }
    }

    VoronoiTerrain.prototype.makeBody = function(cells, type, land) {
        if(cells.length <= 0) {
            return;
        }

        var body = { cells: cells, land: land, coast: [] };
        var coast = body.coast;

        for(var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if(cell.site.isCoast) {
                coast.push(cell);
            }
        }

        if(!(type in this.bodies)) {
            this.bodies[type] = [];
        }
        this.bodies[type].push(body);
    }

    VoronoiTerrain.prototype.bfs = function(cell, limit, condition, action) {
        var prioq = new PriorityQueue({
            comparator: function(a, b) {
                /* Low to high priority */
                return a.prio - b.prio;
            }
        });
        var visitedCells = new Set();

        prioq.queue({cell: cell, prio: 0});

        while(prioq.length > 0) {
            var data = prioq.dequeue();
            var cell = data.cell;
            var prio = data.prio;
            var result = condition(this, cell);

            visitedCells.add(cell);
            if(result > 0) {
                //We want this cell
                action(cell);
            } else if(result == 0) {
                //We don't want this cell
                continue;
            }
            //Anything else, we want to skip this cell for
            // taking an action but still go forward

            if(prio + 1 > limit) {
                continue;
            }

            for(var i = 0; i < cell.halfedges.length; i++) {
                var halfedge = cell.halfedges[i];
                var othersite = this.getOtherSite(cell.halfedges[i].edge, cell.site);
                //Other site must be valid
                if(othersite) {
                    var othercell = this.getCellForId(othersite.voronoiId);
                    //Cell must meet condition and not be visited already
                    if(!visitedCells.has(othercell)) {
                        prioq.queue({cell: othercell, prio: prio + 1});
                    }
                }
            }
        }
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

    VoronoiTerrain.prototype.generateRivers = function() {
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
            // If this assert is hit, either we're spawning too many
            // rivers or riverTooClose is too large
            u.assert(prioq.length > 0, "We ran out of river candidates!?");

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

            while(elevation > this.waterLine) {
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
                    //It's possible that this edge borders the edge of the map
                    if(halfEdges[j].edge.lSite) {
                        halfEdges[j].edge.lSite.bordersRiver = true;
                    }
                    if(halfEdges[j].edge.rSite) {
                        halfEdges[j].edge.rSite.bordersRiver = true;
                    }
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

                u.assert(foundDual, "We didn't find a dual edge for some halfedge");
            }

            if(river.length > 0) {
                rivers.push(river);
            }
        }

        this.rivers = rivers;
    }

    VoronoiTerrain.prototype.getCellForPos = function(pos) {
        if(pos.x < 0 || pos.y < 0 || pos.x > this.size.w || pos.y > this.size.h) {
            return null;
        }

        //Exploit a property of the voronoi cells we generate; since we generate
        // a grid of points for the sites, try the grid cell the coord would
        // correspond to and then spiral out from there
        var gridLoc = new vec2(Math.round(pos.x / this.pointData.size.x),
                               Math.round(pos.y / this.pointData.size.y));
        var rel = new vec2(0, 0);
        var point = this.pointData.points[gridLoc.y * this.pointData.dimensions.x + gridLoc.x];
        var found = false;
        var dx = 0;
        var dy = -1;

        while(!(found = this.inCell(pos, this.diagram.cells[point.voronoiId]))) {
            if(rel.x == rel.y ||
                    (rel.x < 0 && rel.x == - rel.y) ||
                    (rel.x > 0 && rel.x == 1 - rel.y)) {
                var tmp = dx;
                dx = -dy;
                dy = tmp;
            }
            rel.x += dx;
            rel.y += dy;
            point = this.pointData.points[(gridLoc.y + rel.y) * this.pointData.dimensions.x + (gridLoc.x + rel.x)];
        }

        if(found) {
            return this.diagram.cells[point.voronoiId];
        } else {
            console.log("WARNING: Didn't find a cell containing point " + pos);
            return null;
        }
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

    VoronoiTerrain.prototype.getBodies = function() {
        return this.bodies;
    }

    VoronoiTerrain.prototype.getCellForId = function(voronoiId) {
        return this.diagram.cells[voronoiId];
    }

    VoronoiTerrain.prototype.getOtherSite = function(edge, site) {
        u.assert(edge.lSite || edge.rSite);
        var lsite = edge.lSite;
        var rsite = edge.rSite;
        if(lsite === site) {
            return rsite;
        } else if(rsite === site) {
            return lsite;
        } else {
            return null;
        }
    }

    VoronoiTerrain.prototype.generateTerrain = function(width, height, density, waterPercent) {
        this.size.w = width;
        this.size.h = height;
        this.generatePoints(width, height, density);
        this.generateDiagram(width, height);
        this.annotateElevation();

        this.waterLine = this.elevationRange.min +
            (this.elevationRange.max - this.elevationRange.min) * waterPercent;

        this.generateRivers();
        this.annotateCoasts();
        this.makeBodies();
    }
    
    return VoronoiTerrain;
});
