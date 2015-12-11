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

describe('AngularSyncDecorator', function() {

  var $http;
  var $httpBackend;

  beforeEach(angular.mock.module('angularSync'));

  beforeEach(inject(function(_$http_, _$httpBackend_) {
    $http = _$http_;
    $httpBackend = _$httpBackend_;
  }));

  angular.forEach(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], function(method) {
    it('should define ' + method + ' shortcut methods', function() {
      expect(angular.isFunction($http[method.toLowerCase()])).toBe(true);
    });

    it('should trigger ' + method + ' success', function() {
      var onSuccess = jasmine.createSpy('success');
      var onError = jasmine.createSpy('onError');
      var config = {
        url: '/foo',
        method: method
      };

      $httpBackend['expect' + method](config.url).respond(201);

      $http(config).then(onSuccess, onError);

      $httpBackend.flush();

      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.calls.count()).toBe(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should trigger ' + method + ' success using shortcut method', function() {
      var onSuccess = jasmine.createSpy('success');
      var onError = jasmine.createSpy('onError');
      var url = '/foo';

      $httpBackend['expect' + method](url).respond(201);

      $http[method.toLowerCase()](url).then(onSuccess, onError);

      $httpBackend.flush();

      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.calls.count()).toBe(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should trigger ' + method + ' error', function() {
      var onSuccess = jasmine.createSpy('success');
      var onError = jasmine.createSpy('onError');
      var config = {
        url: '/foo',
        method: method
      };

      $httpBackend['expect' + method](config.url).respond(404);

      $http(config).then(onSuccess, onError);

      $httpBackend.flush();

      expect(onError).toHaveBeenCalled();
      expect(onError.calls.count()).toBe(1);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should trigger ' + method + ' error using shortcut method', function() {
      var onSuccess = jasmine.createSpy('success');
      var onError = jasmine.createSpy('onError');
      var url = '/foo';

      $httpBackend['expect' + method](url).respond(404);

      $http[method.toLowerCase()](url).then(onSuccess, onError);

      $httpBackend.flush();

      expect(onError).toHaveBeenCalled();
      expect(onError.calls.count()).toBe(1);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should prevent ' + method + ' error', function() {
      var onSuccess = jasmine.createSpy('success');
      var onError = jasmine.createSpy('onError');
      var config = {
        url: '/foo',
        method: method,
        ngSync: {
          preventError: true
        }
      };

      $httpBackend['expect' + method](config.url).respond(404);

      $http(config).then(onSuccess, onError);

      $httpBackend.flush();

      expect(onError).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should prevent ' + method + ' error using shortcut method', function() {
      var onSuccess = jasmine.createSpy('success');
      var onError = jasmine.createSpy('onError');
      var url = '/foo';
      var config = {
        ngSync: {
          preventError: true
        }
      };

      $httpBackend['expect' + method](url).respond(404);

      // POST, PUT and PATCH methods need the second parameter
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        $http[method.toLowerCase()](url, {}, config).then(onSuccess, onError);
      } else {
        $http[method.toLowerCase()](url, config).then(onSuccess, onError);
      }

      $httpBackend.flush();

      expect(onError).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
