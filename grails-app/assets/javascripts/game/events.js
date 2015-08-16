/**
 * events.js - Handles all events for the game
 */
"use strict";

function tick(event) {
	
	if(fpsDisplay != null) {
		if(update) {
			fpsDisplay.htmlElement.innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
			
			if(!$("#fpsDiv").hasClass("active")) {
				$('#fpsDiv').toggleClass("active");
			}
		}
		else{
			fpsDisplay.htmlElement.innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
			
			if($("#fpsDiv").hasClass("active") 
					&& createjs.Ticker.getTime() - lastUpdate > 500) {
				$('#fpsDiv').toggleClass("active");
			}
		}
	}
	
	// only update when something actually needs to be updated on screen
	if(update) {
		rootStage.update(event);
		
		lastUpdate = createjs.Ticker.getTime();
		update = false;
	}
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
		/*if(playerWeapons[weaponFired] != null) {
			var thisWeapon = playerWeapons[weaponFired];
			
			// TODO: create method to handle toggling weapons and if they actually can be fired before toggling
			// TODO: handle firing weapons only from current player turn unit using isPlayerUnitTurn()
			if(playerUnit == turnUnit 
					&& !$('#'+thisWeapon.id).hasClass("cooldown") 
					&& !$('#'+thisWeapon.id).hasClass("disabled")){
				// only allow weapons to be selected that aren't on cooldown
				$('#'+thisWeapon.id).toggleClass("selected");
				
				updateSelectedWeapons();
			}
		}*/
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
	else if(key == "`"){
		// toggle isometric view
		useIsometric = !useIsometric;
		updateHexDisplayObjects();
		updateUnitDisplayObjects();
		update = true;
	}
	else if(key == "home"){
		// enter fullscreen mode
		goFullScreen();
	}
	else {
		console.log("Unbound key pressed: " + key);
	}
}

/**
 * Enables fullscreen mode, if supported
 */
function goFullScreen(){
	if (fullScreenApi.supportsFullScreen) {
		fullScreenApi.requestFullScreen(document.body);
	}
}

/**
 * Resizes the canvas based on the current browser window size
 */
function resize_canvas(){
	if(stage != null){
		// TODO: add method to also center on the turn unit on resize
		
		canvas.width = window.innerWidth - 5;
		canvas.height = window.innerHeight - 5;
		
		console.log("resizing window ("+window.innerWidth+"x"+window.innerHeight+") stage: "+canvas.width+"x"+canvas.height);
		
		// Keep the board from shifting to the center the first time it is dragged if the window is wider than the board
		if(canvas.width > (numCols+1) * (3 * hexWidth / 4)){
			console.log("stage width "+canvas.width+" > "+
				"board width "+(numCols+1)+" * "+(3 * hexWidth / 4)+"="+((numCols+1) * (3 * hexWidth / 4)));
			
		    if(stage.x < -((numCols+1) * (3 * hexWidth / 4)) + canvas.width){
		    	stage.x = -((numCols+1) * (3 * hexWidth / 4)) + canvas.width;
		    }
		    if(stage.x > (3 * hexWidth / 4)) {
		    	stage.x = (3 * hexWidth / 4);
		    }
		}
		
		// update displayable hexes
		updateHexMapDisplay();
		
		// update the UI elements that need to change position
		updatePlayerUI();
		
		update = true;
	}
}

/**
 * Updates the visible HexDisplay objects that are rendered on screen or off
 */
function updateHexMapDisplay() {
	var startX = - stage.x;
    var startY = - stage.y;
    
    var canvasX = startX + canvas.width;
    var canvasY = startY + canvas.height;
    
    var scaledHexWidth = hexWidth * stage.scaleX;
    var scaledHexHeight = hexHeight * stage.scaleY;
    
    for(var y=0; y<numRows; y++){
		
		var thisHexRow = hexMap[y];
		if(thisHexRow == null){
			continue;
		}
		
		for(var x=0; x<numCols; x++){
			
			var thisHex = thisHexRow[x];
			if(thisHex == null){
				continue;
			}
			
			var thisDisplayHex = thisHex.hexDisplay;
			if(thisDisplayHex == null){
				continue;
			}
			
			// start with making it visible until the location checks prove it is not
			thisDisplayHex.visible = true;
			
			var xOffset = x * (3 * scaledHexWidth / 4);
			var yOffset = y * scaledHexHeight;
			
			if(thisDisplayHex.isXOdd()){
				yOffset = (scaledHexHeight / 2) + (y * scaledHexHeight);
			}
			
			// TODO: handle pop-in of hexes at the bottom of the screen when using isometric mode
			
			if((xOffset + scaledHexWidth < startX || xOffset > canvasX) 
					|| (yOffset + scaledHexHeight < startY || yOffset > canvasY)) {
				// hex object is outside of the view area
				thisDisplayHex.visible = false;
			}
		}
    }
}

function handleProgress(event) {
	progress.graphics.clear();
    
    // Draw the outline again.
    progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
    
    // Draw the progress bar
    progress.graphics.beginFill("#ff0000").drawRect(0,0,100*event.progress,20);
    
    update = true;
}

