angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope, $firebaseAuth, $cordovaOauth, $stateParams, $ionicHistory, $cacheFactory, $ionicLoading, $ionicPopup, $state, MembersFactory, myCache, CurrentUserService) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  var auth = $firebaseAuth(fb);
 
  $scope.loginGoogle = function() {
      $cordovaOauth.google("650716399232-al2qqn4rut5sd3qsmt5hrtbfpc932pb0.apps.googleusercontent.com", ["https://www.googleapis.com/auth/urlshortener", "https://www.googleapis.com/auth/userinfo.email", 
      "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/plus.me"]).then(function(result) {
          auth.$authWithOAuthToken("google", result.access_token).then(function(authData) {
              console.log("google login success");
              console.log(JSON.stringify(authData));
              $http({method:"GET", url:"https://www.googleapis.com/plus/v1/people/me?access_token="+result.access_token}).
                success(function(response){
                         console.log(response);
                        var param = {
                          provider: 'google',
                            google: {
                                          uid: response["id"],
                                          provider: 'google',
                                          first_name: response["name"]["givenName"],
                                          last_name: response["name"]["familyName"],
                                          email: response.emails[0]["value"],
                                          image: response.image.url
                                      }
                          };
                          console.log(param);
                }, function(error) {
                  console.log(error);
                });
              $scope.modal.hide();
              $state.reload('app.news');
          }, function(error) {
              console.error("ERROR: " + error);
          });
      }, function(error) {
          console.log("ERROR: " + error);
      });
  }


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
                    myCache.put('thisUserName', $scope.fullname());
                    myCache.put('thisMemberId', authData.uid);
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

  $scope.isadmin = CurrentUserService.isadmin;
    $scope.$on('$ionicView.beforeEnter', function () {
        if (typeof CurrentUserService.isadmin !== 'undefined' && CurrentUserService.isadmin !== '') {
            $scope.isadmin = CurrentUserService.isadmin;
    }
  });

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
  $scope.new = [];
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

    	$scope.news = NewsFactory.getNews();
      $scope.news.$loaded().then(function (x) {
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
        PickTransactionServices.videoSelected = '';
        $state.go('app.posting');
    }

    function refresh(news, $scope, NewsFactory) {
    
    }
})

.controller('TutorialCtrl', function($scope, $state, $stateParams, NewsFactory, $ionicFilterBar, $ionicListDelegate, PickTransactionServices, CurrentUserService, myCache) {
  $scope.news = [];
  $scope.new = [];
  $scope.isshow = false;
    $scope.userId = myCache.get('thisMemberId')
    $scope.photo = CurrentUserService.photo;

    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if (fromState.name === "app.news") {
            refresh($scope.news, $scope, NewsFactory);
        }
    });

    $scope.news = NewsFactory.getTutorial();
    $scope.news.$loaded().then(function (x) {
      refresh($scope.news, $scope, NewsFactory);
    }).catch(function (error) {
        console.error("Error:", error);
    });

    $scope.doRefresh = function (){

      $scope.news = NewsFactory.getTutorial();
      $scope.news.$loaded().then(function (x) {
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
        PickTransactionServices.videoSelected = '';
        $state.go('app.posting');
    }

    function refresh(news, $scope, NewsFactory) {
    
    }
})

