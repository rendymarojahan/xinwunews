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
        fb.authWithPassword({
            "email": user.email,
            "password": user.password
        }, function (error, authData) {
            if (error) {
                //console.log("Login Failed!", error);
                $ionicLoading.hide();
                $ionicPopup.alert({title: 'Login Failed', template: 'Check your credentials and try again!'});
            } else {
                
                MembersFactory.getMember(authData).then(function (thisuser) {

                	$scope.firstname = thisuser.firstname;
    				$scope.surename = thisuser.surename;
    				$scope.fullname = function (){
    					return $scope.firstname +" "+ $scope.surename;
    				};
                    
                    /* Save user data for later use */
                    myCache.put('thisGroupId', thisuser.group_id);
                    myCache.put('thisUserName', $scope.fullname());
                    myCache.put('thisMemberId', authData.uid);
                    myCache.put('thisPublicId', thisuser.public_id);
                    CurrentUserService.updateUser(thisuser);

                    if (thisuser.firstname !== '' && thisuser.isadmin === true) {
                    	CurrentUserService.isadmin = true;
                        $ionicLoading.hide();
                        $scope.modal.hide();
                        $state.reload('app.news');
                    } else {
                        $ionicLoading.hide();
                		$ionicPopup.alert({title: 'Login Failed', template: 'Binding Failed'});
                    }
                });
            }
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

.controller('NewsCtrl', function($scope, $state, $stateParams, NewsFactory, $ionicFilterBar, $ionicListDelegate, PickTransactionServices, CurrentUserService, myCache) {
	$scope.news = [];
	$scope.isshow = false;
    $scope.userId = myCache.get('thisMemberId')
    $scope.photo = CurrentUserService.photo;

    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if (fromState.name === "app.news") {
            refresh($scope.news, $scope, NewsFactory);
        }
    });

    $scope.news = NewsFactory.getNews();
    $scope.news.$loaded().then(function (x) {
    	refresh($scope.news, $scope, NewsFactory);
    }).catch(function (error) {
        console.error("Error:", error);
    });

    $scope.doRefresh = function (){

    	$scope.new = NewsFactory.getNews();
	    $scope.new.$loaded().then(function (x) {
			$scope.news = $scope.new.concat($scope.news);
	        refresh($scope.news, $scope, NewsFactory);
	        $scope.$broadcast('scroll.refreshComplete');
	    }).catch(function (error) {
	        console.error("Error:", error);
	    });

    };

    var filterBarInstance;
    $scope.showFilterBar = function () {
        filterBarInstance = $ionicFilterBar.show({
            items: $scope.news,
            update: function (filteredItems, filterText) {
                $scope.news = filteredItems;
            },
            filterProperties: 'title'
        });
    };

    $scope.listCanSwipe = true;
    $scope.handleSwipeOptions = function ($event, post) {
        $state.go('app.post', { postId: post.$id });
    };

	$scope.isadmin = CurrentUserService.isadmin;
  	$scope.$on('$ionicView.beforeEnter', function () {
        if (typeof CurrentUserService.isadmin !== 'undefined' && CurrentUserService.isadmin !== '') {
            $scope.isadmin = CurrentUserService.isadmin;
        }
    });

    $scope.createPosting = function () {
        PickTransactionServices.typeDisplaySelected = '';
        PickTransactionServices.typeInternalSelected = '';
        PickTransactionServices.dateSelected = '';
        PickTransactionServices.photoSelected = 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        PickTransactionServices.noteSelected = '';
        PickTransactionServices.titleSelected = '';
        $state.go('app.posting');
    }

    function refresh(news, $scope, NewsFactory) {
    
    }
})

