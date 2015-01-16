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
            topojson: "../node_modules/topojson/topojson.min"
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
    },

    watch: {
      src: {
        files: ['src/**/*.js'],
        tasks: ['requirejs:compile', 'uglify']
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", ["requirejs", "uglify"]);
};
