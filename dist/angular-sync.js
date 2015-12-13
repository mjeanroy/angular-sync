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

(function(window, document, angular, undefined) {

'use strict';

var angularSync = (function() {
  try {
    return angular.module('angularSync', ['ngResource']);
  }
  catch(e) {
    return angular.module('angularSync', []);
  }
})();

// Constants values that define sync mode

angularSync.constant('AngularSyncMode', {
  ABORT: 'abort',        // Pending request will be aborted.
  PREVENT: 'prevent',    // New request will not be sent because of pending request.
  FORCE: 'force'         // New request will be triggered even if pending request exist.
});
angularSync.provider('AngularSync', ['AngularSyncMode', function(SyncMode) {

  var options = {
    preventError: true,
    timeout: -1,
    modes: {
      GET: SyncMode.ABORT,
      POST: SyncMode.PREVENT,
      PUT: SyncMode.PREVENT,
      PATCH: SyncMode.PREVENT,
      DELETE: SyncMode.PREVENT,
      HEAD: SyncMode.FORCE
    }
  };

  this.timeout = function(timeout) {
    options.timeout = timeout;
    return this;
  };

  this.mode = function(verb, mode) {
    var m = SyncMode[mode.toUpperCase()];

    if (!angular.isDefined(m)) {
      throw new Error('Mode "' + mode + '" is not valid');
    }

    options.modes[verb.toUpperCase()] = m;

    return this;
  };

  this.allowError = function() {
    options.preventError = false;
  };

  this.$get = function() {
    return {
      timeout: function() {
        return options.timeout;
      },

      mode: function(verb) {
        return options.modes[verb.toUpperCase()];
      },

      preventError: function() {
        return options.preventError;
      }
    };
  };

}]);
angularSync.factory('AngularSyncTimeout', ['AngularSync', function (AngularSync) {
  return {
    isOutdated: function (d1, d2) {
      var timeout = AngularSync.timeout();
      if (timeout <= 0) {
        return false;
      }

      var t1 = new Date(d1).getTime();
      var t2 = new Date(d2).getTime();
      return Math.abs(t2 - t1) >= timeout;
    }
  };
}]);
angularSync.factory('AngularSyncHistory', ['AngularSyncTimeout', function (timeout) {
  var $pendings = {};

  var now = function() {
    return new Date().getTime();
  };

  var buildKey = function (id, method) {
    return method + '_' + id;
  };

  var findIndex = function(array, callback, ctx) {
    for (var i = 0, size = array.length; i < size; ++i) {
      if (callback.call(ctx, array[i], i, array)) {
        return i;
      }
    }
    return -1;
  };

  var isSameConfigIterator = function(config) {
    return function(current) {
      return config === current.config;
    };
  };

  var reject = function(array, callback, ctx) {
    var newArray = [];
    for (var i = 0, size = array.length; i < size; ++i) {
      if (!callback.call(ctx, array[i], i, array)) {
        newArray.push(array[i]);
      }
    }
    return newArray;
  };

  return {
    // Add new entry
    add: function (config) {
      var ngSync = config.ngSync;
      var id = ngSync.id;
      var key = buildKey(id, config.method);
      var pendings = $pendings[key] = $pendings[key] || [];

      pendings.push({
        timestamp: now(),
        config: config
      });

      return this;
    },

    // Remove entry
    remove: function (config) {
      var ngSync = config.ngSync;
      var id = ngSync.id;
      var key = buildKey(id, config.method);
      var pendings = $pendings[key] || [];

      var idx = findIndex(pendings, isSameConfigIterator(config));
      if (idx !== -1) {
        pendings.splice(idx, 1);
      }

      return this;
    },

    // Get copy of pending requests
    pendings: function(id, method) {
      var key = buildKey(id, method);
      return ($pendings[key] || []).slice();
    },

    // Clear pending requests
    clear: function(id, method) {
      var key = buildKey(id, method);
      $pendings[key] = [];
      return this;
    },

    // Check if entry is currently in progress
    contains: function (id, method) {
      var key = buildKey(id, method);
      var tt = now();

      // Outdated request should not be here anyway, so remove it now...
      var pendings = $pendings[key] = reject($pendings[key] || [], function(rq) {
        return timeout.isOutdated(rq.timestamp, tt);
      });

      return pendings.length > 0;
    }
  };
}]);
angularSync.factory('AngularSyncStrategies', ['AngularSync', 'AngularSyncMode', 'AngularSyncHistory', '$q', function (AngularSync, SyncMode, history, $q) {
  var commands = {};

  // Prevent requests to be triggered in parallel
  // Useful to not trigger the same POST request...
  commands[SyncMode.PREVENT] = function(config) {
    var ngSync = config.ngSync;

    // Check if request is pending.
    // If request is pending, we should prevent request to be triggered.
    if (history.contains(ngSync.id, config.method)) {
      ngSync.preventError = AngularSync.preventError();
      return $q.reject(config);
    }

    // Add to pending request.
    history.add(config);

    return config;
  };

  // Request will be triggered whatever happens
  commands[SyncMode.FORCE] = function(config) {
    history.add(config);
    return config;
  };

  // Pending requests will be aborted and incoming request
  // will be triggered
  commands[SyncMode.ABORT] = function(config) {
    var ngSync = config.ngSync;

    // Remove all pendings requests.
    var pendingRequests = history.pendings(ngSync.id, config.method);
    angular.forEach(pendingRequests, function(rq) {
      var rqNgSync = rq.config.ngSync;
      rqNgSync.preventError = AngularSync.preventError();
      rqNgSync.$q.resolve();
    });

    history.clear(ngSync.id, config.method)
           .add(config);

    return config;
  };

  return commands;
}]);

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


})(window, document, window.angular, void 0);