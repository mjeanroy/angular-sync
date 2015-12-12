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

  var $rootScope;
  var $timeout;
  var $q;
  var $http;
  var $resource;
  var $httpBackend;

  beforeEach(angular.mock.module('ngResource'));
  beforeEach(angular.mock.module('angularSync'));

  beforeEach(inject(function(_$rootScope_, _$timeout_, _$q_, _$http_, _$resource_, _$httpBackend_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    $timeout = _$timeout_;
    $http = _$http_;
    $resource = _$resource_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
     $httpBackend.verifyNoOutstandingExpectation();
     $httpBackend.verifyNoOutstandingRequest();
   });

  it('should abort previous GET request', function() {
    var config = {
      url: '/foo',
      method: 'GET'
    };

    $httpBackend.whenGET('/foo').respond(201);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');

    $rootScope.$apply(function() {
      $http(config).then(onSuccess1, onError1);
    });

    // Trigger second request
    var onSuccess2 = jasmine.createSpy('onSuccess2');
    var onError2 = jasmine.createSpy('onError2');

    $rootScope.$apply(function() {
      $http(config).then(onSuccess2, onError2);
    });

    $httpBackend.flush();

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();
  });

  it('should abort previous GET request with $resource', function() {
    var Entity = $resource('/foo');

    $httpBackend.whenGET('/foo').respond([]);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1').and.callFake(function() {
      console.log('onError1');
    });

    var r1 = $rootScope.$apply(function() {
      return Entity.query(onSuccess1, onError1);
    });

    expect(r1.$promise).toBeDefined();
    expect(r1.$resolved).toBe(false);
    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();

    // Trigger second request
    var onSuccess2 = jasmine.createSpy('onSuccess2');
    var onError2 = jasmine.createSpy('onError2');

    var r2 = $rootScope.$apply(function() {
      return Entity.query(onSuccess2, onError2);
    });

    expect(r2.$promise).toBeDefined();
    expect(r2.$resolved).toBe(false);
    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).not.toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();

    $httpBackend.flush();

    expect(r2.$resolved).toBe(true);
    expect(r1.$resolved).toBe(false);

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();
  });

  it('should abort previous GET request with $resource and $promise', function() {
    var Entity = $resource('/foo');

    $httpBackend.whenGET('/foo').respond([]);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');

    var r1 = $rootScope.$apply(function() {
      var value = Entity.query();
      value.$promise.then(onSuccess1, onError1);
      return value;
    });

    expect(r1.$promise).toBeDefined();
    expect(r1.$resolved).toBe(false);
    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();

    // Trigger second request
    var onSuccess2 = jasmine.createSpy('onSuccess2');
    var onError2 = jasmine.createSpy('onError2');

    var r2 = $rootScope.$apply(function() {
      var value = Entity.query();
      value.$promise.then(onSuccess2, onError2);
      return value;
    });

    expect(r2.$promise).toBeDefined();
    expect(r2.$resolved).toBe(false);
    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).not.toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();

    $httpBackend.flush();

    expect(r2.$resolved).toBe(true);
    expect(r1.$resolved).toBe(false);

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();
  });

  it('should abort previous GET request with $resource instances and $promise', function() {
    var Entity = $resource('/foo');

    var e1 = new Entity();
    var e2 = new Entity();

    $httpBackend.whenGET('/foo').respond({
      id: 1,
      name: 'foo'
    });

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');

    $rootScope.$apply(function() {
      return e1.$get().then(onSuccess1, onError1);
    });

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();

    // Trigger second request
    var onSuccess2 = jasmine.createSpy('onSuccess2');
    var onError2 = jasmine.createSpy('onError2');

    $rootScope.$apply(function() {
      return e2.$get(onSuccess2, onError2);
    });

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).not.toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();

    $httpBackend.flush();

    expect(e1).not.toEqual(jasmine.objectContaining({
      id: 1,
      name: 'foo'
    }));

    expect(e2).toEqual(jasmine.objectContaining({
      id: 1,
      name: 'foo'
    }));

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();
    expect(onSuccess2).toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();
  });

  it('should abort GET request with timeout promise', function() {
    var deferred = $q.defer();
    var config = {
      url: '/foo',
      method: 'GET',
      timeout: deferred.promise
    };

    $httpBackend.whenGET('/foo').respond(201);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');

    $rootScope.$apply(function() {
      $http(config).then(onSuccess1, onError1);
    });

    $rootScope.$apply(function() {
      deferred.resolve();
    });

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).toHaveBeenCalled();

    $timeout.verifyNoPendingTasks();
  });

  it('should abort GET request with timeout value', function() {
    var config = {
      url: '/foo',
      method: 'GET',
      timeout: 100
    };

    $httpBackend.whenGET('/foo').respond(201);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');
    $rootScope.$apply(function() {
      $http(config).then(onSuccess1, onError1);
    });

    $timeout.flush();

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).toHaveBeenCalled();

    $timeout.verifyNoPendingTasks();
  });

  it('should cancel timeout when request respond in success', function() {
    var timeoutSuccess = jasmine.createSpy('timeoutSuccess');
    var timeoutError = jasmine.createSpy('timeoutError');
    var timeout = $timeout(500);

    // Register some functions
    timeout.then(timeoutSuccess, timeoutError);

    var config = {
      url: '/foo',
      method: 'GET',
      timeout: timeout
    };

    $httpBackend.whenGET('/foo').respond(201);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');
    $rootScope.$apply(function() {
      $http(config).then(onSuccess1, onError1);
    });

    $httpBackend.flush();

    expect(onSuccess1).toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();

    // Check timeout has been cancelled
    expect(timeoutSuccess).not.toHaveBeenCalled();
    expect(timeoutError).toHaveBeenCalled();
  });

  it('should cancel timeout when request respond in error', function() {
    var timeoutSuccess = jasmine.createSpy('timeoutSuccess');
    var timeoutError = jasmine.createSpy('timeoutError');
    var timeout = $timeout(500);

    // Register some functions
    timeout.then(timeoutSuccess, timeoutError);

    var config = {
      url: '/foo',
      method: 'GET',
      timeout: timeout
    };

    $httpBackend.whenGET('/foo').respond(404);

    // Trigger first request
    var onSuccess1 = jasmine.createSpy('onSuccess1');
    var onError1 = jasmine.createSpy('onError1');
    $rootScope.$apply(function() {
      $http(config).then(onSuccess1, onError1);
    });

    $httpBackend.flush();

    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).toHaveBeenCalled();

    // Check timeout has been cancelled
    expect(timeoutSuccess).not.toHaveBeenCalled();
    expect(timeoutError).toHaveBeenCalled();
  });
});
