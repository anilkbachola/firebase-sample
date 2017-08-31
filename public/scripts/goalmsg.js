'use strict';

window.smartChat = window.smartChat || {};

/**
 * Handles Goal messaging.
 */
smartChat.GoalMsg = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  //this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
    
  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  this.submitImageButton.addEventListener('click', function() {
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));
  
  
  //this.goal = {};
}

// Loads chat messages history and listens for upcoming ones.
smartChat.GoalMsg.prototype.loadMessages = function(goalKey) {
    this.goalForm = document.getElementById('goal-form');
    this.goalForm.setAttribute('style','display:none;');
    this.goalname = document.getElementById('goal-name');
    this.database.ref('/goals/' + goalKey).once('value').then(function(data) {
      this.currentGoal = {
          'key': data.key,
          'val': data.val()
      };
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',data.val().name);
      this.goalname.innerHTML = data.val().name;
      this.clearMessages();
      this.messagesRef = this.database.ref('messages/'+goalKey);
      this.messagesRef.off();
      
      var setMessage = function(data){
        var val = data.val();
        if(val.adminApproved || (!val.adminApproved && this.auth.currentUser.email == this.currentGoal.val.admin)
           || (!val.adminApproved && this.auth.currentUser.email == val.email)){
          this.displayMessage(data.key, data.val());
        }
      }.bind(this);
    
      var unsetMessage = function(data){
        this.removeMessage(data.key);
      }.bind(this);
      
      this.messagesRef.limitToLast(100).on('child_added',setMessage);
      this.messagesRef.limitToLast(100).on('child_changed',setMessage);
      this.messagesRef.on('child_removed', unsetMessage);    
    }.bind(this));

    
};

smartChat.GoalMsg.MESSAGE_TEMPLATE = 
    '<div class="chat">'+
        '<div class="name"></div>'+
        '<div class="text">'+
        '</div>'+
      '</div>';
smartChat.GoalMsg.MESSAGE_CONV = 
    '<div class="chat conversation-start">'+
        '<span class="conv">Today, 6:28 AM</span>'+
    '</div>';

smartChat.GoalMsg.prototype.removeMessage = function(key){
    var div = document.getElementById(key);
    this.messageList.removeChild(div);
};

smartChat.GoalMsg.prototype.clearMessages = function(){
  while (this.messageList.firstChild) {
    this.messageList.removeChild(this.messageList.firstChild);
  }
};

smartChat.GoalMsg.prototype.displayMessage = function(key, val ) {
  // If an element for that message does not exists yet we create it.
  this.addConvStart(val);
  var div = this.createOrGetChatDiv(key);
  //this.addUserPicToChat(div, val);
  this.addName(div, val);
  this.addChatMessage(key, div, val);      
  if(this.auth.currentUser.email == val.email){
      div.classList.add('right');
   }else{
     div.classList.add('left');
   }
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  setTimeout(function(){
      this.messageList.scrollTop = this.messageList.scrollHeight;
      this.messageInput.focus();
  }.bind(this),1000);
};

smartChat.GoalMsg.prototype.addConvStart = function(val){
  var key = moment(val.timestamp,'MMMM Do YYYY, h:mm:ss a').format('YYYYMMDo');
  var convDiv = document.getElementById(key);
  if(!convDiv){
    var container = document.createElement('div');
    container.innerHTML = smartChat.GoalMsg.MESSAGE_CONV;
    convDiv = container.firstChild;
    convDiv.setAttribute('id', key);
    convDiv.querySelector('.conv').textContent= moment(val.timestamp,'MMMM Do YYYY, h:mm:ss a').format('MMM DD, YYYY');
    this.messageList.appendChild(convDiv);  
  }
};

