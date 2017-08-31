'use strict';

window.smartChat = window.smartChat || {};

/**
 * Handles the About Us page information.
 */
smartChat.Add = function() {
  
}
 var goal;
smartChat.Add.prototype.addGoals = function(){

};


smartChat.Add.prototype.newGoal = function(){
	var email = firebase.auth().currentUser.email;
	var name = firebase.auth().currentUser.displayName;
    var HomeLink = document.getElementById('homeLink');
	var long = document.getElementById('long').value;
	var short = document.getElementById('short').value;
	var ref = firebase.database().ref('users');
	ref.orderByChild('email').equalTo(email).once('value', function( snapshot ){ 
		if(snapshot.val() == null){
            console.log('insert new user goal');
			var newKey = firebase.database().ref('users').push().key;
			firebase.database().ref("users/"+newKey).set({
        		longTerm : long,
        		shortTerm : short,
        		key: newKey,
        		email : email,
        		name : name
        	})
            homeLink.click();
		}
		else{
            console.log('update user goal exist one');
			snapshot.forEach(function(childSnapshot) {
	        	var childData = childSnapshot.val();
	        	goal = childSnapshot.val();
	        	var key = goal.key;
	        	firebase.database().ref("users/"+key).update({
	        		longTerm : long,
	        		shortTerm : short
	        	})
	        });
            homeLink.click();
		}
      
    });
};

smartChat.Add = new smartChat.Add();