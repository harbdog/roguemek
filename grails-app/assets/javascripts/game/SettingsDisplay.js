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
	    min: 0.1,
	    max: 4.0,
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
	    min: 0.1,
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
	var bgColorDiv = $("<div>", {id: "bgColorDiv"});
	settingsDiv.append(bgColorDiv);
	
	var bgColorLabel = $("<span>", {id: "bgColorLabel", class: "property-heading"});
	bgColorLabel.text("UI Background");
	bgColorDiv.append(bgColorLabel);
	
	var bgColorInput = $("<input>", {id: "bgColorInput", value: Settings.get(Settings.UI_BG_COLOR)});
	bgColorDiv.append(bgColorInput);
	
	bgColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: function(color) {
			var settingKey = Settings.UI_BG_COLOR;
			var color = color.toHexString();
			Settings.set(settingKey, color);
			
			handleSettingsUpdate(settingKey);
		}
	});
	
	////////////////////////////////////////////
	// create the UI foreground color setting //
	var fgColorDiv = $("<div>", {id: "fgColorDiv"});
	settingsDiv.append(fgColorDiv);
	
	var fgColorLabel = $("<span>", {id: "fgColorLabel", class: "property-heading"});
	fgColorLabel.text("UI Foreground");
	fgColorDiv.append(fgColorLabel);
	
	var fgColorInput = $("<input>", {id: "bgColorInput", value: Settings.get(Settings.UI_FG_COLOR)});
	fgColorDiv.append(fgColorInput);
	
	fgColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: function(color) {
			var settingKey = Settings.UI_FG_COLOR;
			var color = color.toHexString();
			Settings.set(settingKey, color);
			
			handleSettingsUpdate(settingKey);
		}
	});
	
	/////////////////////////////////////
	// create the player color setting //
	var playerColorDiv = $("<div>", {id: "playerColorDiv"});
	settingsDiv.append(playerColorDiv);
	
	var playerColorLabel = $("<span>", {id: "playerColorLabel", class: "property-heading"});
	playerColorLabel.text("Player");
	playerColorDiv.append(playerColorLabel);
	
	var playerColorInput = $("<input>", {id: "playerColorInput", value: Settings.get(Settings.UI_PLAYER_COLOR)});
	playerColorDiv.append(playerColorInput);
	
	playerColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: function(color) {
			var settingKey = Settings.UI_PLAYER_COLOR;
			var color = color.toHexString();
			Settings.set(settingKey, color);
			
			handleSettingsUpdate(settingKey);
		}
	});
	
	////////////////////////////////////
	// create the enemy color setting //
	var enemyColorDiv = $("<div>", {id: "enemyColorDiv"});
	settingsDiv.append(enemyColorDiv);
	
	var enemyColorLabel = $("<span>", {id: "enemyColorLabel", class: "property-heading"});
	enemyColorLabel.text("Enemy");
	enemyColorDiv.append(enemyColorLabel);
	
	var enemyColorInput = $("<input>", {id: "enemyColorInput", value: Settings.get(Settings.UI_ENEMY_COLOR)});
	enemyColorDiv.append(enemyColorInput);
	
	enemyColorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: function(color) {
			var settingKey = Settings.UI_ENEMY_COLOR;
			var color = color.toHexString();
			Settings.set(settingKey, color);
			
			handleSettingsUpdate(settingKey);
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