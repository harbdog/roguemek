/**
 * Class for displaying and interacting with the game Settings dialog
 */
(function() {
"use strict";

function SettingsDisplay() {
	
	this.settingsDiv = null;
	
	this.boardScaleSlider = null;
	this.uiScaleSlider = null;
	
	this.init();
}
var s = SettingsDisplay.prototype;

s.init = function() {
	// Initialize dialog for the settings display
	this.settingsDiv = $("#settingsDiv").dialog({
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
	
	// create the board scale setting
	var boardScaleDiv = $("<div>", {id: "boardScaleDiv"});
	$("#settingsDiv").append(boardScaleDiv);
	
	var boardScaleLabel = $("<span>", {id: "boardScaleLabel", class: "property-heading"});
	boardScaleLabel.text("Board Scale");
	$("#boardScaleDiv").append(boardScaleLabel);
	
	var boardScaleValue = $("<span>", {id: "boardScaleValue", class: "property-value"});
	boardScaleValue.css("float", "right");
	$("#boardScaleDiv").append(boardScaleValue);
	
	this.boardScaleSlider = $("<div>", {id: "boardScaleSlider", class: "property-value"});
	$("#boardScaleDiv").append(this.boardScaleSlider);
	
	this.boardScaleSlider.slider({
		value: 1.0,
	    min: 0.1,
	    max: 4.0,
	    step: 0.1,
	    change: function( event, ui ) {
	    	boardScaleValue.text( ui.value );
	    },
	    slide: function( event, ui ) {
	    	boardScaleValue.text( ui.value );
	    	handleZoomBoard(ui.value);
	    }
	});
	boardScaleValue.text(this.boardScaleSlider.slider("value"));
}

s.update = function() {
	// update any values that need to be updated between showing settings
	// such as zoom/scale that can be adjusted without using the settings menu
	this.boardScaleSlider.slider("option", "value", amplify.store("BOARD_SCALE"));
}

s.show = function() {
	this.update();
	this.settingsDiv.dialog("open");
}

window.SettingsDisplay = SettingsDisplay;
}());