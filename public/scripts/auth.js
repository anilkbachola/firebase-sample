'use strict';

window.smartChat = window.smartChat || {};

/**
 * Handles the user auth flows and updating the UI depending on the auth state.
 */
smartChat.Auth = function() {
  // Firebase SDK
  this.database = firebase.database();
  this.auth = firebase.auth();
  this.waitForAuthPromiseResolver = new $.Deferred();

  $(document).ready(function () {
    // Pointers to DOM Elements
    this.signedInUsername = $('.sc-username');
    this.signOutButton = $('.sc-sign-out');
    this.signedOutOnlyElements = $('.sc-signed-out-only');
    this.signedInOnlyElements = $('.sc-signed-in-only');
    this.usernameLink = $('.sc-usernamelink');

    // Event bindings
    // this.signOutButton.click(function () {
    //   return this.signOut;
    // }.bind(this));
    //this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.signedInOnlyElements.hide();
    
  });

  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

function close() {
  var d = document.querySelector('.mdl-layout');
  d.MaterialLayout.toggleDrawer();
}

document.querySelector('.mdl-layout__drawer').addEventListener('click', close);

firebase.auth().onAuthStateChanged(function(user) {
  // We ignore token refresh events.
    this.signedOutOnlyElements = $('.sc-signed-out-only');
    this.signedInOnlyElements = $('.sc-signed-in-only');
    if (user){
      this.user = user.uid;;
      var userlink = document.getElementById('userLink')
      var username = document.getElementById('username')
      username.innerHTML = user.displayName || 'Anonymous';
      userLink.setAttribute('href', '/user/' + user.uid);
        this.signedOutOnlyElements.hide();
        this.signedInOnlyElements.show();
    }else{
        this.user = null;
        this.signedOutOnlyElements.show();
        this.signedInOnlyElements.hide();
    }
 })

function signout(){
  firebase.auth().signOut().then(function() {
    // Sign-out successful.
    window.location.replace("/");
    //this.signedInOnlyElements.show();
  }, function(error) {
    // An error happened.
  });
}

/**
 * Displays the signed-in user information in the UI or hides it and displays the
 * "Sign-In" button if the user isn't signed-in.
 */
 smartChat.Auth.prototype.onAuthStateChanged = function(user) {    
   // We ignore token refresh events.
   if (user && this.userId === user.uid) {
      console.log("called");
     return;
    }

   if (window.smartChat.router) {
     window.smartChat.router.reloadPage();
   }
   this.waitForAuthPromiseResolver.resolve();
   $(document).ready(function () {
    if (!user) {
      this.signedOutOnlyElements.show();
      this.signedInOnlyElements.hide();
      this.userId = null;
    } else {
      this.signedOutOnlyElements.hide();
      this.signedInOnlyElements.show();
      this.userId = user.uid;
      // var userlink = document.getElementById('userLink')
      // var username = document.getElementById('username')
      // username.innerHTML = user.displayName || 'Anonymous';
      // userLink.setAttribute('href', '/user/' + user.uid);
      //this.signedInUserAvatar.css('background-image', 'url("' + (user.photoURL || '/images/silhouette.jpg') + '")');
      //this.signedInUsername.text(user.displayName || 'Anonymous');
      //this.usernameLink.attr('href', '/user/' + user.uid);
      //this.usernameLink.attr('href', '/AddGoal');
      // smartChat.firebase.saveUserData(user.photoURL, user.displayName);
    }
   });
};

smartChat.Auth.prototype.waitForAuth = function(){
   return this.waitForAuthPromiseResolver.promise(); 
};

smartChat.Auth.prototype.checkSignedInWithMessage = function() {
  console.log("Check user loggged in or not");
  console.log(this.auth.currentUser)
  if(this.auth.currentUser){
      return true;
  }
  this.main.showSnackbar('You must sign-in first');
  return false;
};

smartChat.Auth.prototype.signOut = function() {
    this.auth.signOut();
};

smartChat.auth = new smartChat.Auth();