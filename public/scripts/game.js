
require(['crafty',
        'jquery',
        './GUI',
        './VoronoiTerrain',
        './UnitManager',
        './CameraControls',
        './TerrainRenderer',
        './GameController',
        './Util',
    './Expires',
    './Meter',
    './TerrainVisualizer',
    './Minimap',
    './InfoDisplay',
    './HUD',
    './Unit',
], function(Crafty, $, GUI, VoronoiTerrain, UnitManager, CameraControls, renderTerrain, GameController, u) {
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

    var names = null;
    var unitInfo = null;
    var unitClasses = null;

    var activeFactions = [];
    var startCenters = [];
    var controllers = null;

    Crafty.init(width, height, gameElem);
    Crafty.pixelart(true);

    /* Hack in wheel event to mouseDispatch */
    Crafty.addEvent(this, Crafty.stage.elem, "wheel", Crafty.mouseDispatch);

    var generateSomeUnits = function(num, good) {
        /* Terrain better be generated at the time of calling */
        var bodies = terrain.getBodies();
        var cells = terrain.getDiagram().cells;

        /* Pick a random continent and stick some guys on it */
        var continent = u.randomElem(bodies.continents);
        var cells = [];
        var centerCell;

        /* Pick a faction name for this group */
        var alignment = good ? "good" : "bad";
        var factionName = u.randomElem(names.groups[alignment]);
        activeFactions.push(factionName);

        /* Make sure we're not sticking the unit on a mountain */
        do {
            centerCell = u.randomElem(continent.cells);
        } while(!terrain.isGround(centerCell.site));
        startCenters.push(centerCell);

        /* Get a relatively close area to place the units in */
        terrain.bfs(centerCell, 3, function(terrain, cell) {
            return terrain.isGround(cell.site);
        }, function(cell) {
            cells.push(cell);
        });

        /* Place the units */
        for(var i = 0; i < num; i++) {
            var unitName = u.randomElem(names.units[alignment]);
            var className = u.randomElem(unitClasses);
            var placed = false;
            while(!placed) {
                var cell = cells[Math.floor(u.getRandom(cells.length))];
                var site = cell.site;

                if(!unitManager.getUnitForCell(cell)) {
                    /* Note that we're trusting in addUnit to set the unit location */
                    var unit = Crafty.e("2D, Canvas, Unit, SpriteAnimation, UnitSprite")
                        .attr({w: unitSize, h: unitSize})
                        .unit(unitName, factionName, className, good, unitInfo[className])
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

        /* Generate some units (placeholder) */
        /* We want the first faction to be good */
        var good = true;
        for(var i = 0; i < 5; i++) {
            generateSomeUnits(5, good);
            good = false;
        }

        /* Create game controllers */
        controllers = new Array(activeFactions.length);
        for(var i = 0; i < activeFactions.length; i++) {
            controllers[i] = new GameController(unitManager, terrain, gui, terrainVis, camera, activeFactions[i])
        }

        /* Hack - wait a bit, it seems like the loading switchover can't keep up */
        window.setTimeout(function() {
            /* Activate the first controller */
            camera.centerOn({x: startCenters[0].site.x, y: startCenters[0].site.y});
            controllers[0].setActive(true);
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
