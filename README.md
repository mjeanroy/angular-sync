# angular-sync

## Introduction

Simple angular.js module that will prevent your application with parallel and undesirable requests.

Current version is 0.1.3. 

## Installation

Using npm: ```npm install angular-sync```

Using bower: ```bower install angular-sync```

## Why ?

Suppose you have a simple controller:

```javascript
angular.module('myApp')
  .controller('MyController', ['$scope', '$http', function($scope, $http) {
    $scope.submit = function() {
      $http.post('/foo', $scope.myForm)
        .success(function() {
          console.log('it works !');
        });
    };
  }]);
```

With a simple form:

```html
<div ng-controller="MyController">
  <form name="myForm">
    <button ng-click="submit()"></button>
  </form>
</div>
```

If you don't do anything, user will be able to submit form each time they click on your button. This is probably not what you want, right ?

A very simple solution would be to define a flag in your controller and use ```ng-disabled``` directive to prevent multiple clicks. This is a lot of boilerplate code, and not really DRY. Using angular-sync, parallel submission are automatically cancelled before being triggered.

## How ?

Just import module to your application:

```javascript
angular.module('myApp', [
  'AngularSync'
]);
```

By default:

- POST, PUT, PATCH and DELETE requests are cancelled before being triggered if a pending request with the same url already exist. This will prevent parallel submission for these type of requests. A request is seen as "pending" until response has not been received but you can define a timeout to allow parallel with a pre-defined delay.

- GET requests are triggered but previous request is automatically aborted.

As stated before, by default, a request is pending until response is received (success or error), but you can define a timeout value and request will be automatically seen as "received" when timeout is reached.

You can change default settings in the ```config``` function of your module:

```javascript
angular.module('myApp', ['AngularSync'])
  .config(['AngularSyncProvider', 'AngularSyncMode', function(AngularSyncProvider, SyncMode) {
    AngularSyncProvider.timeout(3000)                   // Override timeout (in millis).
                       .mode('GET', SyncMode.PREVENT)   // Prevent parallel requests with same URL.
                       .mode('POST', SyncMode.ABORT)    // Abort previous request by default.
                       .mode('DELETE', SyncMode.FORCE); // Allow parallel submissions.
  }]);
```

You can also override default mode for a specific request:

```javascript
angular.module('myApp')
  .controller('MyController', ['$scope', '$http', 'AngularSyncMode', function($scope, $http, SyncMode) {
    $scope.submit = function() {
      var config = {
        ngSync: {
          mode: SyncMode.FORCE
        }
      };

      $http.post('/foo', $scope.myForm, config)
        .success(function() {
          console.log('it works !');
        });
    };
  }]);
```

___Important:___

Note that error callback will not be executed if request is not being triggered because another request is still pending. This is the same for aborted request (suppose that a request is aborted because a new incoming request is triggered, error callback will not be executed).

If you think this is a mistake, do not hesitate to submit an issue or a pull request.

## Licence

MIT License (MIT)

## Contributing

If you find a bug or think about enhancement, feel free to contribute and submit an issue or a pull request.
