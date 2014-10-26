/**
 * events.js - Handles all events for the game
 */

function tick(event) {
	
	if(fpsDisplay != null) {
		fpsDisplay.htmlElement.innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
	}
	
	// TODO: only update when something actually needs to be updated on screen
	
	stage.update(event);
}

function handleKeyPress(key) {
	if(!playerActionReady){
		// TODO: alternate actions if pressed when player turns but between being ready for another action
		console.log("Waiting...")
		return;
	}
	
	// TODO: alternate actions if pressed when not player turn so the server isn't bugged by it
	
	var weaponFired = -1;
	
	// pressing 1-0 fires that weapon
	for(var i=1; i<=10; i++){
		var strVal = i.toString();
		if(i == 10) strVal = "0";
		
		if(key == strVal){
			weaponFired = (i-1);
			break;
		}
	}
	
	if(weaponFired >= 0){
		// Toggle the weapon UI for firing
		if(playerWeapons[weaponFired] != null) {
			// TODO: create method to handle toggling weapons and if they actually can be fired before toggling
			var thisWeapon = playerWeapons[weaponFired];
			$('#'+thisWeapon.id).toggleClass("selected");
			
			updateSelectedWeapons();
		}
	}
	else if(key == "." || key == "space" || key == "enter"){
		// Skip the remainder of the turn
		// TODO: OR fire any selected weapons
		var selectedWeapons = getSelectedWeapons();
		
		if(selectedWeapons.length == 0){
			skip();
		}
		else{
			fire_weapons(selectedWeapons);
		}
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

/**
 * Resizes the canvas based on the current browser window size
 */
function resize_canvas(){
	if(stage != null){
		// TODO: add method to also center on the player unit on resize
		
		stage.canvas.width = window.innerWidth - 5;
		stage.canvas.height = window.innerHeight - 5;
		
		console.log("resizing window ("+window.innerWidth+"x"+window.innerHeight+") stage: "+stage.canvas.width+"x"+stage.canvas.height);
		
		// Keep the board from shifting to the center the first time it is dragged if the windows is wider than the board
		if(stage.canvas.width > (numCols+1) * (3 * hexWidth / 4)){
			console.log("stage width "+stage.canvas.width+" > "+
				"board width "+(numCols+1)+" * "+(3 * hexWidth / 4)+"="+((numCols+1) * (3 * hexWidth / 4)));
			
		    if(stage.x < -((numCols+1) * (3 * hexWidth / 4)) + stage.canvas.width){
		    	stage.x = -((numCols+1) * (3 * hexWidth / 4)) + stage.canvas.width;
		    }
		    if(stage.x > (3 * hexWidth / 4)) {
		    	stage.x = (3 * hexWidth / 4);
		    }
		}
		
		// resize certain UI elements to fit the window size
		$("#messagingArea").css({width: stage.canvas.width - playerContainerWidth - 10, height: messagingContainerHeight});
		$("#controlDiv").css({width: stage.canvas.width - playerContainerWidth});
	}
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
	updateWeaponsDisplay();
	
	// Initialize FPS counter
	var fpsDiv = document.getElementById("fpsDiv");
	fpsDisplay = new createjs.DOMElement(fpsDiv);
	fpsDisplay.x = -stage.x - 10;
    fpsDisplay.y = -stage.y + stage.canvas.height - 20;
    stage.addChild(fpsDisplay);
}

/**
 * Handles control input from the user
 * @param event
 * @param action
 */
function handleControls(action) {
	if(ACTION_ROTATE_CW == action) {
		// rotate Heading CW
		rotate(true);
	}
	else if(ACTION_ROTATE_CCW == action) {
		// rotate Heading CCW
		rotate(false);
	}
	else if(ACTION_FORWARD == action) {
		// move forward
		move(true);
	}
	else if(ACTION_BACKWARD == action) {
		// move backward
		move(false);
	}
}

function handleHexClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var hex = event.target;
	
	console.log("clicked "+x+","+y+": "+hex);
	
	/*//TESTING the clicking based movement on adjacent hexes
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
	}*/
}

function handleUnitClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var unitDisplay = event.target;
	if(unitDisplay != null){
		var unit = units[unitDisplay.id];
	}
	
	console.log("clicked "+x+","+y+": "+unit); 
	
	if(playerUnit != unit) {
		playerTarget = unit;
		updateTargetDisplay();
	}
}

function handleTargetCloseClick(event) {
	createjs.Tween.get(weaponsContainer).to({alpha: 0}, 250);
	createjs.Tween.get(targetContainer).to({alpha: 0}, 250);
	createjs.Tween.get(targetBracket).to({alpha: 0}, 250);
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

// Goes along with the stage pressmove event
var allowStageDragMove = true;
function handleStageDrag(evt) {
	if(allowStageDragMove === false) return;
	else if(evt.type == "pressup"){
		// reset click and drag map panning
		stageInitDragMoveX = null;
		stageInitDragMoveY = null;
		return;
	}

	// Add click and drag to pan the map
	if(stageInitDragMoveX == null){
		stageInitDragMoveX = evt.stageX - stage.x;
		stageInitDragMoveY = evt.stageY - stage.y;
	}
	
	var newX = evt.stageX - stageInitDragMoveX;
	var newY = evt.stageY - stageInitDragMoveY;
	
	if(Math.abs(stage.x - newX) < 10 && Math.abs(stage.y - newY) < 10){
		// do not start moving the stage until there is a clear intent to drag a reasonable small distance
		return;
	}
	
    stage.x = newX;
    stage.y = newY;
    
    // Keep the board from going off the window too much
    if(stage.x < -((numCols+1) * (3 * hexWidth / 4)) + stage.canvas.width){
    	stage.x = -((numCols+1) * (3 * hexWidth / 4)) + stage.canvas.width;
    }
    if(stage.x > playerContainerWidth) {
    	stage.x = playerContainerWidth;
    }
    
    if(stage.y < -((hexHeight / 2) + (numRows * hexHeight)) + stage.canvas.height + weaponsContainerOffsetY){
    	stage.y = -((hexHeight / 2) + (numRows * hexHeight)) + stage.canvas.height + weaponsContainerOffsetY;
    }
    if(stage.y > messagingContainerHeight) {
    	stage.y = messagingContainerHeight;
    }
    
    // handle stage overlay movement
    fpsDisplay.x = -stage.x - 10;
    fpsDisplay.y = -stage.y + stage.canvas.height - 20;
    
    weaponsContainer.x = -stage.x + playerContainerWidth;
    weaponsContainer.y = -stage.y + stage.canvas.height + weaponsContainerOffsetY;
    
    playerContainer.x = -stage.x;
    playerContainer.y = -stage.y;
    
    messagingContainer.x = -stage.x + playerContainerWidth;
    messagingContainer.y = -stage.y;
}

function handleTargetDrag(evt) {
	if(evt.type == "pressup"){
		allowStageDragMove = true;
		return;
	}
	
	allowStageDragMove = false;
	targetContainer.x = evt.stageX - playerContainerWidth;
	targetContainer.y = evt.stageY - hexHeight / 2;
}