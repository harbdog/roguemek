/**
 * Class used to handle setting up default settings for the application
 */
(function() {
"use strict";

function Settings() {}

// initialize all default settings for the game
Settings.init = function() {
	// the settings used for the board
	Settings.default(Settings.BOARD_ISOMETRIC, true);
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
	Settings.default(Settings.GFX_CACHING, Settings.GFX_BALANCE);
	Settings.default(Settings.GFX_FRAMERATE, 30);
}

// STATIC key names of settings for the game
Settings.BOARD_ISOMETRIC = "BOARD_ISOMETRIC";
Settings.BOARD_SCALE = "BOARD_SCALE";
Settings.UI_SCALE = "UI_SCALE";
Settings.UI_OPACITY = "UI_OPACITY";
Settings.UI_BG_COLOR = "UI_BG_COLOR";
Settings.UI_FG_COLOR = "UI_FG_COLOR";
Settings.UI_PLAYER_COLOR = "UI_PLAYER_COLOR";
Settings.UI_FRIENDLY_COLOR = "UI_FRIENDLY_COLOR";
Settings.UI_ENEMY_COLOR = "UI_ENEMY_COLOR";
Settings.GFX_CACHING = "GFX_CACHING";
Settings.GFX_FRAMERATE = "GFX_FRAMERATE";

// static key values for certain settings
Settings.GFX_PERFORMANCE = 0;
Settings.GFX_BALANCE = 1;
Settings.GFX_QUALITY = 2;

// sets up a default value for the setting if it has not yet been set
Settings.default = function(key, value, session) {
	if(Settings.get(key, session) == null) {
		Settings.set(key, value, session);
	}
}

// gets the stored value, optionally specify if the session storage should be used instead of persisted
Settings.get = function(key, session) {
	if(session) {
		var store = amplify.store.sessionStorage(key);
		console.log(store);
		if(store) return store.key;
	}
	else{
		return amplify.store(key);
	}
}

// sets the stored value, optionally specify if the session storage should be used instead of persisted
Settings.set = function(key, value, session) {
	if(session) {
		amplify.store.sessionStorage(key, {key: value});
	}
	else{
		amplify.store(key, value);
	}
}

window.Settings = Settings;
}());