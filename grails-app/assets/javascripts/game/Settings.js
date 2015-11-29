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
	
	// the colors of the of the UI overlay
	Settings.default(Settings.UI_BG_COLOR, "#404040");
	Settings.default(Settings.UI_FG_COLOR, "#FFFFFF");
	Settings.default(Settings.UI_PLAYER_COLOR, "#3399FF");
	Settings.default(Settings.UI_FRIENDLY_COLOR, "#00CC29");
	Settings.default(Settings.UI_ENEMY_COLOR, "#FF0000");
	
	// the graphics quality
	Settings.default(Settings.GFX_CACHING, Settings.GFX_PERFORMANCE);
}

// STATIC key names of settings for the game
Settings.BOARD_SCALE = "BOARD_SCALE";
Settings.UI_SCALE = "UI_SCALE";
Settings.UI_OPACITY = "UI_OPACITY";
Settings.UI_BG_COLOR = "UI_BG_COLOR";
Settings.UI_FG_COLOR = "UI_FG_COLOR";
Settings.UI_PLAYER_COLOR = "UI_PLAYER_COLOR";
Settings.UI_FRIENDLY_COLOR = "UI_FRIENDLY_COLOR";
Settings.UI_ENEMY_COLOR = "UI_ENEMY_COLOR";
Settings.GFX_CACHING = "GFX_CACHING";

// static key values for certain settings
Settings.GFX_PERFORMANCE = 0;
Settings.GFX_BALANCE = 1;
Settings.GFX_QUALITY = 2;

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