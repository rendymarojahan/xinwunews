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
        var mRef = {};
        var members = {};
        mRef = fb.child("members").orderByChild('group_id');
        members = $firebaseArray(mRef);
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

.factory('CategoriesFactory', function ($firebaseArray, $q, myCache) {
        var ref = {};
        var categories = {};
        var parentcategories = {};
        var categoriesByType = {};
        var categoryRef = {};
        var thisGroupId = myCache.get('thisGroupId');
        var thisMemberId = myCache.get('thisMemberId');
        return {
            getCategories: function (type) {
                ref = fb.child("members").child(thisMemberId).child("membercategories").child(type).orderByChild('categoryname');
                categories = $firebaseArray(ref);
                return categories;
            },
            getParentCategories: function (type) {
                ref = fb.child("members").child(thisMemberId).child("membercategories").child(type).orderByChild('categoryparent');
                parentcategories = $firebaseArray(ref);
                return parentcategories;
            },
            getCategoriesByTypeAndGroup: function (type) {
                ref = fb.child("members").child(thisMemberId).child("membercategories").child(type).orderByChild('categoryparent');
                categoriesByType = $firebaseArray(ref);
                return categoriesByType;
            },
            getCategory: function (categoryid, type) {
                var deferred = $q.defer();
                ref = fb.child("members").child(thisMemberId).child("membercategories").child(type).child(categoryid);
                ref.once("value", function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            getCategoryRef: function (categoryid, type) {
                categoryRef = fb.child("members").child(thisMemberId).child("membercategories").child(type).child(categoryid);
                return categoryRef;
            },
        };
})

.factory('PublicsFactory', function ($firebaseArray, $q, myCache, MembersFactory, CurrentUserService) {
        var ref = {};
        var publicRef = {};
        var thisPublicId = CurrentUserService.public_id;
        var thisUserId = myCache.get('thisMemberId');
        return {
            ref: function () {
                ref = fb.child("publics").child(thisPublicId).child(thisUserId);
                return ref;
            },
            getPublics: function () {
                ref = fb.child("publics").child(thisPublicId).child(thisUserId);
                publicRef = $firebaseArray(ref);
                return publicRef;
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
            //getTransactionByCategoryRef: function (categoryid, transactionid) {
            //    transactionsbycategoryRef = fb.child("groups").child(thisGroupId).child("membertransactionsbycategory").child(categoryid).child(transactionid);
            //    return transactionsbycategoryRef;
            //},
            //getTransactionByPayeeRef: function (payeeid, transactionid) {
            //    transactionsbypayeeRef = fb.child("groups").child(thisGroupId).child("membertransactionsbypayee").child(payeeid).child(transactionid);
            //    return transactionsbypayeeRef;
            //},
            createNewAccount: function (currentItem) {
                // Create the account
                allaccounts.$add(currentItem).then(function (newChildRef) { });
            },
            saveAccount: function (account) {
                allaccounts.$save(account).then(function (ref) {
                    
                });
            },
            createTransaction: function (currentAccountId, currentItem) {
                //
                var otherAccountId = '';
                var OtherTransaction = {};
                //
                if (currentItem.istransfer) {
                    angular.copy(currentItem, OtherTransaction);
                    if (currentAccountId === currentItem.accountToId) {
                        //For current account: transfer is coming into the current account as an income
                        currentItem.type = 'Income';
                        accountId = currentItem.accountToId;
                        otherAccountId = currentItem.accountFromId;
                        OtherTransaction.type = 'Expense';
                    } else {
                        //For current account: transfer is moving into the other account as an expense
                        currentItem.type = 'Expense';
                        accountId = currentItem.accountFromId;
                        otherAccountId = currentItem.accountToId;
                        OtherTransaction.type = 'Income';
                    }
                } else {
                    currentAccountId = currentItem.accountId;
                }
                //
                // Save transaction
                //
                var ref = fb.child("members").child(thisMemberId).child("member_transactions").child(currentAccountId);
                var newChildRef = ref.push(currentItem);
                // Save posting public
                var publicId = myCache.get('thisPublicId');
                if (publicId = 'undefined'){
                    var publicId = myCache.get('thisPublicId');
                    var refPublic = fb.child("publics").child(publicId).child(currentItem.userid);
                    refPublic.push({ name: currentItem.addedby, 
                                     location: currentItem.payee,
                                     note: currentItem.note,
                                     photo: currentItem.photo,
                                     date: currentItem.date,
                                     likes:'',
                                     views:'',
                                     comments:''
                                  });
                } else {
                    var publicId = myCache.get('thisPublicId');
                    var refPublic = fb.child("publics").child(publicId).child(currentItem.userid);
                    refPublic.push({ name: currentItem.addedby, 
                                     location: currentItem.payee,
                                     note: currentItem.note,
                                     photo: currentItem.photo,
                                     date: currentItem.date,
                                     likes:'',
                                     views:'',
                                     comments:''
                                  });
                }
                //
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

                ////
                //// Save transaction under category
                ////
                //var categoryTransactionRef = fb.child("groups").child(thisGroupId).child("membertransactionsbycategory").child(currentItem.categoryid).child(newChildRef.key());
                //var categoryTransaction = {
                //    payee: currentItem.payee,
                //    amount: currentItem.amount,
                //    date: currentItem.date,
                //    type: currentItem.type,
                //    iscleared: currentItem.iscleared
                //};
                //categoryTransactionRef.update(categoryTransaction);
                ////
                //// Save transaction under payee
                ////
                //var payeeTransactionRef = fb.child("groups").child(thisGroupId).child("membertransactionsbypayee").child(currentItem.payeeid).child(newChildRef.key());
                //var payeeTransaction = {
                //    payee: currentItem.payee,
                //    amount: currentItem.amount,
                //    date: currentItem.date,
                //    type: currentItem.type,
                //    iscleared: currentItem.iscleared
                //};
                //payeeTransactionRef.update(payeeTransaction);


                //
                // Save payee-category relationship
                //
                var payee = {};
                var payeeRef = fb.child("members").child(thisMemberId).child("memberpayees").child(currentItem.payeeid);
                if (currentItem.type === "Income") {
                    payee = {
                        lastamountincome: currentItem.amount,
                        lastcategoryincome: currentItem.category,
                        lastcategoryidincome: currentItem.categoryid
                    };
                } else if (currentItem.type === "Expense") {
                    payee = {
                        lastamount: currentItem.amount,
                        lastcategory: currentItem.category,
                        lastcategoryid: currentItem.categoryid
                    };
                }
                payeeRef.update(payee);

                if (currentItem.istransfer) {
                    //
                    // Save the other transaction, get the transaction id and link it to this transaction
                    //
                    OtherTransaction.linkedtransactionid = newChildRef.key();
                    var othertransRef = fb.child("members").child(thisMemberId).child("transfertransactions").child(otherAccountId);
                    var sync = $firebaseArray(othertransRef);
                    sync.$add(OtherTransaction).then(function (otherChildRef) {
                        //
                        // Update this transaction with other transaction id
                        newChildRef.update({ linkedtransactionid: otherChildRef.key() })
                        //
                    });
                }
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

.factory('PayeesService', function ($firebaseArray, $q, myCache) {
        var ref = {};
        var allpayees = {};
        var payeesRef = {};
        var payeeRef = {};
        //var transactionsByPayeeRef = {};
        //var transactionsByCategoryRef = {};
        var thisGroupId = myCache.get('thisGroupId');
        var thisMemberId = myCache.get('thisMemberId');
        return {
            getPayees: function () {
                ref = fb.child("members").child(thisMemberId).child("memberpayees").orderByChild('payeesort');
                allpayees = $firebaseArray(ref);
                return allpayees;
            },
            getPayee: function (payeeid) {
                var deferred = $q.defer();
                ref = fb.child("members").child(thisMemberId).child("memberpayees").child(payeeid);
                ref.once("value", function (snap) {
                    deferred.resolve(snap.val());
                });
                return deferred.promise;
            },
            //getTransactionsByPayee: function (payeeid) {
            //    ref = fb.child("groups").child(thisGroupId).child("membertransactionsbypayee").child(payeeid);
            //    transactionsByPayeeRef = $firebaseArray(ref);
            //    return transactionsByPayeeRef;
            //},
            //getTransactionsByCategory: function (categoryid) {
            //    ref = fb.child("groups").child(thisGroupId).child("membertransactionsbycategory").child(categoryid);
            //    transactionsByCategoryRef = $firebaseArray(ref);
            //    return transactionsByCategoryRef;
            //},
            getPayeesRef: function () {
                payeesRef = fb.child("members").child(thisMemberId).child("memberpayees");
                return payeesRef;
            },
            getPayeeRef: function (payeeid) {
                payeeRef = fb.child("members").child(thisMemberId).child("memberpayees").child(payeeid);
                return payeeRef;
            },
            savePayee: function (payee) {
                allpayees.$save(payee).then(function (ref) {
                    //ref.key() = payee.$id;
                });
            }
        };
})

.factory('PayeesFactory', function ($firebaseArray, $q, $timeout, myCache) {
        var ref = {};
        var payees = {};
        var thisGroupId = myCache.get('thisGroupId');
        var thisMemberId = myCache.get('thisMemberId');
        ref = fb.child("members").child(thisMemberId).child("memberpayees").orderByChild('payeename');
        payees = $firebaseArray(ref);
        var searchPayees = function (searchFilter) {
            //console.log(searchFilter);
            var deferred = $q.defer();
            var matches = payees.filter(function (payee) {
                if (payee.payeename.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1) {
                    return true;
                }
            });
            $timeout(function () {
                deferred.resolve(matches);
            }, 100);
            return deferred.promise;
        };
        return {
            searchPayees: searchPayees
        }
})

.service("CategoryTypeService", function () {
        var cattype = this;
        cattype.updateType = function (value) {
            this.typeSelected = value;
        }
})
.service("PickParentCategoryService", function () {
        var cat = this;
        cat.updateParentCategory = function (value) {
            this.parentcategorySelected = value;
        }
})
.service("PickCategoryTypeService", function () {
        var type = this;
        type.updateType = function (value) {
            this.typeSelected = value;
        }
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
        }
})

    // Account Pick Lists
.service("SelectAccountServices", function () {
        var accountDate = this;
        var accountType = this;
        accountDate.updateDate = function (value) {
            this.dateSelected = value;
        }
        accountType.updateType = function (value) {
            this.typeSelected = value;
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
        var transNote = this;
        var transSearch = this;
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
        transNote.updateNote = function (value) {
            this.noteSelected = value;
        }
        transSearch.updateSearch = function (value) {
            this.searchSelected = value;
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