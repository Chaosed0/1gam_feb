
define(['crafty', 'jquery',
    './Island',
], function(Crafty, $) {
    var self = this;
    var map;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);  			  		
                        
    Crafty.scene("Main", function () {
        var islandRadius = Math.min(width, height);
        var island = Crafty.e("2D, Canvas, Island")
            .attr({x: 0, y: 0})
            .island(islandRadius, 10, islandRadius, 2);

        var player = Crafty.e("2D, Canvas, Fourway, Color")
            .fourway(4)
            .color("#000000")
            .attr({x: 0, y: 0, w: 16, h: 16})

        Crafty.viewport.follow(player);
    });

    Crafty.scene("Load", function() {
        Crafty.scene("Main");
    });
    
    Crafty.scene("Load");
});
