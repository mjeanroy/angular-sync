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

/* global angular */
/* global angularSync */

angularSync.config(['$provide', '$injector', function ($provide, $injector) {

  // Wrap promise `then` function.
  // If error must be silently ignored, then error callback
  // will be skipped (and promise will be rejected to allow chaining).
  var wrapPromise = function(promise, $q) {
    var originalThen  = promise.then;

    // Wrap promise to be sure error callback is not called when
    // request rejection occurs because of double click
    promise.then = function (success, error) {
      var newErrorCallback = error;
      if (error) {
        newErrorCallback = function (data, status, headers, config) {
          var originalConfig = config || data.config || data;
          var ngSync = originalConfig.ngSync || {};
          if (!ngSync.preventError) {
            return error.apply(this, arguments);
          }

          return $q.reject(data);
        };
      }

      var args = Array.prototype.slice.call(arguments);
      args[1] = newErrorCallback;
      return originalThen.apply(promise, args);
    };

    return promise;
  };

  // Wrap function and allow result to be modified by `after` function.
  var proxyResult = function(original, after) {
    return function() {
      return after.call(this, original.apply(this, arguments));
    };
  };

  $provide.decorator('$http', ['$delegate', '$q', function ($delegate, $q) {
    var after = function(promise) {
      return wrapPromise(promise, $q);
    };

    var proxyPromise = function(fn) {
      return proxyResult(fn, after);
    };

    // Proxy $http function
    var $http = proxyPromise($delegate);

    // Proxy shortcuts methods
    for (var i in $delegate) {
      if (angular.isFunction($delegate[i])) {
        $http[i] = proxyPromise($delegate[i]);
      }
    }

    // Return the custom http service
    return $http;
  }]);

  // Check if ngResource module is available.
  // This module is optional and may not be registered.
  if ($injector.has('$resource')) {
    $provide.decorator('$resource', ['$delegate', '$q', function($delegate, $q) {
      // Proxy $resource promise.
      var after = function(result) {
        var promise = wrapPromise(result.$promise || result, $q);

        // Need to return instance with $promise property, or
        // promise if function was called on instance.
        if (result.$promise) {
          result.$promise = promise;
        } else {
          result = promise;
        }

        return result;
      };

      var proxyPromise = function(fn) {
        return proxyResult(fn, after);
      };

      // Proxy $resource factory
      var $resource = function() {
        var resource = $delegate.apply($delegate, arguments);

        // Proxy resource methods
        for (var i in resource) {
          if (angular.isFunction(resource[i])) {
            resource[i] = proxyPromise(resource[i]);
          }
        }

        return resource;
      };

      return $resource;
    }]);
  }
}]);
