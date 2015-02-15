
define(['crafty', './Util'], function(Crafty, u) {

    var Button = function(text, color, bounds) {
        this.background = Crafty.e("2D, Canvas, Color, HUD, Mouse")
            .attr(bounds)
            .color(color)
            .hud(true);
        this.text = Crafty.e("2D, Canvas, Text, HUD")
            .attr({x: bounds.x + bounds.w/2, y: bounds.y + bounds.h/2, z: this.background.z+1})
            .text(text)
            .textAlign('center')
            .hud(true);
    }

    Button.prototype.bind = function(event, cb) {
        this.background.bind(event, cb);
    }

    Button.prototype.unbind = function(event, cb) {
        this.background.unbind(event, cb);
    }

    Button.prototype.text = function(text) {
        this.text.text(text);
    }

    return Button;
});
