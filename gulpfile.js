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

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Mickael Jeanroy, Cedric Nisio
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

var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var taskListing = require('gulp-task-listing');
var uglify = require('gulp-uglify');
var wrap = require('gulp-wrap');
var strip = require('gulp-strip-comments');
var karma = require('karma').server;

var BUILD_FOLDER = 'dist';

gulp.task('help', taskListing);

var vendors = [
  'node_modules/angular/angular.js',
  'node_modules/angular-mocks/angular-mocks.js'
];

var files = [
  'src/angular-sync-module.js',
  'src/angular-sync-timeout.js',
  'src/angular-sync-history.js',
  'src/angular-sync-interceptor.js'
];

var karmaFiles = vendors
  .concat(files)
  .concat('test/**/*.js');

gulp.task('lint', function() {
  return gulp.src("src/**/*.js")
    .pipe(jshint())
    .pipe(jshint.reporter("default"));
});

gulp.task('minify', function(done) {
  return gulp.src(files)
    .pipe(concat('angular-sync.js'))
    .pipe(strip({ block: true }))
    .pipe(wrap({src: 'wrapper.js'}))
    .pipe(gulp.dest(BUILD_FOLDER))
    .pipe(uglify())
    .pipe(rename('angular-sync.min.js'))
    .pipe(gulp.dest(BUILD_FOLDER));;
});

gulp.task('tdd', function(done) {
  var options = {
    configFile: __dirname + '/karma.conf.js',
    files: karmaFiles
  };

  var onDone = function() {
    done();
  };

  karma.start(options, onDone);
});

gulp.task('test', function(done) {
  var options = {
    configFile: __dirname + '/karma.conf.js',
    files: karmaFiles,
    singleRun: true,
    browsers: ['PhantomJS']
  };

  var onDone = function() {
    done();
  };

  karma.start(options, onDone);
});

gulp.task('build', ['lint', 'minify']);
gulp.task('default', ['build']);