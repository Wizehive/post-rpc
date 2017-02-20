module.exports = function(grunt) {
    'use strict';

    // Load the plugins that provide the tasks we specified in package.json

    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        blanket_mocha: {
            options: {
                run: true,
                reporter: 'Min',
                threshold: 10,
                timeout: 3000
            },
            files: {
                src: 'test/*.html'
            }
        },
	    blanket: {
	        "data-cover-timeout": 3000
	    },
        karma: {
            options: {
                // Configuration options that tell Karma how to run
                configFile: 'karma.conf.js',

                files: [
                    // These files are probably going to be included in
                    // all our tests that we'd write. The files object in
                    // each individual karma target are added to these.
                    'node_modules/chai/chai.js',
                    'node_modules/sinon-chai/lib/sinon-chai.js',
                    'node_modules/sinon/pkg/sinon.js',

                    'test/fixtures.js',
                    'test/karma.js',
                    'test/polyfills.js',
                    'test/helpers.js',

                    // In our case, the test and src files are the
                    // same for the dev and prod targets so we can include
                    // them in the global files option here
                    'lib/PostRPC.Client.js',
                    'lib/PostRPC.Server.js',
                    'test/server.spec.js',
                    'test/client.spec.js',

                    // html2js preprocessor takes this file and coverts it
                    // to a string in our JS when the tests run.
                    'test/karma.html'
                ]

            },

            dev: {
                // On our local environment we want to test all the things!
                //browsers: ['Chrome', 'Firefox', 'PhantomJS']
                browsers: ['Chrome']
            },

            // For production, that is to say, our CI environment, we'll
            // run tests once in PhantomJS browser.
            prod: {
                singleRun: true,
                browsers: ['PhantomJS']
            }
        }
    });

    grunt.registerTask('default', ['blanket_mocha']);
};

