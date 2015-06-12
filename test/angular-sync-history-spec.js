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
      method: method,
      ngSync: {
        id: url
      }
    };

    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);

    AngularSyncHistory.add(config);
    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
  });

  it('should add two request with same url and method', function() {
    var url = '/foo';
    var method = 'POST';

    var config1 = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    var config2 = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    expect(AngularSyncHistory.contains(config1.url, config1.method)).toBe(false);
    expect(AngularSyncHistory.contains(config2.url, config2.method)).toBe(false);

    AngularSyncHistory.add(config1);
    AngularSyncHistory.add(config2);

    expect(AngularSyncHistory.contains(config1.url, config1.method)).toBe(true);
    expect(AngularSyncHistory.contains(config2.url, config2.method)).toBe(true);
  });

  it('should get pending requests', function() {
    var url = '/foo';
    var method = 'POST';

    var config1 = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    var config2 = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    AngularSyncHistory.add(config1);
    AngularSyncHistory.add(config2);

    expect(AngularSyncHistory.pendings(config1.url, config1.method)).toEqual([
      { config: config1, timestamp: jasmine.any(Number) },
      { config: config2, timestamp: jasmine.any(Number) }
    ]);
  });

  it('should remove url with method', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);

    AngularSyncHistory.add(config);
    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

    AngularSyncHistory.remove(config);
    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);
  });

  it('should clear all url with method', function() {
    var url = '/foo';
    var method = 'POST';

    var config1 = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    var config2 = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    expect(AngularSyncHistory.contains(config1)).toBe(false);
    expect(AngularSyncHistory.contains(config2)).toBe(false);

    AngularSyncHistory.add(config1);
    AngularSyncHistory.add(config2);
    expect(AngularSyncHistory.contains(config1.url, config1.method)).toBe(true);
    expect(AngularSyncHistory.contains(config2.url, config2.method)).toBe(true);

    AngularSyncHistory.clear(config1.url, config1.method);
    expect(AngularSyncHistory.contains(config1.url, config1.method)).toBe(false);
    expect(AngularSyncHistory.contains(config2.url, config2.method)).toBe(false);
  });

  it('should not contain entry if entry is outdated', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      method: method,
      ngSync: {
        id: url
      }
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    AngularSyncHistory.add(config);

    AngularSyncTimeout.isOutdated.and.returnValue(false);
    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

    AngularSyncTimeout.isOutdated.and.returnValue(true);
    expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);
  });
});