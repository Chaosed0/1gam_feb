
define(['crafty', 'jquery', './VoronoiTerrain',
    './TerrainVisualizer',
    './CameraControls',
], function(Crafty, $, VoronoiTerrain) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    const tileDensity = 50;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);
                        
    var terrain = new VoronoiTerrain();
    Crafty.scene("Main", function () {
        var islandRadius = Math.min(width, height);
        var island = Crafty.e("2D, Canvas, TerrainVisualizer, CameraControls, Mouse")
            .attr({x: 0, y: 0, w: width, h: height})
            .terrainvisualizer(terrain, waterPercent, groundPercent);
        Crafty.viewport.scale(8.0);
        Crafty.viewport.clampToEntities = false;
    });

    Crafty.scene("Load", function() {
        var loadtext = Crafty.e("2D, Canvas, Text")
            .attr({x: width/2.0, y: width/2.0})
            .text("Loading")
            .textFont({size: '20px'});

        //Give crafty a small amount of time to get the loading
        // text up before blocking the thread
        setTimeout(function() {
            console.log('GENERATE');
            terrain.generateTerrain(width, height, 100, waterPercent);
            console.log('DONE');
            Crafty.scene("Main");
        }, tileDensity);
    });
    
    Crafty.scene("Load");
});
