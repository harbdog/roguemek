// This is a manifest file that loads the javascript files needed for running the game.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
//= require jquery.min.js
//= require jquery-ui.min.js
//= require jquery.ui.touch-punch.min.js
//= require jquery.form.js
//= require atmosphere-meteor-jquery
//= require spectrum-1.7.1.js
//= require createjs-2015.05.21.min.js
//= require amplify-1.1.2.js
//= require proton-1.0.0.js
//= require fullscreen-api.js
//= require atmosphereHPG.js
//= require game/roguemek.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initGame(); 
});
