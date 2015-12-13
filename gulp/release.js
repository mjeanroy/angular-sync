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
var git = require('gulp-git');
var bump = require('gulp-bump');
var gulpFilter = require('gulp-filter');
var tag_version = require('gulp-tag-version');

module.exports = function(options) {
  var isPackageJson = function(file) {
    return file.relative === 'package.json';
  };

  var isDist = function(file) {
    return file.relative === 'dist';
  };

  ['minor', 'major', 'patch'].forEach(function(level) {
    gulp.task('release:' + level, ['build', 'test-all'], function(done) {
      var packageJsonFilter = gulpFilter(isPackageJson, { restore: true });
      var distFilter = gulpFilter(isDist);

      var src = _.map(['package.json', 'bower.json', 'dist'], function(file) {
        return path.join(options.root, file)
      });

      return gulp.src(src)
        .pipe(bump({type: level}))
        .pipe(gulp.dest(options.root))
        .pipe(git.add({args: '-f'}))
        .pipe(git.commit('release: release version'))
        .pipe(packageJsonFilter)
        .pipe(tag_version())
        .pipe(packageJsonFilter.restore)
        .pipe(distFilter)
        .pipe(git.rm({args: '-r'}))
        .pipe(git.commit('release: start new release'));
    });
  });

  gulp.task('release', ['release:minor']);
};
