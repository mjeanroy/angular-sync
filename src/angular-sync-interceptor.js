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

/* global angularSync */

angularSync.factory('AngularSyncInterceptor', ['AngularSync', 'AngularSyncMode', 'AngularSyncHistory', 'AngularSyncStrategies', '$q', '$timeout', function (AngularSync, SyncMode, history, strategies, $q, $timeout) {

  var handleResponse = function(config) {
    var ngSync = config.ngSync;

    // Remove history
    history.remove(config);

    // Cancel optional timeout task
    if (ngSync.$timeout) {
      $timeout.cancel(ngSync.$timeout);
    }

    // Cancel created deferred object
    ngSync.$q.reject();

    // Restore original timeout
    config.timeout = ngSync.$timeout;

    // Delete deferred and original timeout.
    delete ngSync.$timeout;
    delete ngSync.$q;
  };

  return {
    request: function (config) {
      var method = config.method;

      // Get request mode
      var ngSync = config.ngSync = config.ngSync || {};

      ngSync.mode = ngSync.mode || AngularSync.mode(method);
      ngSync.id = ngSync.id || config.url;

      // Add timeout to abort request if needed
      var deferred = ngSync.$q = $q.defer();
      var promise = deferred.promise;

      // If a timeout promise is already defined, we must resolve new
      // timeout promise when original timeout is resolved to force abortion
      var timeout = config.timeout;
      if (timeout) {
        // If timeout is specified as a number, then we should abort request
        // when timeout is reached
        if (timeout > 0) {
          timeout = $timeout(deferred.resolve, timeout, false);
        } else {
          timeout.then(deferred.resolve);
        }

        ngSync.$timeout = timeout;
      }

      var free = function() {
        // Set everything to null...
        deferred = promise = timeout = ngSync = free = null;
      };

      // Free memory when promise is resolved.
      // This promise will be resolved:
      // - On next request.
      // - When timeout is reached.
      promise.then(free, free);

      // Override timeout promise
      config.timeout = promise;

      return strategies[ngSync.mode](config);
    },

    response: function (response) {
      handleResponse(response.config || response);
      return response;
    },

    responseError: function (rejection) {
      handleResponse(rejection.config || rejection);
      return $q.reject(rejection);
    }
  };
}]);

angularSync.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('AngularSyncInterceptor');
}]);