.controller('PostingCtrl', function ($scope, $state, $stateParams, $cordovaSocialSharing, $cordovaCamera, $ionicActionSheet, $ionicHistory, AccountsFactory, PickTransactionServices, myCache, CurrentUserService) {

    $scope.hideValidationMessage = true;
    $scope.loadedClass = 'hidden';
    $scope.transactions = [];
    $scope.AccountTitle = '';
    $scope.inEditMode = false;
    $scope.isTransfer = false;
    $scope.ItemFrom = {};
    $scope.ItemTo = {};
    $scope.ItemOriginal = {};
    $scope.DisplayDate = '';
    $scope.currentItem = {
        'date': '',
        'isphoto': false,
        'title': '',
        'note': '',
        'photo': '',
        'comments': '',
        'likes': '',
        'typedisplay': ''
    };

    $scope.firstname = CurrentUserService.firstname;
    $scope.surename = CurrentUserService.surename;
    $scope.fullname = function (){
    	return $scope.firstname +" "+ $scope.surename;
    };
    $scope.photo = CurrentUserService.photo;
    $scope.admin = CurrentUserService.isadmin;

    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.hideValidationMessage = true;
        $scope.currentItem.typedisplay = PickTransactionServices.typeDisplaySelected;
        $scope.currentItem.photo = PickTransactionServices.photoSelected;
        if ($scope.currentItem.photo === 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==') {
            $scope.currentItem.photo = '';
            $scope.currentItem.isphoto = false;
        }
        $scope.currentItem.title = PickTransactionServices.titleSelected;
        $scope.currentItem.note = PickTransactionServices.noteSelected;
        // Handle transaction date
        if (typeof PickTransactionServices.dateSelected !== 'undefined' && PickTransactionServices.dateSelected !== '') {
            $scope.DisplayDate = PickTransactionServices.dateSelected;
        }
        // Handle Two Ways Binding
        if ($scope.currentItem.typedisplay === "News"){
        	$scope.type = function (){ return "create News";};
    	} else if ($scope.currentItem.typedisplay === "Tutorial"){
        	$scope.type = function (){ return "create Tutorial ";};
        } else if ($scope.currentItem.typedisplay === "Tips"){
        	$scope.type = function (){ return "create Tips ";};
        }
    	if ($scope.currentItem.note !== ''){
        	$scope.note = function (){ return " " + $scope.currentItem.note;};
    	}
    	if ($scope.currentItem.photo !== ''){
        	$scope.sphoto = function (){ return " " + $scope.currentItem.photo;};
    	}
    });

    // PICK TRANSACTION TYPE
    $scope.pickPostPhoto = function() {
	
		$scope.hideSheet = $ionicActionSheet.show({

			buttons: [
        		{ text: '<i class="icon ion-camera"></i> Take Picture' },
        		{ text: '<i class="icon ion-images"></i> Choose Album' },
    		],
			buttonClicked: function(index) {
				switch (index) {
                case 0:
                    $scope.currentItem = { photo: PickTransactionServices.photoSelected };
        				
            				var options = {
			                quality: 75,
			                destinationType: Camera.DestinationType.DATA_URL,
			                sourceType: Camera.PictureSourceType.CAMERA,
			                allowEdit: false,
			                encodingType: Camera.EncodingType.JPEG,
			                popoverOptions: CameraPopoverOptions,
			                targetWidth: 800,
			                targetHeight: 800,
			                saveToPhotoAlbum: false
            				};
				            $cordovaCamera.getPicture(options).then(function (imageData) {
				                $scope.currentItem.photo = imageData;
								PickTransactionServices.updatePhoto($scope.currentItem.photo);
								$scope.currentItem.isphoto = true;
				            }, function (error) {
				                console.error(error);
				            })

                break;
                case 1:
                	$scope.currentItem = { photo: PickTransactionServices.photoSelected };
            				var options = {
			                quality: 75,
			                destinationType: Camera.DestinationType.DATA_URL,
			                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
			                allowEdit: false,
			                encodingType: Camera.EncodingType.JPEG,
			                popoverOptions: CameraPopoverOptions,
			                targetWidth: 800,
			                targetHeight: 800,
			                saveToPhotoAlbum: false
            				};
				            $cordovaCamera.getPicture(options).then(function (imageData) {
				                $scope.currentItem.photo = imageData;
				                PickTransactionServices.updatePhoto($scope.currentItem.photo);
				                $scope.currentItem.isphoto = true;
				            }, function (error) {
				                console.error(error);
				            })
        			
                break;
            	}
            	return true;
    		},
			cancelText: 'Cancel',
				cancel: function() {
				console.log('CANCELLED');
			}
		});	
	 }
    // PICK TRANSACTION TYPE
    // Don't let users change the transaction type. If needed, a user can delete the transaction and add a new one
    $scope.pickNewsType = function () {
        if ($scope.currentItem.istransfer) {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Transaction type on transfers cannot be changed."
            return;
        } else {
            $state.go('app.picknewstype');
        }
    }

    $scope.shareViaTwitter = function(message, image, link) {
    	if (typeof $scope.currentItem.note === 'undefined' || $scope.currentItem.note === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please type some note"
            return;
        }
        if (typeof $scope.currentItem.photo === 'undefined' || $scope.currentItem.photo === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please take a photo"
            return;
        }else {
	        $cordovaSocialSharing.canShareVia("twitter", message, image, link).then(function(result) {
	            $cordovaSocialSharing.shareViaTwitter(message, image, link);
	        }, function(error) {
	            alert("Cannot share on Twitter");
	        });
	    }
    }

    $scope.shareViaFacebook = function(message, image, link) {
    	if (typeof $scope.currentItem.note === 'undefined' || $scope.currentItem.note === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please type some note"
            return;
        }
        if (typeof $scope.currentItem.photo === 'undefined' || $scope.currentItem.photo === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please take a photo"
            return;
        }else {
	        $cordovaSocialSharing.shareViaFacebook(message, image, link).then(function(result) {
	            alert("Share on Facebook Success");
	        }, function(error) {
	            alert("Cannot share on Facebook");
	        });
	    }
    }

    // SAVE
    $scope.savePosting = function () {

        // Validate form data
        if (typeof $scope.currentItem.typedisplay === 'undefined' || $scope.currentItem.typedisplay === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please select News Type"
            return;
        }
        if (typeof $scope.currentItem.title === 'undefined' || $scope.currentItem.title === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please create a Title"
            return;
        }
        if (typeof $scope.currentItem.note === 'undefined' || $scope.currentItem.note === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please create a Note"
            return;
        }

        // Format date
        $scope.currentItem.date = new Date();
        if (typeof $scope.currentItem.date === 'undefined' || $scope.currentItem.date === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please select a date for this transaction"
            return;
        }

        if ($scope.inEditMode) {
            //
            // Update Existing Transaction
            //
            var onComplete = function (error) {
                if (error) {
                    //console.log('Synchronization failed');
                }
            };
            AccountsFactory.saveTransaction($scope.currentItem);
            var accountId = '';
            var otherAccountId = '';
            var OtherTransaction = {};
            if ($scope.ItemOriginal.istransfer) {
                if ($stateParams.accountId === $scope.currentItem.accountToId) {
                    // Transfer is coming into the current account --> income
                    $scope.currentItem.type = 'Income';
                    accountId = $scope.currentItem.accountToId;
                    otherAccountId = $scope.currentItem.accountFromId;
                    OtherTransaction.type = 'Expense';
                    OtherTransaction.amount = $scope.currentItem.amount;
                } else {
                    // Transfer is moving into the other account --> expense
                    $scope.currentItem.type = 'Expense';
                    accountId = $scope.currentItem.accountFromId;
                    otherAccountId = $scope.currentItem.accountToId;
                    OtherTransaction.type = 'Income';
                    OtherTransaction.amount = $scope.currentItem.amount;
                }

                console.log(OtherTransaction);

                var transferRef = AccountsFactory.getTransactionRef(otherAccountId, $scope.ItemOriginal.linkedtransactionid);
                transferRef.update(OtherTransaction);
            }

            $scope.inEditMode = false;
            //
        } else {
            $scope.currentItem.addedby = myCache.get('thisUserName');
            $scope.currentItem.userid = myCache.get('thisMemberId');
            //
            AccountsFactory.createPosting($scope.currentItem);
        }
        $scope.currentItem = {};
        $ionicHistory.goBack();
    }
})

