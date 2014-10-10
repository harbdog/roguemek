// This is a manifest file that loads the javascript files needed for running the game.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
//= require jquery
//= require jquery-ui.min.js
//= require jquery.form.js
//= require createjs-2013.12.12.min.js
//= require game/roguemek.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initGame(); 
});
