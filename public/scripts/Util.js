
define(['seedrandom'], function(seedrandom) {
    const epsilon = 0.001;

    var seed = Math.random();
    Math.seedrandom(seed);
    console.log(seed);

    var Util = {};

    Util.setSeed = function(seed) {
        Math.seedrandom(seed);
    }

    Util.dist = function(v1, v2) {
        this.assert(v1.x !== undefined && v1.y !== undefined);
        this.assert(v2.x !== undefined && v2.y !== undefined);
        var relX = v2.x - v1.x;
        var relY = v2.y - v1.y;
        return Math.sqrt(relX*relX + relY*relY);
    }

    Util.getRandom = function(min, max) {
        if(arguments.length > 1) {
            return Math.random() * (max - min) + min;
        } else {
            return Math.random() * min;
        }
    }

    Util.close = function(v1, v2, e) {
        if(e === undefined) {
            e = epsilon;
        }
        return Math.abs(v1.x - v2.x) < e && Math.abs(v1.y - v2.y) < e;
    }

    Util.assert = function(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    }

    Util.randomElem = function(arr) {
        return arr[Math.floor(this.getRandom(arr.length))];
    }

    return Util;
});
