
define(['crafty', 'jquery',
    './Island',
    './Terrain',
], function(Crafty, $) {
    var self = this;
    var map;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);  			  		
                        
    Crafty.scene("Main", function () {
        var islandRadius = Math.min(width, height);
        var island = Crafty.e("2D, Canvas, Terrain")
            .attr({x: 0, y: 0, w: width, h: height})
            .terrain(30);
    });

    Crafty.scene("Load", function() {
        Crafty.scene("Main");
    });
    
    Crafty.scene("Load");
});
