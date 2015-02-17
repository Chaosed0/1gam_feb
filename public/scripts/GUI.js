
define(['crafty', './Util', './Button', './HUD'], function(Crafty, u, Button) {
    const menuZ = 1000;
    const menuElemZ = 1001;

    const fontFamily = 'Palatino';
    const padding = 10;
    const smallPadding = 5;

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

        this.titleText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: this.infoBounds.x + this.infoBounds.w / 2,
                y: this.infoBounds.y + this.infoBounds.h * 1/16,
                z: menuElemZ })
            .hud(true)
            .textFont({family: fontFamily, size: '30px'})
            .textAlign('center')
            .text('a');

        this.subtitleText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: this.infoBounds.x + this.infoBounds.w / 2,
                y: this.titleText.y + this.titleText.h + smallPadding,
                z: menuElemZ })
            .hud(true)
            .textFont({family: fontFamily, size: '15px'})
            .textAlign('center');

        this.healthText = Crafty.e("2D, Canvas, HUD, Text")
            .textFont({family: fontFamily, size: '12px'})
            .text("HP");
        this.healthMeter = Crafty.e("2D, Canvas, HUD, Meter")
            .attr({w: 200, h: 5})
            .meter('#FF0000')
            .fill(1);
        this.healthAmtText = Crafty.e("2D, Canvas, HUD, Text")
            .textFont({family: fontFamily, size: '12px'})
            .text("100/100");

        this.manaText = Crafty.e("2D, Canvas, HUD, Text")
            .textFont({family: fontFamily, size: '12px'})
            .text('MP');
        this.manaMeter = Crafty.e("2D, Canvas, HUD, Meter")
            .attr({w: 200, h: 5})
            .meter('#0000FF')
            .fill(1);
        this.manaAmtText = Crafty.e("2D, Canvas, HUD, Text")
            .textFont({family: fontFamily, size: '12px'})
            .text("100/100");

        var metersLeft = this.infoBounds.x + this.infoBounds.w / 2.0 - this.healthText.w / 2
            - smallPadding - this.healthMeter.w / 2 - this.healthAmtText.w / 2;
        this.healthText.x = metersLeft;
        this.healthText.y = this.subtitleText.y + this.subtitleText.h + padding;
        this.healthText.z = menuElemZ;
        this.healthText.visible = false;
        this.healthText.hud(true);
        this.healthMeter.x = this.healthText.x + this.healthText.w + smallPadding;
        this.healthMeter.y = this.healthText.y + this.healthText.h / 2 - this.healthMeter.h / 2;
        this.healthMeter.z = menuElemZ;
        this.healthMeter.visible = false;
        this.healthMeter.hud(true);
        this.healthAmtText.x = this.healthMeter.x + this.healthMeter.w + smallPadding;
        this.healthAmtText.y = this.healthText.y;
        this.healthAmtText.z = menuElemZ;
        this.healthAmtText.visible = false;
        this.healthAmtText.hud(true);

        this.manaText.x = metersLeft;
        this.manaText.y = this.healthText.y + this.healthText.h + smallPadding;
        this.manaText.z = menuElemZ;
        this.manaText.visible = false;
        this.manaText.hud(true);
        this.manaMeter.x = this.healthMeter.x;
        this.manaMeter.y = this.manaText.y + this.manaText.h / 2 - this.manaMeter.h / 2;
        this.manaMeter.z = menuElemZ;
        this.manaMeter.visible = false;
        this.manaMeter.hud(true);
        this.manaAmtText.x = this.healthAmtText.x;
        this.manaAmtText.y = this.manaText.y;
        this.manaAmtText.visible = false;
        this.manaAmtText.z = menuElemZ;
        this.manaAmtText.hud(true);

        this.classImage = Crafty.e("2D, Canvas, HUD, ClassSprite")
            .attr({x: this.titleText.x - 100,
                   y: this.titleText.y, w: this.titleText.h - 2, h: this.titleText.h, z: menuElemZ})
            .hud(true);
        this.classImage.visible = false;

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

        this.buttons = new Array(4);
        var buttonBounds = {w: this.menuBounds.w - padding * 2,
            h: (this.menuBounds.h - padding * 5) / 4,
            z: menuElemZ};
        for(var i = 0; i < 4; i++) {
            buttonBounds.x = this.menuBounds.x + padding;
            buttonBounds.y = this.menuBounds.y + padding + i * (buttonBounds.h + padding);
            this.buttons[i] = new Button('dummy', '#EEEEEE', buttonBounds);
            this.buttons[i].setVisible(false);
        }

        var aboutButton = new Button('?', 'rgba(238, 238, 238, 0.25)', {
            x: Crafty.viewport.width - smallPadding - 25,
            y: smallPadding, w: 25, h: 25
        }).bind("MouseDown", function(e) {
            window.open("about.html", "_blank");
        }).bind("MouseOver", function(e) {
            aboutButton.background.color('rgba(238,238,238,1.0)');
            aboutButton.text.textColor('rgba(0,0,0,1.0)');
        }).bind("MouseOut", function(e) {
            aboutButton.background.color('rgba(238,238,238,0.25)');
            aboutButton.text.textColor('rgba(0,0,0,0.25)');
        });
        aboutButton.text.textColor('rgba(0,0,0,0.25)');
        aboutButton.text.textFont({family: fontFamily, size: '20px'});
        aboutButton.textBaselineCenter();

        /* We set the titletext temporarily so we could get the height - unset it */
        this.titleText.text('');
        this.callbacks = {};
    }

    GUI.prototype.updateClassImage = function(className) {
        if(className && this.getClassMap) {
            var index = this.getClassMap(className);
            this.classImage.sprite(index[0], index[1]);
            this.classImage.visible = true;
        } else {
            this.classImage.visible = false;
        }
    }

    GUI.prototype.setClassMapCallback = function(cb) {
        this.getClassMap = cb;
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
        this.titleText.text(unit.getName());
        this.subtitleText.text('of ' + unit.getFaction());
        this.updateClassImage(unit.getClassName());

        this.healthMeter.fill(unit.getHealth() / unit.getMaxHealth());
        this.manaMeter.fill(unit.getMana() / unit.getMaxMana());
        this.healthAmtText.text(unit.getHealth() + "/" + unit.getMaxHealth());
        this.manaAmtText.text(unit.getMana() + "/" + unit.getMaxMana());
        this.healthText.visible = true;
        this.healthMeter.visible = true;
        this.healthAmtText.visible = true;
        this.manaText.visible = true;
        this.manaMeter.visible = true;
        this.manaAmtText.visible = true;
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
