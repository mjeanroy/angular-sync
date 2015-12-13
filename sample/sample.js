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

angular
  .module('SampleApp', ['angularSync', 'ngResource'])
  .controller('SampleController', ['$scope', '$http', '$resource', function($scope, $http, $resource) {
    var $r = $resource('/foo', {}, {
      put: {
        method: 'PUT'
      },
      patch: {
        method: 'PATCH'
      }
    });

    var verbs = $scope.verbs = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    var operations = {
      GET: 'query',
      POST: 'save',
      PUT: 'put',
      PATCH: 'patch',
      DELETE: 'delete'
    };

    $scope.counters = {};

    angular.forEach(verbs, function(verb) {
      $scope.counters[verb] = {
        nbSuccess: 0,
        nbError: 0
      };
    });

    var onSuccess = function(verb) {
      return function() {
        $scope.counters[verb].nbSuccess++;
      };
    };

    var onError = function(verb) {
      return function() {
        $scope.counters[verb].nbError++;
      };
    };

    $scope.triggerHttp = function(verb) {
      $http[verb.toLowerCase()]('/foo')
        .then(onSuccess(verb), onError(verb));
    };

    $scope.triggerNgResource = function(verb) {
      $r[operations[verb]]().$promise
        .then(onSuccess(verb), onError(verb));
    };
  }]);