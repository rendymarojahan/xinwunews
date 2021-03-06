angular.module('starter.services', [])

.factory('Auth', function ($firebaseAuth) {
        return $firebaseAuth(fb);
})

.factory('myCache', function ($cacheFactory) {
        return $cacheFactory('myCache', function ($cacheFactory) {
            return $cacheFactory('myCache');
        });
})

.factory('MembersFactory', function ($firebaseArray, $q, myCache, $timeout) {
        var ref = fb.child("admins");
        return {
            ref: function () {
                return ref;
            },
            getMember: function (authData) {
                var deferred = $q.defer();
                var memberRef = ref.child(authData.uid);
                memberRef.once("value", function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            updateMember: function (userId) {
                var deferred = $q.defer();
                var memberRef = ref.child(userId);
                memberRef.once("value", function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            getMemberByCode: function (thisGroup) {
                var deferred = $q.defer();
                var matches = members.filter(function (member) {
                if (member.group_id.toLowerCase().indexOf(thisGroup.toLowerCase()) !== -1) {
                    return true;
                    }
                });
                $timeout(function () {
                deferred.resolve(matches);
                }, 100);
                return deferred.promise;
            },
        };
})

.factory('GroupFactory', function ($state, $q, myCache) {
        //
        // https://github.com/oriongunning/myExpenses
        //
        var authData = fb.getAuth();
        var ref = fb.child("groups");
        return {
            ref: function () {
                return ref;
            },
            getGroupByCode: function (code) {
                var deferred = $q.defer();
                ref.orderByChild("join_code").startAt(code)
                    .endAt(code)
                    .once('value', function (snap) {
                        if (snap.val()) {
                            var group, group_id;
                            angular.forEach(snap.val(), function (value, key) {
                                group = value;
                                group_id = key;
                            });
                            if (group.join_code === code) {
                                deferred.resolve(group_id);
                            }
                        }
                    }, function (errorObject) {
                        console.log("The read failed: " + errorObject.code);
                    });
                return deferred.promise;
            },
            getGroups: function () {
                var deferred = $q.defer();
                ref.once('value', function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            joinGroup: function (id) {
                var temp = {
                    group_id: id
                }
                var memberRef = fb.child("members").child(authData.uid);
                memberRef.update(temp);
                memberRef.setPriority(id);
            },
            createGroup: function (group) {

                /* PREPARE GROUP DATA */
                var currentGroup = {
                    name: group.name,
                    admin: authData.password.email,
                    created: Date.now(),
                    updated: Date.now(),
                    join_code: RandomHouseCode() + group.name,
                    groupid: ''
                };

                /* SAVE GROUP */
                var ref = fb.child("groups");
                var newChildRef = ref.push(currentGroup);
                
                /* Save group_id for later use */
                myCache.put('thisGroupId', newChildRef.key());

                /* UPDATE USER WITH GROUP ID AND SET PRIORITY */
                var temp = {
                    group_id: newChildRef.key(),
                    group_name: group.name,
                    group_join_code: RandomHouseCode() + 1
                };
                var memberRef = fb.child("members").child(authData.uid);
                memberRef.update(temp);
                memberRef.setPriority(newChildRef.key());

                
            }
        };
})

.factory('NewsFactory', function ($firebaseArray, $q, myCache, MembersFactory, CurrentUserService) {
        var ref = {};
        var publicRef = {};
        var likes = {};
        var comments = {};
        var thisPublicId = CurrentUserService.public_id;
        var thisUserId = myCache.get('thisMemberId');
        var thisUserEmail = myCache.get('thisUserEmail');
        return {
            ref: function () {
                ref = fb.child("postings").child("Tips");
                return ref;
            },
            getPost: function (postid, newstype) {
                var deferred = $q.defer();
                ref = fb.child("postings").child(newstype).child(postid);
                ref.once("value", function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            createLikes: function (postid, email, newstype) {
                fb.child("postings").child(newstype).child(postid).child("likers").orderByChild("likeremail").startAt(email)
                .endAt(email)
                .once('value', function (snap) {
                    if (snap.val()) {
                        alert("You have like this post");
                    }else{
                        var ref = fb.child("postings").child(newstype).child(postid).child("likers");
                        ref.push({   likeremail: email
                              });

                        likes = fb.child("postings").child(newstype).child(postid);
                        likes.once("value", function (snap) {
                            var data = snap.val();
                            var temp = {
                                likes: data.likes + 1
                            }
                            fb.child("postings").child(newstype).child(postid).update(temp);
                        });
                    }
                }, function (errorObject) {
                    console.log("The read failed: " + errorObject.code);
                });
            },
            getNewsComments: function (postid, newstype) {
                ref = fb.child("postings").child(newstype).child(postid).child("commentars");
                comments = $firebaseArray(ref);
                return comments;
            },
            createComment: function (postid, postcomment, newstype) {
                var ref = fb.child("postings").child(newstype).child(postid).child("commentars");
                ref.push(postcomment);

                comments = fb.child("postings").child(newstype).child(postid);
                comments.once("value", function (snap) {
                    var data = snap.val();
                    var temp = {
                        comments: data.comments + 1
                    }
                    fb.child("postings").child(newstype).child(postid).update(temp);
                });

            },
            getNews: function () {
                ref = fb.child("postings").child("News").orderByChild('date');
                publicRef = $firebaseArray(ref);
                return publicRef;
            },
            getTutorial: function () {
                ref = fb.child("postings").child("Tutorial").orderByChild('date');
                publicRef = $firebaseArray(ref);
                return publicRef;
            },
            getTips: function () {
                ref = fb.child("postings").child("Tips").orderByChild('date');
                publicRef = $firebaseArray(ref);
                return publicRef;
            },
            getNew: function () {
                var deferred = $q.defer();
                ref = fb.child("postings");
                ref.on("child_added", function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            getPosting: function (postingid) {
                var thisPosting = publicRef.$getRecord(postingid);
                return thisPosting;
            },
            createPosting: function (currentItem) {
                if (currentItem.typedisplay === "News") {
                    var ref = fb.child("postings").child("News");
                    var newChildRef = ref.push(currentItem);
                } else if (currentItem.typedisplay === "Tutorial") {
                    var ref = fb.child("postings").child("Tutorial");
                    var newChildRef = ref.push(currentItem);
                } else if (currentItem.typedisplay === "Tips") {
                    var ref = fb.child("postings").child("Tips");
                    ref.push({   name: currentItem.addedby,
                                 typedisplay: currentItem.typedisplay, 
                                 title: currentItem.title,
                                 userid: currentItem.userid,
                                 note: currentItem.note,
                                 photo: CurrentUserService.photo,
                                 date: currentItem.date,
                                 likes:0,
                                 likers:'',
                                 commentars:'',
                                 isphoto:currentItem.isphoto,
                                 comments:0
                              });
                }
                
                // Update preferences - Last Date Used
                //
                var fbAuth = fb.getAuth();
                var usersRef = MembersFactory.ref();
                var myUser = usersRef.child(fbAuth.uid);
                var temp = {
                    lastdate: currentItem.date
                }
                myUser.update(temp, function () {
                    CurrentUserService.lastdate = temp.lastdate;
                });
            },
            deletePost: function () {
                return publicRef;
            },
            savePosting: function (posting) {
                publicRef.$save(posting).then(function (ref) {
                    //ref.key() = posting.$id;
                });
            }
            
            
        };
})

.factory('AccountsFactory', function ($firebaseArray, $q, myCache, MembersFactory, CurrentUserService) {
        var ref = {};
        var allaccounts = {};
        var allaccounttypes = {};
        var alltransactions = {};
        var transactionRef = {};
        var grouptransaction = {};
        //var transactionsbycategoryRef = {};
        //var transactionsbypayeeRef = {};
        var thisGroupId = myCache.get('thisGroupId');
        var thisMemberId = myCache.get('thisMemberId');
        return {
            ref: function () {
                ref = fb.child("members").child(thisMemberId).child("member_accounts");
                return ref;
            },
            getAccounts: function () {
                ref = fb.child("members").child(thisMemberId).child("member_accounts");
                allaccounts = $firebaseArray(ref);
                return allaccounts;
            },
            getAccount: function (accountid) {
                var thisAccount = allaccounts.$getRecord(accountid);
                return thisAccount;
            },
            getAccountTypes: function () {
                ref = fb.child("members").child(thisMemberId).child("member_account_types");
                allaccounttypes = $firebaseArray(ref);
                return allaccounttypes;
            },
            getTransaction: function (transactionid) {
                var thisTransaction = alltransactions.$getRecord(transactionid);
                return thisTransaction;
            },
            getGroupTransaction: function () {
                ref = fb.child("members").child(thisMemberId).child("member_transactions");
                grouptransaction = $firebaseArray(ref);
                return grouptransaction;
            },
            getTransactionsByDate: function (accountid) {
                ref = fb.child("members").child(thisMemberId).child("member_transactions").child(accountid).orderByChild('date');
                alltransactions = $firebaseArray(ref);
                return alltransactions;
            },
            getTransactionRef: function (accountid, transactionid) {
                transactionRef = fb.child("members").child(thisMemberId).child("member_transactions").child(accountid).child(transactionid);
                return transactionRef;
            },
            createNewAccount: function (currentItem) {
                // Create the account
                allaccounts.$add(currentItem).then(function (newChildRef) { });
            },
            saveAccount: function (account) {
                allaccounts.$save(account).then(function (ref) {
                    
                });
            },
            createPosting: function (currentItem) {
                if (currentItem.typedisplay === "News") {
                    var ref = fb.child("postings").child("News");
                    var newChildRef = ref.push(currentItem);
                } else if (currentItem.typedisplay === "Tutorial") {
                    var ref = fb.child("postings").child("Tutorial");
                    var newChildRef = ref.push(currentItem);
                } else if (currentItem.typedisplay === "Tips") {
                    var ref = fb.child("postings").child("Tips");
                    ref.push({   name: currentItem.addedby, 
                                 title: currentItem.title,
                                 userid: currentItem.userid,
                                 note: currentItem.note,
                                 photo: CurrentUserService.photo,
                                 date: currentItem.date,
                                 likes:'',
                                 isphoto:currentItem.isphoto,
                                 comments:''
                              });
                }
                
                // Update preferences - Last Date Used
                //
                var fbAuth = fb.getAuth();
                var usersRef = MembersFactory.ref();
                var myUser = usersRef.child(fbAuth.uid);
                var temp = {
                    lastdate: currentItem.date
                }
                myUser.update(temp, function () {
                    CurrentUserService.lastdate = temp.lastdate;
                });
            },
            deleteTransaction: function () {
                return alltransactions;
            },
            saveTransaction: function (transaction) {
                alltransactions.$save(transaction).then(function (ref) {
                    //ref.key() = transaction.$id;
                });
            }
        };
})

    // Current User
.service("CurrentUserService", function () {
        var thisUser = this;
        thisUser.updateUser = function (user) {
            this.firstname = user.firstname;
            this.surename = user.surename;
            this.email = user.email;
            this.defaultdate = user.defaultdate;
            this.lastdate = user.lastdate;
            this.photo = user.photo;
            this.isadmin = user.isadmin;
            this.birthday = user.birthday;
            this.phone = user.phone;
        }
})

.service("CurrentVisitorService", function () {
        var thisUser = this;
        thisUser.updateUser = function (user) {
            this.displayName = user.displayName;
            this.email = user.email;
            this.emailVerified = user.emailVerified;
            this.photoURL = user.photoURL;
            this.uid = user.uid;
            this.providerData = providerData;
        }
})
    // Transaction Pick Lists
.service("PickTransactionServices", function () {
        var transactionType = this;
        var transCategory = this;
        var transPayee = this;
        var transDate = this;
        var transAmount = this;
        var transAccount = this;
        var transAccountFrom = this;
        var transAccountTo = this;
        var transPhoto = this;
        var transVideo = this;
        var transNote = this;
        var transTitle = this;
        var transSearch = this;
        var transLikes = this;
        var transComments = this;
        transactionType.updateType = function (value, type) {
            this.typeDisplaySelected = value;
            this.typeInternalSelected = type;
        }
        transCategory.updateCategory = function (value, id) {
            this.categorySelected = value;
            this.categoryid = id;
        }
        transPayee.updatePayee = function (payee, id, type) {
            this.payeeSelected = payee.payeename;
            if (type === "Income") {
                this.categorySelected = payee.lastcategoryincome;
                this.categoryid = payee.lastcategoryidincome;
                this.amountSelected = payee.lastamountincome;
                this.payeeid = id;
            } else if (type === "Expense") {
                this.categorySelected = payee.lastcategory;
                this.categoryid = payee.lastcategoryid;
                this.amountSelected = payee.lastamount;
                this.payeeid = id;
            }
        }
        transDate.updateDate = function (value) {
            this.dateSelected = value;
        }
        transDate.updateTime = function (value) {
            this.timeSelected = value;
        }
        transAmount.updateAmount = function (value) {
            this.amountSelected = value;
        }
        transAccount.updateAccount = function (value, id) {
            this.accountSelected = value;
            this.accountId = id;
        }
        transAccountFrom.updateAccountFrom = function (value, id) {
            this.accountFromSelected = value;
            this.accountFromId = id;
        }
        transAccountTo.updateAccountTo = function (value, id) {
            this.accountToSelected = value;
            this.accountToId = id;
        }
        transPhoto.updatePhoto = function (value) {
            this.photoSelected = value;
        }
        transVideo.updateVideo = function (value) {
            this.videoSelected = value;
        }
        transNote.updateNote = function (value) {
            this.noteSelected = value;
        }
        transTitle.updateTitle = function (value) {
            this.titleSelected = value;
        }
        transSearch.updateSearch = function (value) {
            this.searchSelected = value;
        }
        transLikes.updateLikes = function (value) {
            this.likesSelected = value;
        }
        transComments.updateComments = function (value) {
            this.commentsSelected = value;
        }
})

.filter('reverselist', function () {
        function toArray(list) {
            var k, out = [];
            if (list) {
                if (angular.isArray(list)) {
                    out = list;
                }
                else if (typeof (list) === 'object') {
                    for (k in list) {
                        if (list.hasOwnProperty(k)) {
                            out.push(list[k]);
                        }
                    }
                }
            }
            return out;
        }
        return function (items) {
            return toArray(items).slice().reverse();
        };
})

.filter('filtered', function (type) {
        return function (list) {
            var filtered = {};
            angular.forEach(list, function (transaction, id) {
                if (type === 'active') {
                    if (!transaction.iscleared) {
                        filtered[id] = transaction;
                    }
                } else if (type === 'cleared') {
                    if (transaction.iscleared) {
                        filtered[id] = transaction;
                    }
                } else {
                    filtered[id] = transaction;
                }
            });
            return filtered;
        };
})

    // 
    // http://gonehybrid.com/how-to-group-items-in-ionics-collection-repeat/
    //
.filter('groupByMonthYear', function ($parse) {
        var dividers = {};
        return function (input) {
            if (!input || !input.length) {
                return;
            }
            var output = [],
                previousDate,
                currentDate,
                item;
            for (var i = 0, ii = input.length; i < ii && (item = input[i]) ; i++) {
                currentDate = moment(item.date);
                if (!previousDate ||
                    currentDate.month() !== previousDate.month() ||
                    currentDate.year() !== previousDate.year()) {
                    var dividerId = currentDate.format('MMYYYY');
                    if (!dividers[dividerId]) {
                        dividers[dividerId] = {
                            isDivider: true,
                            divider: currentDate.format('MMMM YYYY')
                        };
                    }
                    output.push(dividers[dividerId]);
                }
                output.push(item);
                previousDate = currentDate;
            }
            return output;
        };
})

    // 
    // http://gonehybrid.com/how-to-group-items-in-ionics-collection-repeat/
    //
.filter('groupByDayMonthYear', function ($parse) {
        var dividers = {};
        return function (input) {
            if (!input || !input.length) {
                return;
            }
            var output = [],
                previousDate,
                previousDividerId,
                currentDate,
                item;
            for (var i = 0, ii = input.length; i < ii && (item = input[i]) ; i++) {
                currentDate = moment(item.date);
                var dividerId = moment(currentDate).format('YYYYMMDD');
                if (!previousDate || previousDividerId !== dividerId) {
                    //console.log(dividerId);
                    //console.log(item);
                    if (!dividers[dividerId]) {
                        dividers[dividerId] = {
                            isDivider: true,
                            _id: dividerId,
                            divider: currentDate.format('dddd, MMMM DD, YYYY')
                        };
                    }
                    output.push(dividers[dividerId]);
                }
                output.push(item);
                previousDate = currentDate;
                previousDividerId = dividerId
            }
            //console.log(output);
            return output;
        };
})

    
;

function RandomHouseCode() {
    return Math.floor((Math.random() * 100000000) + 100);
}