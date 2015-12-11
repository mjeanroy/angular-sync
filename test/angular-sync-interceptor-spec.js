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
  var AngularSyncStrategies;
  var $httpProvider;
  var $q;
  var $timeout;

  beforeEach(angular.mock.module('angularSync', function(_$httpProvider_) {
    $httpProvider = _$httpProvider_;
  }));

  beforeEach(inject(function(_AngularSyncInterceptor_, _AngularSyncHistory_, _AngularSyncStrategies_, _$q_, _$timeout_) {
    AngularSyncInterceptor = _AngularSyncInterceptor_;
    AngularSyncHistory = _AngularSyncHistory_;
    AngularSyncStrategies = _AngularSyncStrategies_;

    $timeout = _$timeout_;
    $q = _$q_;

    spyOn(AngularSyncStrategies, 'abort').and.callThrough();
    spyOn(AngularSyncStrategies, 'prevent').and.callThrough();
    spyOn(AngularSyncStrategies, 'force').and.callThrough();
    spyOn(AngularSyncHistory, 'remove').and.callThrough();
  }));

  it('should define interceptor in array of http interceptors', function() {
    expect($httpProvider.interceptors).toContain('AngularSyncInterceptor');
  });

  describe('interceptor', function() {
    var config;
    var deferred;
    var promise;

    beforeEach(function() {
      config = {
        url: '/foo',
        method: 'GET'
      };

      promise = jasmine.createSpyObj('promise', ['then']);
      deferred = {
        promise: promise,
        resolve: jasmine.createSpy('resolve'),
        reject: jasmine.createSpy('reject')
      };

      spyOn($q, 'defer').and.returnValue(deferred);
    });

    it('should abort previous GET request by default', function() {
      var result = AngularSyncInterceptor.request(config);

      expect(result).toBeDefined();
      expect(result).toBe(config);

      expect(config.timeout).toBe(promise);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync).toEqual({
        id: '/foo',
        mode: 'abort',
        $q: deferred
      });

      expect(AngularSyncStrategies.abort).toHaveBeenCalledWith(config);
    });

    it('should not override ngSync id', function() {
      config.ngSync = {
        id: 'foobar'
      };

      var result = AngularSyncInterceptor.request(config);

      expect(result).toBeDefined();
      expect(result).toBe(config);

      expect(config.timeout).toBe(promise);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync).toEqual({
        id: 'foobar',
        mode: 'abort',
        $q: deferred
      });

      expect(AngularSyncStrategies.abort).toHaveBeenCalledWith(config);
    });

    it('should not override ngSync mode', function() {
      config.ngSync = {
        mode: 'prevent'
      };

      var result = AngularSyncInterceptor.request(config);

      expect(result).toBeDefined();
      expect(result).toBe(config);

      expect(config.timeout).toBe(promise);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync).toEqual({
        id: '/foo',
        mode: 'prevent',
        $q: deferred
      });

      expect(AngularSyncStrategies.prevent).toHaveBeenCalledWith(config);
    });

    it('should store original timeout promise', function() {
      var timeout = jasmine.createSpyObj('timeout', ['then']);

      // Extend configuration
      angular.extend(config, {
        timeout: timeout
      });

      AngularSyncInterceptor.request(config);

      expect(config.timeout).toBeDefined();
      expect(config.timeout).not.toBe(timeout);
      expect(config.ngSync).toEqual({
        id: '/foo',
        mode: 'abort',
        $q: deferred,
        $timeout: timeout
      });

      expect(timeout.then).toHaveBeenCalledWith(deferred.resolve);
    });

    it('should store original timeout value', function() {
      angular.extend(config, {
        timeout: 500
      });

      AngularSyncInterceptor.request(config);

      expect(config.timeout).toBeDefined();
      expect(config.timeout).not.toBe(500);
      expect(config.ngSync).toEqual(jasmine.objectContaining({
        id: '/foo',
        mode: 'abort',
        $q: deferred,
        $timeout: jasmine.objectContaining({
          $$timeoutId: jasmine.any(Number)
        })
      }));

      expect(deferred.resolve).not.toHaveBeenCalled();
      $timeout.flush();
      expect(deferred.resolve).toHaveBeenCalled();
    });

    it('should trigger response', function() {
      spyOn($timeout, 'cancel');

      var deferred = jasmine.createSpyObj('deferred', ['resolve', 'reject']);
      var timeout = jasmine.createSpyObj('promise', ['then']);

      config.ngSync = {
        id: '/foo',
        mode: 'prevent',
        $q: deferred,
        $timeout: timeout
      };

      var response = {
        config: config
      };

      var result = AngularSyncInterceptor.response(response);

      expect(result).toBe(response);
      expect(AngularSyncHistory.remove).toHaveBeenCalledWith(config);
      expect(config.$timeout).not.toBeDefined();
      expect(config.$q).not.toBeDefined();

      expect(deferred.reject).toHaveBeenCalled();
      expect($timeout.cancel).toHaveBeenCalledWith(timeout);
    });

    it('should trigger response error', function() {
      var retValue = jasmine.createSpyObj('rejection', ['then']);
      spyOn($timeout, 'cancel');
      spyOn($q, 'reject').and.returnValue(retValue);

      var deferred = jasmine.createSpyObj('deferred', ['resolve', 'reject']);
      var timeout = jasmine.createSpyObj('promise', ['then']);

      config.ngSync = {
        id: '/foo',
        mode: 'prevent',
        $q: deferred,
        $timeout: timeout
      };

      var rejection = {
        config: config
      };

      var result = AngularSyncInterceptor.responseError(rejection);

      expect(result).toBe(retValue);
      expect(AngularSyncHistory.remove).toHaveBeenCalledWith(config);
      expect(config.$timeout).not.toBeDefined();
      expect(config.$q).not.toBeDefined();

      expect(deferred.reject).toHaveBeenCalled();
      expect($timeout.cancel).toHaveBeenCalledWith(timeout);
    });
  });
});
