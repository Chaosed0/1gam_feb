
define(['crafty', 'jquery', './VoronoiTerrain',
    './TerrainVisualizer',
    './CameraControls',
    './Minimap',
], function(Crafty, $, VoronoiTerrain) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    const tileDensity = 100;
    const terrainSize = {x: 0, y: 0, w: 8000, h: 8000};
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    Crafty.init(width, height, gameElem);
                        
    var terrain = new VoronoiTerrain();
    Crafty.scene("Main", function () {
        var terrainVis = Crafty.e("2D, Canvas, TerrainVisualizer, CameraControls, Mouse")
            .attr({x: 0, y: 0, w: terrainSize.w, h: terrainSize.h})
            .terrainvisualizer(terrain, waterPercent, groundPercent)
            .cameracontrols({x: 0, y: 0, w: terrainSize.w, h: terrainSize.h});

        var minimap = Crafty.e("2D, Canvas, Minimap, Mouse")
            .attr({w: width / 4, h: height / 4, z: 9999})
            .minimap(terrainVis.getPrerender(), terrainSize);
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
            terrain.generateTerrain(terrainSize.w, terrainSize.h, tileDensity, waterPercent);
            console.log('DONE');
            Crafty.scene("Main");
        }, 100);
    });
    
    Crafty.scene("Load");
});
