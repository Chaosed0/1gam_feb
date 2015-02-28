
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
        './UnitFx',
        './ObjectParser',
        './Util',
    './Expires',
    './Meter',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, GUI, VoronoiTerrain, UnitManager, CameraControls, renderTerrain, ComputerInputs, LocalInputs, GameController, NameGenerator, UnitFx, ObjectParser, u) {
    var self = this;
    var map;

    const waterPercent = 0.3;
    const groundPercent = 0.4;
    const tileDensity = 30;
    const terrainSize = {x: 0, y: 0, w: 5000, h: 4000};
    const guiRatio = 0.25;
    const unitSize = 48;

    const initialAnnounceTime = 4000;

    const enemyPartyNum = 7;
    const enemyPartySize = 5;
    /* Size in cells */
    const campSize = 3;
    const minCampDist = 7;

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

    var campCenters = [];
    var bossUnit = null;
    var terrainPrerender = null;
    var camera = null;
    var gui = null;
    var terrain = new VoronoiTerrain();
    var unitManager = new UnitManager();

    var names = null;
    var unitClasses = null;
    var unitClassNames = null;
    var bossClasses = null;
    var bossClassNames = null;
    var unitFx = null;

    var effectParser = null;
    var goodNameGenerator = null;
    var badNameGenerator = null;
    var enemyFaction = null;
    var enemyController = null;
    var playerFaction = null;
    var playerController = null;
    
    var turns = 0;

    /* Init crafty */
    Crafty.init(width, height, gameElem);
    Crafty.pixelart(true);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    /* Set seed */
    if(window.location.search !== '') {
        /* User has specified seed through query string - use it instead */
        u.setSeed(window.location.search.substring(1));
    } else {
        u.randomSeed();
    }

    var winFx = function() {
        var bossUnit = this;
        var bossFaction = bossUnit.getFaction();

        /* Stop everything */
        for(var i = 0; i < unitManager.allUnits.length; i++) {
            unitManager.allUnits[i].animate('none', -1);
        }
        camera.mouselook(false);

        /* We know it's the player's turn right now - they just killed the boss */
        playerController.forceStop();

        /* Kill all remaining enemy units after some time */
        window.setTimeout(function() {
            var unitlist = unitManager.getUnitListForFaction(bossFaction);
            while(unitlist.length > 0) {
                /* The unitlist gets modified as this happens */
                var unit = unitlist[unitlist.length-1];
                unit.damage(unit._maxhealth);
            }
        }, 1000);

        /* Announce the victory */
        gui.announce("You have cleansed the land of evil!", 3000, true, function() {
            gui.announce("Turns taken: " + (turns+1), 3000, true, function() {
                gui.announce("Seed for this map: " + u.getSeed(), 1500, false, function(outTween) {
                    /* nothing - maybe something here later */
                });
            });
        });
    }

    var loseFx = function() {
        /* Stop everything */
        for(var i = 0; i < unitManager.allUnits.length; i++) {
            unitManager.allUnits[i].animate('none', -1);
        }
        camera.mouselook(false);

        /* We know it's the enemy's turn right now */
        enemyController.forceStop();

        /* Announce the loss */
        gui.announce("Evil has triumphed...", 1500, false, function(outTween) {
            gui.setInstructionText("Refresh to try again");
        });
    }

    var createUnit = function(name, faction, className, good, cell, boss) {
        var size = unitSize;
        if(boss) {
            size *= 1.5;
        }

        var unit = Crafty.e("2D, Canvas, Unit, SpriteAnimation, UnitSprite")
            .attr({w: size, h: size})
            .unit(name, faction, className, good, (boss ? bossClasses[className] : unitClasses[className]))
            .bind("Died", function(data) {
                /* The unit is dead - destroy it once all anims are over
                 * XXX: How do we know that the unit has anims pending? */
                this.bind("FxEnd", function() {
                    /* Give the unit a small amount of time to finish up */
                    this.addComponent("Expires");
                    this.expires(1000);
                });
            });

        if(boss) {
            /* Bind win con to the boss' death */
            unit.bind("Died", winFx);
        }

        /* Good units start alerted, bad ones don't */
        if(good) {
            unit.alert(true);
        } else {
            unit.alert(false);
        }
        /* Set unit alert distance
         * XXX: We probably shouldn't be the one doing this */
        var alertDistance = Math.max(terrain.getPointData().size.x,
                terrain.getPointData().size.y) * 3;
        unit.setAlertDistance(alertDistance);

        unitManager.addUnit(cell, unit);
        unitFx.bindFx(unit);

        return unit;
    }

    var generateUnitCamp = function(num, faction, good, boss) {
        var bodies = terrain.getBodies();
        var cells = terrain.getDiagram().cells;
        var oneOfEach = false;

        if(num === null) {
            /* Special case - we're to generate one of each class */
            num = unitClassNames.length;
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
        var campCenter = null;
        var campCells = [];
        var goodSpawn = false;
        while(!goodSpawn) {
            goodSpawn = true;

            campCenter = u.randomElem(continent.cells);
            for(var i = 0; goodSpawn && i < campCenters.length; i++) {
                if(u.dist(campCenters[i].site, campCenter.site) <
                        terrain.getCellSize()*minCampDist) {
                    goodSpawn = false;
                }
            }

            if(goodSpawn) {
                terrain.bfs(campCenter, campSize, function(terrain, cell) {
                    /* Can't place units on water, mountain or occupied ground */
                    return terrain.isGround(cell.site) &&
                        !unitManager.getUnitForCell(cell);
                }, function(cell) {
                    campCells.push(cell);
                });

                if(campCells.length < num) {
                    goodSpawn = false;
                }
            }
        }

        campCenters.push(campCenter);

        /* Should we put the boss here? */
        if(boss !== undefined && boss) {
            u.assert(!good);
            /* Put the boss right at the camp center */
            var bossName = badNameGenerator.generateName();
            var className = u.randomElem(bossClassNames);
            bossUnit = createUnit(bossName, faction, className, good, campCenter, true);
        }

        /* Place normal units */
        for(var i = 0; i < num; i++) {
            var unitName = (good ? goodNameGenerator.generateName() : badNameGenerator.generateName());
            var className = null;
            if(oneOfEach) {
                className = unitClassNames[i];
            } else {
                className = u.randomElem(unitClassNames);
            }

            var placed = false;
            while(!placed) {
                var cell = u.randomElem(campCells);
                var site = cell.site;

                if(!unitManager.getUnitForCell(cell)) {
                    createUnit(unitName, faction, className, good, cell, false);
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
        camera = new CameraControls({
            x: terrainSize.x,
            y: terrainSize.y,
            w: terrainSize.w,
            h: terrainSize.h
        }, {
            b: guiSize.h
        });
        camera.mouselook(true);

        /* Create the actual gui */
        gui = new GUI(guiSize, camera, terrainPrerender, terrainSize);

        /* Pick a random faction name for player and enemy */
        playerFaction = u.randomElem(names.groups.good);
        enemyFaction = u.randomElem(names.groups.bad);

        /* Generate one unit of each class for the player */
        generateUnitCamp(null, playerFaction, true);
        /* Generate some random units for the bad guys */
        for(var i = 0; i < enemyPartyNum-1; i++) {
            generateUnitCamp(enemyPartySize, enemyFaction, false);
        }
        /* Generate the boss camp */
        generateUnitCamp(enemyPartySize, enemyFaction, false, true);

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

        /* Create an input handler for the AI bad guys */
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
            turns++;
        });

        /* Hack - wait a bit, it's hard for us to keep up with the
         * announcement that comes on-screen otherwise */
        window.setTimeout(function() {
            /* Center on the boss and announce the objective */
            camera.centerOn(bossUnit.getCell().site, initialAnnounceTime/4);
            gui.announce("Kill " + bossUnit.getName() + ", the king of " + bossUnit.getFaction() + "!",
                    initialAnnounceTime, true, function() {
                        /* Let the player controller take over */
                        playerController.setActive();
                    });
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
            unitClasses = data.classes;
            unitClassNames = Object.keys(unitClasses);
            bossClasses = data.bossClasses;
            bossClassNames = Object.keys(bossClasses);
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
            /* Initialize unit effect generator */
            unitFx = new UnitFx(data.effectFx);
            /* Switch over to the main scene */
            Crafty.scene("Main");
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + " (" + error + ")";
            console.log("Error requesting JSON from server: " + err);
        });
    });

    Crafty.scene("Load");
});
