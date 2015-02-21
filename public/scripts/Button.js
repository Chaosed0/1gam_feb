
define(['crafty', './Util'], function(Crafty, u) {

    var Button = function(text, color, bounds) {
        if(bounds === undefined) {
            bounds = greycolor;
            greycolor = '#888888';
        }

        this.backcolor = color;
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
        return this;
    }

    Button.prototype.unbind = function(event, cb) {
        this.background.unbind(event, cb);
        return this;
    }

    Button.prototype.setText = function(text) {
        this.text.text(text);
    }

    Button.prototype.setVisible = function(visible) {
        this.background.visible = visible;
        this.text.visible = visible;
    }

    Button.prototype.textBaselineCenter = function() {
        this.text.y = this.text.y - this.text.h/2.0;
        this.text.hud(true);
    }

    Button.prototype.grey = function(grey) {
        if(grey) {
            this.text.textColor('rgba(0,0,0,0.25)');
        } else {
            this.text.textColor('rgba(0,0,0,1.0)');
        }
    }

    return Button;
});
