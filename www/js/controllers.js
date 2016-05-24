angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope, $stateParams, $ionicHistory, $cacheFactory, $ionicLoading, $ionicPopup, $state, MembersFactory, myCache, CurrentUserService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  $scope.user = {};
  $scope.doLogin = function(user) {
    $ionicLoading.show({
        template: '<ion-spinner icon="ios"></ion-spinner><br>Loggin In...'
    });

    /* Check user fields*/
    if (!user.email || !user.password) {
        $ionicLoading.hide();
        $ionicPopup.alert({title: 'Login Failed', template: 'Please check your Email or Password!'});
        return;
    }

    /* Authenticate User */
    var email = user.email;
    var password = user.password;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
    	if (firebase.auth().currentUser) {
	        $ionicLoading.hide();
	        firebase.auth().signOut();
        }
    	var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode == 'auth/wrong-password') {
          $ionicLoading.hide();
          alert('Wrong password');
        } else {
            $ionicLoading.hide();
            $ionicPopup.alert({title: 'Login Failed', template: 'Check your credentials and try again!'});
        }
        firebase.auth().onAuthStateChanged(function(user) {
		    if (user) {
		      var userId = firebase.auth().currentUser.uid;
		      fb.ref('/admins/' + userId).once('value').then(function(snapshot) {
				$scope.firstname = snapshot.val().firstname;
				$scope.surename = snapshot.val().surename;
				$scope.fullname = function (){
					return $scope.firstname +" "+ $scope.surename;
				};
                myCache.put('thisUserName', $scope.fullname());
                myCache.put('thisMemberId', userId);
                CurrentUserService.updateUser(snapshot);
                if (snapshot.val().firstname !== '') {
                    $ionicLoading.hide();
                    $scope.modal.hide();
                }
			  });
		    } else {
	            $ionicLoading.hide();
	            $ionicPopup.alert({title: 'Login Failed', template: 'No User Signin'});
        	}
		});   
            
    });
  }

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('NewsCtrl', function($scope, CurrentUserService) {
  	$scope.isadmin = false;
  	$scope.$on('$ionicView.beforeEnter', function () {
        if (typeof CurrentUserService.isadmin !== 'undefined' && CurrentUserService.isadmin !== '') {
            $scope.isadmin = CurrentUserService.isadmin;
        }
    });
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
