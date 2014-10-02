/**
 * events.js - Handles all events for the game
 */

function tick(event) {
	
	if(fpsDisplay != null) {
		fpsDisplay.htmlElement.innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
	}
	
	stage.update(event);
}

function handleProgress(event) {
	progress.graphics.clear();
    
    // Draw the outline again.
    progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
    
    // Draw the progress bar
    progress.graphics.beginFill("#ff0000").drawRect(0,0,100*event.progress,20);
}

function handleComplete(event) {
	stage.removeChild(progress);
	
	// Initialize the hex map display objects
	initHexMapDisplay();
	
	// Initialize the units display objects
	initUnitsDisplay();
	
	// Initialize the player UI
	initPlayerUI();
	setPlayerInfo(playerUnit.name+" "+playerUnit.chassisVariant, playerUnit.callsign);
	
	// Initialize player AP display
	setActionPoints(playerUnit.actionPoints);
	setJumpPoints(playerUnit.jumpPoints);
	setHeatDisplay(playerUnit.heat);
	setArmorDisplay(playerUnit.armor, playerUnit.internals);
	
	// TESTING weapons display
	setWeaponsDisplay(playerUnit.weapons);
	
	// Initialize FPS counter
	var fpsDiv = document.getElementById("fpsDiv");
	fpsDisplay = new createjs.DOMElement(fpsDiv);
	fpsDisplay.x = -10;
	fpsDisplay.y = 10;
    stage.addChild(fpsDisplay);
}

function handleHexClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var hex = event.target;
	
	console.log("clicked "+x+","+y+": "+hex);
	
	// TESTING the clicking based movement on adjacent hexes
	if(!playerUnit.coords.equals(hex.coords)){
		var adjacents = playerUnit.coords.getAdjacentCoords();
		
		// see if the clicked hex is one of the adjacents
		for (var toHeading = 0; toHeading < 6; toHeading++) {
			var adj = adjacents[toHeading];
			if(adj != null && adj.equals(hex.coords)) {
				// figure out which way that direction is relative to the unit heading, then turn or move accordingly
				
				if(toHeading == playerUnit.heading) {
					// move forward
					move(true);
				}
				else if(toHeading == ((playerUnit.heading + 3) % 6)) {
					// move backward
					move(false);
				}
				else {
					var cwHeadings = [(playerUnit.heading + 1) % 6, (playerUnit.heading + 2) % 6];
					var ccwHeadings = [(playerUnit.heading - 1) % 6, (playerUnit.heading - 2) % 6];
					
					if(jQuery.inArray( toHeading, cwHeadings ) >= 0){
						// rotate Heading CW
						rotate(true);
					}
					else{
						// rotate Heading CCW
						rotate(false);
					}
				}
				
				break;
			}
		}
	}
}

function handleUnitClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var unit = event.target;
	
	console.log("clicked "+x+","+y+": "+unit); 
	
	if(playerUnit != unit) {
		setTargetDisplay(unit);
	}
}

//Using jQuery add the event handlers after the DOM is loaded
function addEventHandlers() {
	// add event handler for key presses
	document.onkeypress = function(e){
		var charCode = e.which || e.keyCode;
		var key = String.fromCharCode(charCode);
		
		handleKeyPress(key);
		
		e.preventDefault();
	};
	
	specialKeyCodes = [8, 9, 13, 16, 17, 18, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
	window.addEventListener("keydown", function(e) {
		// handle special keys which don't have char codes, such as space and arrow keys
		if(specialKeyCodes.indexOf(e.keyCode) > -1) {
			e.preventDefault();
			
			var key = "";
			switch(e.keyCode){
				case 8:		key = "backspace";
							break;
				case 9:		key = "tab";
							break;
				case 13:	key = "enter";
							break;
				case 16:	key = "shift";
							break;
				case 17:	key = "ctrl";
							break;
				case 18:	key = "alt";
							break;
				case 27:	key = "escape";
							break;
				case 32:	key = "space";
							break;
				case 33:	key = "pgup";
							break;
				case 34:	key = "pgdn";
							break;
				case 35:	key = "end";
							break;
				case 36:	key = "home";
							break;
				case 37:	key = "left";
							break;
				case 38:	key = "up";
							break;
				case 39:	key = "right";
							break;
				case 40:	key = "down";
							break;
				case 45:	key = "insert";
							break;
				case 46:	key = "delete";
							break;
				default:	key = "undefined";
							break;
			}
			
			handleKeyPress(key);
		}
	}, false);
}

function handleKeyPress(key) {
	if(!playerActionReady){
		// TODO: alternate actions if pressed when not player turns or between being ready for next action
		console.log("Waiting...")
		return;
	}
	
	if(key == "." || key == "space" || key == "enter"){
		// Skip the remainder of the turn
		skip();
	}
	else if(key == "a" || key == "left"){
		// turn left/CCW
		rotate(false);
	}
	else if(key == "d" || key == "right"){
		// turn right/CW
		rotate(true);
	}
	else if(key == "w" || key == "up"){
		// move forward
		move(true);
	}
	else if(key == "s" || key == "down"){
		// move backward
		move(false);
	}
}