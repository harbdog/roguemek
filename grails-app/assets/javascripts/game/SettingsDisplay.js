/**
 * Class for displaying and interacting with the game Settings dialog
 */
(function() {
"use strict";

function SettingsDisplay() {
	
	this.settingsDialog = null;
	
	this.boardScaleSlider = null;
	this.uiScaleSlider = null;
	
	this.init();
}
var s = SettingsDisplay.prototype;

s.init = function() {
	// Initialize dialog for the settings display
	var settingsDiv = $("#settingsDiv");
	this.settingsDialog = settingsDiv.dialog({
		title: "Settings",
    	autoOpen: false,
    	modal: false,
		show: {
			effect: "fade",
			duration: 500
		},
		hide: {
			effect: "clip",
			duration: 250
		}
    });
	
	////////////////////////////////////
	// create the board scale setting //
	var boardScaleDiv = $("<div>", {id: "boardScaleDiv"});
	settingsDiv.append(boardScaleDiv);
	
	var boardScaleLabel = $("<span>", {id: "boardScaleLabel", class: "property-heading"});
	boardScaleLabel.text("Board Scale");
	boardScaleDiv.append(boardScaleLabel);
	
	var boardScaleValue = $("<span>", {id: "boardScaleValue", class: "property-value"});
	boardScaleValue.css("float", "right");
	boardScaleDiv.append(boardScaleValue);
	
	this.boardScaleSlider = $("<div>", {id: "boardScaleSlider", class: "property-value"});
	boardScaleDiv.append(this.boardScaleSlider);
	
	this.boardScaleSlider.slider({
		value: Settings.get(Settings.BOARD_SCALE),
	    min: 0.2,
	    max: 3.0,
	    step: 0.1,
	    change: function(event, ui) {
	    	boardScaleValue.text(ui.value);
	    },
	    slide: function(event, ui) {
	    	boardScaleValue.text(ui.value);
	    	handleZoomBoard(ui.value);
	    }
	});
	boardScaleValue.text(this.boardScaleSlider.slider("value"));
	
	/////////////////////////////////
	// create the UI scale setting //
	var uiScaleDiv = $("<div>", {id: "uiScaleDiv"});
	settingsDiv.append(uiScaleDiv);
	
	var uiScaleLabel = $("<span>", {id: "uiScaleLabel", class: "property-heading"});
	uiScaleLabel.text("UI Scale");
	uiScaleDiv.append(uiScaleLabel);
	
	var uiScaleValue = $("<span>", {id: "uiScaleValue", class: "property-value"});
	uiScaleValue.css("float", "right");
	uiScaleDiv.append(uiScaleValue);
	
	this.uiScaleSlider = $("<div>", {id: "uiScaleSlider", class: "property-value"});
	uiScaleDiv.append(this.uiScaleSlider);
	
	this.uiScaleSlider.slider({
		value: Settings.get(Settings.UI_SCALE),
	    min: 0.3,
	    max: 3.0,
	    step: 0.05,
	    change: function(event, ui) {
	    	uiScaleValue.text(ui.value);
	    },
	    slide: function(event, ui) {
	    	uiScaleValue.text(ui.value);
	    	handleScaleOverlay(ui.value);
	    }
	});
	uiScaleValue.text(this.uiScaleSlider.slider("value"));
	
	///////////////////////////////////////////////////
	// create the UI background transparency setting //
	var bgTransDiv = $("<div>", {id: "bgTransDiv"});
	settingsDiv.append(bgTransDiv);
	
	var bgTransLabel = $("<span>", {id: "bgTransLabel", class: "property-heading"});
	bgTransLabel.text("UI Opacity");
	bgTransDiv.append(bgTransLabel);
	
	var bgTransValue = $("<span>", {id: "bgTransValue", class: "property-value"});
	bgTransValue.css("float", "right");
	bgTransDiv.append(bgTransValue);
	
	this.bgTransSlider = $("<div>", {id: "bgTransSlider", class: "property-value"});
	bgTransDiv.append(this.bgTransSlider);
	
	this.bgTransSlider.slider({
		value: Settings.get(Settings.UI_OPACITY),
	    min: 0,
	    max: 1,
	    step: 0.05,
	    change: function(event, ui) {
	    	bgTransValue.text(ui.value);
	    },
	    slide: function(event, ui) {
	    	var settingKey = Settings.UI_OPACITY;
	    	var opacity = ui.value;
	    	
	    	bgTransValue.text(opacity);
			Settings.set(settingKey, opacity);
			
			handleSettingsUpdate(settingKey);
	    }
	});
	bgTransValue.text(this.bgTransSlider.slider("value"));
	
	////////////////////////////////////////////
	// create the UI background color setting //
	var bgColorKey = Settings.UI_BG_COLOR;
	var bgColorDiv = $("<div>", {id: "bgColorDiv"});
	settingsDiv.append(bgColorDiv);
	
	var bgColorInput = $("<input>", {id: "bgColorInput", class: "property-value", value: Settings.get(bgColorKey)});
	bgColorDiv.append(bgColorInput);
	
	var bgColorLabel = $("<span>", {id: "bgColorLabel", class: "property-heading"});
	bgColorLabel.text("UI Background");
	bgColorDiv.append(bgColorLabel);
	
	var bgColorUpdateFunc = function(tinycolor) {
		var settingKey = bgColorKey;
		var color = tinycolor.toHexString();
		Settings.set(settingKey, color);
		
		handleSettingsUpdate(settingKey);
	};
	
	bgColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: bgColorUpdateFunc,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor(Settings.get(bgColorKey)));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed (update would have occurred from move action)
			} else {
				// cancelled
				bgColorUpdateFunc($(this).data('origColor'));
			}
		}
	});
	
	////////////////////////////////////////////
	// create the UI foreground color setting //
	var fgColorKey = Settings.UI_FG_COLOR;
	var fgColorDiv = $("<div>", {id: "fgColorDiv"});
	settingsDiv.append(fgColorDiv);
	
	var fgColorInput = $("<input>", {id: "fgColorInput", class: "property-value", value: Settings.get(fgColorKey)});
	fgColorDiv.append(fgColorInput);
	
	var fgColorLabel = $("<span>", {id: "fgColorLabel", class: "property-heading"});
	fgColorLabel.text("UI Foreground");
	fgColorDiv.append(fgColorLabel);
	
	var fgColorUpdateFunc = function(tinycolor) {
		var settingKey = fgColorKey;
		var color = tinycolor.toHexString();
		Settings.set(settingKey, color);
		
		handleSettingsUpdate(settingKey);
	};
	
	fgColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: fgColorUpdateFunc,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor(Settings.get(fgColorKey)));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed
			} else {
				// cancelled
				fgColorUpdateFunc($(this).data('origColor'));
			}
		}
	});
	
	/////////////////////////////////////
	// create the player color setting //
	var playerColorKey = Settings.UI_PLAYER_COLOR;
	var playerColorDiv = $("<div>", {id: "playerColorDiv"});
	settingsDiv.append(playerColorDiv);
	
	var playerColorInput = $("<input>", {id: "playerColorInput", class: "property-value", value: Settings.get(playerColorKey)});
	playerColorDiv.append(playerColorInput);
	
	var playerColorLabel = $("<span>", {id: "playerColorLabel", class: "property-heading"});
	playerColorLabel.text("Player");
	playerColorDiv.append(playerColorLabel);
	
	var playerColorUpdateFunc = function(tinycolor) {
		var settingKey = playerColorKey;
		var color = tinycolor.toHexString();
		Settings.set(settingKey, color);
		
		handleSettingsUpdate(settingKey);
	};
	
	playerColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: playerColorUpdateFunc,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor(Settings.get(playerColorKey)));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed
			} else {
				// cancelled
				playerColorUpdateFunc($(this).data('origColor'));
			}
		}
	});
	
	////////////////////////////////////
	// create the enemy color setting //
	var enemyColorKey = Settings.UI_ENEMY_COLOR;
	var enemyColorDiv = $("<div>", {id: "enemyColorDiv"});
	settingsDiv.append(enemyColorDiv);
	
	var enemyColorInput = $("<input>", {id: "enemyColorInput", class: "property-value", value: Settings.get(enemyColorKey)});
	enemyColorDiv.append(enemyColorInput);
	
	var enemyColorLabel = $("<span>", {id: "enemyColorLabel", class: "property-heading"});
	enemyColorLabel.text("Enemy");
	enemyColorDiv.append(enemyColorLabel);
	
	var enemyColorUpdateFunc = function(tinycolor) {
		var settingKey = enemyColorKey;
		var color = tinycolor.toHexString();
		Settings.set(settingKey, color);
		
		handleSettingsUpdate(settingKey);
	};
	
	enemyColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: enemyColorUpdateFunc,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor(Settings.get(enemyColorKey)));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed
			} else {
				// cancelled
				enemyColorUpdateFunc($(this).data('origColor'));
			}
		}
	});
}

s.update = function() {
	// update any values that need to be updated between showing settings
	// such as zoom/scale that can be adjusted without using the settings menu
	this.boardScaleSlider.slider("option", "value", Settings.get(Settings.BOARD_SCALE));
	this.uiScaleSlider.slider("option", "value", Settings.get(Settings.UI_SCALE));
}

s.show = function() {
	this.update();
	this.settingsDialog.dialog("open");
}

window.SettingsDisplay = SettingsDisplay;
}());