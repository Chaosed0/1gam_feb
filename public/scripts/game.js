
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

    const TEMPunitspeed = 2;
    
    var width = $(document).width();
    var height = $(document).height();
    var gameElem = document.getElementById('game');

    var terrainPrerender = null;
    var terrain = new VoronoiTerrain();
    var unitManager = new UnitManager();

    var selectedUnit = null;
    var highlightedCells = null;
    var unitAnims = null;
    var unitClasses = null;

    Crafty.init(width, height, gameElem);
    Crafty.pixelart(true);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    var generateSomeUnits = function(num, faction) {
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
                        .unit(className + ' ' + i, TEMPunitspeed, faction)
                        .reel('idle', 2000, unitAnims[className])
                        .animate('idle', -1);
                    unitManager.addUnit(cell, unit);
                    placed = true;
                }
            }
        }
    }

    Crafty.scene("Main", function () {
        var currentSelectCallback;

        var transition = function(cb) {
            terrainVis.unbind("CellSelected", currentSelectCallback);
            currentSelectCallback = cb;
            terrainVis.bind("CellSelected", currentSelectCallback);
        }

        var selectUnit = function(unit) {
            selectedUnit = unit;
            gui.displayUnitInfo(selectedUnit);
            gui.setButtons([{
                text: 'Move',
                callback: guiMoveCallback
            }]);
        }

        /* Callback for when "cancel" button is hit in gui. Transitions to
         * freeSelectCallback and deselects the selected unit. */
        var guiCancelHighlight = function() {
            gui.hideButtons();
            terrainVis.clearHighlight();
            selectedUnit = null;
        }

        /* Callback for when "move" button is hit in gui. Transitions to 
         * freeSelectCallback. */
        var guiMoveCallback = function() {
            gui.hideButtons();
            highlightedCells = [];
            terrain.bfs(selectedUnit.getCell(), selectedUnit.getSpeed(), function(terrain, cell) {
                var unitOnPoint = unitManager.getUnitForCell(cell);
                var passable = terrain.isGround(cell.site);
                var skip = false;
                if (passable && unitOnPoint) {
                    if(selectedUnit.getFaction() !== unitOnPoint.getFaction()) {
                        /* Other unit is not of our faction, we cannot pass this tile */
                        passable = false;
                    } else {
                        /* Other unit is of our faction; we can't move here but we can
                         * pass through it */
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

            gui.setButtons([{
                text: 'Cancel',
                callback: function() {
                    /* We want to keep the previously selected unit selected */
                    var savedUnit = selectedUnit;
                    guiCancelHighlight();
                    selectUnit(selectedUnit);
                    transition(freeSelectCallback);
                }
            }]);

            terrainVis.highlightCells(highlightedCells);
            transition(moveSelectCallback);
        }

        /* Select callback when user is selecting any tile. If a unit is selected,
         * adds the unit's available actions to the gui menu. */
        var freeSelectCallback = function(data) {
            var cell = data.cell;
            var unitOnCell = unitManager.getUnitForCell(cell);

            gui.displayCellInfo(cell);

            if(data.mouseButton == 0) {
                /* Left click, highlight the map cell */
                terrainVis.selectCell(cell);
            }

            if(unitOnCell !== null) {
                selectUnit(unitOnCell);
            } else {
                guiCancelHighlight();
            }
        }

        /* Select callback when user has chosen to move the unit. Moves the
         * selected unit to the selected cell, then transitions to
         * freeSelectCallback.
         * Note that we don't need to check if it's a valid cell; we only
         * receive the callback if it's a highlighted cell. */
        var moveSelectCallback = function(data) {
            unitManager.moveUnit(selectedUnit, data.cell);
            gui.hideButtons();
            terrainVis.clearHighlight();
            terrainVis.deselect();
            selectedUnit = null;
            transition(freeSelectCallback);
        }

        currentSelectCallback = freeSelectCallback;

        /* Create the terrain visualizer */
        var terrainVis = Crafty.e("2D, Canvas, TerrainVisualizer, Mouse")
            .attr(terrainSize)
            .terrainvisualizer(terrain, terrainPrerender)
            .bind("CellSelected", currentSelectCallback);

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
            generateSomeUnits(5, i);
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
