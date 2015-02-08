
define(['crafty', 'util',], function(Crafty, u) {

    var draw = function(e) {
        if(e.type == 'canvas') {
            this.x = -Crafty.viewport.x + Crafty.viewport.width * 3/4;
            this.y = -Crafty.viewport.y + Crafty.viewport.width * 3/4;
            e.ctx.drawImage(this._prerender, this.x, this.y, this.w, this.h);
        }
    }

    var mousedown = function(e) {
        this._mousedownpos = {x: e.clientX, y: e.clientY};
    }

    var mousemove = function(e) {
    }
    
    var mouseup = function(e) {
    }

    var mouseout = function(e) {
    }

    var mouseup = function(e) {
    }

    Crafty.c("Minimap", {
        _prerender: null,
        _lastmouse: {x: 0, y: 0},
        ready: false,

        init: function() {
            this.ready = true;
            this.bind("Draw", draw);
            this.bind("MouseDown", mousedown);
            this.bind("MouseMove", mousemove);
            this.bind("MouseUp", mouseup);
            this.bind("MouseOut", mouseup);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", draw);
            this.unbind("MouseDown", mousedown);
            this.unbind("MouseMove", mousemove);
            this.unbind("MouseUp", mouseup);
            this.unbind("MouseOut", mouseup);
            this.trigger("Invalidate");
        },

        minimap: function(prerender) {
            this._prerender = prerender;
            this.x = -Crafty.viewport.x + Crafty.viewport.width * 3/4;
            this.y = -Crafty.viewport.y + Crafty.viewport.width * 3/4;
            this.w = Crafty.viewport.width * 1/4;
            this.h = Crafty.viewport.height * 1/4;
            return this;
        }
    });
});
