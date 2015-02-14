
require(['crafty', 'jquery', './GUI', './VoronoiTerrain', './UnitManager', './CameraControls', './Util',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, GUI, VoronoiTerrain, UnitManager, CameraControls, u) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    const tileDensity = 100;
    const terrainSize = {x: 0, y: 0, w: 10000, h: 8000};
    const guiRatio = 0.25;

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
        var centerCell = continent.cells[Math.floor(u.getRandom(continent.cells.length))];
        var cells = [];
        terrain.bfs(centerCell, 4, function(terrain, cell) {
            return terrain.aboveWater(cell.site);
        }, function(cell) {
            cells.push(cell);
        });
        for(var i = 0; i < num; i++) {
            var placed = false;
            while(!placed) {
                var cell = cells[Math.floor(u.getRandom(cells.length))];
                var site = cell.site;
                if(!unitManager.getUnitForCell(cell)) {
                    placed = true;
                    var unit = Crafty.e("2D, Canvas, Color, Unit")
                        .attr({x: site.x - unitSize/2, y: site.y - unitSize/2, w: unitSize, h: unitSize})
                        .color('rgb(' + color.r + ',' + color.g + ',' + color.b + ')')
                        .unit(3, num);
                    unitManager.addUnit(site.voronoiId, unit);
                }
            }
        }
    }

    Crafty.scene("Main", function () {
        var terrainVis = Crafty.e("2D, Canvas, TerrainVisualizer, Mouse")
            .attr(terrainSize)
            .terrainvisualizer(terrain, waterPercent, groundPercent)
            .bind("CellSelected", function(data) {
                var cell = data.cell;
                var unitSelected = unitManager.getUnitForCell(cell);
                if(unitSelected !== null) {
                    var cells = [];
                    terrain.bfs(cell, unitSelected.getSpeed(), function(terrain, cell) {
                        //Terrain must be walkable and not occupied by a unit of another faction
                        var unitOnPoint = unitManager.getUnitForId(cell.site.voronoiId);
                        var passable = terrain.aboveWater(cell.site);
                        if (passable && unitOnPoint) {
                            if(unitSelected.getFaction() != unitOnPoint.getFaction()) {
                                passable = false;
                            }
                        }
                        return passable;
                    }, function(cell) {
                        cells.push(cell);
                    });

                    this.highlightCells(cells);
                }
            });

        var guiSize = {w: Crafty.viewport.width, h: Crafty.viewport.height * guiRatio};
        var gui = new GUI(guiSize, camera, terrainVis.getPrerender(), terrainSize);

        /* Camera needs to go beyond the terrain a bit, since the gui takes up some space */
        var camera = new CameraControls({
            x: terrainSize.x,
            y: terrainSize.y,
            w: terrainSize.w,
            h: terrainSize.h + guiSize.h
        });
        camera.mouselook(true);

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
