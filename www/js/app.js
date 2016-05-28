// Ionic Starter App
var fb = new Firebase("https://xinwu.firebaseio.com");
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.directives' , 'starter.services', 'angular.filter', 'angularMoment', 'firebase', 'ngCordovaOauth', 'jett.ionic.filter.bar', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $sceDelegateProvider) {

  $sceDelegateProvider.resourceUrlWhitelist([
     // Allow same origin resource loads.
     'self',
     // Allow loading from our assets domain.  Notice the difference between * and **.
     'https://www.youtube.com/embed/**']);

   // The blacklist overrides the whitelist so the open redirect here is blocked.
  $sceDelegateProvider.resourceUrlBlacklist([
     'http://myapp.example.com/clickThru**']);

  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.news', {
    url: '/news',
    views: {
      'menuContent': {
        templateUrl: 'templates/news.html',
        controller: 'NewsCtrl'
      }
    }
  })

  .state('app.posting', {
    url: '/posting',
    views: {
      'menuContent': {
        templateUrl: 'templates/posting.html',
        controller: 'PostingCtrl'
      }
    }
  })

  .state('app.picknewstype', {
    url: '/newstype',
    views: {
      'menuContent': {
        templateUrl: 'templates/picknewstype.html',
        controller: 'NewsTypeCtrl'
      }
    }
  })

  .state('app.newstitle', {
    url: '/newstitle',
    views: {
      'menuContent': {
        templateUrl: 'templates/newstitle.html',
        controller: 'NewsTitleCtrl'
      }
    }
  })

  .state('app.newscontent', {
    url: '/newscontent',
    views: {
      'menuContent': {
        templateUrl: 'templates/newscontent.html',
        controller: 'NewsContentCtrl'
      }
    }
  })

  .state('app.newsvideo', {
    url: '/newsvideo',
    views: {
      'menuContent': {
        templateUrl: 'templates/newsvideo.html',
        controller: 'NewsVideoCtrl'
      }
    }
  })

  .state('app.post', {
    url: "/post/:postId",
    views: {
      'menuContent': {
        templateUrl: 'templates/post.html',
        controller: 'PostCtrl'
      }
    }
  })

  .state('app.tutorial', {
      url: '/tutorial',
      views: {
        'menuContent': {
          templateUrl: 'templates/tutorial.html',
          controller: 'TutorialCtrl'
        }
      }
    })
    .state('app.tips', {
      url: '/tips',
      views: {
        'menuContent': {
          templateUrl: 'templates/tips.html',
          controller: 'TipsCtrl'
        }
      }
    })

  .state('app.single', {
    url: '/playlists/:playlistId',
    views: {
      'menuContent': {
        templateUrl: 'templates/playlist.html',
        controller: 'PlaylistCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/news');
});
