
define(['crafty', './Util', './Button', './HUD'], function(Crafty, u, Button) {
    const menuZ = 1000;
    const menuElemZ = 1001;

    const fontFamily = 'Palatino';
    const padding = 10;
    const smallPadding = 5;

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
        this.titleText.updateHudTextSize();
        this.subtitleText.text(unit.getClassName() + ' of ' + unit.getFaction());
        this.subtitleText.updateHudTextSize();
        this.updateClassImage(unit);

        this.healthMeter.fill(unit.getHealth() / unit.getMaxHealth());
        this.manaMeter.fill(unit.getMana() / unit.getMaxMana());
        this.healthAmtText.text(unit.getHealth() + "/" + unit.getMaxHealth());
        this.healthAmtText.updateHudTextSize();
        this.manaAmtText.text(unit.getMana() + "/" + unit.getMaxMana());
        this.manaAmtText.updateHudTextSize();

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

    UnitInfoContainer.prototype.updateClassImage = function(unit) {
        if(unit) {
            var loc = unit.getClassImageLoc();
            this.classImage.sprite(loc[0], loc[1]);
            this.classImage.visible = true;
        } else {
            this.classImage.visible = false;
        }
    }

    var GUI = function(size, camera, prerender, terrainSize) {
        this.minimapBounds = {
            x: 0,
            y: Crafty.viewport.height - size.h,
            w: size.h,
            h: size.h,
            z: menuZ
        };

        this.minimap = Crafty.e("2D, Canvas, Minimap, HUD, Mouse")
            .attr(this.minimapBounds)
            .minimap(prerender, terrainSize)
            .hud(true)
            .bind("MinimapDown", function(point) {
                camera.mouselook(false);
                camera.centerOn(point);
            }).bind("MinimapUp", function() {
                camera.mouselook(true);
            });

        this.infoBounds = {
            x: this.minimapBounds.w,
            y: Crafty.viewport.height - size.h,
            w: Crafty.viewport.width - this.minimapBounds.w * 2,
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

        this.centerText = Crafty.e("2D, Canvas, HUD, Text")
            .textFont({family: fontFamily, size: '20px'})
            .hud(true);
        this.centerText.z = menuElemZ;
        this.centerText.visible = false;

        this.menuBounds = {
            x: Crafty.viewport.width - this.minimapBounds.w,
            y: Crafty.viewport.height - size.h,
            w: this.minimapBounds.w,
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
        
        this.announceText = Crafty.e("2D, Canvas, Text, HUD, Tween")
            .attr({x: Crafty.viewport.width/2, y: (Crafty.viewport.height - size.h)/2, z: 3000})
            .textFont({family: 'Georgia', size: '50px'})
            .textColor('#FFFFFF')
            .text('a');
        this.announceText.hud(true);
        this.announceText.visible = false;

        this.announceBacking = Crafty.e("2D, Canvas, Color, HUD")
            .attr({
                x: 0,
                y: (Crafty.viewport.height - size.h)/2 - padding*2,
                w: Crafty.viewport.width,
                h: this.announceText.h + padding*4,
                z: 2000
            })
            .color('rgba(0,0,0,0.7)')
            .hud(true);
        this.announceBacking.visible = false;

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
                if(buttons[i] !== null) {
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

    GUI.prototype.setCenterText = function(text) {
        if(text !== null) {
            /* A ton of cheating going on here */
            this.centerText.text(text);
            this.centerText.updateHudTextSize();
            this.centerText._clientbounds.x = this.infoBounds.x + this.infoBounds.w/2 -
                this.centerText._clientbounds.w/2;
            this.centerText._clientbounds.y = this.infoBounds.y + this.infoBounds.h/2;
            this.centerText.trigger("InvalidateViewport");
            this.centerText.visible = true;
        } else {
            this.centerText.visible = false;
        }
    }

    GUI.prototype.announce = function(text, callback) {
        var self = this;
        self.announceText.text(text);
        self.announceText.updateHudTextSize();
        self.announceText._clientbounds.x = Crafty.viewport.width;
        self.announceText.visible = true;
        self.announceBacking.visible = true;
        self.announceText.tween({_clientbounds: {x: Crafty.viewport.width/2 -
            self.announceText._clientbounds.w/2}}, 1000, 'easeInQuad');

        var tweenEnd2 = function() {
            self.announceText.unbind("TweenEnd", tweenEnd2);
            self.announceBacking.visible = false;
            self.announceText.visible = false;
            callback();
        }

        var tweenEnd1 = function() {
            self.announceText.unbind("TweenEnd", tweenEnd1);
            self.announceText.tween({_clientbounds: {x: Crafty.viewport.x -
                self.announceText._clientbounds._w}}, 1000, 'easeInQuad');
            self.announceText.bind("TweenEnd", tweenEnd2);
        }

        self.announceText.bind("TweenEnd", tweenEnd1);
    }

    return GUI;
});
