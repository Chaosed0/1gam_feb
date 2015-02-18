
define(['crafty', './Util', './VoronoiTerrain'], function(Crafty, u, VoronoiTerrain) {
    
    var drawCells = function(ctx, cells, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        for(var i = 0; i < cells.length; i++) {
            var halfedges = cells[i].halfedges;
            ctx.beginPath();
            ctx.moveTo(halfedges[0].getStartpoint().x, halfedges[0].getStartpoint().y);
            for(var j = 1; j < halfedges.length; j++) {
                ctx.lineTo(halfedges[j].getStartpoint().x, halfedges[j].getStartpoint().y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
        ctx.restore();
    }

    var draw = function(e) {
        if(e.type == 'canvas') {
            e.ctx.drawImage(this._prerender, this.x, this.y);

            if(this._highlightcells) {
                drawCells(e.ctx, this._highlightcells, 'rgba(200, 200, 200, .25)');
            }

            if(this._extrahighlightcells) {
                drawCells(e.ctx, this._extrahighlightcells, 'rgba(200, 0, 0, .25)');
            }

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
            var cell = this._terrain.getCellForPos({x: e.realX, y: e.realY});
            if(cell) {
                if(this._selectmode === 'free' ||
                        (this._selectmode === 'highlight' && this._highlightcells.indexOf(cell) >= 0) ||
                        (this._selectmode === 'confirm' && this._selectedcell === cell)) {
                    /* Valid cell, trigger */
                    this.trigger("CellSelected", {mouseButton: e.mouseButton, cell: cell});
                }
            }
        }
    }

    Crafty.c("TerrainVisualizer", {
        _terrain: null,
        _selectedcell: null,
        _mousedownpos: null,
        _prerender: null,
        _highlightcells: null,
        _extrahighlightcells: null,
        _selectmode: 'free',
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

        terrainvisualizer: function(terrain, prerender) {
            this._terrain = terrain;
            this._prerender = prerender;
            return this;
        },

        highlight: function(cells) {
            if(cells === undefined) {
                return this._highlightcells;
            } else {
                if(cells !== null && cells.constructor === Array) {
                    this._highlightcells = cells;
                } else if(cells !== null && cells.constructor === Object) {
                    this._highlightcells = cells.main;
                    this._extrahighlightcells = cells.extra;
                } else {
                    this._highlightcells = null;
                    this._extrahighlightcells = null;
                }
                this.trigger("Invalidate");
            }
        },

        selection: function(cell) {
            if(cell === undefined) {
                return this._selectedcell;
            } else {
                u.assert(cell === null || cell.site);
                this._selectedcell = cell;
                this.trigger("Invalidate");
            }
        },

        selectMode: function(mode) {
            if(mode === undefined) {
                return this._selectmode;
            } else {
                this._selectmode = mode;
            }
        }
    });
});
