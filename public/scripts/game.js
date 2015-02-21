
require(['crafty',
        'jquery',
        './GUI',
        './VoronoiTerrain',
        './UnitManager',
        './CameraControls',
        './TerrainRenderer',
        './GameController',
        './NameGenerator',
        './Util',
    './Expires',
    './Meter',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, GUI, VoronoiTerrain, UnitManager, CameraControls, renderTerrain, GameController, NameGenerator, u) {
    var self = this;
    var map;

    const waterPercent = 0.3;
    const groundPercent = 0.4;
    const tileDensity = 50;
    const terrainSize = {x: 0, y: 0, w: 10000, h: 8000};
    const guiRatio = 0.25;
    const unitSize = 48;
    const playerPartySize = 5;
    const enemyPartyNum = 5;
    const enemyPartySize = 5;

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

    var names = null;
    var unitInfo = null;
    var unitClasses = null;

    var goodNameGenerator = null;
    var badNameGenerator = null;
    var enemyFaction = null;
    var enemyController = null;

    Crafty.init(width, height, gameElem);
    Crafty.pixelart(true);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    var generateSomeUnits = function(num, faction, good) {
        /* Terrain better be generated at the time of calling */
        var bodies = terrain.getBodies();
        var cells = terrain.getDiagram().cells;

        /* Pick a random continent and stick some guys on it */
        var continent = u.randomElem(bodies.continents);
        var cells = [];
        var centerCell;

        /* Make sure we're not sticking the unit on a mountain */
        do {
            centerCell = u.randomElem(continent.cells);
        } while(!terrain.isGround(centerCell.site));

        /* Get a relatively close area to place the units in */
        while(cells.length < num) {
            terrain.bfs(centerCell, 3, function(terrain, cell) {
                return terrain.isGround(cell.site);
            }, function(cell) {
                cells.push(cell);
            });
        }

        /* Place the units */
        for(var i = 0; i < num; i++) {
            var className = u.randomElem(unitClasses);
            var unitName = (good ? goodNameGenerator.generateName() : badNameGenerator.generateName());

            var placed = false;
            while(!placed) {
                var cell = cells[Math.floor(u.getRandom(cells.length))];
                var site = cell.site;

                if(!unitManager.getUnitForCell(cell)) {
                    /* Note that we're trusting in addUnit to set the unit location */
                    var unit = Crafty.e("2D, Canvas, Unit, SpriteAnimation, UnitSprite")
                        .attr({w: unitSize, h: unitSize})
                        .unit(unitName, faction, className, good, unitInfo[className])
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
            .terrainvisualizer(terrain, terrainPrerender);

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

        /* Pick a random faction name for player and enemy */
        var playerFaction = u.randomElem(names.groups.good);
        var enemyFaction = u.randomElem(names.groups.bad);

        /* Generate some units for the player */
        generateSomeUnits(playerPartySize, playerFaction, true);
        /* Generate some units for the bad guys */
        for(var i = 0; i < enemyPartyNum; i++) {
            generateSomeUnits(enemyPartySize, enemyFaction, false);
        }

        /* Wrap up objects the GameController needs */
        var stateObjects = {
            unitManager: unitManager,
            terrain: terrain,
            gui: gui,
            vis: terrainVis,
            camera: camera
        }

        /* Create user game controller */
        playerController = new GameController(playerFaction, stateObjects, function() {
            /* When the player's done, switch to the enemy */
            enemyController.setActive();
        });

        /* Create enemy game controller */
        enemyController = new GameController(enemyFaction, stateObjects, function() {
            /* When the enemy's done, switch to the player */
            playerController.setActive();
        });

        /* Fire up the player GameController and let it take over
         * Hack - wait a bit, it's hard for us to keep up */
        window.setTimeout(function() {
            playerController.setActive();
        }, 500);
    });

    Crafty.scene("Load", function() {
        var loadtext = Crafty.e("2D, Canvas, Text")
            .attr({x: width/2.0, y: height/2.0})
            .text("Loading")
            .textFont({size: '20px'});

        /* Grab the json definition for the creatures spritesheet */
        $.getJSON('data/unitinfo.json', function(data) {
            /* Preload spritesheet */
            Crafty.load(data.preload);
            /* Save animation data */
            unitInfo = data.units;
            unitClasses = Object.keys(unitInfo);
            names = data.names;
            /* Initialize name generator */
            goodNameGenerator = new NameGenerator(names.units.good);
            badNameGenerator = new NameGenerator(names.units.bad);
            /* Generate terrain */
            terrain.generateTerrain(terrainSize.w, terrainSize.h, tileDensity, terrainPercents);
            /* Render the terrain */
            terrainPrerender = renderTerrain(terrain, terrainSize, terrainPercents, terrainRenderOptions);
            /* Switch over to the main scene */
            Crafty.scene("Main");
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + " (" + error + ")";
            console.log("Error requesting JSON from server: " + err);
        });
    });
    
    Crafty.scene("Load");
});
