
// Map of voronoi cell ids to units
define(['crafty', './Util'], function(Crafty, u) {
    var vec2 = Crafty.math.Vector2D;

    var UnitManager = function() {
        this.map = {};
    }

    UnitManager.prototype.addUnit = function(cell, unit) {
        u.assert(!(cell.site.voronoiId in this.map));
        this.map[cell.site.voronoiId] = unit;
        unit.setLocation(cell);
    }

    UnitManager.prototype.getUnitForCell = function(cell) {
        return this.getUnitForId(cell.site.voronoiId);
    }

    UnitManager.prototype.getUnitForId = function(id) {
        if(id in this.map) {
            return this.map[id];
        } else {
            return null;
        }
    }

    UnitManager.prototype.moveUnit = function(unit, cell) {
        u.assert(!this.getUnitForCell(cell));
        var unitCell = unit.getLocation();
        u.assert(this.getUnitForCell(unitCell) === unit);
        this.map[unitCell.site.voronoiId] = undefined;
        this.map[cell.site.voronoiId] = unit;

        unit.x = cell.site.x - unit.w/2;
        unit.y = cell.site.y - unit.h/2;
    }

    return UnitManager;
});
