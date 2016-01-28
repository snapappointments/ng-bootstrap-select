module.exports = function (grunt) {
  var env = process.env.CI ? 'continuous' : 'unit';

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    readme: 'README.md',
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
            ' * ng-bootstrap-select v<%= pkg.version %>\n' +
            ' *\n' +
            ' * Licensed under <%= pkg.license %>\n' +
            ' */\n',
    karma: {
      options: {
        configFile: 'test/karma.conf.js'
      },
      unit: {
      },
      continuous: {
        browsers: ['PhantomJS'],
        autoWatch: false,
        singleRun: true
      }
    },
    uglify: {
      build: {
        files: {
          'build/<%= pkg.name %>.min.js': ['src/<%= pkg.name %>.js']
        }
      }
    },
    copy: {
      build: {
        files: [
          { expand: true, flatten: true, src: ['src/**'], dest: 'build/', filter: 'isFile' }
        ]
      },
      demo: {
        options: {
          processContent: (function (content) {
            return grunt.template.process(content);
          })
        },
        files: [
          { src: ['demo/**'], dest: '.tmp/' }
        ]
      }
    },
    clean: {
      build: {
        src: ['build']
      }
    },
    usebanner: {
      js: {
        options: {
          banner: '<%= banner %>'
        },
        src: [
          'build/<%= pkg.name %>.js',
          'build/<%= pkg.name %>.min.js'
        ]
      }
    },
  });

  grunt.registerTask('test', ['karma:' + env]);
  grunt.registerTask('dist', ['clean:build', 'uglify', 'copy:build', 'usebanner:js']);
  grunt.registerTask('default', ['test']);
};
