'use strict';

window.smartChat = window.smartChat || {};

smartChat.Router = function(){
  this.pagesElements = $('[id^=page-]');
  this.splashLogin = $('#login', '#page-splash');
  this.back = $('.back');  
    
  $(document).ready(function () {
      smartChat.auth.waitForAuth().then(function () {

       // Configuring routes.
       var pipe = smartChat.Router.pipe;
       var displayPage = smartChat.router.displayPage.bind(this);
         
       var loadGoals = function loadGoals() {
         return smartChat.goals.loadGoals();
       }
       var loadMessages = function loadMessages(goalId) {
         return smartChat.goalmsg.loadMessages(goalId);
       }
       var aboutUs = function aboutUs() {
         return smartChat.about.aboutUs();
       }

       var addGoals = function addGoals() {
         return smartChat.Add.addGoals();
       }

       var loadUser = function loadUser(userId) {
         return smartChat.user.loadUser(userId);
       }

       var loadHelp = function help(){
         return smartChat.help.loadHelp();
       }
       

      // page('/', pipe(addGoals, null, true), pipe(displayPage, { pageId: 'addGoal', onlyAuthed: true }));
       page('/', pipe(loadGoals, null, true), pipe(displayPage, { pageId: 'goals', onlyAuthed: true }));
       page('/goals/:goalId', pipe(loadMessages, null, true), pipe(displayPage, { pageId: 'goal' }));
       page('/user/:userId', pipe(loadUser, null, true), pipe(displayPage, { pageId: 'user' }));    
       page('/about', pipe(aboutUs, null, true), pipe(displayPage, { pageId: 'about' }));
       page('/help', pipe(loadHelp, null, true), pipe(displayPage, { pageId: 'help' }));   
       //page('/addGoals', pipe(addGoals, null, true), pipe(displayPage, { pageId: 'addGoal' }));
       
       page('*', function () {
         return page('/');
       });

       // Start routing.
       page();
      });
    }); 
}

smartChat.Router.pipe = function(funct, attribute, optContinue) {
  return function (context, next) {
    if (funct) {
      var params = Object.keys(context.params);
      if (!attribute && params.length > 0) {
        funct(context.params[params[0]], context);
      } else {
        funct(attribute, context);
      }
    }
    if (optContinue) {
      next();
    }
  };
};



smartChat.Router.setLinkAsActive = function(canonicalPath) {
  if (canonicalPath === '') {
    canonicalPath = '/';
  }
  $('.is-active').removeClass('is-active');
  $('[href="' + canonicalPath + '"]').addClass('is-active');
};

smartChat.Router.scrollToTop = function() {
  $('html,body').animate({ scrollTop: 0 }, 0);
};

smartChat.Router.prototype.reloadPage = function() {
  var path = window.location.pathname;
  if (path === '') {
    path = '/';
  }
  page(path);
};

smartChat.Router.prototype.displayPage = function(attributes, context) {

  var onlyAuthed = attributes.onlyAuthed;
  var pageId = attributes.pageId;


  if (onlyAuthed && !firebase.auth().currentUser) {
    pageId = 'splash';
    smartChat.router.splashLogin.show();
  }


  //TODO::
    if(pageId === 'goals'){
        smartChat.router.back.hide();
    }else{
        smartChat.router.back.show();
    }
    
  smartChat.Router.setLinkAsActive(context.canonicalPath);

  smartChat.router.pagesElements.each(function (index, element) {
    if (element.id === 'page-' + pageId) {
      $(element).show();
    } else if (element.id === 'page-splash') {
      $(element).fadeOut(1000);
    } else {
      $(element).hide();
    } 
  });
  //smartChat.MaterialUtils.closeDrawer();
  smartChat.Router.scrollToTop();
    
}
smartChat.router = new smartChat.Router();