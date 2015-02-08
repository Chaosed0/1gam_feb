
define(['crafty', 'jquery', './VoronoiTerrain',
    './TerrainVisualizer',
    './CameraControls',
], function(Crafty, $, VoronoiTerrain) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    const tileDensity = 50;
    const terrainMult = 8;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);
                        
    var terrain = new VoronoiTerrain();
    Crafty.scene("Main", function () {
        var island = Crafty.e("2D, Canvas, TerrainVisualizer, CameraControls, Mouse")
            .attr({x: 0, y: 0, w: width * terrainMult, h: height * terrainMult})
            .terrainvisualizer(terrain, waterPercent, groundPercent);
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
            terrain.generateTerrain(width * terrainMult, height * terrainMult, 100, waterPercent);
            console.log('DONE');
            Crafty.scene("Main");
        }, tileDensity);
    });
    
    Crafty.scene("Load");
});
