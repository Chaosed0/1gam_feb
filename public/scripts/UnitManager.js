
// Map of voronoi cell ids to units
define(['crafty', './Util'], function(Crafty, u) {
    var vec2 = Crafty.math.Vector2D;

    var UnitManager = function() {
        this.locationMap = {};
        this.ownerMap = {};
    }

    UnitManager.prototype.addUnit = function(cell, unit) {
        u.assert(!(cell.site.voronoiId in this.locationMap));
        this.locationMap[cell.site.voronoiId] = unit;
        unit.setCell(cell);
    }

    UnitManager.prototype.getUnitForCell = function(cell) {
        return this.getUnitForId(cell.site.voronoiId);
    }

    UnitManager.prototype.getUnitForId = function(id) {
        if(id in this.locationMap) {
            return this.locationMap[id];
        } else {
            return null;
        }
    }

    UnitManager.prototype.moveUnit = function(unit, cell) {
        u.assert(!this.getUnitForCell(cell));
        var curCell = unit.getCell();
        u.assert(this.getUnitForCell(curCell) === unit);
        delete this.locationMap[curCell.site.voronoiId];
        this.locationMap[cell.site.voronoiId] = unit;
        unit.setCell(cell);
    }

    return UnitManager;
});
