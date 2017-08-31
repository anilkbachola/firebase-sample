'use strict';

window.smartChat = window.smartChat || {};

// Initializes SmartChat Application.
function SmartChat() {
  this.checkSetup();
    
  // Shortcuts to DOM Elements.
  this.snackbar = document.getElementById('snackbar');
  this.pushButton = document.querySelector('.push-button'); 
  
    this.pushButton.addEventListener('click', function() {
    if (this.isTokenSentToServer()) {
      this.unsubscribe();
    } else {
      this.subscribe();
    }
  }.bind(this));
  
  this.initFirebase();
}
SmartChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// self.online = {};
// var ref =  firebase.database().ref();
// ref.once('value', function(snapshot) {
//        //console.log('values with priorities', snapshot.exportVal());
//        window.localStorage.setItem('goals', JSON.stringify(snapshot.exportVal().goals));
//        window.localStorage.setItem('messages', JSON.stringify(snapshot.exportVal().messages));
// });

// var connectedRef = firebase.database().ref(".info/connected");
// connectedRef.on("value", function(snap) {
//   if (snap.val() === true) {
//     //console.log("connected")
//     ref.once('value', function(snapshot) {
//        self.online = true;
//        //console.log('values with priorities', snapshot.exportVal());
//        window.localStorage.setItem('goals', JSON.stringify(snapshot.exportVal().goals));
//        window.localStorage.setItem('messages', JSON.stringify(snapshot.exportVal().messages));
//     });
//   } else {
//     self.online = false;
//     // /console.log("not connected");
//   }
// });

// Checks that the Firebase SDK has been correctly setup and configured.
SmartChat.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('Firebase SDK is not configured');
  } else if (config.storageBucket === '') {
    window.alert('Firebase Storage is not configured');
  }
  //Register service worker
  $(document).ready(function () { 
    if('serviceWorker' in navigator){
        navigator.serviceWorker.register('./service-worker.js').then(function() {
        console.log('service worker registered');
        console.log(localStorage.getItem('sentToServer'));
        this.initialiseState;
      }.bind(this));
    }else{
     //smartChat.pushButton.textContent = 'Not Supported';
      SmartChat.isPushAvialable = false;
     console.warn('service worker not supported');
    }  
  });
}

// var connectedRef = firebase.database().ref(".info/connected");
// connectedRef.on("value", function(snap) {
//   if (snap.val() === true) {
//     //alert("connected")

//   } else {
//     alert("not connected");
//     navigator.serviceWorker.register('./service-worker.js').then(function() {
//         alert('service worker registered');
//         console.log(localStorage.getItem('sentToServer'));
//         this.initialiseState;
//     }.bind(this));
//   }
// });

// Sets up shortcuts to Firebase features and initiate firebase auth.
SmartChat.prototype.initFirebase = function() {
  
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    this.messaging = firebase.messaging();
    
    //this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
    this.messaging.onTokenRefresh(this.onTokenRefresh.bind(this));
    this.messaging.onMessage(this.onMessage.bind(this));
};
/*
SmartChat.prototype.signIn = function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    //this.auth.signInWithPopup(provider);
    this.auth.signInWithRedirect(provider);
};*/

SmartChat.prototype.onMessage = function(payload){
  if(payload.data.email != this.auth.currentUser.email){
    this.showSnackbar(payload.notification.body);
  }
};

SmartChat.prototype.subscribe = function() {
    this.messaging.requestPermission()
    .then(function() {
      this.resetUI();
      this.showSnackbar('Subscribed to notifications successfully');
    }.bind(this))
    .catch(function(err) {
        this.showSnackbar('Permission denied by user');
    }.bind(this));
};

SmartChat.prototype.onTokenRefresh = function(){
    this.messaging.getToken().then(function(refreshedToken) {
      this.setTokenSentToServer(false);
      this.sendTokenToServer(refreshedToken);
      this.resetUI();
    }.bind(this))
    .catch(function(err) {
      console.log('Unable to retrieve refreshed token ', err);
    });
};

SmartChat.prototype.unsubscribe = function() {
    this.messaging.getToken()
    .then(function(currentToken) {
      this.messaging.deleteToken(currentToken)
      .then(function() {
        console.log('Token deleted.');
        this.setTokenSentToServer(false);
        // Once token is deleted update UI.
        //this.resetUI();
        this.updateUIForPushPermissionRequired();
        this.showSnackbar('Unsubscribed to notifications successfully');
      }.bind(this))
      .catch(function(err) {
        console.log('Unable to delete token. ', err);
      });
    }.bind(this)).catch(function(err) {
      console.log('Error retrieving Instance ID token. ', err);
    });
};


SmartChat.prototype.showSnackbar = function(msg){
    this.snackbar.MaterialSnackbar.showSnackbar({
        message: msg,
        timeout: 3000
    });
};

SmartChat.prototype.setTokenSentToServer = function(sent) {
    if (sent) {
      window.localStorage.setItem('sentToServer', 1);
    } else {
      window.localStorage.setItem('sentToServer', 0);
    }
};

SmartChat.prototype.sendTokenToServer = function(currentToken) {
   if (!this.isTokenSentToServer()) {
      console.log('Sending token to server...');
      var subscriptionRef = this.database.ref('push_subscriptions/');
      subscriptionRef.push({
        email: this.auth.currentUser.email,
        token: currentToken  
      });
      this.setTokenSentToServer(true);
    } else {
      console.log('Token already sent to server so won\'t send it again ' +
          'unless it changes');
    }
};

SmartChat.prototype.resetUI = function() {
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    this.messaging.getToken()
    .then(function(currentToken) {
      if(currentToken) {
        this.sendTokenToServer(currentToken);
        this.updateUIForPushEnabled(currentToken);
      } else {
        // Show permission request.
        console.log('No Instance ID token available. Request permission to generate one.');
        // Show permission UI.
        this.updateUIForPushPermissionRequired();
        this.setTokenSentToServer(false);
      }
    }.bind(this))
    .catch(function(err) {
      console.log('An error occurred while retrieving token. ', err);
      setTokenSentToServer(false);
    });
};

SmartChat.prototype.updateUIForPushEnabled = function(currentToken) {
    this.pushButton.innerHTML = '<i class="material-icons">notifications_on</i> Notifications'
};

SmartChat.prototype.updateUIForPushPermissionRequired = function() {
    this.pushButton.innerHTML = '<i class="material-icons">notifications_off</i> Notifications';
}

SmartChat.prototype.isTokenSentToServer = function() {
    if (window.localStorage.getItem('sentToServer') == 1) {
          return true;
    }
    return false;
};


// Resets the given MaterialTextField.
SmartChat.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Once the service worker is registered set the initial state
SmartChat.prototype.initialiseState = function() {
  // Are Notifications supported in the service worker?
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    this.showSnackbar('Notifications are not supported');
    return;
  }

  // Check the current Notification permission.
  // If its denied, it's a permanent block until the
  // user changes the permission
  if (Notification.permission === 'denied') {
    this.showSnackbar('User blocked the notification permission');
    return;
  }
  // Check if push messaging is supported
  if (!('PushManager' in window)) {
      //this.pushButton.textContent = 'Not Supported';
      SmartChat.isPushAvialable = false;
      return;
  }
  if(this.isTokenSentToServer()){
      this.pushButton.innerHTML = '<i class="material-icons">notifications_on</i>';
  }
  
}

smartChat.main = new SmartChat();
