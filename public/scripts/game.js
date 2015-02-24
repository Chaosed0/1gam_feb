
require(['crafty',
        'jquery',
        './GUI',
        './VoronoiTerrain',
        './UnitManager',
        './CameraControls',
        './TerrainRenderer',
        './ComputerInputs',
        './LocalInputs',
        './GameController',
        './NameGenerator',
        './ObjectParser',
        './Util',
    './Expires',
    './Meter',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, GUI, VoronoiTerrain, UnitManager, CameraControls, renderTerrain, ComputerInputs, LocalInputs, GameController, NameGenerator, ObjectParser, u) {
    var self = this;
    var map;

    const waterPercent = 0.3;
    const groundPercent = 0.4;
    const tileDensity = 50;
    const terrainSize = {x: 0, y: 0, w: 10000, h: 8000};
    const guiRatio = 0.25;
    const unitSize = 48;
    const enemyPartyNum = 5;
    const enemyPartySize = 5;

    const damageTextExpireTime = 1000;

    const terrainPercents = {
        water: waterPercent,
        ground: groundPercent,
        other: 1 - waterPercent - groundPercent
    };

    const terrainRenderOptions = {
        drawElevations: false,
        drawBodyTypes: false,
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

    var effectParser = null;
    var goodNameGenerator = null;
    var badNameGenerator = null;
    var enemyFaction = null;
    var enemyController = null;
    var playerFaction = null;
    var playerController = null;

    Crafty.init(width, height, gameElem);
    Crafty.pixelart(true);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    var createDamageNumbers = function(magnitude, color) {
        /* Make damage numbers; we expect this func to be called with
         * this === unit being damaged */
        var text = Crafty.e("2D, Canvas, Text, Expires, Tween")
            .attr({x: this.x + this.w/2, y: this.y})
            .text(magnitude)
            .textFont({family: 'Georgia', size: '20px', weight: '900'})
            .expires(damageTextExpireTime);
        if(color !== undefined) {
            text.textColor(color);
        }
        text.tween({y: text.y - text.h - 10}, damageTextExpireTime/4, 'easeOutQuad');
    }

    var checkAndHandleUnitDeath = function() {
        /* Check if we need to kill the unit off */
        if(this.isDead()) {
            /* Do the deed */
            this.addComponent("Tween");
            this.tween({alpha: 0}, damageTextExpireTime/2, 'easeOutQuad');
            this.bind("TweenEnd", function() {
                this.destroy();
            });
        }
    }

    var generateUnitCamp = function(num, faction, good) {
        var bodies = terrain.getBodies();
        var cells = terrain.getDiagram().cells;
        var oneOfEach = false;

        if(num === null) {
            /* Special case - we're to generate one of each class */
            num = unitClasses.length;
            oneOfEach = true;
        }

        /* Pick the largest open space and stick some guys on a random location there */
        var continent = bodies.plains[0];
        for(var i = 1; i < bodies.plains.length; i++) {
            if(bodies.plains[i].cells.length > continent.cells.length) {
                continent = bodies.plains[i];
            }
        }

        /* Get a relatively close area to place the units in
         * that isn't too small */
        var centerCell = null;
        var campCells = [];
        while(campCells.length < num) {
            centerCell = u.randomElem(continent.cells);
            terrain.bfs(centerCell, 3, function(terrain, cell) {
                /* Can't place units on water, mountain or occupied ground */
                return terrain.isGround(cell.site) &&
                    !unitManager.getUnitForCell(cell);
            }, function(cell) {
                campCells.push(cell);
            });
        }

        /* Place the units */
        for(var i = 0; i < num; i++) {
            var unitName = (good ? goodNameGenerator.generateName() : badNameGenerator.generateName());
            var className = null;
            if(oneOfEach) {
                className = unitClasses[i];
            } else {
                className = u.randomElem(unitClasses);
            }

            var placed = false;
            while(!placed) {
                var cell = u.randomElem(campCells);
                var site = cell.site;

                if(!unitManager.getUnitForCell(cell)) {
                    /* Note that we're trusting in addUnit to set the unit location */
                    var unit = Crafty.e("2D, Canvas, Unit, SpriteAnimation, UnitSprite")
                        .attr({w: unitSize, h: unitSize})
                        .unit(unitName, faction, className, good, unitInfo[className])
                        .animate('idle', -1)
                        .bind("Damaged", createDamageNumbers)
                        .bind("Damaged", checkAndHandleUnitDeath)
                        .bind("Healed", function(v) { createDamageNumbers.call(this, v, '#00FF00'); });
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
        playerFaction = u.randomElem(names.groups.good);
        enemyFaction = u.randomElem(names.groups.bad);

        /* Generate one unit of each class for the player */
        generateUnitCamp(null, playerFaction, true);
        /* Generate some random units for the bad guys */
        for(var i = 0; i < enemyPartyNum; i++) {
            generateUnitCamp(enemyPartySize, enemyFaction, false);
        }

        /* Wrap up objects the GameControllers need */
        var stateObjects = {
            unitManager: unitManager,
            terrain: terrain,
            gui: gui,
            vis: terrainVis,
            camera: camera,
            effectParser: effectParser,
        }

        /* Create an input handler for the local user */
        var playerInputs = new LocalInputs(terrainVis, gui);

        /* Create an input handler for the AI villains */
        var enemyInputs = new ComputerInputs(enemyFaction, playerFaction);

        /* Create user game controller */
        playerController = new GameController(playerFaction, playerInputs, stateObjects, function() {
            /* When the player's done, switch to the enemy */
            enemyController.setActive();
        });

        /* Create enemy game controller */
        enemyController = new GameController(enemyFaction, enemyInputs, stateObjects, function() {
            /* When the enemy's done, switch to the player */
            playerController.setActive();
        });

        /* Fire up the player GameController and let it take over
         * Hack - wait a bit, it's hard for us to keep up with the
         * resulting announcement that comes on-screen otherwise */
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
            /* Initialize effect stringifier */
            effectParser = new ObjectParser(data.strings.effects);
            /* Switch over to the main scene */
            Crafty.scene("Main");
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + " (" + error + ")";
            console.log("Error requesting JSON from server: " + err);
        });
    });
    
    Crafty.scene("Load");
});
