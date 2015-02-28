
define(['seedrandom'], function(seedrandom) {
    const epsilon = 0.001;
    const randomSeedLength = 16;
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    var Util = {};
    var seed = null;

    Util.setSeed = function(newSeed) {
        seed = newSeed;
        Math.seedrandom(seed);
    }

    Util.randomSeed = function() {
        var seed = "";
        for(var i = 0; i < randomSeedLength; i++) {
            seed += possible.charAt(Math.floor(Math.random()*possible.length));
        }
        this.setSeed(seed);
        console.log(seed);
    }

    Util.getSeed = function() {
        return seed;
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
                var error = new Error(message);
                this.stacktrace(error);
                throw error;
            }
            throw message; // Fallback
        }
    }

    Util.stacktrace = function(e) {
        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@');
        console.log(stack);
    }

    Util.randomElem = function(arr) {
        return arr[Math.floor(this.getRandom(arr.length))];
    }

    return Util;
});
