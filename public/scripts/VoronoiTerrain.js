
//Terrain generator using voronoi cells
// http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/
define(['crafty', 'util', 'voronoi', 'noise', 'prioq'], function(Crafty, u, Voronoi, Noise, PriorityQueue) {
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
                var ids = [];
                this.floodFillSub(point, ids, set, function(terrain, opoint) {
                    if(point.elevation > terrain.waterLine) {
                        return opoint.elevation > terrain.waterLine;
                    } else {
                        return opoint.elevation < terrain.waterLine;
                    }
                });

                var type, land;
                if(point.elevation < this.waterLine) {
                    if(ids.length > oceanThreshold) {
                        //Large body of water
                        type = 'oceans';
                    } else {
                        type = 'lakes';
                    }
                    land = false;
                } else {
                    if(ids.length > continentThreshold) {
                        type = 'continents';
                    } else {
                        type = 'islands';
                    }
                    land = true;
                }

                this.makeBody(ids, type, land);
                point.type = type;
            }
        }
        console.log(this.bodies);
    }
    
    VoronoiTerrain.prototype.aboveWater = function(point) {
        return point.elevation > this.waterLine;
    }

    VoronoiTerrain.prototype.floodFill = function(point, limit, condition) {
        var ids = [];
        var set = new Set();
        this.floodFillSub(point, ids, set, condition, limit, 0);
        return ids;
    }

    VoronoiTerrain.prototype.floodFillSub = function(point, arr, set, condition, limit, num) {
        if(!condition(this, point) ||
                set.has(point.voronoiId) ||
                (num !== undefined && limit !== undefined && num > limit)) {
            return;
        } 

        if(num !== undefined) {
            num++;
        }

        arr.push(point.voronoiId);
        set.add(point.voronoiId);

        var halfedges = this.diagram.cells[point.voronoiId].halfedges;
        for(var i = 0; i < halfedges.length; i++) {
            var lsite = halfedges[i].edge.lSite;
            var rsite = halfedges[i].edge.rSite;
            if(rsite && lsite === point) {
                this.floodFillSub(rsite, arr, set, condition, limit, num);
            } else if(lsite && rsite === point) {
                this.floodFillSub(lsite, arr, set, condition, limit, num);
            }
        }
    }

    VoronoiTerrain.prototype.makeBody = function(ids, type, land) {
        if(ids.length <= 0) {
            return;
        }

        var body = { ids: ids, land: land, coast: [] };
        var coast = body.coast;

        for(var i = 0; i < ids.length; i++) {
            var id = ids[i];
            if(this.diagram.cells[id].site.isCoast) {
                coast.push(id);
            }
        }

        if(!(type in this.bodies)) {
            this.bodies[type] = [];
        }
        this.bodies[type].push(body);
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

    VoronoiTerrain.prototype.drawTo = function(ctx, colormap, options) {
        var pointData = this.pointData;
        var diagram = this.diagram;
        var rivers = this.rivers;
        var points = pointData.points;
        var edges = diagram.edges;
        var cells = diagram.cells;

        ctx.save();
        for(var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var elevation = cell.site.elevation;
            var halfEdges = cell.halfedges;
            var color = colormap[cell.site.voronoiId];
            var textColor = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';

            ctx.beginPath();
            ctx.fillStyle = textColor;
            ctx.strokeStyle = textColor;

            var point = halfEdges[0].getStartpoint();
            ctx.moveTo(point.x, point.y);

            for(var j = 1; j < halfEdges.length; j++) {
                point = halfEdges[j].getStartpoint();
                ctx.lineTo(point.x, point.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if(options._drawElevations) {
                ctx.fillStyle = 'rgb(' + (255 - color.r) + ',' + (255 - color.g) + ',' + (255 - color.b) + ')';
                ctx.font = "8px";
                ctx.textAlign = 'center';
                ctx.fillText(elevation.toFixed(2), cell.site.x, cell.site.y);
            }
        }
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for(var i = 0; i < rivers.length; i++) {
            var river = rivers[i];
            
            ctx.beginPath();
            ctx.moveTo(river[0].x, river[0].y);
            for(var j = 1; j < river.length; j++) {
                var point = river[j];
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
        ctx.restore();

        if(options && options.drawSites) {
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = 'black';
            for(var i = 0; i < points.length; i++) {
                var point = points[i];
                ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
            }
            ctx.fill();
            ctx.restore();
        }

        if(options && options.drawEdges) {
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'red';
            for(var i = 0; i < edges.length; i++) {
                var edge = edges[i];
                ctx.moveTo(edge.va.x, edge.va.y);
                ctx.lineTo(edge.vb.x, edge.vb.y);
            }
            ctx.stroke();
            ctx.restore();
        }

        if(options && options.drawCoasts) {
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'yellow';
            ctx.lineCap = 'round';
            ctx.lineWidth = 5;
            for(var i = 0; i < cells.length; i++) {
                if(cells[i].site.isCoast) {
                    var halfedges = cells[i].halfedges;
                    for(var j = 0; j < halfedges.length; j++) {
                        if(halfedges[j].edge.isCoastline) {
                            var p1 = halfedges[j].getStartpoint();
                            var p2 = halfedges[j].getEndpoint();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                        }
                    }
                }
            }
            ctx.stroke();
            ctx.restore();
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
