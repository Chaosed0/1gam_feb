
define(['crafty', './Util', './Button', './HUD'], function(Crafty, u, Button) {
    const menuZ = 1000;
    const menuElemZ = 1001;

    const fontFamily = 'Palatino';
    const padding = 10;
    const smallPadding = 5;

    var getClassMap = null;

    var UnitInfoContainer = function(bounds, align) {
        if(align === 'left') {
            this.startpos = {x: bounds.x + padding, y: bounds.y + padding};
            this.dx = 1;
        } else if(align === 'right') {
            this.startpos = {x: bounds.x + bounds.w - padding, y: bounds.y + padding};
            this.dx = -1;
        }
        this.curpos = {x: this.startpos.x, y: this.startpos.y};
        this.maxHeight = 0;

        this.classImage = Crafty.e("2D, Canvas, HUD, ClassSprite")
            .attr({w: 36, h: 39, z: menuElemZ});
        this.positionElem(this.classImage, smallPadding);

        this.titleText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({ z: menuElemZ })
            .textFont({family: fontFamily, size: '30px'})
            .text('LOLWTFBBQ!?')
            .textAlign(align);
        this.positionElem(this.titleText, smallPadding, true);
        this.titleText.y += this.classImage.h/2 - this.titleText.h/2;
        this.titleText.hud(true);

        this.subtitleText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({z: menuElemZ })
            .textFont({family: fontFamily, size: '15px'})
            .text('LOTSOFTEXTWHEEEEEEEEEEEEEE')
            .textAlign(align);
        this.positionElem(this.subtitleText, padding, true);

        this.healthText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text("HP")
            .textAlign(align);
        this.positionElem(this.healthText, smallPadding);

        this.healthMeter = Crafty.e("2D, Canvas, HUD, Meter")
            .attr({ z: menuElemZ, w: 200, h: 5})
            .meter('#FF0000')
            .fill(1);
        this.positionElem(this.healthMeter, smallPadding);
        this.healthMeter.y += this.healthText.h/2 - 2.5;
        this.healthMeter.hud(true);

        this.healthAmtText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text("10/10")
            .textAlign(align);
        this.positionElem(this.healthAmtText, smallPadding, true);

        this.manaText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text('MP')
            .textAlign(align);
        this.positionElem(this.manaText, smallPadding);

        this.manaMeter = Crafty.e("2D, Canvas, HUD, Meter")
            .attr({z: menuElemZ, w: 200, h: 5})
            .attr({w: 200, h: 5})
            .meter('#0000FF')
            .fill(1);
        this.positionElem(this.manaMeter, smallPadding);
        this.manaMeter.y += this.manaText.h/2 - 2.5;
        this.manaMeter.hud(true);

        this.manaAmtText = Crafty.e("2D, Canvas, HUD, Text")
            .attr({z: menuElemZ})
            .textFont({family: fontFamily, size: '12px'})
            .text("10/10")
            .textAlign(align);
        this.positionElem(this.manaAmtText, padding, true);

        //this.visible(false);
    }

    UnitInfoContainer.prototype.positionElem = function(elem, padding, newline) {
        elem.x = this.curpos.x;
        if(this.dx < 0 && !elem.has("Text")) {
            elem.x -= elem.w;
        }
        elem.y = this.curpos.y;
        elem.hud(true);

        if(elem.h > this.maxHeight) {
            this.maxHeight = elem.h;
        }

        if(newline === undefined) {
            this.curpos.x = this.curpos.x + this.dx * (elem.w + padding);
        } else {
            this.curpos.x = this.startpos.x;
            this.curpos.y += this.maxHeight + padding;
            this.maxHeight = 0;
        }
    }

    UnitInfoContainer.prototype.displayUnitInfo = function(unit) {
        this.titleText.text(unit.getName());
        this.titleText.updateHudTextWidth();
        this.subtitleText.text(unit.getClassName() + ' of ' + unit.getFaction());
        this.subtitleText.updateHudTextWidth();
        this.updateClassImage(unit.getClassName());

        this.healthMeter.fill(unit.getHealth() / unit.getMaxHealth());
        this.manaMeter.fill(unit.getMana() / unit.getMaxMana());
        this.healthAmtText.text(unit.getHealth() + "/" + unit.getMaxHealth());
        this.healthAmtText.updateHudTextWidth();
        this.manaAmtText.text(unit.getMana() + "/" + unit.getMaxMana());
        this.manaAmtText.updateHudTextWidth();

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

    UnitInfoContainer.prototype.visible = function(visible) {
        this.titleText.visible = visible;
        this.subtitleText.visible = visible;
        this.classImage.visible = visible;
        this.healthMeter.visible = visible;
        this.manaMeter.visible = visible;
        this.healthText.visible = visible;
        this.manaText.visible = visible;
        this.healthAmtText.visible = visible;
        this.manaAmtText.visible = visible;
    }

    UnitInfoContainer.prototype.updateClassImage = function(className) {
        if(className && getClassMap) {
            var index = getClassMap(className);
            this.classImage.sprite(index[0], index[1]);
            this.classImage.visible = true;
        } else {
            this.classImage.visible = false;
        }
    }

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

        this.unitInfos = {
            left: new UnitInfoContainer(this.infoBounds, 'left'),
            right: new UnitInfoContainer(this.infoBounds, 'right')
        };

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
    }

    GUI.setClassMapCallback = function(cb) {
        getClassMap = cb;
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
    GUI.prototype.displayUnitInfo = function(unit, side) {
        u.assert(side in this.unitInfos);
        this.unitInfos[side].displayUnitInfo(unit);
        this.unitInfos[side].visible(true);
    }

    GUI.prototype.hideInfo = function(side) {
        if(side === undefined) {
            for(side in this.unitInfos) {
                this.unitInfos[side].visible(false);
            }
        } else {
            this.unitInfos[side].visible(false);
        }
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
