
define(['seedrandom'], function(seedrandom) {
    const epsilon = 0.001;

    //Antipattern??
    if(!window.seed) {
        window.seed = Math.random();
        Math.seedrandom(window.seed);
        console.log(seed);
    }

    var exports = {
        setSeed: function(seed) {
            Math.seedrandom(seed);
        },
        getRandom: function(min, max) {
            if(arguments.length > 1) {
                return Math.random() * (max - min) + min;
            } else {
                return Math.random() * min;
            }
        },
        close: function(v1, v2, e) {
            if(e === undefined) {
                e = epsilon;
            }
            return Math.abs(v1.x - v2.x) < e && Math.abs(v1.y - v2.y) < e;
        },
    }

    return exports;
});
