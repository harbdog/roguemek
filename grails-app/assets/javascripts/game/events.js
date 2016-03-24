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
	var pong = new Date().getTime();
	var milliseconds = pong - lastPing;
	
	if(pingDisplay != null) {
		pingDisplay.htmlElement.innerHTML = milliseconds + " ms";
	}
}

function handleChatControls(e, key) {
	if(key == "escape" || key == "tab") {
		// hide the chat input
		e.preventDefault();
		
		var currentMessage = messagingDisplay.getChatInput();
		if(key == "escape"
				&& currentMessage.trim().length > 0) {
			// if escape is pressed with content in chat input, clear it, otherwise it can close the chat input
			messagingDisplay.setChatInput("");
		}
		else {
			messagingDisplay.showChatInput(false);
		}
	}
	else if(key == "enter") {
		// submit the chat input
		e.preventDefault();
		
		var data = {
			type: 'chat',
			message: messagingDisplay.getChatInput()
		};
		HPG.chatSubscription.push(JSON.stringify(data));
		messagingDisplay.setChatInput("");
		
		messagingDisplay.showChatInput(false);
	}
	else {
		// let the key proceed as input to chat
	}
}

/**
 * Handles initializing the list of chat users
 * @param userDataList
 */
function handleChatUsersList(userDataList) {
	$.each(userDataList, function(index, userData) {
		userData.add = true;
		handleChatUsersUpdate(userData);
	});
}

/**
 * Handles adding and removing users from the chat users list
 * @param userData
 */
function handleChatUsersUpdate(userData) {
	//<div><span class="chat-user">CapperDeluxe</span></div>
	var userId = userData.userid;
	var userName = userData.username;
	
	var $chatUserDiv = $("div[data-chat-userid='"+userId+"']")
	
	if(userData.add) {
		// first, make sure it doesn't already exist
		if($chatUserDiv.length) {
			$chatUserDiv.fadeIn();
			return
		}
		
		var $chatUsers = $('#chat-users');
		
		// create the div section containing the user name
		var $chatUserDiv = $("<div>").attr("data-chat-userid", userId);
		var $chatUserSpan = $("<span>", {class: "chat-user"}).text(userName);
		
		$chatUserDiv.append($chatUserSpan);
		$chatUsers.append($chatUserDiv);
		
		// TODO: allow customization of colors in chat!
		var effectOptions = {color: shadeColor("#3399FF", -0.5)};
		$chatUserDiv.effect("highlight", effectOptions, 1000);
	}
	else if(userData.remove){
		$chatUserDiv.fadeOut(function() {
			var $this = $(this);
			// waiting a short while before complete removal just in case it was only a refresh event
			setTimeout(function(){
				if($this.is(":visible") == false) {
					$this.remove()
				}
			},500);
		});
	}
}

function handleKeyPress(e, key) {
	
	if(isChatInput()) {
		// typing in chat
		return handleChatControls(e, key);
	}
	
	e.preventDefault();
	
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
			jump(!turnUnit.jumping);
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
	else if(key == "e"){
		// target previous enemy unit
		cycleTarget(false);
	}
	else if(key == "r"){
		// target next enemy unit
		cycleTarget(true);
	}
	else if(key == "escape"){
		// clear target
		handleTargetChange(null);
	}
	else if(key == "t"){
		handleShowChatInput();
	}
	else if(key == "`"){
		// toggle isometric view
		toggleIsometricDisplay();
		
		// update in settings in case it is showing
		settingsDisplay.update();
	}
	else if(key == "home"){
		// enter fullscreen mode
		toggleFullScreen();
	}
	else if(key == "-"){
		// zoom out board
		handleZoomOut();
	}
	else if(key == "="){
		// zoom in board
		handleZoomIn();
	}
	else if(key == "["){
		// scale down UI
		handleScaleDown();
	}
	else if(key == "]"){
		// scale up UI
		handleScaleUp();
	}
	else if(key == "?"){
		// show the settings dialog
		showSettingsDisplay();
	}
	else {
		console.log("Unbound key pressed: " + key);
	}
}

function toggleShowChatInput() {
	messagingDisplay.toggleShowChatInput();
}

function handleShowChatInput() {
	messagingDisplay.showChatInput(true);
}

function isChatInput() {
	return messagingDisplay.isChatInput;
}

/**
 * show the settings dialog
 */
function showSettingsDisplay() {
	settingsDisplay.show();
}

/**
 * Shows the unit info dialog
 * @param unitId
 */
