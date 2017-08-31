'use strict';

function Debug() {

}

Debug.prototype.log = function() {
  var paragraphElement = document.createElement('p');
  paragraphElement.textContent = Array.prototype.join.call(arguments, '');
    console.log(document.querySelector('.js-log'))
  document.querySelector('.js-log').appendChild(paragraphElement);
};

Debug.prototype.init =  function() {
  var logDiv = document.createElement('div');
  logDiv.classList.add('js-log');

  var heading = document.createElement('h2');
  heading.textContent = 'Log';
  logDiv.appendChild(heading);

  document.body.appendChild(logDiv);
};