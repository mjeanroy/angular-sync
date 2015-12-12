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

describe('AngularSyncMode', function() {

  var AngularSyncProvider;
  var AngularSync;

  beforeEach(angular.mock.module('angularSync', function(_AngularSyncProvider_) {
    AngularSyncProvider = _AngularSyncProvider_;
  }));

  beforeEach(inject(function(_AngularSync_) {
    AngularSync = _AngularSync_;
  }));

  it('should use a default timeout', function() {
    expect(AngularSync.timeout()).toBe(-1);
  });

  it('should use a default mode for "GET" request', function() {
    expect(AngularSync.mode('get')).toBe('abort');
    expect(AngularSync.mode('GET')).toBe('abort');
  });

  it('should use a default mode for "POST" request', function() {
    expect(AngularSync.mode('post')).toBe('prevent');
    expect(AngularSync.mode('POST')).toBe('prevent');
  });

  it('should use a default mode for "PUT" request', function() {
    expect(AngularSync.mode('put')).toBe('prevent');
    expect(AngularSync.mode('PUT')).toBe('prevent');
  });

  it('should use a default mode for "PATCH" request', function() {
    expect(AngularSync.mode('patch')).toBe('prevent');
    expect(AngularSync.mode('PATCH')).toBe('prevent');
  });

  it('should use a default mode for "DELETE" request', function() {
    expect(AngularSync.mode('delete')).toBe('prevent');
    expect(AngularSync.mode('DELETE')).toBe('prevent');
  });

  it('should update timeout value', function() {
    AngularSyncProvider.timeout(10);
    expect(AngularSync.timeout()).toBe(10);
  });

  it('should update mode for "GET" request', function() {
    AngularSyncProvider.mode('get', 'force');
    expect(AngularSync.mode('get')).toBe('force');
    expect(AngularSync.mode('GET')).toBe('force');

    AngularSyncProvider.mode('GET', 'prevent');
    expect(AngularSync.mode('get')).toBe('prevent');
    expect(AngularSync.mode('GET')).toBe('prevent');
  });

  it('should update mode for "POST" request', function() {
    AngularSyncProvider.mode('post', 'force');
    expect(AngularSync.mode('post')).toBe('force');
    expect(AngularSync.mode('POST')).toBe('force');

    AngularSyncProvider.mode('POST', 'prevent');
    expect(AngularSync.mode('post')).toBe('prevent');
    expect(AngularSync.mode('POST')).toBe('prevent');
  });

  it('should update mode for "PUT" request', function() {
    AngularSyncProvider.mode('put', 'force');
    expect(AngularSync.mode('put')).toBe('force');
    expect(AngularSync.mode('PUT')).toBe('force');

    AngularSyncProvider.mode('PUT', 'prevent');
    expect(AngularSync.mode('put')).toBe('prevent');
    expect(AngularSync.mode('PUT')).toBe('prevent');
  });

  it('should update mode for "PATCH" request', function() {
    AngularSyncProvider.mode('patch', 'force');
    expect(AngularSync.mode('patch')).toBe('force');
    expect(AngularSync.mode('PATCH')).toBe('force');

    AngularSyncProvider.mode('PATCH', 'prevent');
    expect(AngularSync.mode('patch')).toBe('prevent');
    expect(AngularSync.mode('PATCH')).toBe('prevent');
  });

  it('should update mode for "DELETE" request', function() {
    AngularSyncProvider.mode('delete', 'force');
    expect(AngularSync.mode('delete')).toBe('force');
    expect(AngularSync.mode('DELETE')).toBe('force');

    AngularSyncProvider.mode('DELETE', 'prevent');
    expect(AngularSync.mode('delete')).toBe('prevent');
    expect(AngularSync.mode('DELETE')).toBe('prevent');
  });

  it('should update mode for "GET" request', function() {
    expect(function() {
      AngularSyncProvider.mode('get', 'foo');
    }).toThrow(new Error('Mode "foo" is not valid'));
  });

  it('should prevent error by default', function() {
    expect(AngularSync.preventError()).toBe(true);
    AngularSyncProvider.allowError();
    expect(AngularSync.preventError()).toBe(false);
  });
});