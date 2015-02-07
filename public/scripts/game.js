
define(['crafty', 'jquery', './VoronoiTerrain',
    './TerrainVisualizer',
], function(Crafty, $, VoronoiTerrain) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);  			  		
                        
    var terrain = new VoronoiTerrain();
    Crafty.scene("Main", function () {
        var islandRadius = Math.min(width, height);
        var island = Crafty.e("2D, Canvas, TerrainVisualizer")
            .attr({x: 0, y: 0, w: width, h: height})
            .terrainvisualizer(terrain, waterPercent, groundPercent);
    });

    Crafty.scene("Load", function() {
        var loadtext = Crafty.e("2D, Canvas, Text")
            .attr({x: width/2.0, y: width/2.0})
            .text("Loading")
            .textFont({size: '20px'});

        //Give crafty a small amount of time to get the loading
        // text up before blocking the thread
        setTimeout(function() {
            terrain.generateTerrain(width, height, 100, waterPercent);
            Crafty.scene("Main");
        }, 100);
    });
    
    Crafty.scene("Load");
});
