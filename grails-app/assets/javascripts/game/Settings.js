/**
 * Class used to handle setting up default settings for the application
 */
(function() {
"use strict";

function Settings() {}

// initialize all default settings for the game
Settings.init = function() {
	// the scale used for the board
	Settings.default(Settings.BOARD_SCALE, 1);
	
	// the scale used for the UI overlay
	Settings.default(Settings.UI_SCALE, 1);
	
	// the opacity of the background of the UI overlay
	Settings.default(Settings.UI_OPACITY, 0.75);
}

// STATIC key names of settings for the game
Settings.BOARD_SCALE = "BOARD_SCALE";
Settings.UI_SCALE = "UI_SCALE";
Settings.UI_OPACITY = "UI_OPACITY";

Settings.default = function(key, value) {
	if(Settings.get(key) == null) {
		Settings.set(key, value);
	}
}

Settings.get = function(key) {
	return amplify.store(key);
}

Settings.set = function(key, value) {
	amplify.store(key, value);
}

window.Settings = Settings;
}());