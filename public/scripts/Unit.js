
define(['crafty', './Util'], function(Crafty, u) {
    Crafty.c("Unit", {
        _maxhealth: 1,
        _curhealth: 0,
        _maxmana: 1,
        _curmana: 0,
        _movespeed: 4,
        _faction: 1,
        _attack: null,
        _cell: null,
        _isgood: null,
        _alignment: null,
        _classimageloc: null,

        init: function() {
        },

        unit: function(name, faction, className, good, data) {
            this._name = name;
            this._faction = faction;
            this._className = className;
            this._isgood = good;
            this._alignment = good ? "good" : "bad";
            if(data) {
                this._maxhealth = data.health;
                this._curhealth = data.health;
                this._movespeed = data.speed;
                this._attack = data.attack;
                this._classimageloc = data[this._alignment].classImageMap;
                this.reel('idle', 2000, data[this._alignment].animation)
            }
            return this;
        },

        damage: function(dmg) {
            u.assert(typeof dmg === 'number');
            this._curhealth = Math.max(0, this._curhealth - dmg);
        },

        isDead: function() {
            return this._curhealth < 0;
        },

        isGood: function() {
            u.assert(this._isgood !== null);
            return this._isgood;
        },

        getHealth: function() {
            return this._curhealth;
        },

        getMaxHealth: function(){
            return this._maxhealth;
        },

        getMana: function() {
            return this._curmana;
        },

        getMaxMana: function() {
            return this._maxmana;
        },

        getClassName: function() {
            return this._className;
        },

        getClassImageLoc: function() {
            return this._classimageloc;
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
