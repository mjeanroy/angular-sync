/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var _ = require('underscore');
var path = require('path');
var gulp = require('gulp');
var KarmaServer = require('karma').Server;

module.exports = function(options) {
  var vendors = [
    'angular%version%/angular.js',
    'angular-resource%version%/angular-resource.js',
    'angular-mocks%version%/angular-mocks.js'
  ];

  _.forEach(['1.2', '1.3', ''], function(version) {
    var suffix = version ? '-' + version : '';
    var vendorFiles = _.map(vendors, function(current) {
      return path.join(options.vendors, current.replace('%version%', suffix));
    });

    var karmaFiles = []
      .concat(vendorFiles)
      .concat(options.files)
      .concat(path.join(options.test, '/**/*.js'));

    var startKarma = function(singleRun, done) {
      var opts = {
        configFile: path.join(options.root, '/karma.conf.js'),
        files: karmaFiles
      };

      if (singleRun) {
        opts.singleRun = true;
        opts.browsers = ['PhantomJS'];
      }

      var karma = new KarmaServer(opts, function() {
        done();
      });

      karma.start();
    };

    gulp.task('tdd' + suffix, ['bower'], function(done) {
      startKarma(false, done);
    });

    gulp.task('test' + suffix, ['bower'], function(done) {
      startKarma(true, done);
    });
  });

  // Launch all tests.
  gulp.task('test-all', ['test-1.2', 'test-1.3', 'test']);
};

