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
  var $rootScope;
  var $timeout;
  var $q;
  var $http;
  var $resource;
  var $httpBackend;

  var promise;

  beforeEach(angular.mock.module('ngResource'));
  beforeEach(angular.mock.module('angularSync', function(_$httpProvider_) {
    $httpProvider = _$httpProvider_;
  }));

  beforeEach(inject(function(_AngularSyncInterceptor_, _AngularSyncHistory_, _$rootScope_, _$q_, _$timeout_, _$http_, _$resource_, _$httpBackend_) {
    AngularSyncInterceptor = _AngularSyncInterceptor_;
    AngularSyncHistory = _AngularSyncHistory_;

    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $q = _$q_;
    $http = _$http_;
    $resource = _$resource_;
    $httpBackend = _$httpBackend_;

    promise = jasmine.createSpy('promise');
    spyOn(AngularSyncHistory, 'add').and.callThrough();
    spyOn(AngularSyncHistory, 'remove').and.callThrough();
    spyOn($q, 'defer').and.callThrough();
    spyOn($q, 'reject').and.callThrough();
  }));

  it('should define interceptor in array of http interceptors', function() {
    expect($httpProvider.interceptors).toContain('AngularSyncInterceptor');
  });

  describe('interceptor', function() {
    var config;
    var response;
    var rejection;
    var reject;

    beforeEach(function() {
      config = {
        url: '/foo',
        method: 'POST',
        ngSync: {
          id: '/foo'
        }
      };

      response = { config: config };
      rejection = { config: config };

      reject = jasmine.createSpy();
      $q.reject.and.returnValue(reject);

      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);
    });

    it('should add entry when request is triggered', function() {
      AngularSyncInterceptor.request(config);

      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      expect(config.timeout).toBeDefined();
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.$q).toBeDefined();
      expect(config.ngSync.$promise).toBeDefined();
      expect(config.ngSync.$timeout).not.toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
    });

    it('should add entry using url instead of id if id does not exist', function() {
      config.ngSync = undefined;

      AngularSyncInterceptor.request(config);

      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      expect(config.timeout).toBeDefined();
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.$q).toBeDefined();
      expect(config.ngSync.$promise).toBeDefined();
      expect(config.ngSync.$timeout).not.toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
    });

    it('should keep original timeout', function() {
      var deferred = $q.defer();
      var timeout = deferred.promise;

      config.timeout = timeout;

      AngularSyncInterceptor.request(config);

      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      expect(config.timeout).toBeDefined();
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.$q).toBeDefined();
      expect(config.ngSync.$promise).toBeDefined();
      expect(config.ngSync.$timeout).toBe(timeout);
      expect(config.ngSync.preventError).toBeFalsy();
    });

    it('should cancel request if original timeout is resolved', function() {
      var deferred = $q.defer();
      var timeout = deferred.promise;

      config.timeout = timeout;

      AngularSyncInterceptor.request(config);

      expect(config.timeout).toBeDefined();
      expect(config.timeout).not.toBe(timeout);

      var newTimeout = config.timeout;
      var callback = jasmine.createSpy('callback');
      newTimeout.then(callback);

      deferred.resolve();
      $rootScope.$apply();

      expect(callback).toHaveBeenCalled();
    });

    it('should cancel request if original timeout is reached', function() {
      var timeout = 500;
      config.timeout = timeout;

      AngularSyncInterceptor.request(config);

      expect(config.timeout).toBeDefined();
      expect(config.timeout).not.toBe(timeout);

      var newTimeout = config.timeout;
      var callback = jasmine.createSpy('callback');
      newTimeout.then(callback);

      // When $timeout is flush, then new timeout promise should
      // have been resolved
      $timeout.flush();

      $rootScope.$apply();
      expect(callback).toHaveBeenCalled();
    });

    it('should cancel timeout task if new timeout is reached', function() {
      spyOn($timeout, 'cancel').and.callThrough();

      var timeout = 500;
      config.timeout = timeout;

      AngularSyncInterceptor.request(config);

      expect(config.timeout).toBeDefined();
      expect(config.timeout).not.toBe(timeout);
      expect($timeout.cancel).not.toHaveBeenCalled();

      var newTimeout = config.timeout;
      var callback = jasmine.createSpy('callback');
      newTimeout.then(callback);

      // When $timeout is flush, then new timeout promise should
      // have been resolved
      $timeout.flush();

      $rootScope.$apply();
      expect(callback).toHaveBeenCalled();
    });

    it('should remove entry when response is received', function() {
      var r1 = AngularSyncInterceptor.request(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      var r2 = AngularSyncInterceptor.response(response);
      expect(r2).toBe(response);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);
      expect(AngularSyncHistory.remove).toHaveBeenCalledWith(config);
    });

    it('should remove entry when response is received in error', function() {
      AngularSyncInterceptor.request(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      var r = AngularSyncInterceptor.responseError(rejection);

      expect(r).toBe(reject);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(false);
      expect(AngularSyncHistory.remove).toHaveBeenCalledWith(config);
    });

    it('should not remove pendings config if new request is prevented', function() {
      var c1 = angular.copy(config);
      var c2 = angular.copy(config);

      AngularSyncInterceptor.request(c1);
      AngularSyncInterceptor.request(c2);

      expect(AngularSyncHistory.contains(c1.url, c1.method)).toBe(true);
      expect(AngularSyncHistory.pendings(c1.url, c1.method).length).toBe(1);
      expect(AngularSyncHistory.pendings(c1.url, c1.method)).toEqual([
        { timestamp: jasmine.any(Number), config: c1 }
      ]);

      var r1 = {
        config: c1
      };

      var r2 = {
        config: c2
      };

      var r = AngularSyncInterceptor.responseError(r2);

      expect(r).toBe(reject);
      expect(AngularSyncHistory.contains(c1.url, c1.method)).toBe(true);
      expect(AngularSyncHistory.pendings(c1.url, c1.method).length).toBe(1);
      expect(AngularSyncHistory.pendings(c1.url, c1.method)).toEqual([
        { timestamp: jasmine.any(Number), config: c1 }
      ]);
    });

    it('should not remove entry when response is received in error and config is the first parameter because of requestError interceptor', function() {
      var r1 = AngularSyncInterceptor.request(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      var r2 = AngularSyncInterceptor.responseError(angular.copy(config));

      expect(r2).toBe(reject);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect(AngularSyncHistory.pendings(config.url, config.method).length).toBe(1);
      expect(AngularSyncHistory.pendings(config.url, config.method)).toEqual([
        { timestamp: jasmine.any(Number), config: config }
      ]);
    });
  });

  describe('interceptor mode', function() {
    var config;
    var reject;

    beforeEach(function() {
      config = { url: '/foo', method: 'POST' };

      reject = jasmine.createSpy();
      $q.reject.and.returnValue(reject);

      expect(AngularSyncHistory.contains(config)).toBe(false);
    });

    it('should prevent two POST requests', function() {
      config.method = 'POST';

      var r1 = AngularSyncInterceptor.request(config);

      expect(r1).toBe(config);
      expect(config.angularSync).toBeUndefined();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).not.toHaveBeenCalled();

      AngularSyncHistory.add.calls.reset();

      var r2 = AngularSyncInterceptor.request(config);

      expect(r2).toBe(reject);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeTruthy();
      expect(AngularSyncHistory.add).not.toHaveBeenCalled();
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).toHaveBeenCalled();
    });

    it('should abort previous GET requests', function() {
      config.method = 'GET';

      var r1 = AngularSyncInterceptor.request(config);

      expect(r1).toBe(config);
      expect(config.timeout).toBeDefined();
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);

      spyOn(config.ngSync.$q, 'resolve');

      var newConfig = angular.copy(config);
      var r2 = AngularSyncInterceptor.request(newConfig);

      expect(r2).toBe(newConfig);
      expect(config.ngSync.$q.resolve).toHaveBeenCalled();
      expect(config.ngSync.preventError).toBe(true);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect(AngularSyncHistory.pendings(config.url, config.method)).toEqual([
        { timestamp: jasmine.any(Number), config: newConfig }
      ]);
    });

    it('should prevent two PUT requests', function() {
      config.method = 'PUT';

      var r1 = AngularSyncInterceptor.request(config);

      expect(r1).toBe(config);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).not.toHaveBeenCalled();

      AngularSyncHistory.add.calls.reset();

      var r2 = AngularSyncInterceptor.request(config);

      expect(r2).toBe(reject);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeTruthy();
      expect(AngularSyncHistory.add).not.toHaveBeenCalled();
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).toHaveBeenCalled();
    });

    it('should prevent two PATCH requests', function() {
      config.method = 'PATCH';

      var r1 = AngularSyncInterceptor.request(config);

      expect(r1).toBe(config);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).not.toHaveBeenCalled();

      AngularSyncHistory.add.calls.reset();

      var r2 = AngularSyncInterceptor.request(config);

      expect(r2).toBe(reject);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeTruthy();
      expect(AngularSyncHistory.add).not.toHaveBeenCalled();
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).toHaveBeenCalled();
    });

    it('should prevent two DELETE requests', function() {
      config.method = 'DELETE';

      var r1 = AngularSyncInterceptor.request(config);

      expect(r1).toBe(config);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).not.toHaveBeenCalled();

      AngularSyncHistory.add.calls.reset();

      var r2 = AngularSyncInterceptor.request(config);

      expect(r2).toBe(reject);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeTruthy();
      expect(AngularSyncHistory.add).not.toHaveBeenCalled();
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect($q.reject).toHaveBeenCalled();
    });

    it('should force two GET requests if mode is explicitly set', function() {
      config.method = 'GET';
      config.ngSync = {
        mode: 'force'
      };

      var r1 = AngularSyncInterceptor.request(config);

      expect(r1).toBe(config);
      expect(config.ngSync).toBeDefined();
      expect(config.ngSync.preventError).toBeFalsy();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect(AngularSyncHistory.pendings(config.url, config.method)).toEqual([
        { timestamp: jasmine.any(Number), config: config }
      ]);

      AngularSyncHistory.add.calls.reset();

      var newConfig = angular.copy(config);
      var r2 = AngularSyncInterceptor.request(newConfig);

      expect(r2).toBe(newConfig);
      expect(newConfig.ngSync).toBeDefined();
      expect(newConfig.ngSync.preventError).toBeFalsy();
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(newConfig);
      expect(AngularSyncHistory.contains(config.url, config.method)).toBe(true);
      expect(AngularSyncHistory.pendings(config.url, config.method)).toEqual([
        { timestamp: jasmine.any(Number), config: config },
        { timestamp: jasmine.any(Number), config: newConfig }
      ]);
    });
  });

  describe('using $http', function() {
    var onSuccess;
    var onError;
    var config;

    beforeEach(function() {
      onSuccess = jasmine.createSpy('success');
      onError = jasmine.createSpy('error');
      config = { url: 'foo', method: 'POST' };

      $q.reject.and.callThrough();
    });
  
    it('should define shortcut methods', function() {
      expect(angular.isFunction($http.get)).toBe(true);
      expect(angular.isFunction($http.post)).toBe(true);
      expect(angular.isFunction($http.put)).toBe(true);
      expect(angular.isFunction($http['delete'])).toBe(true);
      expect(angular.isFunction($http.patch)).toBe(true);
    });

    it('should not trigger request response twice', function() {
      $httpBackend.expectPOST(config.url).respond(201);

      $http(config).success(onSuccess).error(onError);
      $http(config).success(onSuccess).error(onError);

      $httpBackend.flush();

      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.calls.count()).toBe(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should not trigger request response twice with $resource', function() {
      $httpBackend.expectPOST(config.url).respond(201);

      $resource(config.url).save(onSuccess, onError);
      $resource(config.url).save(onSuccess, onError);

      $httpBackend.flush();

      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.calls.count()).toBe(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should not trigger request response error twice', function() {
      $httpBackend.expectPOST(config.url).respond(400);

      $http(angular.copy(config)).success(onSuccess).error(onError);
      $http(angular.copy(config)).success(onSuccess).error(onError);

      $httpBackend.flush();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      expect(onError.calls.count()).toBe(1);
    });

    it('should trigger POST request using shortcut method', function() {
      $httpBackend.expectPOST(config.url).respond(400);

      $http.post(config.url).success(onSuccess).error(onError);
      $http.post(config.url).success(onSuccess).error(onError);

      $httpBackend.flush();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      expect(onError.calls.count()).toBe(1);
    });

    it('should trigger two POST request if it is different requests', function() {
      var config1 = angular.copy(config);
      var config2 = angular.extend(config, {
        url: config.url + '/bar',
      });

      $httpBackend.expectPOST(config1.url).respond(200);
      $httpBackend.expectPOST(config2.url).respond(200);

      $http.post(config1.url).success(onSuccess).error(onError);
      $http.post(config2.url).success(onSuccess).error(onError);

      $httpBackend.flush();

      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.calls.count()).toBe(2);
      expect(onError).not.toHaveBeenCalled();
    });
  });
});