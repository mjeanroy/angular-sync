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

var angularSync = angular.module('angularSync', []);

// Constants values that define sync mode

angularSync.constant('AngularSyncMode', {
  ABORT: 'abort',        // Pending request will be aborted.
  PREVENT: 'prevent',    // New request will not be sent because of pending request.
  FORCE: 'force'         // New request will be triggered even if pending request exist.
});
angularSync.provider('AngularSync', ['AngularSyncMode', function(SyncMode) {

  var options = {
    timeout: -1,
    modes: {
      GET: SyncMode.ABORT,
      POST: SyncMode.PREVENT,
      PUT: SyncMode.PREVENT,
      PATCH: SyncMode.PREVENT,
      DELETE: SyncMode.PREVENT
    }
  };

  this.timeout = function(timeout) {
    options.timeout = timeout;
  };

  this.mode = function(verb, mode) {
    var m = SyncMode[mode.toUpperCase()];

    if (!angular.isDefined(m)) {
      throw new Error('Mode "' + mode + '" is not valid');
    }

    options.modes[verb.toUpperCase()] = m;
  };

  this.$get = function() {
    return {
      timeout: function() {
        return options.timeout;
      },

      mode: function(verb) {
        return options.modes[verb.toUpperCase()];
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
  var $urls = {};

  var now = function() {
    return new Date().getTime();
  };

  var buildKey = function (url, method) {
    return method + '_' + url;
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
      var key = buildKey(config.url, config.method);
      var pendings = $urls[key] = $urls[key] || [];

      pendings.push({
        timestamp: now(),
        config: config
      });

      return this;
    },

    // Remove entry
    remove: function (config) {
      var key = buildKey(config.url, config.method);
      var pendings = $urls[key] || [];

      var idx = findIndex(pendings, isSameConfigIterator(config));
      if (idx !== -1) {
        pendings.splice(idx, 1);
      }

      return this;
    },

    // Get copy of pending requests
    pendings: function(url, method) {
      var key = buildKey(url, method);
      return ($urls[key] || []).slice();
    },

    // Clear pending requests
    clear: function(url, method) {
      var key = buildKey(url, method);
      $urls[key] = [];
      return this;
    },

    // Check if entry is currently in progress
    contains: function (url, method) {
      var key = buildKey(url, method);
      var tt = now();

      // Outdated request should not be here anyway, so remove it now...
      var pendings = $urls[key] = reject($urls[key] || [], function(rq) {
        return timeout.isOutdated(rq.timestamp, tt);
      });

      return pendings.length > 0;
    }
  };
}]);
angularSync.factory('AngularSyncInterceptor', ['AngularSync', 'AngularSyncMode', 'AngularSyncHistory', '$q', function (AngularSync, SyncMode, history, $q) {
  var commands = {};

  // Prevent requests to be triggered in parallel
  // Useful to not trigger the same POST request...
  commands[SyncMode.PREVENT] = function(config) {
    if (history.contains(config.url, config.method)) {
      config.ngSync.preventError = true;
      return $q.reject(config);
    }

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
    angular.forEach(history.pendings(config.url, config.method), function(rq) {
      rq.config.ngSync.preventError = true;
      rq.config.ngSync.$q.resolve();
    });

    history.clear(config.url, config.method).add(config);
    return config;
  };

  return {
    request: function (config) {
      var method = config.method;

      // Get request mode
      var ngSync = config.ngSync = config.ngSync || {};
      var mode = ngSync.mode = ngSync.mode || AngularSync.mode(method);

      // Add timeout to abort request if needed
      var deferred = ngSync.$q = $q.defer();
      var promise = ngSync.$promise = deferred.promise;

      // If a timeout promise is already defined, we must resolve new
      // timeout promise when original timeout is resolved to force abortion
      if (config.timeout) {
        ngSync.$timeout = config.timeout;
        config.timeout.then(deferred.resolve);
      }

      config.timeout = promise;

      return commands[mode](config);
    },

    response: function (response) {
      history.remove(response.config);
      return response;
    },

    responseError: function (rejection) {
      history.remove(rejection.config || rejection);
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


})(window, document, window.angular, void 0);