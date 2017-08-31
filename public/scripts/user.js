'use strict';

window.smartChat = window.smartChat || {};

/**
 * Handles the user information.
 */
smartChat.User = function() {
  
}

smartChat.User.prototype.loadUser = function(userId){
  this.goalForm = document.getElementById('goal-form');
  this.goalForm.setAttribute('style','display:none;'); 
  document.getElementById('goal-name').innerHTML = '';
	var pageuser = document.getElementById('page-user');
	pageuser.setAttribute('style', 'display:block;');
  	var user = firebase.auth().currentUser.email;
  	var ref = firebase.database().ref('users');
  	ref.orderByChild('email').equalTo(user).once('value', function( snapshot ){
      	if(snapshot.val() != null){
      		snapshot.forEach(function(childSnapshot) {
		          var goal = childSnapshot.val();
		        	document.getElementById('long').value = goal.longTerm;
	            document.getElementById('short').value = goal.shortTerm;
	            var long = document.getElementById('longDiv');
	            long.className += ' is-dirty';
				      var short = document.getElementById('shortDiv');
				      short.className += ' is-dirty';
				      //console.log(long.className, short.className)
              var profileImage = document.getElementById('profileImage');
              //console.log(profileImage);
              if(goal.profileImg == null || goal.profileImg == undefined || goal.profileImg == ""){
                profileImage.src = './images/profile_placeholder.png';
              }else{
                profileImage.src = goal.profileImg;
              }
	    	  });
      	}
  	})
};

document.getElementById('profileImage').onclick = function() {
    document.getElementById('profileCapture').click();
};

function showImage(image){
  //console.log(image.files,'&&', image.files[0]);
  var currentUser = firebase.auth().currentUser;
  var profileImage = document.getElementById('profileImage');
  if(image.files && image.files[0]){
      var file = image.files[0]
      profileImage.src = 'https://s-media-cache-ak0.pinimg.com/originals/4e/23/9a/4e239a307e8d3121fff869f3314c4e02.gif';
      var storageRef = firebase.storage().ref();
      var uploadTask = storageRef.child(currentUser.uid + '/' + Date.now() + '/' + file.name).put(file); //upload image to storage
      uploadTask.on('state_changed', function(snapshot){
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            //console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            //console.log('Upload is running');
            break;
        }
      }, function(error) {
        // Handle unsuccessful uploads
        console.log(error);
      }, function() {
        var downloadURL = uploadTask.snapshot.downloadURL;
        profileImage.src = downloadURL;
        saveToUser(downloadURL);
      }); 
  }
}

function saveToUser(link){
  var email = firebase.auth().currentUser.email;
  var name = firebase.auth().currentUser.displayName;
  var ref = firebase.database().ref('users');
  var long = document.getElementById('long').value;
  var short = document.getElementById('short').value;
  ref.orderByChild('email').equalTo(email).once('value', function( snapshot ){ 
    if(snapshot.val() == null){
      //console.log('insert new user goal in image');
      var newKey = firebase.database().ref('users').push().key;
      firebase.database().ref("users/"+newKey).set({
            longTerm : long,
            shortTerm : short,
            key: newKey,
            email : email,
            name : name,
            profileImg : link
      })
    }
    else{
          //console.log('update user goal exist one in image');
          snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            goal = childSnapshot.val();
            var key = goal.key;
            if(goal.profileImg != null || goal.profileImg != undefined){
              var storage = firebase.storage();
              var storageRef = storage.ref();
              var httpsReference = storage.refFromURL(goal.profileImg);
              var desertRef = storageRef.child(httpsReference.a.path);
              desertRef.delete().then(function() {
                //console.log('File deleted successfully');
              }).catch(function(error) {
                //console.log('Uh-oh, an error occurred!',error);
              });
            }
            firebase.database().ref("users/"+key).update({
                  profileImg : link
            })
          });
    }
  });
}

function saveToStorage(file){
  console.log(file);
}


function autoSuggestlongGoal(){
  //console.log(window.longTerm);
  $('#long').autocomplete({
    minLength:1,
    limit:4,
    source:[window.longTerm]
  });
}

function autoSuggestshortGoal(){
  $('#short').autocomplete({
    minLength:1,
    limit:4,
    source:[window.shortTerm]
  });
}

window.longTerm = [];
window.shortTerm = [];
function setUsersGoals(){
  var users = firebase.database().ref('users');
  users.on('child_added', function(childSnapshot) {
    //console.log(childSnapshot.val());
    window.longTerm.push(childSnapshot.val().longTerm);
    window.shortTerm.push(childSnapshot.val().shortTerm);
  });
}
setUsersGoals();

smartChat.user = new smartChat.User();