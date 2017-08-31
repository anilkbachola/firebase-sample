'use strict';

window.smartChat = window.smartChat || {};

/**
 * Handles the Goals/Home page information.
 */
smartChat.Goals = function() {
  this.database = firebase.database();
  this.auth = firebase.auth();
  
  this.goalList = document.getElementById('goals');
  this.myGoals = document.getElementById('myGoals');
  this.goalsImIn = document.getElementById('goalsImIn');
  this.otherGoals = document.getElementById('otherGoals');
    
  this.goalForm = document.getElementById('goal-form');   

  this.createGoalButton = document.getElementById('createGoal');
  this.goalInput = document.getElementById('goal');
  this.goalForm.addEventListener('submit', this.createGoal.bind(this));
  var onGoalInputChange = this.onGoalInputChange.bind(this);
  this.goalInput.addEventListener('keyup', onGoalInputChange);
  this.goalInput.addEventListener('change', onGoalInputChange); 
} 



var once = false;
smartChat.Goals.prototype.loadGoals = function() {
    this.goalForm.setAttribute('style','display:flex;');
    document.getElementById('goal-name').innerHTML = '';
    var user = firebase.auth().currentUser;
    var ref = firebase.database().ref('users');
    if(once == false){
      var userPage = document.getElementsByClassName('sc-usernamelink')[0];
      once = true;
      ref.orderByChild('email').equalTo(user.email).once('value', function( snapshot ){ 
        if(snapshot.val() == null){
            userPage.click();
        }
        else{
          snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            goal = childSnapshot.val();
            if(goal.longTerm == '' || goal.longTerm == undefined || goal.longTerm == null || goal.shortTerm == '' || goal.shortTerm == undefined || goal.shortTerm == null){
              userPage.click();
            }

          });
        }
      });
    }

    this.goalsRef = this.database.ref('goals');
    this.goalsRef.off();
    
    //Load all goals
    var setGoal = function(data){
        this.displayGoal(data.key, data.val());
    }.bind(this);
    //this.goalsRef.limitToLast(10).on('child_added',setGoal);
    //this.goalsRef.limitToLast(10).on('child_changed',setGoal);
    this.goalsRef.orderByChild('created').on('child_added',setGoal);
    this.goalsRef.orderByChild('created').on('child_changed',setGoal);
};


smartChat.Goals.GOAL_TEMPLATE = 
    '<div class="goal">'+
        '<div class="avatar">'+
          '<img src="/images/icons/icon-128x128.png" alt="User name">'+
        '</div>'+
        '<div class="name"><a href="" class="n"></a></div>'+
        '<div class="details"><div class="admin"></div><div class="date"></div></div>'+
    '</div>';

smartChat.Goals.prototype.displayGoal = function(key, val) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = smartChat.Goals.GOAL_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
      
    if(this.auth.currentUser.email == val.admin){
      this.myGoals.appendChild(div);
    }else if(JSON.stringify(val.members).indexOf(this.auth.currentUser.email) != -1){
        this.goalsImIn.appendChild(div);
    }else{
        this.otherGoals.appendChild(div);
    } 
  }

// var temp = document.getElementById('homeLink');
// console.log(temp);
// temp.onclick = function() {
//   document.getElementById('sidebar').className = 'mdl-layout__drawer';
// }
  
  //div.querySelector('.name').textContent = val.name;
  div.querySelector('.n').textContent = val.name;
  div.querySelector('.n').setAttribute('href', 'goals/'+key);     
    /*var adminDiv = document.createElement('div');
  adminDiv.textContent = val.adminName;
  var timeDiv = document.createElement('div');
  timeDiv.textContent = moment(val.timestamp,'MMMM Do YYYY, h:mm:ss a').format('MMM DD YYYY h:mm a');  */
  div.querySelector('.admin').textContent = val.adminName;
   //div.querySelector('.admin').appendChild(adminDiv);
    //div.querySelector('.admin').appendChild(timeDiv);
  div.querySelector('.date').textContent = moment(val.timestamp,'MMMM Do YYYY, h:mm:ss a').format('MMM DD YYYY h:mm a');
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.goalList.scrollTop = this.goalList.scrollHeight;
  //this.goalInput.focus();
};

smartChat.Goals.prototype.onGoalInputChange = function() {
  if (this.goalInput.value) {
    this.createGoalButton.removeAttribute('disabled');
    if(this.goalInput.value.length >=3)
        this.filterGoals(true);
  } else {
    this.createGoalButton.setAttribute('disabled', 'true');
    this.filterGoals(false);  
  }
};

smartChat.Goals.prototype.filterGoals = function(filter){
    this.filterGoal(filter, this.myGoals.childNodes);
    this.filterGoal(filter, this.goalsImIn.childNodes);
    this.filterGoal(filter, this.otherGoals.childNodes);
};

smartChat.Goals.prototype.filterGoal = function(filter, children){
    for(var i=0; i<children.length;i++){
        var child = children[i];
        var goalEl = child.querySelector('.name');
        if(!filter || goalEl.textContent.toLowerCase().indexOf(this.goalInput.value.toLowerCase()) != -1){
          child.removeAttribute('hidden'); 
        }else{
          child.setAttribute('hidden',true);
        }
    }
}

smartChat.Goals.prototype.createGoal = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.goalInput.value && smartChat.auth.checkSignedInWithMessage()) {
      var currentUser = this.auth.currentUser;
      var createdAt = 0-moment().valueOf();
      this.goalsRef.push({
          name: this.goalInput.value,
          admin: currentUser.email,
          adminName: currentUser.displayName,
          timestamp: moment().format('MMMM Do YYYY, h:mm:ss a'),
          created: createdAt,
          members: []
      }).then(function(ref){
        SmartChat.resetMaterialTextfield(this.goalInput);
        this.onGoalInputChange();
        this.addUserToGoalMembers(ref.key);  
      }.bind(this)).catch(function(error){
         console.error('Error creating goal', error); 
      });
  }
};

smartChat.Goals.prototype.addUserToGoalMembers = function(goalKey){
    var membersRef = this.database.ref('goals/'+goalKey+'/members');
    var currentUser = this.auth.currentUser;
    
    membersRef.orderByChild("email").equalTo(currentUser.email).once('value').then(function(data) {
        if(!data.val()){
            membersRef.push({email: currentUser.email});    
        }
    })
};
smartChat.goals = new smartChat.Goals();