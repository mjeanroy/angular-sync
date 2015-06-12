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