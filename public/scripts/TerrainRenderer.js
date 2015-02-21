
//Renderer for voronoi terrain to a canvas.
define(['./Util'], function(u) {
    const elevationColorMap = {
        water: [
            {chance: 0.5, color: { r: 0, g: 0, b: 200}},
            {chance: 0.3, color: { r: 30, g: 30, b: 230}},
            {chance: 0.2, color: { r: 50, g: 70, b: 250}},
        ], ground: [
            {chance: 0.25, color: { r: 150, g: 230, b: 50}},
            {chance: 0.25, color: { r: 125, g: 215, b: 50}},
            {chance: 0.25, color: { r: 100, g: 200, b: 50}},
            {chance: 0.25, color: { r: 100, g: 180, b: 50}},
        ], mountain: [
            {chance: 0.5, color: { r: 170, g: 170, b: 170}},
            {chance: 0.5, color: { r: 200, g: 200, b: 210}},
        ]
    };
    const colorVariation = 15;

    var elevationToColor = function(elevation, range, terrainPercentages) {
        var curSubpercent = 0;
        var curLimit = 0;
        var normalizeElevation = (elevation - range.min) / (range.max - range.min);
        for(var type in elevationColorMap) {
            if(type in terrainPercentages) {
                curSubpercent = terrainPercentages[type];
            } else if('other' in terrainPercentages) {
                curSubpercent = terrainPercentages['other'];
            } else {
                u.assert(false, "Couldn't find terrain type " + type);
            }
            var typeColorMap = elevationColorMap[type];

            for(var i = 0; i < typeColorMap.length; i++) {
                var curMap = typeColorMap[i];
                curLimit += curSubpercent * curMap.chance;
                if(normalizeElevation <= curLimit) {
                    return {r: Math.floor(curMap.color.r + u.getRandom(colorVariation)),
                            g: Math.floor(curMap.color.g + u.getRandom(colorVariation)),
                            b: Math.floor(curMap.color.b + u.getRandom(colorVariation))};
                }
            }
        }

        /* Floating point math won't always let us get to 1.0. Just return what we would have
         * for the last tile if we couldn't find anything. */
        var typeColorMap = elevationColorMap['mountain'];
        var curMap = typeColorMap[typeColorMap.length-1];
        return {r: Math.floor(curMap.color.r + u.getRandom(colorVariation)),
                g: Math.floor(curMap.color.g + u.getRandom(colorVariation)),
                b: Math.floor(curMap.color.b + u.getRandom(colorVariation))};
    }
    
    var renderTerrain = function(terrain, bounds, terrainPercents, options) {
        var elevationRange = terrain.getElevationRange();

        var pointData = terrain.getPointData();
        var diagram = terrain.getDiagram();
        var rivers = terrain.getRivers();
        var bodies = terrain.getBodies();
        var points = pointData.points;
        var edges = diagram.edges;
        var cells = diagram.cells;

        var canvas = document.createElement('canvas');
        canvas.width = bounds.w;
        canvas.height = bounds.h;
        var ctx = canvas.getContext('2d');

        ctx.save();
        for(var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var elevation = cell.site.elevation;
            var halfEdges = cell.halfedges;
            var color = elevationToColor(elevation, elevationRange, terrainPercents);
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

            if(options && options.drawElevations) {
                ctx.fillStyle = 'rgb(' + (255 - color.r) + ',' + (255 - color.g) + ',' + (255 - color.b) + ')';
                ctx.font = "8px";
                ctx.textAlign = 'center';
                ctx.fillText(elevation.toFixed(2), cell.site.x, cell.site.y);
            } else if(options && options.drawBodyTypes) {
                var typestr = null;
                for(var type in bodies) {
                    for(var j = 0; j < bodies[type].length; j++) {
                        if(bodies[type][j].cellset.has(cell)) {
                            typestr = type + ' (' + j + ')';
                            break;
                        }
                    }
                    if(typestr) {
                        break;
                    }
                }
                ctx.fillStyle = 'rgb(' + (255 - color.r) + ',' + (255 - color.g) + ',' + (255 - color.b) + ')';
                ctx.font = "8px";
                ctx.textAlign = 'center';
                ctx.fillText(typestr, cell.site.x, cell.site.y);
            }
        }
        ctx.restore();

        if(options && options.drawRivers) {
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
        }

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

        return canvas;
    }

    return renderTerrain;
});