.controller('TipsCtrl', function($scope, $state, $stateParams, NewsFactory, $ionicFilterBar, $ionicListDelegate, PickTransactionServices, CurrentUserService, myCache) {
  $scope.news = [];
  $scope.new = [];
  $scope.isshow = false;
    $scope.userId = myCache.get('thisMemberId')
    $scope.photo = CurrentUserService.photo;

    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if (fromState.name === "app.news") {
            refresh($scope.news, $scope, NewsFactory);
        }
    });

    $scope.news = NewsFactory.getTips();
    $scope.news.$loaded().then(function (x) {
      refresh($scope.news, $scope, NewsFactory);
    }).catch(function (error) {
        console.error("Error:", error);
    });

    $scope.doRefresh = function (){

      $scope.news = NewsFactory.getTips();
      $scope.news.$loaded().then(function (x) {
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
        PickTransactionServices.videoSelected = '';
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
        'video': '',
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
        $scope.video = "https://www.youtube.com/embed/";
        $scope.currentItem.video = $scope.video+PickTransactionServices.videoSelected;
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
            $scope.currentItem.likes = '';
            $scope.currentItem.comments = '';
            $scope.currentItem.date = Firebase.ServerValue.TIMESTAMP;
            $scope.currentItem.addedby = myCache.get('thisUserName');
            $scope.currentItem.userid = myCache.get('thisMemberId');
            //
            AccountsFactory.createPosting($scope.currentItem);
            PickTransactionServices.typeDisplaySelected = '';
            PickTransactionServices.typeInternalSelected = '';
            PickTransactionServices.dateSelected = '';
            PickTransactionServices.photoSelected = 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            PickTransactionServices.noteSelected = '';
            PickTransactionServices.titleSelected = '';
            PickTransactionServices.videoSelected = '';                                   
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

.controller('NewsVideoCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

    if (typeof PickTransactionServices.videoSelected !== 'undefined' && PickTransactionServices.videoSelected !== '') {
        $scope.video = PickTransactionServices.videoSelected;
    }
    $scope.saveVideo = function () {
        PickTransactionServices.updateVideo($scope.video);
        $ionicHistory.goBack();
    };

})

.controller('ProfileCtrl', function ($scope, $state, $ionicLoading, $ionicHistory, MembersFactory, CurrentUserService, PickTransactionServices, $cordovaCamera, $ionicActionSheet, $cordovaDevice, $cordovaFile, $ionicPopup, myCache) {

  $scope.user = {};
  $scope.isphoto = false;
  $scope.firstname = CurrentUserService.firstname;
  $scope.surename = CurrentUserService.surename;
  $scope.phone = CurrentUserService.phone;
  $scope.photo = CurrentUserService.photo;
  $scope.currentItem = {'photo': ''};
  $scope.$on('$ionicView.beforeEnter', function () {
      $scope.hideValidationMessage = true;
      $scope.currentItem.photo = PickTransactionServices.photoSelected;
      if ($scope.currentItem.photo === '') {
          $scope.currentItem.photo = 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
      }
  });

  $scope.doAction = function() {

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
                        $scope.isphoto = true;
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
                        $scope.isphoto = true;
                    }, function (error) {
                        console.error(error);
                    })
              
                break;
              }
              return true;
        },
      cancelText: 'Cancel',
        cancel: function() {
        console.log('CANCELLED');}
    }); 
  }
   
  $scope.createMember = function (user) {

      var userId = myCache.get('thisMemberId');

      // Validate form data
      if (typeof user.firstname === 'undefined' || user.firstname === '') {
          $scope.hideValidationMessage = false;
          user.firstname = CurrentUserService.firstname;
          return;
      }
      if (typeof user.surename === 'undefined' || user.surename === '') {
          $scope.hideValidationMessage = false;
          user.surename = CurrentUserService.surename;
          return;
      }
      if (typeof user.phone === 'undefined' || user.phone === '') {
          $scope.hideValidationMessage = false;
          user.phone = CurrentUserService.phone;
          return;
      }

      $ionicLoading.show({
          template: '<ion-spinner icon="ios"></ion-spinner><br>Registering...'
      });

      
      var photo = $scope.currentItem.photo;
      if (typeof photo === 'undefined') {
        photo = CurrentUserService.photo;
      }
      /* PREPARE DATA FOR FIREBASE*/
      $scope.temp = {
          firstname: user.firstname,
          surename: user.surename,
          phone: user.phone,
          photo: photo,
          datecreated: Date.now(),
          dateupdated: Date.now()
      }


      /* SAVE MEMBER DATA */
      var membersref = MembersFactory.ref();
      var newUser = membersref.child(userId);
      newUser.update($scope.temp, function (ref) {
      addImage = newUser.child("images");
      });

      MembersFactory.updateMember(userId).then(function (thisuser) {

        $scope.firstname = thisuser.firstname;
        $scope.surename = thisuser.surename;
        $scope.fullname = function (){
          return $scope.firstname +" "+ $scope.surename;
        };
          
          /* Save user data for later use */
          myCache.put('thisUserName', $scope.fullname());
          CurrentUserService.updateUser(thisuser);
      });

      $ionicLoading.hide();
      $ionicHistory.goBack();
  };

})

