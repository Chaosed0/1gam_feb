
define(['crafty', './Util'], function(Crafty, u) {
    Crafty.c("Unit", {
        _maxhealth: 1,
        _curhealth: 0,
        _maxmana: 1,
        _curmana: 0,
        _moverange: 4,
        _speed: 0,
        _faction: 1,
        _attack: null,
        _cell: null,
        _isgood: null,
        _alignment: null,
        _classimageloc: null,

        _moved: false,
        _attacked: false,

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
                this._moverange = data.moverange;
                this._speed = data.speed;
                this._attack = data.attack;
                this._classimageloc = data[this._alignment].classImageMap;
                this.reel('idle', 2000, data[this._alignment].animation)
            }
            return this;
        },

        damage: function(dmg) {
            u.assert(typeof dmg === 'number', 'Attack damage magnitude was not a number');
            this._curhealth = Math.max(0, this._curhealth - dmg);
            this.trigger("Damaged", dmg);
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

        getMoveRange: function() {
            return this._moverange;
        },

        getSpeed: function() {
            return this._speed;
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
        },

        moveToCell: function(cell) {
            this.setCell(cell);
            this._moved = true;
        },

        attack: function(unit) {
            u.assert(unit.damage, "Tried to attack something that doesn't look like a unit");
            unit.damage(this._attack.magnitude);
            this._attacked = true;
        },

        hasAttacked: function() {
            return this._attacked;
        },

        hasMoved: function() {
            return this._moved;
        },

        isTurnOver: function() {
            return this._attacked;
        },

        newTurn: function() {
            this._moved = false;
            this._attacked = false;
        }
    });
});
