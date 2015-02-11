
define(['crafty', ], function(Crafty) {

    var viewportchanged = function() {
        if(this._clientbounds) {
            this.w = this._clientbounds.w / Crafty.viewport._scale;
            this.h = this._clientbounds.h / Crafty.viewport._scale;
            this.x = -Crafty.viewport.x + this._clientbounds.x / Crafty.viewport._scale;
            this.y = -Crafty.viewport.y + this._clientbounds.y / Crafty.viewport._scale;
        }
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
        init: function() {
            viewportchanged.call(this);
            this.bind("InvalidateViewport", viewportchanged);
        },

        remove: function() {
            this.unbind("InvalidateViewport", viewportchanged);
        },
    });
});
