
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

    const waterPercent = 0.3;
    const groundPercent = 0.4;
    const tileDensity = 50;
    const terrainSize = {x: 0, y: 0, w: 10000, h: 8000};
    const guiRatio = 0.25;
    const unitSize = 48;

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

    var selectMode = 'free';
    var selectedUnit = null;
    var highlightedCells = null;
    var unitAnims = null;
    var unitClasses = null;

    Crafty.init(width, height, gameElem);
    Crafty.pixelart(true);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    var generateSomeUnits = function(num) {
        // Terrain better be generated at the time of calling
        var bodies = terrain.getBodies();
        var cells = terrain.getDiagram().cells;

        var className = unitClasses[Math.floor(u.getRandom(unitClasses.length))];

        //Pick a random continent and stick some guys on it
        var continent = bodies.continents[Math.floor(u.getRandom(bodies.continents.length))];
        var cells = [];
        var centerCell;

        /* Make sure we're not sticking the unit on a mountain */
        do {
            centerCell = continent.cells[Math.floor(u.getRandom(continent.cells.length))];
        } while(!terrain.isGround(centerCell.site));

        terrain.bfs(centerCell, 3, function(terrain, cell) {
            return terrain.isGround(cell.site);
        }, function(cell) {
            cells.push(cell);
        });

        for(var i = 0; i < num; i++) {
            var placed = false;
            while(!placed) {
                var cell = cells[Math.floor(u.getRandom(cells.length))];
                var site = cell.site;

                if(!unitManager.getUnitForCell(cell)) {
                    /* Note that we're trusting in addUnit to set the unit location */
                    var unit = Crafty.e("2D, Canvas, Unit, SpriteAnimation, UnitSprite")
                        .attr({w: unitSize, h: unitSize})
                        .unit(className + ' ' + i, 2, num)
                        .reel('idle', 2000, unitAnims[className])
                        .animate('idle', -1);
                    unitManager.addUnit(cell, unit);
                    placed = true;
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

                if(selectMode === 'free') {
                    if(data.mouseButton == 0) {
                        /* Left click, also highlight the map cell */
                        vis.selectCell(cell);
                    }

                    if(unitSelected !== null) {
                        selectedUnit = unitSelected;
                        gui.displayUnitInfo(unitSelected);
                        gui.setButtons([{
                            text: 'Move',
                            callback: function() {
                                highlightedCells = [];
                                terrain.bfs(cell, unitSelected.getSpeed(), function(terrain, cell) {
                                    //Terrain must be walkable and not occupied by a unit of another faction
                                    var unitOnPoint = unitManager.getUnitForCell(cell);
                                    var passable = terrain.isGround(cell.site);
                                    var skip = false;
                                    if (passable && unitOnPoint) {
                                        if(unitSelected.getFaction() != unitOnPoint.getFaction()) {
                                            passable = false;
                                        } else {
                                            skip = true;
                                        }
                                    }
                                    if(skip) {
                                        return -1;
                                    } else {
                                        return passable;
                                    }
                                }, function(cell) {
                                    highlightedCells.push(cell);
                                });

                                vis.highlightCells(highlightedCells);
                                selectMode = 'highlight';
                            }
                        }]);
                    } else {
                        gui.hideButtons();
                        vis.clearHighlight();
                        selectedUnit = null;
                    }
                } else if(selectMode === 'highlight') {
                    if(highlightedCells.indexOf(cell) >= 0) {
                        unitManager.moveUnit(selectedUnit, cell);
                        gui.hideButtons();
                        vis.clearHighlight();
                        vis.deselect();
                        selectMode = 'free';
                    }
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

        /* Grab the json definition for the creatures spritesheet */
        $.getJSON('/img/oryx_16bit_fantasy_creatures_trans.json', function(data) {
            /* Preload spritesheet */
            Crafty.load(data.preload);
            /* Save animation data */
            unitAnims = data.animations;
            unitClasses = Object.keys(unitAnims);
            /* Generate terrain */
            terrain.generateTerrain(terrainSize.w, terrainSize.h, tileDensity, terrainPercents);
            /* Render the terrain */
            terrainPrerender = renderTerrain(terrain, terrainSize, terrainPercents, terrainRenderOptions);
            /* Switch over to the main scene */
            Crafty.scene("Main");
        });
    });
    
    Crafty.scene("Load");
});
