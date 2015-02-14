require.config({
  shim: {

  },
  paths: {
    crafty: "../bower_components/crafty/dist/crafty",
    jquery: "../bower_components/jquery/dist/jquery",
    require: "../bower_components/requirejs/require",
    simplify: "../bower_components/simplify-js/simplify",
    seedrandom: "../bower_components/seedrandom/seedrandom",
    voronoi: "../bower_components/Javascript-Voronoi/rhill-voronoi-core",
    noise: "../bower_components/noisejs/index",
    prioq: "../bower_components/js-priority-queue/priority-queue",
  },
  packages: [

  ]
});

requirejs(['./game']);
