
require(['crafty',
        'jquery',
        './GUI',
        './VoronoiTerrain',
        './UnitManager',
        './CameraControls',
        './TerrainRenderer',
        './Util',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, GUI, VoronoiTerrain, UnitManager, CameraControls, renderTerrain, u) {
    var self = this;
    var map;

    const waterPercent = 0.6;
    const groundPercent = 0.2;
    const tileDensity = 100;
    const terrainSize = {x: 0, y: 0, w: 10000, h: 8000};
    const guiRatio = 0.25;
    const unitSize = 16;

    const terrainPercents = {
        water: waterPercent,
        ground: groundPercent,
        other: 1 - waterPercent - groundPercent
    };

    const terrainRenderOptions = {
        drawElevations: false,
        drawRivers: true,
        drawSites: false,
        drawEdges: false,
        drawCoasts: true,
    };
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    var terrainPrerender = null;
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
        /* Create the terrain visualizer */
        var terrainVis = Crafty.e("2D, Canvas, TerrainVisualizer, Mouse")
            .attr(terrainSize)
            .terrainvisualizer(terrain, terrainPrerender)
            .bind("CellSelected", function(data) {
                var cell = data.cell;
                var unitSelected = unitManager.getUnitForCell(cell);
                var vis = this;

                gui.displayCellInfo(cell);

                if(unitSelected !== null) {
                    gui.displayUnitInfo(unitSelected);
                    gui.setButtons([{
                        text: 'Move',
                        callback: function() {
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

                            vis.highlightCells(cells);
                        }
                    }]);
                } else {
                    gui.hideButtons();
                    vis.clearHighlight();
                }
            });

        /* Calculate the size of the bottom bar (GUI) */
        var guiSize = {w: Crafty.viewport.width, h: Crafty.viewport.height * guiRatio};

        /* Initialize the camera controls, with some padding at the bottom */
        var camera = new CameraControls({
            x: terrainSize.x,
            y: terrainSize.y,
            w: terrainSize.w,
            h: terrainSize.h
        }, {
            b: guiSize.h
        });
        camera.mouselook(true);

        /* Create the actual gui */
        var gui = new GUI(guiSize, camera, terrainPrerender, terrainSize);

        /* Generate some units (placeholder) */
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
            terrainPrerender = renderTerrain(terrain, terrainSize, terrainPercents, terrainRenderOptions);
            console.log('DONE');
            Crafty.scene("Main");
        }, 100);
    });
    
    Crafty.scene("Load");
});
