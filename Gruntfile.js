module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    requirejs: {
      compile: {
        options: {
          baseUrl: "src",
          paths: {
            d3: "../node_modules/d3/d3.min",
            topojson: "../node_modules/topojson/topojson.min"
          },
          include: ["../node_modules/almond/almond", "parse/spec"],
          exclude: ["d3", "topojson"],
          out: "vega2.js",
          wrap: {
              startFile: "src/_start.js",
              endFile: "src/_end.js"
          },
          optimize: "none"
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          require: ["d3", "amd-loader"],
          reporter: "spec",
        },
        src: ["test/**/*.js"]
      }
    },

    uglify: {
      build: {
        src: "vega2.js",
        dest: "vega2.min.js"
      }
    },

    watch: {
      src: {
        files: ["src/**/*.js"],
        tasks: ["build"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-mocha-test");

  grunt.registerTask("default", ["test", "build"]);
  grunt.registerTask("build", ["requirejs", "uglify"]);
  grunt.registerTask("test", ["mochaTest"]);
};