.controller('AdminCtrl', function($scope, $state, $ionicLoading, $ionicHistory, MembersFactory, CurrentUserService, PickTransactionServices, $cordovaCamera, $ionicActionSheet, $cordovaDevice, $cordovaFile, $ionicPopup, myCache) {

  $scope.user = {};
  $scope.currentItem = {'photo': ''};
  $scope.$on('$ionicView.beforeEnter', function () {
        $scope.hideValidationMessage = true;
        $scope.currentItem.photo = PickTransactionServices.photoSelected;
        if ($scope.currentItem.photo === '') {
            $scope.currentItem.photo = 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        }
    });
    $scope.goToLogIn = function () {
        $state.go('login');
    };

    $scope.doAction = function() {
  
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
                    }, function (error) {
                        console.error(error);
                    })
              
                break;
              }
              return true;
        },
      cancelText: 'Cancel',
        cancel: function() {
        console.log('CANCELLED');}
    }); 
  }
   
    $scope.createMember = function (user) {
        var email = user.email;
        var password = user.password;

        // Validate form data
        if (typeof user.firstname === 'undefined' || user.firstname === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please enter your first name"
            return;
        }
        if (typeof user.surename === 'undefined' || user.surename === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please enter your surename"
            return;
        }
        if (typeof user.email === 'undefined' || user.email === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please enter your email"
            return;
        }
        if (typeof user.password === 'undefined' || user.password === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please enter your password"
            return;
        }
        if (typeof user.phone === 'undefined' || user.phone === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please enter your phone"
            return;
        }
        if (typeof user.birthday === 'undefined' || user.birthday === '') {
            $scope.hideValidationMessage = false;
            $scope.validationMessage = "Please enter your birthday"
            return;
        }

        $ionicLoading.show({
            template: '<ion-spinner icon="ios"></ion-spinner><br>Registering...'
        });

        fb.createUser({
            email: user.email,
            password: user.password
        }, function (error, userData) {
            if (error) {
                switch (error.code) {
                    case "EMAIL_TAKEN":
                        $ionicLoading.hide();
                        $ionicPopup.alert({title: 'Register Failed', template: 'The email entered is already in use!'});
                        break;
                    case "INVALID_EMAIL":
                        $ionicLoading.hide();
                        $ionicPopup.alert({title: 'Register Failed', template: 'The specified email is not a valid email!'});
                        break;
                    default:
                        $ionicLoading.hide();
                        $ionicPopup.alert({title: 'Register Failed', template: 'Oops. Something went wrong!'});
                }
            } else {
                fb.authWithPassword({
                    "email": user.email,
                    "password": user.password
                }, function (error, authData) {
                    if (error) {
                        $ionicLoading.hide();
                        $ionicPopup.alert({title: 'Register Failed', template: 'Error. Login failed!'});
                    } else {

                      if ($scope.currentItem.photo === 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==') {
                      $scope.currentItem.photo = '';
                }
                var photo = $scope.currentItem.photo;
                if (typeof photo === 'undefined') {
                  photo = '';
                }
                        /* PREPARE DATA FOR FIREBASE*/
                        $scope.temp = {
                            firstname: user.firstname,
                            surename: user.surename,
                            email: user.email,
                            phone: user.phone,
                            birthday: user.birthday,
                            isadmin: true,
                            photo: photo,
                            datecreated: Date.now(),
                            dateupdated: Date.now()
                        }


                        /* SAVE MEMBER DATA */
                        var membersref = MembersFactory.ref();
                        var newUser = membersref.child(authData.uid);
                        newUser.update($scope.temp, function (ref) {
                        addImage = newUser.child("images");
                        });

                        $ionicLoading.hide();
                        $ionicHistory.goBack();
                    }
                });
            }
        });
    };

})

.controller('MnewsCtrl', function ($scope, $ionicHistory, PickTransactionServices, NewsFactory) {

  $scope.data = {
    showDelete: false
  };
  
  $scope.edit = function(item) {
    alert('Edit Item: ' + item.id);
  };
  $scope.share = function(item) {
    alert('Share Item: ' + item.id);
  };
  
  $scope.moveItem = function(item, fromIndex, toIndex) {
    $scope.items.splice(fromIndex, 1);
    $scope.items.splice(toIndex, 0, item);
  };
  
  $scope.onItemDelete = function(item) {
    $scope.items.splice($scope.items.indexOf(item), 1);
  };
  
  $scope.items = [];
  $scope.items = NewsFactory.getNews();
    $scope.items.$loaded().then(function (x) {
      refresh($scope.items, $scope, NewsFactory);
    }).catch(function (error) {
        console.error("Error:", error);
  });

  function refresh(items, $scope, NewsFactory) {
    
    }

})

.controller('MtutorialCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

})

.controller('MtipsCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

})

.controller('AboutCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

})

.controller('NewsContentCtrl', function ($scope, $ionicHistory, PickTransactionServices) {

    if (typeof PickTransactionServices.noteSelected !== 'undefined' && PickTransactionServices.noteSelected !== '') {
        $scope.note = PickTransactionServices.noteSelected;
    }
    $scope.saveNote = function () {
        PickTransactionServices.updateNote($scope.note);
        $ionicHistory.goBack();
    };

});