var firstUnitInfoDisplayLoad = false
function showUnitInfoDisplay(unitId) {
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		dialogDisplay.load("battleMech/battleInfo/"+unitId, function() {
			dialogLoading.dialog("close");
			dialogDisplay.dialog("open");
			
	    	// move the header to the title area of the dialog
	    	$(".unit-header").appendTo("#unit-title");
	    	
	    	if(!firstUnitInfoDisplayLoad) {
	    		// stupid trick to get the dialog to show in the correct place without causing browser scrollbars to appear
	    		dialogDisplay.dialog("option", "width", (canvas.width >= 900) ? 900 : canvas.width);
				dialogDisplay.dialog("option", "height", (canvas.height >= 600) ? 600 : canvas.height);
				dialogDisplay.dialog("option", "position", { my: "center", at: "center", of: window});
				firstUnitInfoDisplayLoad = true;
	    	}
	    });
	},250);
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
		dialogDisplay.dialog("option", "position", { my: "center", at: "center", of: window});
		
		// update displayable hexes
		updateHexMapDisplay();
		
		// update the UI elements that need to change position
		updatePlayerUI();
		
		update = true;
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
	
	// Need to wait for the unit display objects to finish loading images before the UI can finish initializing
	(function waitForReadyLoop() {
		setTimeout(function() {
			var allReady = true;
			$.each(units, function(index, thisUnit) {
				if(!thisUnit.getUnitDisplay().ready) {
					allReady = false;
				}
			});
			
			if(allReady) {
				// ready to continue updating display objects
				arrangeUnitsDisplay();
				updateUnitDisplayObjects();
				
				// Initialize the player UI
				initPlayerUI();
				
				// load list of chat users just before connecting to the Atmosphere server
				loadChatUsersList();
				
				// begin long polling for game updates during play
				initAtmosphere();
				
				// use setInterval to ping for every several seconds
				ping();
				setInterval(ping, 5000);
			    
			    // resize the canvas and adjust the board to the canvas on first load
				initializing = false;
				resize_canvas();
			    
			    update = true;
			    firstUpdate = false;
			}
			else {
				// keep waiting
				waitForReadyLoop();
			}
		}, 100);
	})();
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
			jump(!turnUnit.jumping);
			
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
		handleTargetChange(targetUnit);
	}
}

function handleWeaponClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var unitWeaponDisplay = event.target;
	
	console.log("clicked "+unitWeaponDisplay);
	
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
		
		handleKeyPress(e, key);
	};
	
	window.addEventListener("keydown", function(e) {
		// handle special keys which don't have char codes, such as space and arrow keys
		if(specialKeyCodes.indexOf(e.keyCode) > -1) {
			
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
			
			handleKeyPress(e, key);
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
	var direction = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
	
	var mouseX = evt.clientX - stage.x;
	var mouseY = evt.clientY - stage.y;
	
	handleZoomBoard(stage.scaleX + (direction * 0.1));

	// update in settings in case it is showing
	settingsDisplay.update();
}

function handleZoomIn() {
	var newScale = Settings.get(Settings.BOARD_SCALE) + 0.25;
	handleZoomBoard(newScale);
	
	// update in settings in case it is showing
	settingsDisplay.update();
}
function handleZoomOut() {
	var newScale = Settings.get(Settings.BOARD_SCALE) - 0.25;
	handleZoomBoard(newScale);
	
	// update in settings in case it is showing
	settingsDisplay.update();
}
/**
 * Zooms the board in or out based on the zoom value given
 * @param zoom
 */
function handleZoomBoard(newScale) {
	// TODO: allow animations to be turned off
	var doAnimate = true;
	
	if(newScale > 0 && newScale <= 4) {
		// put the new scale in local storage
		Settings.set(Settings.BOARD_SCALE, newScale);
		
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

function handleScaleUp() {
	var newScale = Settings.get(Settings.UI_SCALE) + 0.05;
	handleScaleOverlay(newScale);
	
	// update in settings in case it is showing
	settingsDisplay.update();
}
function handleScaleDown() {
	var newScale = Settings.get(Settings.UI_SCALE) - 0.05;
	handleScaleOverlay(newScale);
	
	// update in settings in case it is showing
	settingsDisplay.update();
}
/**
 * Scales the UI overlay up or down based on the scale value given
 * @param scale
 */
function handleScaleOverlay(newScale) {
	if(newScale > 0 && newScale <= 3) {
		// put the new scale in local storage
		Settings.set(Settings.UI_SCALE, newScale);
		
		overlay.scaleX = newScale;
		overlay.scaleY = newScale;
		
		updatePlayerUI();
	    
	    update = true;
	}
}

/**
 * Handles updating for various settings changes for the UI
 * @param opacity
 */
function handleSettingsUpdate(settingKey) {
	// handle any key specific UI updates here first
	if(settingKey == Settings.UI_PLAYER_COLOR) {
		$.each(units, function(index, thisUnit) {
			if(isPlayerUnit(thisUnit)) {
				var displayUnit = thisUnit.getUnitDisplay();
				displayUnit.update();
			}
		});
	}
	else if(settingKey == Settings.UI_ENEMY_COLOR) {
		$.each(units, function(index, thisUnit) {
			if(!isPlayerUnit(thisUnit)) {
				var displayUnit = thisUnit.getUnitDisplay();
				displayUnit.update();
			}
		});
		
		if(targetBracket != null) {
			targetBracket.update();
		}
		
		if(targetLine != null) {
			targetLine.update();
		}
	}
	else if(settingKey == Settings.GFX_CACHING) {
		updateHexDisplayObjects();
		
		$.each(units, function(index, thisUnit) {
			var displayUnit = thisUnit.getUnitDisplay();
			displayUnit.update();
		});
	}
	else if(settingKey == Settings.GFX_FRAMERATE) {
		createjs.Ticker.setFPS(Settings.get(Settings.GFX_FRAMERATE));
	}
	
	// general UI updates performed
	updatePlayerUI();
	
	update = true;
}

/**
 * Cycles to the next active target forward or backward 
 * @param cycleForward
 */
function cycleTarget(cycleForward) {
	if(isPlayerUnitTurn()) {
		var targetUnit = null;
		var prevTargetUnit = getUnitTarget(turnUnit);
		
		var unitList = [];
		
		var index = 0;
		var targetIndex = -1;
		$.each(units, function(id, thisUnit) {
			if(prevTargetUnit != null 
					&& id == prevTargetUnit.id) {
				targetIndex = index;
			}
			
			unitList.push(thisUnit);
			index ++;
		});
		
		// start looping through the array start
		index = (cycleForward) ? targetIndex + 1 : targetIndex - 1;
		while(targetUnit == null && index != targetIndex) {
			if(index >= unitList.length) {
				index = 0;
			}
			else if(index < 0) {
				index = unitList.length - 1;
			}
			
			var thisUnit = unitList[index];
			
			if((prevTargetUnit != null && thisUnit.id == prevTargetUnit.id)
					|| isPlayerUnit(thisUnit) 
					|| thisUnit.isDestroyed()) {
				// do not consider for targeting
			}
			else {
				// target this unit!
				targetUnit = thisUnit;
				break;
			}
			
			if(cycleForward) index ++;
			else index --;
		}
		
		if(targetUnit != null) {
			handleTargetChange(targetUnit);
		}
	}
}

/**
 * Handles changing the target
 * @param targetUnit
 */
function handleTargetChange(targetUnit) {
	var prevTargetUnit = getUnitTarget(turnUnit);
	setUnitTarget(turnUnit, targetUnit);
	
	setPlayerTarget(targetUnit);
	
	if(prevTargetUnit != null && prevTargetUnit.getUnitDisplay()!= null
			&& (targetUnit == null || prevTargetUnit.id != targetUnit.id)) {
		// show the unit indicator on the previous target,
		prevTargetUnit.getUnitDisplay().setUnitIndicatorVisible(true);
	}
	
	if(targetUnit == null) {
		// clear selected weapons and update weapons display
		clearSelectedWeapons();
		clearWeaponsToHit(turnUnit);
		
		updateWeaponsDisplay(turnUnit);
		
		// Update selected weapons
		updateSelectedWeapons();
	}
	else {
		// hide the unit indicator on the new target
		targetUnit.getUnitDisplay().setUnitIndicatorVisible(false);
		
		// get the target info from server or from cache if available
		var target_id = targetUnit.id;
		var targetDataCache = getTargetCache(target_id);
		if(targetDataCache != null) {
			updateGameData(targetDataCache);
		}
		else{ 
			target(targetUnit);
		}
	}
}

function keepBoardInWindow() {
	var inPoint = getBoardPointInWindow(new Point(stage.x, stage.y));
	
	stage.x = inPoint.x;
	stage.y = inPoint.y;
}
