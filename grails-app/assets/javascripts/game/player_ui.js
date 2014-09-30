/**
 * player_ui.js - Methods that handle the non-canvas player UI
 */

var playerInfoDisplay, unitStatsDisplay, unitHeatDisplay;

var apDisplaying, jpDisplaying;

function initPlayerUI() {
	playerInfoDisplay = document.getElementById("infoDiv");
	unitStatsDisplay = document.getElementById("statsDiv");
	unitHeatDisplay = document.getElementById("heatDiv");
}

function setPlayerInfo(unitName, playerName) {
	playerInfoDisplay.innerHTML = 
			"<p>"+unitName+"</p>"+
			"<p>"+playerName+"</p>";
}

function setActionPoints(actionPoints) {
	apDisplaying = actionPoints;
	
	if(actionPoints == 0){
		// TODO: hide the END button when out of AP
	}

	updateUnitStatsDisplay();
}

function setJumpPoints(jumpPoints) {
	jpDisplaying = jumpPoints;
	
	if(jumpPoints == null) {
		// TODO: null means no jump jets, hide the JP display and JUMP Button
	}
	
	updateUnitStatsDisplay();
}

function updateUnitStatsDisplay() {
	var statsString = "";
	
	if(apDisplaying != null) {
		statsString += "<p>AP "+apDisplaying+"</p>";
	}
	
	if(jpDisplaying != null) {
		statsString += "<p>JP "+jpDisplaying+"</p>";
	}
	
	unitStatsDisplay.innerHTML = statsString;
}

function setHeatDisplay(heat) {
	unitHeatDisplay.innerHTML = "<p>Heat "+heat+"</p>";
}