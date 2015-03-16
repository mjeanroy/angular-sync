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

describe('AngularSyncTimeout', function() {

  var AngularSyncHistory;
  var AngularSyncTimeout;

  beforeEach(angular.mock.module('angularSync'));

  beforeEach(inject(function(_AngularSyncHistory_, _AngularSyncTimeout_) {
    AngularSyncHistory = _AngularSyncHistory_;
    AngularSyncTimeout = _AngularSyncTimeout_;

    spyOn(AngularSyncTimeout, 'isOutdated').and.returnValue(false);
  }));

  it('should add url with method', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      method: method
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    AngularSyncHistory.add(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
  });

  it('should remove url with method', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      method: method
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    AngularSyncHistory.add(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);

    AngularSyncHistory.remove(config);
    expect(AngularSyncHistory.contains(config)).toBe(false);
  });

  it('should not contain entry if entry is outdated', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      method: method
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    AngularSyncHistory.add(config);

    AngularSyncTimeout.isOutdated.and.returnValue(false);
    expect(AngularSyncHistory.contains(config)).toBe(true);

    AngularSyncTimeout.isOutdated.and.returnValue(true);
    expect(AngularSyncHistory.contains(config)).toBe(false);
  });
});