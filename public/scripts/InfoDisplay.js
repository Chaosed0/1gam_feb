
define(['crafty'], function(Crafty) {
    var draw = function() {
    }

    Crafty.c("InfoDisplay", {
        _text: '',
        _clientbounds: {x: 0, y: 0, h: 0, w: 0},
        ready: false,
        
        init: function() {
            this.ready = true;
            this.bind("Draw", draw);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", draw);
            this.trigger("Invalidate");
        },

        infodisplay: function(size, text) {
            this._clientbounds = {
                x: size,
                y: Crafty.viewport.height - size,
                w: Crafty.viewport.width - size,
                h: size
            };
            this._text = text;
        },
    });
});