.controller('PostCtrl', function($scope, $state, $stateParams, NewsFactory, $ionicFilterBar, $ionicListDelegate, PickTransactionServices, CurrentUserService, myCache) {

  $scope.posts = [];
    $scope.userId = myCache.get('thisMemberId');
    $scope.photo = {
        userid: ''
    };

    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if (fromState.name === "app.post") {
            refresh($scope.posts, $scope, NewsFactory);
        }
    });

    NewsFactory.getPost($stateParams.postId).then(function (post) {
      $scope.title = post.title;
      $scope.date = post.date;
      $scope.note = post.note;
      $scope.typedisplay = post.typedisplay;
      $scope.photo = post.photo;
      $scope.likes = post.likes;
      $scope.comments = post.comments;
    });

    

    $scope.doRefresh = function (){

      $scope.posts = NewsFactory.getPost($stateParams.postId);
      scope.posts.$loaded().then(function (x) {
      refresh($scope.news, $scope, NewsFactory, $stateParams.postId);
          $scope.$broadcast('scroll.refreshComplete');
      }).catch(function (error) {
          console.error("Error:", error);
      });

    };

    function refresh(posts, $scope, NewsFactory) {
    
    }

})

.controller('NewsTypeCtrl', function ($scope, $ionicHistory, PickTransactionServices) {
    $scope.NewsTypeList = [
        { text: 'News', value: 'News' },
        { text: 'Tutorial', value: 'Tutorial' },
        { text: 'Tips', value: 'Tips' }];
    $scope.currentItem = { typedisplay: PickTransactionServices.typeDisplaySelected };
    $scope.itemchanged = function (item) {
        PickTransactionServices.updateType(item.value, item.value);
        $ionicHistory.goBack();
    };
})

.controller('NewsTitleCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

    if (typeof PickTransactionServices.titleSelected !== 'undefined' && PickTransactionServices.titleSelected !== '') {
        $scope.title = PickTransactionServices.titleSelected;
    }
    $scope.saveNote = function () {
        PickTransactionServices.updateTitle($scope.title);
        $ionicHistory.goBack();
    };

})

.controller('NewsContentCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

    if (typeof PickTransactionServices.noteSelected !== 'undefined' && PickTransactionServices.noteSelected !== '') {
        $scope.note = PickTransactionServices.noteSelected;
    }
    $scope.saveNote = function () {
        PickTransactionServices.updateNote($scope.note);
        $ionicHistory.goBack();
    };

})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
