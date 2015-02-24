
define(['crafty'], function(Crafty) {

    Crafty.c("Expires", {
        _loops: 1,
        _time: 2000,
        _timer: 0,

        _enterframe: function(data) {
            this._timer += data.dt;
            if(this._timer > this._time) {
                this.trigger("Expired");

                if(this._loops > 0) {
                    this._loops--;
                    if(this._loops <= 0) {
                        this.visible = false;
                        this.trigger("Invalidate");
                        this.destroy();
                    }
                }

                this._timer = 0;
            }
        },

        init: function() {
            this.bind("EnterFrame", this._enterframe);
        },

        remove: function() {
            this.unbind("EnterFrame", this._enterframe);
        },

        expires: function(time, loops) {
            if(loops) {
                this._loops = loops;
            }

            this._starttime = time;
            this._time = time;
            return this;
        }
    });
});
