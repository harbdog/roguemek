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

function pingResponse(data) {
	console.log(data);
	var pong = new Date().getTime();
	var milliseconds = pong - lastPing;
	
	if(pingDisplay != null) {
		pingDisplay.htmlElement.innerHTML = milliseconds + " ms";
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

		// TESTING: weapons fire, see console
		if(isPlayerUnitTurn()) {
			var weapon, index = 0;
			for(var id in turnUnit.weapons) {
				if(weaponFired == index) {
					weapon = turnUnit.weapons[id];
					break;
				}
				
				index ++;
			}
			
			if(weapon != null && !weapon.isMeleeWeapon()) {
				var selectedIndex = $.inArray(weapon, selectedWeapons);
				if(selectedIndex == -1) {
					addSelectedWeapon(weapon);
				}
				else {
					removeSelectedWeapon(weapon);
				}
				
				// update the selected weapons on the UI and their heat that would be generated
				updateSelectedWeapons();
			}
		}
	}
	else if(key == "." || key == "space" || key == "enter"){
		// Skip the remainder of the turn
		// OR fire any selected weapons
		setControlActive(PlayerControl.TYPE_CENTER, true);
		
		var weaponsToFire = getSelectedWeapons();
		if(weaponsToFire.length == 0){
			skip();
		}
		else{
			fire_weapons(weaponsToFire);
			
			clearSelectedWeapons();
		}
	}
	else if(key == "a" || key == "left"){
		// turn left/CCW
		setControlActive(PlayerControl.TYPE_LEFT, true);
		rotate(false, turnUnit.jumping);
	}
	else if(key == "d" || key == "right"){
		// turn right/CW
		setControlActive(PlayerControl.TYPE_RIGHT, true);
		rotate(true, turnUnit.jumping);
	}
	else if(key == "w" || key == "up"){
		// move forward
		setControlActive(PlayerControl.TYPE_FORWARD, true);
		move(true, turnUnit.jumping);
	}
	else if(key == "s" || key == "down"){
		// move backward
		setControlActive(PlayerControl.TYPE_BACKWARD, true);
		move(false, turnUnit.jumping);
	}
	else if(key == "j"){
		// toggle jump jets
		if(isPlayerUnitTurn()) {
			setControlActive(PlayerControl.TYPE_JUMP, true);
			turnUnit.jumping = !turnUnit.jumping;
			jump(turnUnit.jumping);
		}
	}
	else if(key == "p") {
		// toggle punch to fire
		if(isPlayerUnitTurn()) {
			for(var id in turnUnit.weapons) {
				var weapon = turnUnit.weapons[id];
				if(weapon.isPunch()) {
					var selectedIndex = $.inArray(weapon, selectedWeapons);
					if(selectedIndex == -1) {
						addSelectedWeapon(weapon);
					}
					else {
						removeSelectedWeapon(weapon);
					}
					updateSelectedWeapons();
					break;
				}
			}
		}
	}
	else if(key == "k") {
		// toggle kick to fire
		if(isPlayerUnitTurn()) {
			for(var id in turnUnit.weapons) {
				var weapon = turnUnit.weapons[id];
				if(weapon.isKick()) {
					var selectedIndex = $.inArray(weapon, selectedWeapons);
					if(selectedIndex == -1) {
						addSelectedWeapon(weapon);
					}
					else {
						removeSelectedWeapon(weapon);
					}
					updateSelectedWeapons();
					break;
				}
			}
		}
	}
	else if(key == "c") {
		// toggle charge to fire
		if(isPlayerUnitTurn()) {
			for(var id in turnUnit.weapons) {
				var weapon = turnUnit.weapons[id];
				if(weapon.isCharge()) {
					var selectedIndex = $.inArray(weapon, selectedWeapons);
					if(selectedIndex == -1) {
						addSelectedWeapon(weapon);
					}
					else {
						removeSelectedWeapon(weapon);
					}
					updateSelectedWeapons();
					break;
				}
			}
		}
	}
	else if(key == "v") {
		// toggle DFA to fire
		if(isPlayerUnitTurn()) {
			for(var id in turnUnit.weapons) {
				var weapon = turnUnit.weapons[id];
				if(weapon.isDFA()) {
					var selectedIndex = $.inArray(weapon, selectedWeapons);
					if(selectedIndex == -1) {
						addSelectedWeapon(weapon);
					}
					else {
						removeSelectedWeapon(weapon);
					}
					updateSelectedWeapons();
					break;
				}
			}
		}
	}
	else if(key == "`"){
		// toggle isometric view
		toggleIsometricDisplay();
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
function toggleFullScreen(){
	if (fullScreenApi.supportsFullScreen) {
		if(fullScreenApi.isFullScreen()) {
			fullScreenApi.cancelFullScreen(document.body);
		}
		else {
			fullScreenApi.requestFullScreen(document.body);
		}
	}
}

/**
 * Resizes the canvas based on the current browser window size
 */
function resize_canvas(){
	if(stage != null && !initializing){
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
		
		// update dialog display
		dialogDisplay.dialog("option", "width", (canvas.width >= 900) ? 900 : canvas.width);
		dialogDisplay.dialog("option", "height", (canvas.height >= 600) ? 600 : canvas.height);
		
		if(canvas.width < 900) {
			dialogDisplay.dialog("option", "position", { my: "left", at: "left", of: window});
		}
		else {
			dialogDisplay.dialog("option", "position", { my: "center", at: "center", of: window});
		}
		
		if(canvas.height < 600) {
			dialogDisplay.dialog("option", "position", { my: "top", at: "top", of: window});
		}
		else {
			dialogDisplay.dialog("option", "position", { my: "center", at: "center", of: window});
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
	progress.css("width", (100*event.progress)+"%");
}
var dialogDisplayTitle = "<i>title</i>";
function handleComplete(event) {
	// hide the progress bar
	$("#progressDiv").css("display", "none");
	
	//rootStage.enableMouseOver(10);
	
	// Initialize the hex map display objects
	initHexMapDisplay();
	
	// Initialize the units display objects
	initUnitsDisplay();
	
	// Initialize the player UI
	initPlayerUI();
	
	// Initialize FPS counter
	var fpsDiv = document.getElementById("fpsDiv");
	fpsDisplay = new createjs.DOMElement(fpsDiv);
	fpsDisplay.x = -rootStage.x - 10;
    fpsDisplay.y = -rootStage.y + 80 ;
    overlay.addChild(fpsDisplay);
    
    // Initialize ping display
	var pingDiv = document.getElementById("pingDiv");
	pingDisplay = new createjs.DOMElement(pingDiv);
	pingDisplay.x = -rootStage.x - 10;
	pingDisplay.y = -rootStage.y + 100 ;
    overlay.addChild(pingDisplay);
    
    // Initialize dialog display
    dialogDisplay = $("#dialogDiv").dialog({
    	open: function () { $(this).siblings().find(".ui-dialog-title").html("<div id='unit-title'></div>"); },
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 500
		},
		hide: {
			effect: "clip",
			duration: 250
		}
    });
    
    dialogLoading = $("#loadingDiv").dialog({
    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
    	title: "Loading...",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		}
    });
    
    // show the board zoom in button
    var inButton = new createjs.Container();
    inButton.x = 0;
    inButton.y = 0;
	rootStage.addChild(inButton);
	
	var inBackground = new createjs.Shape();
	inBackground.graphics.setStrokeStyle(2, "round").beginStroke("#FFFFFF").beginFill("#404040").drawRect(0,0, 25,25);
	inButton.addChild(inBackground);
	
	var inText = new createjs.Text("[+]", "12px UbuntuMono", "white");
	inText.x = (25 - inText.getMeasuredWidth())/2;
	inText.y = (25 - inText.getMeasuredHeight()*2)/2;
	inButton.addChild(inText);
	
	inButton.on("click", handleZoomIn);
	inButton.mouseChildren = false;
	
	// show the board zoom out button
	var outButton = new createjs.Container();
	outButton.x = 0;
	outButton.y = 25;
	rootStage.addChild(outButton);
	
	var outBackground = new createjs.Shape();
	outBackground.graphics.setStrokeStyle(2, "round").beginStroke("#FFFFFF").beginFill("#404040").drawRect(0,0, 25,25);
	outButton.addChild(outBackground);
	
	var outText = new createjs.Text("[-]", "12px UbuntuMono", "white");
	outText.x = (25 - outText.getMeasuredWidth())/2;
	outText.y = (25 - outText.getMeasuredHeight()*2)/2;
	outButton.addChild(outText);
	
	outButton.on("click", handleZoomOut);
	outButton.mouseChildren = false;
    
    
    // only show the fullscreen button if the browser supports it
    if( fullScreenApi.supportsFullScreen || devMode ) {
    	// TODO: find a better place for the fullscreen button
		var fsButton = new createjs.Container();
		fsButton.x = 0;
		fsButton.y = 50;
		rootStage.addChild(fsButton);
		
		var fsBackground = new createjs.Shape();
		fsBackground.graphics.setStrokeStyle(2, "round").beginStroke("#FFFFFF").beginFill("#404040").drawRect(0,0, 25,25);
		fsButton.addChild(fsBackground);
		
		var fsText = new createjs.Text("[ ]", "12px UbuntuMono", "white");
		fsText.x = (25 - fsText.getMeasuredWidth())/2;
		fsText.y = (25 - fsText.getMeasuredHeight()*2)/2;
		fsButton.addChild(fsText);
		
		fsButton.on("click", toggleFullScreen);
		fsButton.mouseChildren = false;
    }
    
    // begin long polling for game updates during play, starting with a ping
	ping();
    
    // resize the canvas and adjust the board to the canvas on first load
	initializing = false;
	resize_canvas();
    
    update = true;
    firstUpdate = false;
}

/**
 * Handles touch controls action
 * @param event
 */
function handleControls(event) {
	if(!isPlayerUnitTurn()) return;
	
	var x = event.stageX;
	var y = event.stageY;
	var control = event.target;
	
	console.log("clicked "+x+","+y+": "+control);
	setControlActive(control.type, true);
	
	switch(control.type) {
		case PlayerControl.TYPE_BACKWARD:
			// move backward
			move(false, turnUnit.jumping);
			break;
			
		case PlayerControl.TYPE_FORWARD:
			// move forward
			move(true, turnUnit.jumping);
			break;
			
		case PlayerControl.TYPE_LEFT:
			// turn left/CCW
			rotate(false, turnUnit.jumping);
			break;
			
		case PlayerControl.TYPE_RIGHT:
			// turn right/CW
			rotate(true, turnUnit.jumping);
			break;
			
		case PlayerControl.TYPE_CENTER:
			// Skip the remainder of the turn
			// OR fire any selected weapons
			var weaponsToFire = getSelectedWeapons();
			if(weaponsToFire.length == 0){
				skip();
			}
			else{
				fire_weapons(weaponsToFire);
				
				clearSelectedWeapons();
			}
			break;
			
		case PlayerControl.TYPE_JUMP:
			// toggle jumping
			turnUnit.jumping = !turnUnit.jumping;
			jump(turnUnit.jumping);
			
			break;
	}
}

/**
 * Handles hex clicking action
 * @param event
 */
function handleHexClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var hex = event.target;
	
	console.log("clicked "+x+","+y+": "+hex);
	
	// TODO: show hex information in target display
	
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

function handleWeaponClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var unitWeaponDisplay = event.target;
	
	console.log("clicked "+unitWeaponDisplay); 
	console.log(unitWeaponDisplay.weapon);
	
	if(isPlayerUnitTurn()) {
		var weapon = unitWeaponDisplay.weapon;
		
		if(weapon != null) {
			var selectedIndex = $.inArray(weapon, selectedWeapons);
			if(selectedIndex == -1) {
				addSelectedWeapon(weapon);
			}
			else {
				removeSelectedWeapon(weapon);
			}
			
			// update the selected weapons on the UI and their heat that would be generated
			updateSelectedWeapons();
		}
	}
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
	
	// TODO: allow animations to be turned off
	var doAnimate = true;
	
	// need to handle different browsers differently based on event and property type defined when mouse scroll is used
	if (!evt) evt = event;
	var direction = (evt.detail < 0 || evt.wheelDelta > 0) ? 2 : -1;
	
	var mouseX = evt.clientX - stage.x;
	var mouseY = evt.clientY - stage.y;
	
	var oldScale = stage.scaleX;
	var newScale = stage.scaleX + (direction * 0.1);
	
	if(newScale >= 0.1 && newScale <= 5) {
		console.log("scale="+newScale);
		
		if(doAnimate) {
			var aTime = 250;
			createjs.Tween.removeTweens(stage);
			createjs.Tween.get(stage)
					.to({scaleX: newScale, scaleY: newScale}, aTime, createjs.Ease.quadOut)
					.call(function() {
						update = true;
						
						// Keep the board from going off the window too much
					    keepBoardInWindow();
						
						// update visible hexes
					    updateHexMapDisplay();
					})
					.addEventListener("change", function() {
						update = true;
						
						// Keep the board from going off the window too much
					    keepBoardInWindow();
						
						// update visible hexes
					    updateHexMapDisplay();
					});
		}
		else{
			stage.scaleX = newScale;
			stage.scaleY = newScale;
			
			// Keep the board from going off the window too much
		    keepBoardInWindow();
			
			// update visible hexes
		    updateHexMapDisplay();
		    
		    update = true;
		}
	}
}

function handleZoomIn() {
	var oldScale = stage.scaleX;
	var newScale = stage.scaleX + 0.2;
	
	// TODO: allow animations to be turned off
	var doAnimate = true;
	
	if(newScale > 0 && newScale <= 5) {
		console.log("scale="+newScale);
		
		if(doAnimate) {
			var aTime = 250;
			createjs.Tween.removeTweens(stage);
			createjs.Tween.get(stage)
					.to({scaleX: newScale, scaleY: newScale}, aTime, createjs.Ease.quadOut)
					.call(function() {
						update = true;
						
						// Keep the board from going off the window too much
					    keepBoardInWindow();
						
						// update visible hexes
					    updateHexMapDisplay();
					})
					.addEventListener("change", function() {
						update = true;
						
						// Keep the board from going off the window too much
					    keepBoardInWindow();
						
						// update visible hexes
					    updateHexMapDisplay();
					});
		}
		else{
			stage.scaleX = newScale;
			stage.scaleY = newScale;
			
			// Keep the board from going off the window too much
		    keepBoardInWindow();
			
			// update visible hexes
		    updateHexMapDisplay();
		    
		    update = true;
		}
	}
}

function handleZoomOut() {
	var oldScale = stage.scaleX;
	var newScale = stage.scaleX - 0.1;
	
	// TODO: allow animations to be turned off
	var doAnimate = true;
	
	if(newScale > 0 && newScale <= 5) {
		console.log("scale="+newScale);
		
		if(doAnimate) {
			var aTime = 250;
			createjs.Tween.removeTweens(stage);
			createjs.Tween.get(stage)
					.to({scaleX: newScale, scaleY: newScale}, aTime, createjs.Ease.quadOut)
					.call(function() {
						update = true;
						
						// Keep the board from going off the window too much
					    keepBoardInWindow();
						
						// update visible hexes
					    updateHexMapDisplay();
					})
					.addEventListener("change", function() {
						update = true;
						
						// Keep the board from going off the window too much
					    keepBoardInWindow();
						
						// update visible hexes
					    updateHexMapDisplay();
					});
		}
		else{
			stage.scaleX = newScale;
			stage.scaleY = newScale;
			
			// Keep the board from going off the window too much
		    keepBoardInWindow();
			
			// update visible hexes
		    updateHexMapDisplay();
		    
		    update = true;
		}
	}
}

function keepBoardInWindow() {
	var inPoint = getBoardPointInWindow(new Point(stage.x, stage.y));
	
	stage.x = inPoint.x;
	stage.y = inPoint.y;
}
