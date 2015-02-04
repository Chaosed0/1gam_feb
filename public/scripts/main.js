require.config({
  shim: {

  },
  paths: {
    crafty: "../bower_components/crafty/dist/crafty",
    jquery: "../bower_components/jquery/dist/jquery",
    require: "../bower_components/requirejs/require",
    simplify: "../bower_components/simplify-js/simplify",
    voronoi: "../bower_components/Javascript-Voronoi/rhill-voronoi-core",
    noise: "../bower_components/noisejs/index",
    util: "./Util"
  },
  packages: [

  ]
});

requirejs(['./game']);
