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
			effect: "blind",
			duration: 500
		},
		hide: {
			effect: "blind",
			duration: 250
		}
    });
	
	////////////////////////////////////
	// create the board scale setting //
	this.boardScaleSlider = SettingsDisplay.createSliderSetting(
			settingsDiv,
			"boardScale", "Board Scale", 
			Settings.get(Settings.BOARD_SCALE),
			0.2, 3.0, 0.1,
			function(ui) {
				handleZoomBoard(ui.value);
			}
	); 
	
	/////////////////////////////////
	// create the UI scale setting //
	this.uiScaleSlider = SettingsDisplay.createSliderSetting(
			settingsDiv,
			"uiScale", "UI Scale", 
			Settings.get(Settings.UI_SCALE),
			0.3, 3.0, 0.05,
			function(ui) {
				handleScaleOverlay(ui.value);
			}
	); 
	
	///////////////////////////////////////////////////
	this.bgTransSlider = SettingsDisplay.createSliderSetting(
			settingsDiv,
			"bgTrans", "UI Opacity", 
			Settings.get(Settings.UI_OPACITY),
			0, 1, 0.05,
			function(ui) {
				var settingKey = Settings.UI_OPACITY;
		    	var opacity = ui.value;
		    	
				Settings.set(settingKey, opacity);
				handleSettingsUpdate(settingKey);
			}
	); 
	
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
	var positionOffset = (75/2) * Settings.get(Settings.UI_SCALE); 
	
	this.update();
	this.settingsDialog.dialog("option", "position", {my: "left top+"+positionOffset, at: "left top", of: canvas});
	this.settingsDialog.dialog("open");
}

/**
 * Creates a slider settings option and returns the slider object
 */
SettingsDisplay.createSliderSetting = function(settingsDiv, sliderName, sliderText, sliderValue, sliderMin, sliderMax, sliderStep, callFunction) {
	var settingOuterDiv = $("<div>", {id: sliderName+"Div"});
	settingsDiv.append(settingOuterDiv);
	
	var settingLabel = $("<span>", {id: sliderName+"Label", class: "property-heading"});
	settingLabel.text(sliderText);
	settingOuterDiv.append(settingLabel);
	
	var settingValue = $("<span>", {id: sliderName+"Value", class: "property-value"});
	settingValue.css("float", "right");
	settingOuterDiv.append(settingValue);
	
	var settingInnerDiv = $("<div>", {id: sliderName+"InnerDiv", class: "sliderDiv"});
	settingOuterDiv.append(settingInnerDiv);
	
	var settingSlider = $("<div>", {id: sliderName+"Slider", class: "slider property-value"});
	
	var slideLeftBtn = $("<button>", {id: sliderName+"SlideLeftBtn", class: "sliderButton"});
	slideLeftBtn.button({
		text: false,
		icons: {primary: "ui-icon-seek-prev"}
	});
	slideLeftBtn.click(function() {
		var val = settingSlider.slider("value"), step = settingSlider.slider("option", "step");
		settingSlider.slider("value", val - step);
	});
	
	var slideRightBtn = $("<button>", {id: sliderName+"SlideRightBtn", class: "sliderButton"});
	slideRightBtn.button({
		text: false,
		icons: {primary: "ui-icon-seek-next"}
	});
	slideRightBtn.click(function() {
		var val = settingSlider.slider("value"), step = settingSlider.slider("option", "step");
		settingSlider.slider("value", val + step);
	});
	
	settingInnerDiv.append(slideLeftBtn);
	settingInnerDiv.append(settingSlider);
	settingInnerDiv.append(slideRightBtn);
	
	settingSlider.slider({
		value: sliderValue,
	    min: sliderMin,
	    max: sliderMax,
	    step: sliderStep,
	    change: function(event, ui) {
	    	settingValue.text(ui.value);
	    	callFunction(ui);
	    },
	    slide: function(event, ui) {
	    	settingValue.text(ui.value);
	    	callFunction(ui);
	    }
	});
	settingValue.text(settingSlider.slider("value"));
	
	return settingSlider;
}

window.SettingsDisplay = SettingsDisplay;
}());