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
