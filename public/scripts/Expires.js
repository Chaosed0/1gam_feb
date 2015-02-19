
define(['crafty'], function(Crafty) {

    Crafty.c("Expires", {
        _time: 2000,
        _callback: null,
        _timer: 0,

        _enterframe: function(data) {
            this._timer += data.dt;
            if(this._timer > this._time) {
                if(this._callback) {
                    this._callback.call(this);
                } else {
                    this.visible = false;
                    this.trigger("Invalidate");
                    this.destroy();
                }
            }
        },

        init: function() {
            this.bind("EnterFrame", this._enterframe);
        },

        remove: function() {
            this.unbind("EnterFrame", this._enterframe);
        },

        expires: function(time, callback) {
            this._time = time;
            this._callback = callback;
            return this;
        }
    });
});
