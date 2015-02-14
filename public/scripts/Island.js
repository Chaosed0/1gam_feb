
define(['crafty', './Util', 'simplify'], function(Crafty, u, simplify) {
    var vec2 = Crafty.math.Vector2D;

    var generateIsland = function(radius, iterations, randomness, decay) {
        var rand = function(amt) {
            return u.getRandom(-amt/2.0, amt/2.0);
        }

        var pointsSize = Math.pow(2, iterations + 2);
        var points = new Array(pointsSize+1);

        points[0] = new vec2(radius + rand(randomness), rand(randomness));
        points[1 * Math.floor(pointsSize/4.0)] = new vec2(rand(randomness), radius + rand(randomness));
        points[2 * Math.floor(pointsSize/4.0)] = new vec2(-radius + rand(randomness), rand(randomness));
        points[3 * Math.floor(pointsSize/4.0)] = new vec2(rand(randomness), -radius + rand(randomness));
        points[pointsSize] = new vec2(points[0].x, points[0].y);

        var midpoint = function(begin, end, randomness) {
            if(end - begin <= 1) {
                return;
            }

            var index = begin + Math.ceil((end - begin)/2.0);
            // Bias the point towards the midpoint of the neighboring points
            // and the point on the circle
            var p1 = points[begin];
            var p2 = points[end];
            points[index] = new vec2(
                    (p1.x + p2.x) / 2.0 + rand(randomness),
                    (p1.y + p2.y) / 2.0 + rand(randomness));
            midpoint(begin, begin + Math.floor((end - begin)/2.0), randomness/decay);
            midpoint(begin + Math.floor((end - begin)/2.0), end, randomness/decay);
        }

        midpoint(0, 1 * Math.floor(pointsSize / 4.0), randomness / decay);
        midpoint(1 * Math.floor(pointsSize / 4.0),
                 2 * Math.floor(pointsSize / 4.0), randomness / decay);
        midpoint(2 * Math.floor(pointsSize / 4.0),
                 3 * Math.floor(pointsSize / 4.0), randomness / decay);
        midpoint(3 * Math.floor(pointsSize / 4.0), pointsSize, randomness / decay);
        
        return points;
    }

    Crafty.c("Island", {
        _islandpoints: [],
        ready: false,

        _draw: function(e) {
            var points = this._islandpoints;
            if(e.type == 'canvas') {
                e.ctx.fillStyle = "#000000";
                e.ctx.beginPath();
                e.ctx.moveTo(this.x + points[0].x, this.y + points[0].y);
                for(var i = 0; i < points.length; i++) {
                    e.ctx.lineTo(this.x + points[i].x, this.y + points[i].y);
                }
                e.ctx.closePath();
                e.ctx.stroke();

                e.ctx.moveTo(0, 0);
                e.ctx.lineTo(0, 50);
                e.ctx.stroke();
            }
        },

        init: function() {
            this.ready = true;
            this.bind("Draw", this._draw);
            this.trigger("Invalidate");
        },

        remove: function() {
            this.unbind("Draw", this._draw);
            this.trigger("Invalidate");
        },

        island: function(radius, iterations, randomness, decay) {
            this._islandpoints = generateIsland(radius, iterations, randomness, decay);
            this._islandpoints = simplify(this._islandpoints, 0.5);

            var min = new vec2(0, 0);
            var max = new vec2(0, 0);
            for(var i = 0; i < this._islandpoints.length; i++) {
                if(min.x > this._islandpoints[i].x) {
                    min.x = this._islandpoints[i].x;
                }
                if(min.y > this._islandpoints[i].y) {
                    min.y = this._islandpoints[i].y;
                }
                if(max.x < this._islandpoints[i].x) {
                    max.x = this._islandpoints[i].x;
                }
                if(max.y < this._islandpoints[i].y) {
                    max.y = this._islandpoints[i].y;
                }
            }

            for(var i = 0; i < this._islandpoints.length; i++) {
                this._islandpoints[i].subtract(min);
            }

            this.x = Math.floor(min.x);
            this.y = Math.floor(min.y);
            this.w = Math.ceil(max.x - min.x);
            this.h = Math.ceil(max.y - min.y);

            this.ready = true;
            this.trigger("Invalidate");

            return this;
        }
    });
});
