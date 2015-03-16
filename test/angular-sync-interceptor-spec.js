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

describe('AngularSyncInterceptor', function() {

  var AngularSyncInterceptor;
  var AngularSyncHistory;
  var $httpProvider;
  var $q;
  var promise;

  beforeEach(angular.mock.module('angularSync', function(_$httpProvider_) {
    $httpProvider = _$httpProvider_;
  }));

  beforeEach(inject(function(_AngularSyncInterceptor_, _AngularSyncHistory_, _$q_) {
    AngularSyncInterceptor = _AngularSyncInterceptor_;
    AngularSyncHistory = _AngularSyncHistory_;
    $q = _$q_;

    promise = jasmine.createSpy('promise');
    spyOn(AngularSyncHistory, 'add').and.callThrough();
    spyOn(AngularSyncHistory, 'remove').and.callThrough();
    spyOn($q, 'reject').and.returnValue(promise);
  }));

  it('should define interceptor in array of http interceptors', function() {
    expect($httpProvider.interceptors).toContain('AngularSyncInterceptor');
  });

  it('should add entry when request is triggered', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      config: config
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    AngularSyncInterceptor.request(config);

    expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
  });

  it('should prevent entry to be added and reject request if entry is already in progress', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      config: config
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    var r1 = AngularSyncInterceptor.request(config);

    expect(r1).toBe(config);
    expect(config.angularSync).toBeUndefined();
    expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect($q.reject).not.toHaveBeenCalled();

    AngularSyncHistory.add.calls.reset();

    var r2 = AngularSyncInterceptor.request(config);

    expect(r2).toBe(promise);
    expect(config.angularSync).toBe(true);
    expect(AngularSyncHistory.add).not.toHaveBeenCalled();
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect($q.reject).toHaveBeenCalled();
  });

  it('should remove entry when response is received', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      config: config
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    var r1 = AngularSyncInterceptor.request(config);

    expect(r1).toBe(config);
    expect(config.angularSync).toBeUndefined();
    expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect($q.reject).not.toHaveBeenCalled();

    var response = {
      config: config
    };

    var r2 = AngularSyncInterceptor.response(response);

    expect(r2).toBe(response);
    expect(AngularSyncHistory.contains(config)).toBe(false);
    expect(AngularSyncHistory.remove).toHaveBeenCalledWith(config);
  });

  it('should remove entry when response is received in error', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      config: config
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    var r1 = AngularSyncInterceptor.request(config);

    expect(r1).toBe(config);
    expect(config.angularSync).toBeUndefined();
    expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect($q.reject).not.toHaveBeenCalled();

    var rejection = {
      config: config
    };

    var r2 = AngularSyncInterceptor.responseError(rejection);

    expect(r2).toBe(promise);
    expect(AngularSyncHistory.contains(config)).toBe(false);
    expect(AngularSyncHistory.remove).toHaveBeenCalledWith(config);
  });

  it('should not remove entry when response is received in error with flag angularSync set to true', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      config: config
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    var r1 = AngularSyncInterceptor.request(config);

    expect(r1).toBe(config);
    expect(config.angularSync).toBeUndefined();
    expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect($q.reject).not.toHaveBeenCalled();

    config.angularSync = true;
    var rejection = {
      config: config
    };

    var r2 = AngularSyncInterceptor.responseError(rejection);

    expect(r2).toBe(promise);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect(AngularSyncHistory.remove).not.toHaveBeenCalled();
  });

  it('should not remove entry when response is received in error and config is the first parameter because of requestError interceptor', function() {
    var url = '/foo';
    var method = 'POST';
    var config = {
      url: url,
      config: config
    };

    expect(AngularSyncHistory.contains(config)).toBe(false);

    var r1 = AngularSyncInterceptor.request(config);

    expect(r1).toBe(config);
    expect(config.angularSync).toBeUndefined();
    expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect($q.reject).not.toHaveBeenCalled();

    config.angularSync = true;

    var r2 = AngularSyncInterceptor.responseError(config);

    expect(r2).toBe(promise);
    expect(AngularSyncHistory.contains(config)).toBe(true);
    expect(AngularSyncHistory.remove).not.toHaveBeenCalled();
  });
});