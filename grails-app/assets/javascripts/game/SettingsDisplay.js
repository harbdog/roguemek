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
			function(value) {
				handleZoomBoard(value);
			}
	); 
	
	/////////////////////////////////
	// create the UI scale setting //
	this.uiScaleSlider = SettingsDisplay.createSliderSetting(
			settingsDiv,
			"uiScale", "UI Scale", 
			Settings.get(Settings.UI_SCALE),
			0.3, 3.0, 0.05,
			function(value) {
				handleScaleOverlay(value);
			}
	); 
	
	///////////////////////////////////
	// create the UI opacity setting //
	var bgTransSlider = SettingsDisplay.createSliderSetting(
			settingsDiv,
			"bgTrans", "UI Opacity", 
			Settings.get(Settings.UI_OPACITY),
			0, 1, 0.05,
			function(value) {
				var settingKey = Settings.UI_OPACITY;
		    	var opacity = value;
		    	
				Settings.set(settingKey, opacity);
				handleSettingsUpdate(settingKey);
			}
	); 
	
	////////////////////////////////////////////
	// create the UI background color setting //
	var enemyColorInput = SettingsDisplay.createColorSetting(
			settingsDiv,
			"bgColor", "UI Background",
			Settings.UI_BG_COLOR
	);
	
	////////////////////////////////////////////
	// create the UI foreground color setting //
	var enemyColorInput = SettingsDisplay.createColorSetting(
			settingsDiv,
			"fgColor", "UI Foreground",
			Settings.UI_FG_COLOR
	);
	
	/////////////////////////////////////
	// create the player color setting //
	var playerColorInput = SettingsDisplay.createColorSetting(
			settingsDiv,
			"player", "Player",
			Settings.UI_PLAYER_COLOR
	);
	
	////////////////////////////////////
	// create the enemy color setting //
	var enemyColorInput = SettingsDisplay.createColorSetting(
			settingsDiv,
			"enemy", "Enemy",
			Settings.UI_ENEMY_COLOR
	);
	
	//////////////////////////////////////
	// create the caching level setting //
	var cachingSlider = SettingsDisplay.createTextSliderSetting(
			settingsDiv,
			"caching", "Graphics", 
			Settings.get(Settings.GFX_CACHING),
			["Performance", "Balance", "Quality"],
			function(value) {
				var settingKey = Settings.GFX_CACHING;
		    	
				Settings.set(settingKey, value);
				handleSettingsUpdate(settingKey);
			}
	); 
	
	//////////////////////////////////
	// create the framerate setting //
	var framerateSlider = SettingsDisplay.createSliderSetting(
			settingsDiv,
			"framerate", "Target Framerate", 
			Settings.get(Settings.GFX_FRAMERATE),
			20, 120, 1,
			function(value) {
				var settingKey = Settings.GFX_FRAMERATE;
		    	var framerate = value;
		    	
				Settings.set(settingKey, framerate);
				handleSettingsUpdate(settingKey);
			}
	);
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
	    	callFunction(ui.value);
	    },
	    slide: function(event, ui) {
	    	settingValue.text(ui.value);
	    	callFunction(ui.value);
	    }
	});
	settingValue.text(settingSlider.slider("value"));
	
	return settingSlider;
}

/**
 * Creates a slider settings option, which has only text values as selections, and returns the slider object
 */
SettingsDisplay.createTextSliderSetting = function(settingsDiv, sliderName, sliderText, sliderValue, sliderValueList, callFunction) {
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
	    min: 0,
	    max: sliderValueList.length-1,
	    step: 1,
	    create: function(event, ui) {
	    	settingValue.text(sliderValueList[sliderValue]);
	    },
	    change: function(event, ui) {
	    	settingValue.text(sliderValueList[ui.value]);
	    	callFunction(ui.value);
	    },
	    slide: function(event, ui) {
	    	settingValue.text(sliderValueList[ui.value]);
	    	callFunction(ui.value);
	    }
	});
	
	return settingSlider;
}

/**
 * Creates a color picker settings option and returns the color input object
 */
SettingsDisplay.createColorSetting = function(settingsDiv, settingName, settingText, settingKey) {
	var colorDiv = $("<div>", {id: settingName+"ColorDiv"});
	settingsDiv.append(colorDiv);
	
	var colorInput = $("<input>", {id: settingName+"ColorInput", class: "property-value", value: Settings.get(settingKey)});
	colorDiv.append(colorInput);
	
	var colorLabel = $("<span>", {id: settingName+"ColorLabel", class: "property-heading"});
	colorLabel.text(settingText);
	colorDiv.append(colorLabel);
	
	var colorUpdateFunc = function(tinycolor) {
		var color = tinycolor.toHexString();
		
		Settings.set(settingKey, color);
		handleSettingsUpdate(settingKey);
	};
	
	colorInput.spectrum({
		preferredFormat: "hex",
		showInitial: true,
		move: colorUpdateFunc,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor(Settings.get(settingKey)));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed
			} else {
				// cancelled
				colorUpdateFunc($(this).data('origColor'));
			}
		}
	});
	
	return colorInput;
}

window.SettingsDisplay = SettingsDisplay;
}());