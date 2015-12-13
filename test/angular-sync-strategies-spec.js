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

describe('AngularSyncStrategies', function() {

  var AngularSyncStrategies;
  var AngularSyncHistory;
  var $q;

  var id;
  var method;
  var config;

  beforeEach(angular.mock.module('angularSync'));

  beforeEach(inject(function(_AngularSync_, _AngularSyncStrategies_, _AngularSyncHistory_, _$q_) {
    AngularSync = _AngularSync_;
    AngularSyncStrategies = _AngularSyncStrategies_;
    AngularSyncHistory = _AngularSyncHistory_;
    $q = _$q_;
  }));

  beforeEach(function() {
    spyOn(AngularSync, 'preventError').and.callThrough();
    spyOn(AngularSyncHistory, 'contains').and.callThrough();
    spyOn(AngularSyncHistory, 'add').and.callThrough();
    spyOn(AngularSyncHistory, 'clear').and.callThrough();
    spyOn(AngularSyncHistory, 'pendings').and.callThrough();

    spyOn($q, 'reject').and.callThrough();

    id = '/foo';
    method = 'GET';
    config = {
      url: '/url',
      method: 'GET',
      ngSync: {
        id: id
      }
    };
  });

  describe('PREVENT', function() {
    it('should trigger request if it is not pending', function() {
      AngularSyncStrategies.prevent(config);

      expect(AngularSyncHistory.contains).toHaveBeenCalledWith(id, method);
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(config.ngSync.preventError).not.toBeDefined();
      expect($q.reject).not.toHaveBeenCalled();
    });

    it('should not trigger request if it is not pending', function() {
      var c1 = angular.copy(config);
      var c2 = angular.copy(config);

      // Trigger first request.
      var r1 = AngularSyncStrategies.prevent(c1);

      expect(r1).toBe(c1);
      expect(AngularSyncHistory.contains).toHaveBeenCalledWith(id, method);
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(config.ngSync.preventError).not.toBeDefined();
      expect($q.reject).not.toHaveBeenCalled();

      // Reset spies.
      AngularSyncHistory.contains.calls.reset();
      AngularSyncHistory.add.calls.reset();

      // Trigger second request with same id / method.
      // This request should be rejected.
      var promise = jasmine.createSpyObj('promise', ['then', 'catch']);
      $q.reject.and.returnValue(promise);

      var r2 = AngularSyncStrategies.prevent(c2);

      expect(r2).toBe(promise);
      expect(AngularSync.preventError).toHaveBeenCalled();
      expect(AngularSyncHistory.contains).toHaveBeenCalledWith(id, method);
      expect(AngularSyncHistory.add).not.toHaveBeenCalledWith(c2);
      expect(c1.ngSync.preventError).not.toBeDefined();
      expect(c2.ngSync.preventError).toBe(true);
      expect($q.reject).toHaveBeenCalledWith(c2);
    });
  });

  describe('ABORT', function() {
    it('should trigger request if it is not pending', function() {
      var r1 = AngularSyncStrategies.abort(config);

      expect(r1).toBe(config);
      expect(AngularSyncHistory.pendings).toHaveBeenCalledWith(id, method);
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.clear).toHaveBeenCalledWith(id, method);
      expect(config.ngSync.preventError).not.toBeDefined();
      expect($q.reject).not.toHaveBeenCalled();
    });

    it('should trigger request and abort previous', function() {
      var c1 = angular.copy(config);
      c1.ngSync.$q = jasmine.createSpyObj('deferred', ['resolve', 'reject']);

      var c2 = angular.copy(config);
      c2.ngSync.$q = jasmine.createSpyObj('deferred', ['resolve', 'reject']);

      var r1 = AngularSyncStrategies.abort(c1);

      expect(r1).toBe(c1);
      expect(AngularSyncHistory.pendings).toHaveBeenCalledWith(id, method);
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(r1);
      expect(AngularSyncHistory.clear).toHaveBeenCalledWith(id, method);
      expect(r1.ngSync.preventError).not.toBeDefined();
      expect(r1.ngSync.$q.resolve).not.toHaveBeenCalled();
      expect(r1.ngSync.$q.reject).not.toHaveBeenCalled();

      var r2 = AngularSyncStrategies.abort(c2);

      expect(r2).toBe(c2);
      expect(AngularSyncHistory.pendings).toHaveBeenCalledWith(id, method);
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(r2);
      expect(AngularSyncHistory.clear).toHaveBeenCalledWith(id, method);
      expect(r2.ngSync.preventError).not.toBeDefined();
      expect(r2.ngSync.$q.resolve).not.toHaveBeenCalled();
      expect(r2.ngSync.$q.reject).not.toHaveBeenCalled();

      expect(AngularSync.preventError).toHaveBeenCalled();
      expect(r1.ngSync.preventError).toBe(true);
      expect(r1.ngSync.$q.resolve).toHaveBeenCalled();
      expect(r1.ngSync.$q.reject).not.toHaveBeenCalled();
    });

    it('should trigger request and abort all previous requests', function() {
      var rq1 = {
          config: angular.copy(config)
      };

      var rq2 = {
          config: angular.copy(config)
      };

      rq1.config.ngSync.$q = jasmine.createSpyObj('deferred', ['resolve', 'reject']);
      rq2.config.ngSync.$q = jasmine.createSpyObj('deferred', ['resolve', 'reject']);

      var c3 = angular.copy(config);
      c3.ngSync.$q = jasmine.createSpyObj('deferred', ['resolve', 'reject']);

      AngularSyncHistory.pendings.and.returnValues([ rq1, rq2 ]);

      AngularSyncStrategies.abort(c3);

      expect(AngularSync.preventError).toHaveBeenCalled();

      expect(rq1.config.ngSync.preventError).toBe(true);
      expect(rq1.config.ngSync.$q.resolve).toHaveBeenCalled();
      expect(rq1.config.ngSync.$q.reject).not.toHaveBeenCalled();

      expect(rq2.config.ngSync.preventError).toBe(true);
      expect(rq2.config.ngSync.$q.resolve).toHaveBeenCalled();
      expect(rq2.config.ngSync.$q.reject).not.toHaveBeenCalled();
    });
  });

  describe('FORCE', function() {
    it('should trigger request if it is not pending', function() {
      var r1 = AngularSyncStrategies.force(config);

      expect(r1).toBe(config);
      expect(AngularSyncHistory.add).toHaveBeenCalledWith(config);
      expect(AngularSyncHistory.clear).not.toHaveBeenCalled();
      expect(AngularSyncHistory.contains).not.toHaveBeenCalled();
      expect(AngularSyncHistory.pendings).not.toHaveBeenCalled();
    });
  });
});
