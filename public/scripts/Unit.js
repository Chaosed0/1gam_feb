
define(['crafty'], function(Crafty) {
    Crafty.c("Unit", {
        _movespeed: 4,
        _faction: 1,
        _cell: null,

        init: function() {
        },

        unit: function(name, speed, faction) {
            this._name = name;
            this._movespeed = speed;
            this._faction = faction;
            return this;
        },

        getName: function() {
            return this._name;
        },

        getSpeed: function() {
            return this._movespeed;
        },

        getFaction: function() {
            return this._faction;
        },

        getCell: function() {
            return this._cell;
        },

        setCell: function(cell) {
            this._cell = cell;
            var center = {x: 0, y: 0};
            for(var j = 0; j < cell.halfedges.length; j++) {
                var vert = cell.halfedges[j].getStartpoint();
                center.x += (vert.x - center.x) / (j+1);
                center.y += (vert.y - center.y) / (j+1);
            }
            this.x = center.x - this.w/2;
            this.y = center.y - this.h/2;
        }
    });
});
