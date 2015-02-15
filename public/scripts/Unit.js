
define(['crafty'], function(Crafty) {
    Crafty.c("Unit", {
        _movespeed: 4,
        _faction: 1,
        _loc: null,

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

        getLocation: function() {
            return this._loc;
        },

        setLocation: function(loc) {
            this._loc = loc;
        }
    });
});
