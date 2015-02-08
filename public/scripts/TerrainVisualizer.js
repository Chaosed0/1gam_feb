
define(['crafty', 'util', './VoronoiTerrain'], function(Crafty, u, VoronoiTerrain) {
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
    const colorVariation = 5;

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
                throw 'Couldn\'t find terrain type ' + type;
            }
            var typeColorMap = elevationColorMap[type];

            for(var i = 0; i < typeColorMap.length; i++) {
                var curMap = typeColorMap[i];
                curLimit += curSubpercent * curMap.chance;
                if(normalizeElevation < curLimit) {
                    color = {r: Math.floor(curMap.color.r + u.getRandom(colorVariation)),
                             g: Math.floor(curMap.color.g + u.getRandom(colorVariation)),
                             b: Math.floor(curMap.color.b + u.getRandom(colorVariation))};
                    return color;
                }
            }
        }

        return {r: 0, g: 0, b: 0};
    }

    var draw = function(e) {
        if(e.type == 'canvas') {
            drawto(e.ctx, this);
        }
    }

    var drawto = function(ctx, vis, cull) {
        var pointData = vis._terrain.getPointData();
        var diagram = vis._terrain.getDiagram();
        var rivers = vis._terrain.getRivers();
        var points = pointData.points;
        var edges = diagram.edges;
        var cells = diagram.cells;

        //Cull on viewport bounds
        var vprops = {
            x: -Crafty.viewport._x,
            y: -Crafty.viewport._y,
            w: Crafty.viewport._width,
            h: Crafty.viewport._height,
            scale: Crafty.viewport._scale
        };
        var bounds = {
            bx: cull ? Math.max(Math.floor(vprops.x / pointData.size.x) - 2, 0) : 0,
            by: cull ? Math.max(Math.floor(vprops.y / pointData.size.y) - 2, 0) : 0,
            ex: cull ? Math.min(Math.floor((vprops.x + vprops.w / vprops.scale) / pointData.size.x) + 2,
                    pointData.dimensions.x) : pointData.dimensions.x,
            ey: cull ? Math.min(Math.floor((vprops.y + vprops.h / vprops.scale) / pointData.size.y) + 2,
                    pointData.dimensions.y) : pointData.dimensions.y
        };

        ctx.save();
        for(var y = bounds.by; y < bounds.ey; y++) {
            for(var x = bounds.bx; x < bounds.ex; x++) {
                var point = points[y * pointData.dimensions.x + x];
                var cell = cells[point.voronoiId];
                var elevation = cell.site.elevation;
                var halfEdges = cell.halfedges;
                var color = vis._cellcolors[cell.site.voronoiId];
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

                if(vis._drawElevations) {
                    ctx.fillStyle = 'rgb(' + (255 - color.r) + ',' + (255 - color.g) + ',' + (255 - color.b) + ')';
                    ctx.font = "8px";
                    ctx.textAlign = 'center';
                    ctx.fillText(elevation.toFixed(2), cell.site.x, cell.site.y);
                }
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

        if(vis._drawSites) {
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

        if(vis._drawEdges) {
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

        if(vis._selectedcell) {
            var halfedges = vis._selectedcell.halfedges;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 3;
            ctx.moveTo(halfedges[0].getStartpoint().x, halfedges[0].getStartpoint().y);
            for(var i = 1; i < halfedges.length; i++) {
                var point = halfedges[i].getStartpoint();
                ctx.lineTo(point.x, point.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        if(vis._drawMinimap && vis._minimap) {
            ctx.drawImage(vis._minimap,
                    -Crafty.viewport.x + Crafty.viewport.width * 3/4,
                    -Crafty.viewport.y + Crafty.viewport.height * 3/4,
                    Crafty.viewport.width * 1/4, Crafty.viewport.height * 1/4);
        }
    }

    var mousedown = function(e) {
        this._mousedownpos = {x: e.clientX, y: e.clientY};
    }

    var mouseup = function(e) {
        if(this._mousedownpos && u.close({x: e.clientX, y: e.clientY}, this._mousedownpos, 8)) {
            this._selectedcell = this._terrain.getCellForPos({x: e.realX, y: e.realY});
            this.trigger("Invalidate");
        }
    }

    Crafty.c("TerrainVisualizer", {
        _terrain: null,
        _elevationRange: {min: 0, max: 0},
        _drawEdges: false,
        _drawSites: false,
        _drawElevations: false,
        _drawMinimap: false,
        _terrainpercents: null,
        _cellcolors: {},
        _selectedcell: null,
        _mousedownpos: null,
        _minimap: null,
        ready: false,

        init: function() {
            this.ready = true;
            this.bind("Draw", draw);
            this.bind("MouseDown", mousedown);
            this.bind("MouseUp", mouseup);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", draw);
            this.unbind("MouseDown", mousedown);
            this.unbind("MouseUp", mouseup);
            this.trigger("Invalidate");
        },

        terrainvisualizer: function(terrain, waterPercent, groundPercent) {
            this._terrainpercents = {
                water: waterPercent,
                ground: groundPercent,
                other: 1 - waterPercent - groundPercent
            }
            this._terrain = terrain;
            this._elevationRange = this._terrain.getElevationRange();

            var points = terrain.getPointData().points;
            for(var i = 0; i < points.length; i++) {
                var color = elevationToColor(points[i].elevation, this._elevationRange, this._terrainpercents);
                this._cellcolors[points[i].voronoiId] = color;
            }

            this._minimap = document.createElement('canvas');
            this._minimap.width = this.w;
            this._minimap.height = this.h;
            var minimapctx = this._minimap.getContext('2d');
            drawto(minimapctx, this, false);
            this._drawMinimap = true;
            return this;
        }
    });
});