function handleComplete(event) {
	stage.removeChild(progress);
	
	// Initialize the hex map display objects
	initHexMapDisplay();
	
	// Initialize the units display objects
	initUnitsDisplay();
	
	// Initialize the player UI
	initPlayerUI();
	
	// TODO: Initialize current selected/player turn unit AP display
	/*setActionPoints(playerUnit.apRemaining);
	setJumpPoints(playerUnit.jpRemaining);
	setHeatDisplay(playerUnit.heat);
	setArmorDisplay(playerUnit.armor, playerUnit.internals);
	updateWeaponsDisplay();*/
	
	// Initialize FPS counter
	var fpsDiv = document.getElementById("fpsDiv");
	fpsDisplay = new createjs.DOMElement(fpsDiv);
	fpsDisplay.x = -rootStage.x - 10;
    fpsDisplay.y = -rootStage.y + 100 ;
    overlay.addChild(fpsDisplay);
    
    // only show the fullscreen button on mobile devices browsers
    if( fullScreenApi.supportsFullScreen
    		&& (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    		|| devMode)) {
    	// TODO: find a better place for the fullscreen button
		var fsButton = new createjs.Container();
		fsButton.x = 0;
		fsButton.y = 100;
		rootStage.addChild(fsButton);
		
		var fsBackground = new createjs.Shape();
		fsBackground.graphics.setStrokeStyle(2, "round").beginStroke("#C0C0C0").beginFill("#404040").drawRect(0,0,100,25);
		fsButton.addChild(fsBackground);
		
		var fsText = new createjs.Text("Go Fullscreen", "12px Arial", "white");
		fsText.x = (100 - fsText.getMeasuredWidth())/2;
		fsText.y = (25 - fsText.getMeasuredHeight())/2;
		fsButton.addChild(fsText);
		
		fsButton.on("click", goFullScreen);
		fsButton.mouseChildren = false;
    }
    
    // resize the canvas and adjust the board to the canvas on first load
	resize_canvas();
    
    update = true;
    firstUpdate = false;
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
	var targetUnitDisplay = event.target;
	var targetUnit = targetUnitDisplay.getUnit();
	
	console.log("clicked "+targetUnitDisplay); 
	
	if(isPlayerUnitTurn() && !isPlayerUnit(targetUnit)) {
		var prevTargetUnit = getUnitTarget(turnUnit);
		setUnitTarget(turnUnit, targetUnit);
		
		setPlayerTarget(targetUnit);
		
		// show the unit indicator on the previous target, hide on the new target
		if(prevTargetUnit != null && prevTargetUnit.getUnitDisplay()!= null
				&& prevTargetUnit.id != targetUnit.id) {
			prevTargetUnit.getUnitDisplay().setUnitIndicatorVisible(true);
		}
		targetUnitDisplay.setUnitIndicatorVisible(false);
		
		target(targetUnit);
	}
}

function handleTargetCloseClick(event) {
	createjs.Tween.get(weaponsContainer).to({alpha: 0}, 250);
	createjs.Tween.get(targetContainer).to({alpha: 0}, 250);
	createjs.Tween.get(targetBracket).to({alpha: 0}, 250);
}

//Using jQuery add the event handlers after the DOM is loaded
var specialKeyCodes = [8, 9, 13, 16, 17, 18, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
function addEventHandlers() {
	// add event handler for key presses
	document.onkeypress = function(e){
		var charCode = e.which || e.keyCode;
		var key = String.fromCharCode(charCode);
		
		handleKeyPress(key);
		
		e.preventDefault();
	};
	
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
	evt.preventDefault();
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
	
	var scaledHexWidth = hexWidth * stage.scaleX;
    var scaledHexHeight = hexHeight * stage.scaleY;
	
    stage.x = newX;
    stage.y = newY;
    
    // Keep the board from going off the window too much
    keepBoardInWindow();
    
    // update visible hexes
    updateHexMapDisplay();
    
    update = true;
}

// stage onmousewheel event triggers this method
var allowMouseWheelZoom = true;
function handleMouseWheel(evt) {
	evt.preventDefault();
	
	if(allowMouseWheelZoom === false) return;
	
	// need to handle different browsers differently based on event and property type defined when mouse scroll is used
	if (!evt) evt = event;
	var direction = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
	
	var mouseX = evt.clientX;
	var mouseY = evt.clientY;
	
	var oldScale = stage.scaleX;
	var newScale = stage.scaleX + (direction * 0.05);
	
	if(newScale > 0 && newScale <= 5) {
		stage.scaleX = newScale;
		stage.scaleY = newScale;
		
		console.log("scale="+newScale);
		
		// Keep the board from going off the window too much
	    keepBoardInWindow();
		
		// update visible hexes
	    updateHexMapDisplay();
	    
	    update = true;
	}
}

function keepBoardInWindow() {
	var scaledHexWidth = hexWidth * stage.scaleX;
    var scaledHexHeight = hexHeight * stage.scaleY;
    
    // Keep the board from going off the window too much
    if(stage.x < -((numCols+1) * (3 * scaledHexWidth / 4)) + canvas.width){
    	stage.x = -((numCols+1) * (3 * scaledHexWidth / 4)) + canvas.width;
    }
    if(stage.x > 10) {
    	stage.x = 10;
    }
    
    if(stage.y < -((scaledHexHeight / 2) + (numRows * scaledHexHeight)) + canvas.height){
    	stage.y = -((scaledHexHeight / 2) + (numRows * scaledHexHeight)) + canvas.height;
    }
    if(stage.y > 10 + (isometricPadding * stage.scaleY)) {
    	stage.y = 10 + (isometricPadding * stage.scaleY);
    }
}
