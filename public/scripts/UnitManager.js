
// Map of voronoi cell ids to units
define(['crafty', './Util'], function(Crafty, u) {
    var vec2 = Crafty.math.Vector2D;

    var UnitManager = function() {
        this.allUnits = [];
        this.locationMap = {};
        this.ownerMap = {};
        this.nextId = 0;
    }

    UnitManager.prototype.addUnit = function(cell, unit) {
        u.assert(!(cell.site.voronoiId in this.locationMap));
        this.locationMap[cell.site.voronoiId] = unit;
        if(!this.ownerMap[unit.getFaction()]) {
            this.ownerMap[unit.getFaction()] = [];
        }
        this.ownerMap[unit.getFaction()].push(unit);
        this.allUnits.push(unit);

        unit.setCell(cell);

        var self = this;
        unit.bind("Died", function() { self.removeUnit(this) });
        
        /* If a unit was moved, damaged, or itself alerted, alert all
         * nearby units around it */
        unit.bind("MovedCell", function() { self.cascadeAlerts(unit) });
        unit.bind("Damaged", function() { self.cascadeAlerts(unit) });
        unit.bind("Alerted", function() { self.cascadeAlerts(unit) });
        unit.id = this.nextId++;
    }

    UnitManager.prototype.removeUnit = function(unit) {
        /* Remove all references to the unit */
        var ownerMapIndex = this.ownerMap[unit.getFaction()].indexOf(unit);
        u.assert(ownerMapIndex >= 0);
        delete this.locationMap[unit.getCell().site.voronoiId];
        this.ownerMap[unit.getFaction()].splice(ownerMapIndex, 1);
        this.allUnits.splice(this.allUnits.indexOf(unit), 1);
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
        var unitOnCell = this.getUnitForCell(cell);
        u.assert(unitOnCell === null || unitOnCell === unit);
        var curCell = unit.getCell();
        u.assert(this.getUnitForCell(curCell) === unit);
        delete this.locationMap[curCell.site.voronoiId];
        this.locationMap[cell.site.voronoiId] = unit;
        unit.moveToCell(cell);
    }

    UnitManager.prototype.getUnitListForFaction = function(faction) {
        if(this.ownerMap[faction]) {
            return this.ownerMap[faction];
        } else {
            return null;
        }
    }

    UnitManager.prototype.cascadeAlerts = function(unit) {
        /* Check all units on whether or not they should alert or not; alerts
         * might trigger more alerts, which is why this is "cascade" */
        for(var i = 0; i < this.allUnits.length; i++) {
            this.allUnits[i].checkAlert(unit);
        }
    }

    return UnitManager;
});