smartChat.GoalMsg.prototype.addChatMessage = function(key, div, val){
    var messageElement = div.querySelector('.text');
  if (val.text) { // If the message is text.
    messageElement.textContent = val.text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');  
  } else if (val.imageUrl) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(val.imageUrl, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
    
   var timeDiv = document.createElement('div');
   timeDiv.innerHTML = '<span class="time">'+moment(val.timestamp,'MMMM Do YYYY, h:mm:ss a').format('h:mm a')+'</span>';
   messageElement.appendChild(timeDiv);
   this.addApprovalLink(messageElement, key, val);
   this.addDeleteLink(messageElement, key, val);    
};

smartChat.GoalMsg.prototype.addName = function(div, val){
  if(this.isDisplayNameInChat(val)){
    div.querySelector('.name').textContent = val.name;
  }
};

smartChat.GoalMsg.prototype.createOrGetChatDiv = function(key){
    var div = document.getElementById(key);
    if (!div) {
      var container = document.createElement('div');
      container.innerHTML = smartChat.GoalMsg.MESSAGE_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', key);
      this.messageList.appendChild(div);
   }
   return div;    
};

smartChat.GoalMsg.prototype.addUserPicToChat = function(div, val){   
  if (val.photoUrl) {
    //div.querySelector('.avatar').style.backgroundImage = 'url(' + val.picUrl + ')';
      div.querySelector('.avatar').innerHTML='<img src="'+val.photoUrl+'" alt="User name"></img>'
  }
};

smartChat.GoalMsg.prototype.addApprovalLink = function(div, key, val){
    if(!val.adminApproved && this.auth.currentUser.email == this.currentGoal.val.GOAL_ADMIN){
      var divApprove = div.querySelector('.approve');
      if(!divApprove){
        divApprove = document.createElement('div');
        //divApprove.innerHTML = 'Approve';
          divApprove.innerHTML = '<i class="material-icons">check_circle</i>';
        divApprove.className='approve';
        divApprove.addEventListener('click', function(){
          var updates = {};
          updates[key+'/adminApproved'] = true;
          this.messagesRef.update(updates);
        }.bind(this));
        div.appendChild(divApprove);
      }
  }else{
      var appr = div.querySelector('.approve');
      if(appr){
          appr.remove();
      }
  }   
};

smartChat.GoalMsg.prototype.addDeleteLink = function(div, key, val){
    if(!val.adminApproved && this.auth.currentUser.email == this.currentGoal.val.admin){
      var divApprove = div.querySelector('.delete');
      if(!divApprove){
        divApprove = document.createElement('div');
        divApprove.innerHTML = '<i class="material-icons">delete_forever</i>';
        divApprove.className='delete';
        divApprove.addEventListener('click', function(){
          var updates = {};
          updates[key] = null;
          this.messagesRef.update(updates);
        }.bind(this));
        div.appendChild(divApprove);
      }
  }else{
      var appr = div.querySelector('.delete');
      if(appr){
          appr.remove();
      }
  }   
};

smartChat.GoalMsg.prototype.isDisplayNameInChat = function(val){
    if(this.auth.currentUser.email == val.email)
        return false;
    
    var lastChild = this.messageList.lastChild;
    var children = this.messageList.childNodes;
    //console.log(children.length);
    for(var i=children.length-1; i>=0;i--){
        var child = children[i-1];
        if(child){
          if(child.querySelector('.conv'))
            return true;
          //console.log('conv');
          if(child.querySelector('.right'))
            return true;
         // console.log('right')
          if(child.querySelector('.name') && child.querySelector('.name').textContent == '')
            continue;
          if(child.querySelector('.name') && child.querySelector('.name').textContent != val.name){
            return true;
          }else{
              return false;
          }
       }
    }
    return false;
}
// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
smartChat.GoalMsg.prototype.setImageUrl = function(imageUri, imgElement) {
  if (imageUri.startsWith('gs://')) {
    imgElement.src = smartChat.main.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message on the Firebase DB.
smartChat.GoalMsg.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && smartChat.auth.checkSignedInWithMessage()) {
      var currentUser = this.auth.currentUser;
      var approved = this.auth.currentUser.email == this.currentGoal.val.admin?true:false;
      this.messagesRef.push({
          goalKey: this.currentGoal.key,
          goalName: this.currentGoal.val.name,
          name: currentUser.displayName,
          email: currentUser.email,
          photoUrl: currentUser.photoURL || 'images/profile_placeholder.png',
          text: this.messageInput.value,
          imageUrl: '',
          adminApproved: approved,
          timestamp: moment().format('MMMM Do YYYY, h:mm:ss a')
      }).then(function(){
        SmartChat.resetMaterialTextfield(this.messageInput);
        this.toggleButton();
        this.addUserToGoalMembers(this.currentGoal.key);
      }.bind(this)).catch(function(error){
         console.error('Error writing new messages to firebase database', error); 
      }); 
  }
};


// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
smartChat.GoalMsg.prototype.saveImageMessage = function(event) {
  event.preventDefault();
  var file = event.target.files[0];
  var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';
  // console.log('************************************************');
  // console.log(LOADING_IMAGE_URL);
  // Clear the selection in the file picker input.
  this.messageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (smartChat.auth.checkSignedInWithMessage()) {
    var currentUser = this.auth.currentUser;
    var approved = currentUser.email == this.currentGoal.val.admin?true:false;
    this.messagesRef.push({
      goalKey: this.currentGoal.key,
      goalName: this.currentGoal.val.name,
      name: currentUser.displayName,
      email: currentUser.email,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      text: '',    
      // imageUrl: smartChat.main.LOADING_IMAGE_URL,
      imageUrl: LOADING_IMAGE_URL,
      adminApproved: approved,
      timestamp: moment().format('MMMM Do YYYY, h:mm:ss a')
    }).then(function(data) {

      // Upload the image to Firebase Storage.
      this.storage.ref(currentUser.uid + '/' + Date.now() + '/' + file.name)
          .put(file, {contentType: file.type})
          .then(function(snapshot) {
            // Get the file's Storage URI and update the chat message placeholder.
            var filePath = snapshot.metadata.fullPath;
            data.update({imageUrl: this.storage.ref(filePath).toString()});
          
            this.database.ref('goals/'+this.currentGoal.key+'/members').set(currentUser.email);
          }.bind(this)).catch(function(error) {
        console.error('There was an error uploading a file to Firebase Storage:', error);
      });
      this.addUserToGoalMembers(this.currentGoal.key);
    }.bind(this));  
  }
};
//TODO
smartChat.GoalMsg.prototype.addUserToGoalMembers = function(goalKey){
    var membersRef = this.database.ref('goals/'+goalKey+'/members');
    var currentUser = this.auth.currentUser;
    
    membersRef.orderByChild("email").equalTo(currentUser.email).once('value').then(function(data) {
        if(!data.val()){
            membersRef.push({email: currentUser.email});    
        }
    })
};

smartChat.GoalMsg.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

smartChat.goalmsg = new smartChat.GoalMsg();