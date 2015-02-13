
define(['crafty'], function(Crafty) {
    Crafty.c("Unit", {
        _movespeed: 4,
        _faction: 1,

        init: function() {
        },

        unit: function(speed, faction) {
            this._speed = speed;
            this._faction = faction;
            return this;
        },

        getSpeed: function() {
            return this._movespeed;
        },

        getFaction: function() {
            return this._faction;
        },
    });
});
