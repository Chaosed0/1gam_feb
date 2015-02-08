
define(['seedrandom'], function(seedrandom) {
    const epsilon = 0.001;
    var seed = Math.random();
    Math.seedrandom(seed);
    console.log(seed);

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
        close: function(v1, v2) {
            return Math.abs(v1.x - v2.x) < epsilon && Math.abs(v1.y - v2.y) < epsilon;
        },
    }

    return exports;
});
