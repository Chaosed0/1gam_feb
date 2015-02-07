
define(['crafty', 'jquery',
    './Island',
    './Voronoi',
], function(Crafty, $) {
    var self = this;
    var map;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);  			  		
                        
    Crafty.scene("Main", function () {
        var islandRadius = Math.min(width, height);
        var island = Crafty.e("2D, Canvas, Voronoi")
            .attr({x: 0, y: 0, w: width, h: height})
            .voronoi(20);
    });

    Crafty.scene("Load", function() {
        Crafty.scene("Main");
    });
    
    Crafty.scene("Load");
});
