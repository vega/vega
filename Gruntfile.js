module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    requirejs: {
      compile: {
        options: {
          baseUrl: "src",
          out: "vega2.js",
          name: "../node_modules/almond/almond",
          include: ["parse/spec"],
          wrap: {
              startFile: "src/_start.js",
              endFile: "src/_end.js"
          },
          optimize: "none",
          paths: {
            d3: "../node_modules/d3/d3.min",
            topojson: "../node_modules/vega/node_modules/topojson/topojson.min",
            "js-priority-queue": "../node_modules/js-priority-queue/priority-queue"
          },
          exclude: ["d3", "topojson"]
        }
      },
    },

    uglify: {
      build: {
        src: "vega2.js",
        dest: "vega2.min.js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("default", ["requirejs", "uglify"]);
};