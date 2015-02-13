
define(['crafty', 'jquery', './VoronoiTerrain', './UnitManager', './CameraControls', 'Util',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, VoronoiTerrain, UnitManager, CameraControls, u) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    const tileDensity = 100;
    const terrainSize = {x: 0, y: 0, w: 10000, h: 8000};
    const minimapRatio = 0.25;

    const unitSize = 16;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');
    var terrain = new VoronoiTerrain();
    var unitManager = new UnitManager();

    Crafty.init(width, height, gameElem);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    var generateSomeUnits = function(num) {
        // Terrain better be generated at the time of calling
        var bodies = terrain.getBodies();
        var cells = terrain.getDiagram().cells;

        var color = {r: Math.floor(u.getRandom(255)),
                     g: Math.floor(u.getRandom(255)),
                     b: Math.floor(u.getRandom(255))};

        //Pick a random continent and stick some guys on it
        var continent = bodies.continents[Math.floor(u.getRandom(bodies.continents.length))];
        var randomTile = continent.ids[Math.floor(u.getRandom(continent.ids.length))];
        var ids = terrain.floodFill(terrain.getDiagram().cells[randomTile].site, 4, function(terrain, point) {
            return terrain.aboveWater(point);
        });
        for(var i = 0; i < num; i++) {
            var placed = false;
            while(!placed) {
                var id = ids[Math.floor(u.getRandom(ids.length))];
                var site = terrain.getDiagram().cells[id].site;
                if(!unitManager.getUnitForId(id)) {
                    placed = true;
                    var unit = Crafty.e("2D, Canvas, Color, Unit")
                        .attr({x: site.x - unitSize/2, y: site.y - unitSize/2, w: unitSize, h: unitSize})
                        .color('rgb(' + color.r + ',' + color.g + ',' + color.b + ')')
                        .unit(4, num);
                    unitManager.addUnit(id, unit);
                }
            }
        }
    }

    Crafty.scene("Main", function () {
        var camera = new CameraControls(terrainSize);
        camera.mouselook(true);

        var terrainVis = Crafty.e("2D, Canvas, TerrainVisualizer, Mouse")
            .attr(terrainSize)
            .terrainvisualizer(terrain, waterPercent, groundPercent)
            .bind("CellSelected", function(cell) {
                var unitSelected = unitManager.getUnitForCell(cell);
                if(unitSelected !== null) {
                    console.log(unitSelected);
                    var ids = terrain.floodFill(cell.site, unitSelected.getSpeed(), function(terrain, point) {
                        //Terrain must be walkable and not occupied by a unit of another faction
                        var unitOnPoint = unitManager.getUnitForId(point.voronoiId);
                        var passable = terrain.aboveWater(point);
                        if (passable && unitOnPoint) {
                            if(unitSelected.getFaction() != unitOnPoint.getFaction()) {
                                passable = false;
                            }
                        }
                        if(!passable && unitOnPoint) {
                            console.log(point.voronoiId, unitOnPoint);
                        }
                        return passable;
                    });

                    this.highlightIds(ids);
                }
            });

        /* Make the minimap square */
        var minimapSize = Math.min(width * minimapRatio, height * minimapRatio);

        var minimap = Crafty.e("2D, Canvas, Minimap, HUD, Mouse")
            .attr({w: minimapSize, h: minimapSize, z: 9999})
            .minimap(terrainVis.getPrerender(), terrainSize)
            .bind("MinimapDown", function(point) {
                camera.mouselook(false);
                camera.centerOn(point);
            }).bind("MinimapUp", function() {
                camera.mouselook(true);
            });

        var infodisplay = Crafty.e("2D, Canvas, HUD, InfoDisplay")
            .attr({
                x: minimapSize,
                y: Crafty.viewport.height - minimapSize,
                w: Crafty.viewport.width - minimapSize,
                h: minimapSize,
                z: 9999
            })
            .infodisplay(minimapSize);

        for(var i = 0; i < 5; i++) {
            generateSomeUnits(5);
        }
    });

    Crafty.scene("Load", function() {
        var loadtext = Crafty.e("2D, Canvas, Text")
            .attr({x: width/2.0, y: height/2.0})
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
