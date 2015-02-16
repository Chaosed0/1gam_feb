
define(['crafty', './Util', './Button', './HUD'], function(Crafty, u, Button) {
    const buttonPadding = 10;

    const menuZ = 1000;
    const menuElemZ = 1001;

    var GUI = function(size, camera, prerender, terrainSize) {
        this.minimapSize = size.h;

        this.minimap = Crafty.e("2D, Canvas, Minimap, HUD, Mouse")
            .attr({w: this.minimapSize, h: this.minimapSize, z: menuZ})
            .minimap(prerender, terrainSize)
            .hud()
            .bind("MinimapDown", function(point) {
                camera.mouselook(false);
                camera.centerOn(point);
            }).bind("MinimapUp", function() {
                camera.mouselook(true);
            });

        this.infoBounds = {
            x: this.minimapSize,
            y: Crafty.viewport.height - size.h,
            w: Crafty.viewport.width - this.minimapSize * 2,
            h: size.h,
            z: menuZ
        };

        this.infodisplay = Crafty.e("2D, Canvas, HUD, Color")
            .attr(this.infoBounds)
            .hud(true)
            .color('#EEEEEE');

        this.menuBounds = {
            x: Crafty.viewport.width - this.minimapSize,
            y: Crafty.viewport.height - size.h,
            w: this.minimapSize,
            h: size.h,
            z: menuZ 
        };

        this.menu = Crafty.e("2D, Canvas, HUD, Color")
            .attr(this.menuBounds)
            .hud(true)
            .color('#BBBBBB');

        this.bottomCenterText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: this.infoBounds.x + this.infoBounds.w / 2,
                y: this.infoBounds.y + this.infoBounds.h * 7/8,
                z: menuElemZ })
            .hud(true)
            .textFont({size: '20px'})
            .textAlign('center');

        this.buttons = new Array(4);
        var buttonBounds = {w: this.menuBounds.w - buttonPadding * 2,
            h: (this.menuBounds.h - buttonPadding * 5) / 4,
            z: menuElemZ};
        for(var i = 0; i < 4; i++) {
            buttonBounds.x = this.menuBounds.x + buttonPadding;
            buttonBounds.y = this.menuBounds.y + buttonPadding + i * (buttonBounds.h + buttonPadding);
            this.buttons[i] = new Button('dummy', '#EEEEEE', buttonBounds);
            this.buttons[i].setVisible(false);
        }

        this.callbacks = {};
    }

    /* Display info about a cell in the center GUI element. */
    GUI.prototype.displayCellInfo = function(cell) {
        if(!cell) {
            return;
        }

        this.bottomCenterText.text('elevation: ' + cell.site.elevation.toFixed(2));
    }

    /* Display info about a unit in the center GUI element,
     * as well as displaying controls in the right menu. */
    GUI.prototype.displayUnitInfo = function(unit) {
    }

    GUI.prototype.reset = function() {
        this.bottomCenterText.text('');
    }

    GUI.prototype.setButtons = function(buttons) {
        u.assert(buttons.length <= 4);
        for(var i = 0; i < buttons.length; i++) {
            if(buttons[i].text) {
                this.buttons[i].setText(buttons[i].text);
            }
            if(buttons[i].callback) {
                this.buttons[i].unbind("MouseDown");
                this.buttons[i].bind("MouseDown", buttons[i].callback);
            }
            this.buttons[i].setVisible(true);
        }
    }

    GUI.prototype.hideButtons = function() {
        for(var i = 0; i < 4; i++) {
            this.buttons[i].setVisible(false);
        }
    }

    return GUI;
});
