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

var path = require('path');
var gulp = require('gulp');
var wrench = require('wrench');

var files = [
  path.join(__dirname, 'src/angular-sync-module.js'),
  path.join(__dirname, 'src/angular-sync-modes.js'),
  path.join(__dirname, 'src/angular-sync-provider.js'),
  path.join(__dirname, 'src/angular-sync-timeout.js'),
  path.join(__dirname, 'src/angular-sync-history.js'),
  path.join(__dirname, 'src/angular-sync-strategies.js'),
  path.join(__dirname, 'src/angular-sync-interceptor.js'),
  path.join(__dirname, 'src/angular-sync-decorator.js')
];

var options = {
  root: __dirname,
  src: path.join(__dirname, 'src'),
  test: path.join(__dirname, 'test'),
  dist: path.join(__dirname, 'dist'),
  vendors: path.join(__dirname, 'vendors'),
  sample: path.join(__dirname, 'sample'),
  files: files
};

wrench.readdirSyncRecursive('./gulp').forEach(function(file) {
  require('./gulp/' + file)(options);
});

gulp.task('build', ['lint', 'minify', 'test-all']);
gulp.task('default', ['build']);
