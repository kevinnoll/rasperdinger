module.exports = function(grunt) {

  grunt.initConfig({
    wiredep: {
      task: {
        src: [
          'index.html'
        ]
      }
    },
    watch: {
       files: ['**/*.html','**/*.js','**/*.css']
    },
    connect: {
      server: {
        options: {
            hostname: '*',
            open: {
                target: 'http://127.0.0.1:80'
            },
            port: 80,
            useAvailablePort: true
        }
      }

      /*server: {
        options: {
          port: 80,
          hostname: '192.168.178.36',
          base: '.',
          open: true
        }

      }*/
    }
  });
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('serve', [
    'wiredep',
    'connect',
    'watch'
  ]);

};