
define(['seedrandom'], function(seedrandom) {
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
    }

    return exports;
});
