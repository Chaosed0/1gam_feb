
define(['crafty'], function(Crafty) {

    Crafty.c("Expires", {
        _time: 2000,
        _timer: 0,

        _enterframe: function(data) {
            this._timer += data.dt;
            if(this._timer > this._time) {
                this.visible = false;
                this.trigger("Invalidate");
                this.destroy();
            }
        },

        init: function() {
            this.bind("EnterFrame", this._enterframe);
        },

        expires: function(time) {
            this._time = time;
            return this;
        }
    });
});
