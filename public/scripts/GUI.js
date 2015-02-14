
define(['crafty', './HUD'], function(Crafty) {
    var GUI = function(size, camera, prerender, terrainSize) {
        this.minimapSize = size.h;

        this.minimap = Crafty.e("2D, Canvas, Minimap, HUD, Mouse")
            .attr({w: this.minimapSize, h: this.minimapSize, z: 9999})
            .minimap(prerender, terrainSize)
            .hud()
            .bind("MinimapDown", function(point) {
                camera.mouselook(false);
                camera.centerOn(point);
            }).bind("MinimapUp", function() {
                camera.mouselook(true);
            });

        var infoBounds = {
            x: this.minimapSize,
            y: Crafty.viewport.height - size.h,
            w: Crafty.viewport.width - this.minimapSize * 2,
            h: size.h,
            z: 9999
        };

        var infodisplay = Crafty.e("2D, Canvas, HUD, Color")
            .attr(infoBounds)
            .hud(infoBounds)
            .color('#EEEEEE');

        var menuBounds = {
            x: Crafty.viewport.width - this.minimapSize,
            y: Crafty.viewport.height - size.h,
            w: this.minimapSize,
            h: size.h,
            z: 9999
        };

        var menu = Crafty.e("2D, Canvas, HUD, Color")
            .attr(menuBounds)
            .hud(menuBounds)
            .color('#BBBBBB');
    }

    return GUI;
});
