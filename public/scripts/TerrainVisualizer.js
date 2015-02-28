
define(['crafty', './Util', './VoronoiTerrain'], function(Crafty, u, VoronoiTerrain) {

    const colorMap = {
        "normal": 'rgba(255,255,255,0.6)',
        "move": 'rgba(255,255,255,0.6)',
        "attack": 'rgba(255,100,50,0.6)',
        "nomove": 'rgba(255,0,0,0.8)'
    }
    
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

            if(this._highlightcells && this._highlightcells.constructor === Array) {
                drawCells(e.ctx, this._highlightcells, colorMap["normal"]);
            } else {
                for(var type in this._highlightcells) {
                    var color = null;
                    if(type in colorMap) {
                        color = colorMap[type];
                    } else {
                        /* Don't draw this layer */
                        continue;
                    }

                    drawCells(e.ctx, this._highlightcells[type], color);
                }
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
                if(validSelection.call(this, cell)) {
                    /* Valid cell, trigger */
                    this.trigger("CellSelected", {cell: cell});
                } else {
                    /* Trigger invalid cell event */
                    this.trigger("InvalidSelection", {cell: cell});
                }
            }
        }
    }

    var validSelection = function(cell) {
        var valid = false;

        if(!this._selectmode) {
            return false;
        }

        if(this._selectmode === 'free') {
            /* Free select means any cell */
            valid = true;
        } else if(this._selectmode === 'confirm' && this._selectedcell === cell) {
            /* Confirm means select only the selected cell */
            valid = true;
        } else if(this._selectmode.substring(0, 9) === 'highlight') {
            /* 'highlight' can take two different forms */
            if(this._selectmode[9] === '.') {
                /* Highlight is an object and we want to take one of the arrays */
                valid = isHighlighted(this._highlightcells, cell, this._selectmode.slice(10));
            } else {
                /* Highlight is an array */
                valid = isHighlighted(this._highlightcells, cell);
            }
        }

        return valid;
    }

    var isHighlighted = function(highlight, cell, type) {
        var arr = null;

        if(highlight.constructor === Array) {
            return highlight.indexOf(cell) >= 0;
        } else if(type === undefined) {
            /* Search all types */
            for(var type in highlight) {
                if(highlight[type].indexOf(cell) >= 0) {
                    return true;
                }
            }
            return false;
        } else {
            return highlight[type].indexOf(cell) >= 0;
        }
    }

    Crafty.c("TerrainVisualizer", {
        _terrain: null,
        _selectedcell: null,
        _mousedownpos: null,
        _prerender: null,
        _highlightcells: null,
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
                if(cells !== null) {
                    this._highlightcells = cells;
                } else {
                    this._highlightcells = null;
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
