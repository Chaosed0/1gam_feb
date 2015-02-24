
define(['crafty', './Util'], function(Crafty, u) {
    var applyEffect = function(target, effect) {
        /* Damages have a different magnitude than their effect says */
        var actual_magnitude = null;

        if(effect.type === undefined || effect.type === 'damage') {
            u.assert(effect.magnitude !== undefined && effect.type !== undefined);
            actual_magnitude = effect.magnitude;
            if(effect.damage_type === 'piercing') {
                actual_magnitude -= target.getArmor();
            }
            target.damage(actual_magnitude);
        } else if(effect.type === 'heal') {
            u.assert(effect.magnitude !== undefined);
            target.heal(effect.magnitude);
        } else {
            console.log("WARNING: Unknown effect " + effect.type);
        }
        target.trigger("EffectApplied", {actual_magnitude: actual_magnitude, effect: effect});
    }

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
        _skill: null,
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
                this._armor = data.armor;
                this._speed = data.speed;
                this._classimageloc = data[this._alignment].classImageMap;

                this._attack = {
                    name: 'Attack',
                    range: data.attack.range,
                    ends_turn: true,
                    type: 'singletarget',
                    effect: {
                        type: 'damage',
                        damage_type: data.attack.damage_type,
                        magnitude: data.attack.magnitude,
                    }
                }

                if(data.skill) {
                    this._skill = data.skill;
                }

                this.reel('idle', 2000, data[this._alignment].animation)
            }
            return this;
        },

        damage: function(magnitude) {
            this._curhealth = Math.max(0, this._curhealth - magnitude);
            return magnitude;
        },

        heal: function(magnitude) {
            this._curhealth = Math.min(this._maxhealth, this._curhealth + magnitude);
            return magnitude;
        },

        applyEffect: function(effect) {
            applyEffect(this, effect);
        },

        /* XXX: This is a slight misstep - an external source shouldn't be
         * telling the unit what skill to use */
        useSkill: function(skill, target) {
            u.assert(skill === this._attack || skill === this._skill);
            target.applyEffect(skill.effect);
            if(skill.ends_turn) {
                this._attacked = true;
            }
        },

        isDead: function() {
            return this._curhealth <= 0;
        },

        isGood: function() {
            u.assert(this._isgood !== null);
            return this._isgood;
        },

        hasSkill: function() {
            return this._skill !== null;
        },

        getSkill: function() {
            return this._skill;
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

        getArmor: function() {
            return this._armor;
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
