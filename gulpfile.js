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

var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var taskListing = require('gulp-task-listing');
var uglify = require('gulp-uglify');
var wrap = require('gulp-wrap');
var strip = require('gulp-strip-comments');
var server = require('gulp-express');
var karma = require('karma').server;
var git = require('gulp-git');
var bump = require('gulp-bump');
var gulpFilter = require('gulp-filter');
var tag_version = require('gulp-tag-version');

var BUILD_FOLDER = 'dist';

gulp.task('help', taskListing);

var vendors = [
  'node_modules/angular/angular.js',
  'node_modules/angular-resource/angular-resource.js',
  'node_modules/angular-mocks/angular-mocks.js'
];

var files = [
  'src/angular-sync-module.js',
  'src/angular-sync-modes.js',
  'src/angular-sync-provider.js',
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

gulp.task('build', ['lint', 'minify', 'test']);

['minor', 'major', 'patch'].forEach(function(level) {
  gulp.task('release:' + level, ['build'], function(done) {
    var packageJsonFilter = gulpFilter(function(file) {
      return file.relative === 'package.json';
    });

    var distFilter = gulpFilter(function(file) {
      return file.relative === 'dist';
    });

    return gulp.src(['./package.json', './bower.json', './dist/'])
      .pipe(bump({type: level}))
      .pipe(gulp.dest('./'))
      .pipe(git.add({args: '-f'}))
      .pipe(git.commit('release: release version'))
      .pipe(packageJsonFilter)
      .pipe(tag_version())
      .pipe(packageJsonFilter.restore())
      .pipe(distFilter)
      .pipe(git.rm({args: '-r'}))
      .pipe(git.commit('release: start new release'));
  });
});

gulp.task('release', ['release:minor']);
gulp.task('default', ['build']);

gulp.task('server', ['minify'], function () {
  server.run(['sample/server.js']);

  gulp.watch(['src/**/*.js'], ['minify']);
  gulp.watch(['dist/**/*'], server.notify);
  gulp.watch(['sample/**/*'], server.notify);
});
