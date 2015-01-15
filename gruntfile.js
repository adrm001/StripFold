module.exports = function(grunt) {

    // configure the tasks
    grunt.initConfig({

        copy: {
            svgjs: {
                cwd:'svgjs/',
                src: '*.min.js',
                dest: 'publish/js/',
                expand: true
            },
            js: {
                src: 'js/*',
                dest: 'publish/',
                expand: true
            },
            media: {
                src: ['media/*','!media/*.db'],
                dest: 'publish/',
                expand: true
            },
            bootstrap:{
                cwd:'bootstrap-scr/dist',
                src: ['js/bootstrap.min.js','css/bootstrap.min.css','fonts/*'],
                dest:'publish',
                expand:true
            },
            html:{
                src: ['index.html','test.html','partials/*'],
                dest: 'publish/',
                expand: true
            }
        },

        clean: {
            publish: {
                src: [ 'publish' ]
            }
        },

        cssmin: {
            publish: {
                files: {
                    'publish/css/AM.min.css': [ 'css/*.css' ]
                }
            }
        },

        uglify: {
            build: {
                //options: {
                //    mangle: true
                //},
                files: {
                    'publish/js/AM.min.js': [ 'js/*.js' ]
                }
            }
        },
        //
        //jade: {
        //    compile: {
        //        options: {
        //            data: {}
        //        },
        //        files: [{
        //            expand: true,
        //            cwd: 'source',
        //            src: [ '**/*.jade' ],
        //            dest: 'build',
        //            ext: '.html'
        //        }]
        //    }
        //},
        //
        //watch: {
        //    stylesheets: {
        //        files: 'source/**/*.styl',
        //        tasks: [ 'stylesheets' ]
        //    },
        //    scripts: {
        //        files: 'source/**/*.coffee',
        //        tasks: [ 'scripts' ]
        //    },
        //    jade: {
        //        files: 'source/**/*.jade',
        //        tasks: [ 'jade' ]
        //    },
        //    copy: {
        //        files: [ 'source/**', '!source/**/*.styl', '!source/**/*.coffee', '!source/**/*.jade' ],
        //        tasks: [ 'copy' ]
        //    }
        //}

    });

    // load the tasks
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    //grunt.loadNpmTasks('grunt-contrib-stylus');
    //grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.loadNpmTasks('grunt-contrib-uglify');
    //grunt.loadNpmTasks('grunt-contrib-jade');
    //grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-contrib-connect');

    // define the tasks
    grunt.registerTask('compile-bootstrap', function() {
        var cb = this.async();
        grunt.util.spawn({
            grunt: true,
            args: ['dist'],
            opts: {
                cwd: 'bootstrap-scr'
            }
        }, function(error, result, code) {
            console.log(result.stdout);
            cb();
        });
    });
    //grunt.registerTask(
    //    'stylesheets',
    //    'Compiles the stylesheets.',
    //    [ 'stylus', 'autoprefixer', 'cssmin', 'clean:stylesheets' ]
    //);
    //
    //grunt.registerTask(
    //    'scripts',
    //    'Compiles the JavaScript files.',
    //    [ 'coffee', 'uglify', 'clean:scripts' ]
    //);
    //
    grunt.registerTask(
        'publish',
        'publishes the site to publish directory.',
        [ 'clean','compile-bootstrap', 'copy', 'cssmin', 'uglify' ]
    );
    grunt.registerTask(
        'debug',
        'quick publishes the site to publish directory.',
        [ 'copy', 'cssmin', 'uglify' ]
    );
    //
    //grunt.registerTask(
    //    'default',
    //    'Watches the project for changes, automatically builds them and runs a server.',
    //    [ 'build', 'connect', 'watch' ]
    //);
};