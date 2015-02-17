
define(['crafty'], function(Crafty) {
    Crafty.c("Unit", {
        _maxhealth: 0,
        _curhealth: 0,
        _movespeed: 4,
        _faction: 1,
        _attack: null,
        _cell: null,

        init: function() {
        },

        unit: function(name, faction, className, data) {
            this._name = name;
            this._faction = faction;
            this._className = className;
            if(data) {
                this._maxhealth = data.health;
                this._curhealth = data.health;
                this._movespeed = data.speed;
                this._attack = data.attack;
                this.reel('idle', 2000, data.animation)
            }
            return this;
        },

        damage: function(dmg) {
            this._curhealth = Math.max(0, this._curhealth - dmg);
        },

        isDead: function() {
            return this._curhealth < 0;
        },

        getClassName: function() {
            return this._className;
        },

        getName: function() {
            return this._name;
        },

        getAttack: function() {
            return this._attack;
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
