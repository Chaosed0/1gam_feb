
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

        var startpos = {x: this.infoBounds.x + padding, y: this.infoBounds.y + padding};
        var curpos = {x: startpos.x, y: startpos.y};

        this.classImage = Crafty.e("2D, Canvas, HUD, ClassSprite")
            .attr({x: curpos.x, y: curpos.y, w: 36, h: 39, z: menuElemZ})
            .hud(true);
        this.classImage.visible = false;
        curpos.x += this.classImage.w + smallPadding;

        this.titleText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: curpos.x , y: curpos.y, z: menuElemZ })
            .textFont({family: fontFamily, size: '30px'})
            .text('LOLWTFBBQ!?');
        this.titleText.y += this.classImage.h/2 - this.titleText.h/2;
        this.titleText.hud(true);
        curpos.x = startpos.x;
        curpos.y += this.classImage.h + smallPadding;

        this.subtitleText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: curpos.x, y: curpos.y, z: menuElemZ })
            .textFont({family: fontFamily, size: '15px'})
            .text('LOLWTFBBQ!?')
            .hud(true);
        curpos.x = startpos.x;
        curpos.y += this.subtitleText.h + padding;

        this.healthText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: curpos.x, y: curpos.y, z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text("HP")
            .hud(true);
        curpos.x += this.healthText.w + smallPadding;
        this.healthMeter = Crafty.e("2D, Canvas, HUD, Meter")
            .attr({x: curpos.x, y: curpos.y + this.healthText.h/2 - 2.5, z: menuElemZ, w: 200, h: 5})
            .meter('#FF0000')
            .fill(1)
            .hud(true);
        curpos.x += this.healthMeter.w + smallPadding;
        this.healthAmtText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: curpos.x, y: curpos.y, z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text("10/10")
            .hud(true);
        curpos.x = startpos.x;
        curpos.y += this.healthText.h + smallPadding;

        this.manaText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: curpos.x, y: curpos.y, z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text('MP')
            .hud(true);
        curpos.x += this.manaText.w + smallPadding;
        this.manaMeter = Crafty.e("2D, Canvas, HUD, Meter")
            .attr({x: curpos.x, y: curpos.y + this.manaText.h/2 - 2.5, z: menuElemZ, w: 200, h: 5})
            .attr({w: 200, h: 5})
            .meter('#0000FF')
            .fill(1)
            .hud(true);
        curpos.x += this.manaMeter.w + smallPadding;
        this.manaAmtText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({x: curpos.x, y: curpos.y, z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text("10/10")
            .hud(true);
        curpos.x = startpos.x;
        curpos.y += padding;

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
        this.titleText.visible = false;
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

        this.titleText.visible = true;
        this.subtitleText.visible = true;
        this.classImage.visible = true;
        this.healthText.visible = true;
        this.healthMeter.visible = true;
        this.healthAmtText.visible = true;
        this.manaText.visible = true;
        this.manaMeter.visible = true;
        this.manaAmtText.visible = true;
    }

    GUI.prototype.hideInfo = function() {
        this.titleText.visible = false;
        this.subtitleText.visible = false;
        this.classImage.visible = false;
        this.healthMeter.visible = false;
        this.manaMeter.visible = false;
        this.healthText.visible = false;
        this.manaText.visible = false;
        this.healthAmtText.visible = false;
        this.manaAmtText.visible = false;
    }

    GUI.prototype.setButtons = function(buttons) {
        u.assert(buttons === null || buttons.length <= 4);
        for(var i = 0; i < this.buttons.length; i++) {
            if(buttons && i < buttons.length) {
                if(buttons[i].text) {
                    this.buttons[i].setText(buttons[i].text);
                }
                if(buttons[i].callback) {
                    this.buttons[i].unbind("MouseDown");
                    this.buttons[i].bind("MouseDown", buttons[i].callback);
                }
                this.buttons[i].setVisible(true);
            } else {
                this.buttons[i].setVisible(false);
            }
        }
    }

    GUI.prototype.hideButtons = function() {
        for(var i = 0; i < 4; i++) {
            this.buttons[i].setVisible(false);
        }
    }

    return GUI;
});
