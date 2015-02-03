require.config({
  shim: {

  },
  paths: {
    crafty: "../bower_components/crafty/dist/crafty",
    jquery: "../bower_components/jquery/dist/jquery",
    require: "../bower_components/requirejs/require",
    simplify: "../bower_components/simplify-js/simplify",
    TiledMapBuilder: "../TiledMapBuilder/tiledmapbuilder",
    TiledMapMocks: "../TiledMapBuilder/create_mocks_module",
    util: "./Util"
  },
  packages: [

  ]
});

requirejs(['./game']);
