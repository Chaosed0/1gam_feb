
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
                u.assert(false, "Couldn't find terrain type " + type);
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
            e.ctx.drawImage(this._prerender, this.x, this.y);

            if(this._selectedcell) {
                var halfedges = this._selectedcell.halfedges;
                e.ctx.save();
                e.ctx.beginPath();
                e.ctx.strokeStyle = 'black';
                e.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                e.ctx.lineWidth = 3;
                e.ctx.moveTo(halfedges[0].getStartpoint().x, halfedges[0].getStartpoint().y);
                for(var i = 1; i < halfedges.length; i++) {
                    var point = halfedges[i].getStartpoint();
                    e.ctx.lineTo(point.x, point.y);
                }
                e.ctx.closePath();
                e.ctx.fill();
                e.ctx.stroke();
                e.ctx.restore();
            }
        }
    }

    var mousedown = function(e) {
        this._mousedownpos = {x: e.clientX, y: e.clientY};
    }

    var mouseup = function(e) {
        /* Make sure the mouseup was close to the mousedown */
        if(this._mousedownpos && u.close({x: e.clientX, y: e.clientY}, this._mousedownpos, 8)) {
            /* User might have selected a cell of the map */
            this._selectedcell = this._terrain.getCellForPos({x: e.realX, y: e.realY});
            if(this._selectedcell) {
                /* Valid cell */
                this.trigger("CellSelected", this._selectedcell);
            }
            this.trigger("Invalidate");
        }
    }

    Crafty.c("TerrainVisualizer", {
        _terrain: null,
        _elevationRange: {min: 0, max: 0},
        _drawEdges: false,
        _drawSites: false,
        _drawElevations: false,
        _terrainpercents: null,
        _cellcolors: {},
        _selectedcell: null,
        _mousedownpos: null,
        _prerender: null,
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

            this._prerender = document.createElement('canvas');
            this._prerender.width = this.w;
            this._prerender.height = this.h;
            var prerenderctx = this._prerender.getContext('2d');
            this._terrain.drawTo(prerenderctx, this._cellcolors, {
                drawEdges: this._drawEdges,
                drawSites: this._drawSites,
                drawElevations: this._drawElevations,
                drawCoasts: true,
            });
            return this;
        },

        getPrerender: function() {
            return this._prerender;
        }
    });
});
