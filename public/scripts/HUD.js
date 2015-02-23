
define(['crafty', './Util'], function(Crafty, u) {

    /* Huge hack to get text width before scaling */
    var tmpcanvas = document.createElement('canvas');

    var viewportchanged = function() {
        if(this._clientbounds) {
            this.x = -Crafty.viewport.x + this._clientbounds.x / Crafty.viewport._scale;
            this.y = -Crafty.viewport.y + this._clientbounds.y / Crafty.viewport._scale;
            this.w = this._clientbounds.w / Crafty.viewport._scale;
            this.h = this._clientbounds.h / Crafty.viewport._scale;
        }
    }

    var predraw = function(e) {
        /* Save drawing transform, including whatever translations/scaling
         * the viewport may have, then reset to the identity transform to
         * draw the HUD element */
        e.ctx.save();
        e.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        /* If the user requested us to set the bounds before drawing, do that */
        if(this._savebounds) {
            e.pos._x = this._clientbounds.x;
            e.pos._y = this._clientbounds.y;
            e.pos._w = this._clientbounds.w;
            e.pos._h = this._clientbounds.h;
        }
    }

    var postdraw = function(e) {
        /* Restore the original transform for whatever comes after */
        e.ctx.restore();
    }

    /* So here's the deal about HUD elements in Crafty.
     * On one hand, they should be completely divorced from the normal viewport
     * transforms/scaling.
     * On the other, if we don't set our position/size in "real coordinates",
     * Crafty thinks the element is outside the viewport. The element will
     * get culled during drawing, and we'll also miss out on events.
     * So, this class sets this.x, this.y, this.w, and this.h depending on
     * the values of this._clientbounds which you need to set in some other
     * component on the current entity. this._clientbounds should be the bounds
     * of the HUD element as it is drawn on the screen.
     */
    Crafty.c("HUD", {
        _savebounds: false,

        init: function() {
            this.bind("PreDraw", predraw);
            this.bind("PostDraw", postdraw);
            this.bind("InvalidateViewport", viewportchanged);
            this.bind("ClientBoundsChanged", viewportchanged);
        },

        remove: function() {
            this.unbind("PreDraw", predraw);
            this.unbind("PostDraw", postdraw);
            this.unbind("InvalidateViewport", viewportchanged);
            this.unbind("ClientBoundsChanged", viewportchanged);
        },

        updateHudTextSize: function() {
            u.assert(this._text);
            /* We can't rely on the Text component's width - it'll have been
             * modified by scale and such. */
            var ctx = tmpcanvas.getContext('2d');
            ctx.font = this._fontString();
            this._clientbounds.w = ctx.measureText(this._text).width;

            var size = (this._textFont.size || this.defaultSize);
            this._clientbounds.h = 1.1 * this._getFontHeight(size);
            viewportchanged.call(this);
        },

        hud: function(bounds) {
            var self = this;
            this._clientbounds = { };
            Object.defineProperty(this._clientbounds, 'x', {
                set: function(v) {
                    this._x = v;
                    self.trigger("ClientBoundsChanged");
                }, get: function() {
                    return this._x;
                }, configurable: true,
                enumerable: true
            });
            Object.defineProperty(this._clientbounds, 'y', {
                set: function(v) {
                    this._y = v;
                    self.trigger("ClientBoundsChanged");
                }, get: function() {
                    return this._y;
                }, configurable: true,
                enumerable: true
            });
            Object.defineProperty(this._clientbounds, 'w', {
                set: function(v) {
                    this._w = v;
                    self.trigger("ClientBoundsChanged");
                }, get: function() {
                    return this._w;
                }, configurable: true,
                enumerable: true
            });
            Object.defineProperty(this._clientbounds, 'h', {
                set: function(v) {
                    this._h = v;
                    self.trigger("ClientBoundsChanged");
                }, get: function() {
                    return this._h;
                }, configurable: true,
                enumerable: true
            });

            if(typeof bounds === 'boolean') {
                this._savebounds = true;
                this._clientbounds._x = this.x;
                this._clientbounds._y = this.y;
                this._clientbounds._w = this.w;
                this._clientbounds._h = this.h;
                this.trigger("ClientBoundsChanged");
            } else if(bounds) {
                this._savebounds = true;
                this._clientbounds._x = bounds.x;
                this._clientbounds._y = bounds.y;
                this._clientbounds._w = bounds.w;
                this._clientbounds._h = bounds.h;
                this.trigger("ClientBoundsChanged");
            }
            return this;
        },
    });
});
