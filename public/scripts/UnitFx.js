
define(['crafty', './Util'], function(Crafty, u) {
    const damageTextExpireTime = 1000;

    var UnitFx = function(fxMap) {
        /* Map of effect types to fx data */
        this.fxMap = fxMap;
        /* Map of unit ids to data on any fx currently playing
         * that is related to the unit */
        this.unitFxData = {};
        /* Next unique fx identifier */
        this.nextFxId = 0;
    }

    /* Bind our fx function to the unit */
    UnitFx.prototype.bindFx = function(unit) {
        var self = this;
        unit.bind("EffectApplied", function(data) { self.applyEffectFx(this, data) });
    }

    /* Get fx data related to a specific unit. If none,
     * a data structure will be created. */
    UnitFx.prototype.getUnitFxData = function(unit) {
        if(!(unit.id in this.unitFxData)) {
            this.unitFxData[unit.id] = {
                set: new Set(),
            };
            var self = this;
            unit.bind("Remove", function() { delete self.unitFxData[this.id]; });
        }
        return this.unitFxData[unit.id];
    }

    /* Creates new unique fx id and assigns it to a unit. Returns the id assigned. */
    UnitFx.prototype.newFx = function(unit) {
        /* We trust that this unit was added to unitManager, which
         * assigns an id */
        var data = this.getUnitFxData(unit);
        var id = this.nextFxId++;
        data.set.add(id);
        return id;
    }

    /* Removes an fx identifier related ot a unit. Exception if the id doesn't
     * belong to the unit. If all fx are done, triggers FxEnd on the unit. */
    UnitFx.prototype.removeFx = function(unit, fxId) {
        u.assert(unit.id in this.unitFxData);
        var data = this.getUnitFxData(unit);
        var deleted = data.set.delete(fxId);
        u.assert(deleted, "Tried to delete fx id not attached to a unit");
        if(data.set.size <= 0) {
            /* XXX: Triggering event on unit outside of unit - bad idea? */
            unit.trigger("FxEnd");
        }
    }

    /* Main fx function. Creates fx depending on the effect being applied to
     * the unit, e.g. piercing damage, fire damage, heal, stun, etc */
    UnitFx.prototype.applyEffectFx = function(unit, data) {
        var effect = data.effect;
        var magnitude = data.actual_magnitude ? data.actual_magnitude : effect.magnitude;
        if(effect.type === 'damage') {
            this.makeFx(unit, effect.damage_type);
            this.createDamageNumbers(unit, magnitude);
            if(unit.isDead()) {
                this.fadeUnitOnDeath(unit);
            }
        } else if(effect.type == 'heal') {
            this.makeFx(unit, effect.type);
            this.createDamageNumbers(unit, magnitude, '#00FF00');
        } else {
            console.log("WARNING: Tried to create effect which we have no record of");
        }
    }
    
    /*  Creates fx depending on what type a passed effect is. */
    UnitFx.prototype.makeFx = function(unit, type) {
        var self = this;
        var fx = this.fxMap[type];
        u.assert(fx, "Couldn't find fx for type " + type);

        var effect = Crafty.e("2D, Canvas, SpriteAnimation, FxSprite_" + fx.size)
            .reel("fx", fx.length, fx.anim)
        var fxId = this.newFx(unit);

        if(fx.position === 'random') {
            effect.animate("fx", 1);
            var randomLoc = function() {
                effect.x = unit.x + Math.floor(u.getRandom(unit.w - effect.w));
                effect.y = unit.y + Math.floor(u.getRandom(unit.h - effect.h));
            }
            randomLoc();

            /* AnimationEnd only triggers at the end of repeats, so we need to
             * make it repeat ourselves with random positions each time */
            var loops = fx.loops;
            effect.bind("AnimationEnd", function() {
                loops--;
                if(loops <= 0) {
                    this.destroy();
                    self.removeFx(unit, fxId);
                } else {
                    randomLoc();
                    this.animate("fx", 1);
                }
            });
        } else {
            effect.x = unit.x;
            effect.y = unit.y;
            effect.w = unit.w;
            effect.h = unit.h;
            effect.animate("fx", fx.loops ? fx.loops : 1);
            effect.bind("AnimationEnd", function() {
                this.destroy();
                self.removeFx(unit, fxId);
            });
        }
    }

    UnitFx.prototype.createDamageNumbers = function(unit, magnitude, color) {
        var self = this;
        var text = Crafty.e("2D, Canvas, Text, Expires, Tween")
            .attr({x: unit.x + unit.w/2, y: unit.y})
            .text(magnitude)
            .textFont({family: 'Georgia', size: '20px', weight: '900'})
            .expires(damageTextExpireTime);
        var fxId = this.newFx(unit);
        if(color !== undefined) {
            text.textColor(color);
        }
        text.tween({y: text.y - text.h - 10}, damageTextExpireTime/4, 'easeOutQuad');
        text.bind("TweenEnd", function() { self.removeFx(unit, fxId); });
    }

    UnitFx.prototype.fadeUnitOnDeath = function(unit) {
        var self = this;
        /* Check if we need to kill the unit off */
        if(unit.isDead()) {
            /* Do the deed */
            unit.addComponent("Tween");
            unit.tween({alpha: 0}, 500, 'easeOutQuad');
            var fxId = this.newFx(unit);
            unit.bind("TweenEnd", function() { self.removeFx(unit, fxId) });
        }
    }

    return UnitFx;
});
