
define(['crafty', 'jquery', './VoronoiTerrain', './CameraControls',
    './TerrainVisualizer',
    './Minimap',
], function(Crafty, $, VoronoiTerrain, CameraControls) {
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

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);
                        
    var terrain = new VoronoiTerrain();
    Crafty.scene("Main", function () {
        var camera = new CameraControls(terrainSize);
        camera.mouselook(true);

        var terrainVis = Crafty.e("2D, Canvas, TerrainVisualizer, Mouse")
            .attr(terrainSize)
            .terrainvisualizer(terrain, waterPercent, groundPercent);

        var minimap = Crafty.e("2D, Canvas, Minimap, Mouse")
            .attr({w: width / 4, h: height / 4, z: 9999})
            .minimap(terrainVis.getPrerender(), terrainSize)
            .bind("MinimapDown", function(point) {
                camera.mouselook(false);
                camera.centerOn(point);
            }).bind("MinimapUp", function() {
                camera.mouselook(true);
            });
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
