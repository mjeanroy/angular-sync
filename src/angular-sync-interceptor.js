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

angularSync.factory('AngularSyncInterceptor', ['AngularSync', 'AngularSyncMode', 'AngularSyncHistory', 'AngularSyncStrategies', '$q', '$timeout', function (AngularSync, SyncMode, history, strategies, $q, $timeout) {

  return {
    request: function (config) {
      var method = config.method;

      // Get request mode
      var ngSync = config.ngSync = config.ngSync || {};

      ngSync.mode = ngSync.mode || AngularSync.mode(method);
      ngSync.id = ngSync.id || config.url;

      // Add timeout to abort request if needed
      var deferred = ngSync.$q = $q.defer();
      var promise = ngSync.$promise = deferred.promise;

      // If a timeout promise is already defined, we must resolve new
      // timeout promise when original timeout is resolved to force abortion
      var timeout = config.timeout;
      var timeoutTask,timeoutDeferred, timeoutPromise;
      if (timeout) {
        // If timeout is specified as a number, then we should abort request
        // when timeout is reached
        if (timeout > 0) {
          timeoutDeferred = $q.defer();
          timeoutPromise = timeoutDeferred.promise;
          timeoutTask = $timeout(timeoutDeferred.resolve, timeout, false);
          timeout = timeoutPromise;
        }

        ngSync.$timeoutTask = timeoutTask;
        ngSync.$timeout = timeout;
        timeout.then(deferred.resolve);
      }

      var free = function() {
        // Set everything to null...
        deferred = promise = timeout = timeoutTask =
          timeoutDeferred = timeoutPromise = ngSync = free = null;
      };

      if (timeoutPromise) {
        timeoutPromise.then(free, free);
      }

      // Free memory when promise is resolved
      promise.then(free, free);

      // Override timeout promise
      config.timeout = promise;

      return strategies[ngSync.mode](config);
    },

    response: function (response) {
      var config = response.config;
      var ngSync = config.ngSync;

      // Remove history
      history.remove(config);

      // Cancel optional timeout task
      if (ngSync.$timeoutTask) {
        $timeout.cancel(ngSync.$timeoutTask);
      }

      // Cancel created deferred object
      ngSync.$q.reject();

      return response;
    },

    responseError: function (rejection) {
      var config = rejection.config || rejection;
      var ngSync = config.ngSync;

      // Remove history
      history.remove(config);

      // Cancel optional timeout task
      if (ngSync.$timeoutTask) {
        $timeout.cancel(ngSync.$timeoutTask);
      }

      // Cancel created deferred object
      ngSync.$q.reject();

      return $q.reject(rejection);
    }
  };
}]);

angularSync.config(['$httpProvider', '$provide', function ($httpProvider, $provide) {
  $httpProvider.interceptors.push('AngularSyncInterceptor');

  // Wrap original http service
  $provide.decorator('$http', ['$delegate', '$q', function ($delegate, $q) {
    var wrapErrorCallback = function (promise) {
      var originalThen  = promise.then;

      // Wrap promise to be sure error callback is not called when
      // request rejection occurs because of double click
      promise.then = function (success, error) {
        var newErrorCallback = error;
        if (error) {
          newErrorCallback = function (data, status, headers, config) {
            var originalConfig = config || data.config || data;
            if (!originalConfig.ngSync.preventError) {
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

    var customHttp = function (config) {
      var promise = $delegate(config);
      return wrapErrorCallback(promise);
    };

    var createShortcutMethodWrapper = function(original, fn) {
      return function() {
        var promise = original[fn].apply(original, arguments);
        return wrapErrorCallback(promise);
      };
    };

    for (var i in $delegate) {
      if (angular.isFunction($delegate[i])) {
        customHttp[i] = createShortcutMethodWrapper($delegate, i);
      }
    }

    // Return the custom http service
    return customHttp;
  }]);
}]);
