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

  var AngularSyncProvider;
  var AngularSyncTimeout;

  beforeEach(angular.mock.module('angularSync', function(_AngularSyncProvider_) {
    AngularSyncProvider =  _AngularSyncProvider_;
  }));

  beforeEach(inject(function(_AngularSyncTimeout_) {
    AngularSyncTimeout = _AngularSyncTimeout_;
  }));

  it('should check that two timestamp are never outdated if timeout is less than zero', function() {
    var t1 = new Date().getTime();
    var t2 = t1 + 10;

    expect(AngularSyncTimeout.isOutdated(t1, t2)).toBe(false);
    expect(AngularSyncTimeout.isOutdated(t2, t1)).toBe(false);
  });

  it('should check that two timestamp are never outdated if timeout is zero', function() {
    AngularSyncProvider.timeout(0);
    var t1 = new Date().getTime();
    var t2 = t1 + 10;

    expect(AngularSyncTimeout.isOutdated(t1, t2)).toBe(false);
    expect(AngularSyncTimeout.isOutdated(t2, t1)).toBe(false);
  });
 
  it('should check that two timestamp are outdated if timeout is set to positive value', function() {
    AngularSyncProvider.timeout(10);
    var t1 = new Date().getTime();
    var t2 = t1 + 10;

    expect(AngularSyncTimeout.isOutdated(t1, t2 - 1)).toBe(false);
    expect(AngularSyncTimeout.isOutdated(t1, t2)).toBe(true);
    expect(AngularSyncTimeout.isOutdated(t2, t1)).toBe(true);
    expect(AngularSyncTimeout.isOutdated(t1, t2 + 1)).toBe(true);
  });
});