module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            doing: {
                src: 'build'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            doing: {
                files: [
                    {src: 'src/<%= pkg.name %>.js', dest: 'build/js/<%= pkg.name %>.min.js'}
                ]
            }
        },
        cssmin : {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            doing : {
                files: [
                    {src: 'src/<%= pkg.name %>.css', dest: 'build/css/<%= pkg.name %>.min.css'}
                ]
            }
        },
        copy : {
            doing : {
                files: [
                    {src: ['src/*.js'], dest: 'build/js/', flatten: true, expand: true},
                    {src: ['src/*.css'], dest: 'build/css/', flatten: true, expand: true}
                ]
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default tasks
    grunt.registerTask('default', ['clean', 'uglify', 'cssmin', 'copy']);

};