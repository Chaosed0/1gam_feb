
// Map of voronoi cell ids to units
define(['crafty', './Util'], function(Crafty, u) {
    var vec2 = Crafty.math.Vector2D;

    var UnitManager = function() {
        this.map = {};
    }

    UnitManager.prototype.addUnit = function(id, unit) {
        u.assert(!(id in this.map));
        this.map[id] = unit;
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

    return UnitManager;
});
