
define(['crafty', 'util', './VoronoiTerrain'], function(Crafty, u, VoronoiTerrain) {
    var elevationColorMap = {
        water: [
            {chance: 0.4, color: { r: 0, g: 0, b: 200}},
            {chance: 0.4, color: { r: 30, g: 30, b: 230}},
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
            var points = this._terrain.getPointData().points;
            var diagram = this._terrain.getDiagram();
            var rivers = this._terrain.getRivers();
            var edges = diagram.edges;
            var cells = diagram.cells;

            for(var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                var elevation = cell.site.elevation;
                var halfEdges = cell.halfedges;
                var color = elevationToColor(elevation, this._elevationRange, this._terrainpercents);
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

            for(var i = 0; i < rivers.length; i++) {
                var river = rivers[i];
                
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

    Crafty.c("TerrainVisualizer", {
        _terrain: null,
        _elevationRange: {min: 0, max: 0},
        _drawEdges: false,
        _drawSites: false,
        _drawElevations: false,
        _terrainpercents: null,
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

        terrainvisualizer: function(terrain, waterPercent, groundPercent) {
            this._terrainpercents = {
                water: waterPercent,
                ground: groundPercent,
                other: 1 - waterPercent - groundPercent
            }
            this._terrain = terrain;
            this._elevationRange = this._terrain.getElevationRange();
            return this;
        }
    });
});
