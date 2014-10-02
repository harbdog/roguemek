// This is the main javascript file for the RogueMek game client 
//
//= require_self
//= require_tree .

function isXOdd(X) {
	return (X & 1 == 1);
}

// TODO: Move Coords to a new appropriately named js file
function Coords(x, y) {
	this.initialize(x, y);
}
Coords.prototype.initialize = function(x, y) {
	this.setLocation(x, y);
}
Coords.prototype.setLocation = function(x, y) {
	this.x = x;
	this.y = y;
}
Coords.prototype.equals = function(thatCoord) {
	if(thatCoord == null) return false;
	return (this.x == thatCoord.x && this.y == thatCoord.y);
}
Coords.prototype.isXOdd = function() {
	return isXOdd(this.x);
}
Coords.prototype.translated = function(direction) {
	return new Coords(xInDirection(this.x, this.y, direction), yInDirection(this.x, this.y, direction));
}
Coords.prototype.getAdjacentCoords = function() {
	var adjacents = [];
	for (var dir = 0; dir < 6; dir++) {
        var adj = this.translated(dir);
        if(adj.x >= 0 && adj.x < numCols && adj.y >= 0 && adj.y < numRows){
        	adjacents[dir] = adj;
        }
	}
	return adjacents;
}
Coords.prototype.toString = function() {
	return "["+this.x+","+this.y+"]";
}

/**
 * Returns the x parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function xInDirection(x, y, direction) {
	 switch (direction) {
		 case 1 :
		 case 2 :
			 return x + 1;
		 case 4 :
		 case 5 :
			 return x - 1;
		 default :
			 return x;
	 }
}

/**
 * Returns the y parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function yInDirection(x, y, direction) {
	switch (direction) {
		case 0 : 
			return y - 1;
		case 1 : 
		case 5 :
			return y - ((x + 1) & 1);
		case 2 : 
		case 4 : 
			return y + (x & 1);
		case 3 : 
			return y + 1;
		default :
			return y;
	}
}


// Create HexMap variables 
var numCols = 0;
var numRows = 0;

//all hex images are the same size
var hexWidth = 84;
var hexHeight = 72;

// STATIC variables
var HEADING_N = 0;
var HEADING_NE = 1;
var HEADING_SE = 2;
var HEADING_S = 3;
var HEADING_SW = 4;
var HEADING_NW = 5;
var HEADING_ANGLE = [0, 60, 120, 180, 240, 300];

// STATIC location indices
var HEAD = 0;
var LEFT_ARM = 1;
var LEFT_TORSO = 2;
var CENTER_TORSO = 3;
var RIGHT_TORSO = 4;
var RIGHT_ARM = 5;
var LEFT_LEG = 6;
var RIGHT_LEG = 7;
var LEFT_REAR = 8;
var CENTER_REAR = 9;
var RIGHT_REAR = 10;

// STATIC equipment type strings
var TYPE_EQUIPMENT = "Equipment";
var TYPE_WEAPON = "Weapon";
var TYPE_AMMO = "Ammo";
var TYPE_JUMP_JET = "JumpJet";
var TYPE_HEAT_SINK = "HeatSink";

// Global variables used throughout the game
var stage, queue, progress, fpsDisplay, hexMap, units;

// Keep track of which unit belongs to the player
var playerUnit;

// Keep track of which unit's turn it currently is
var playerTurnIndex = 0;

// Keep track of when actions are ready to be performed during the player turn
var playerActionReady = true;

// Track when the stage map is dragged to pan the board
var stageInitDragMoveX = null;
var stageInitDragMoveY = null;

/**
 * Gets the game ready to play
 */
function initGame(){
	
	// Create the EaselJS stage
	stage = new createjs.Stage("canvas");
	
	// apply Touch capability for touch screens
	createjs.Touch.enable(stage);
	
	// add resizing event
	window.addEventListener('resize', resize_canvas, false);
	
	// add keyboard listener
	addEventHandlers();
	
	// set up image loading queue handler
	queue = new createjs.LoadQueue();
	queue.addEventListener("complete", handleComplete);
	queue.addEventListener("progress", handleProgress);
	
	// create progress bar during image loading
	progress = new createjs.Shape();
	progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
	stage.addChild(progress);
	
	// load the board, units and their images
	loadGameElements();
	
	// begin long polling for game updates during play
	poll();
		
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(30);
}

/**
 * Resizes the canvas based on the current browser window size
 */
function resize_canvas(){
	if(stage != null){
		stage.canvas.width = window.innerWidth - 200;
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
	}
}

/**
 * Loads all initial game elements from the server to begin the game
 */
function loadGameElements() {
	
	$.getJSON("game/getGameElements", {
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {

		  var manifest = [];
		  var alreadyManifested = {};
		  
		  units = {};
		  hexMap = [];
		  
		  numCols = data.board.numCols;
		  numRows = data.board.numRows;
		  
		  // create the board hex display
		  $.each(data.board.hexMap, function(key, thisHex) {
			  if(thisHex != null){
				  var hexDisplay = new HexDisplay(thisHex.x, thisHex.y, thisHex.images);
				  
				  // add mouse listener
				  hexDisplay.on("click", handleHexClick);
				  hexDisplay.mouseChildren = false;
				  
				  // Place the hex in the map
				  var hexRow = hexMap[thisHex.y];
				  if(hexRow == null){
					  hexRow = [];
					  hexMap[thisHex.y] = hexRow;
				  }
				  hexRow[thisHex.x] = hexDisplay;
				  
				  // Make sure each image gets loaded to the manifest if not already present
				  $.each(thisHex.images, function(i, img) {
					  if(alreadyManifested[img] == null){
						  manifest.push({id:img, src:"assets/hexes/"+img});
						  alreadyManifested[img] = true;		// comment this line to test a slow progress bar locally 
					  }
				  });
			  }
		  });
		  
		  // create each unit display
		  $.each(data.units, function(index, thisUnit) {
			  if(thisUnit != null){
				  var unitDisplay = new UnitDisplay(thisUnit.unit, thisUnit.x, thisUnit.y, thisUnit.heading, thisUnit.image, thisUnit.rgb);
				  unitDisplay.actionPoints = thisUnit.actionPoints;
				  unitDisplay.jumpPoints = thisUnit.jumpPoints;
				  unitDisplay.heat = thisUnit.heat;
				  unitDisplay.callsign = thisUnit.callsign;
				  unitDisplay.name = thisUnit.name;
				  unitDisplay.chassisVariant = thisUnit.chassisVariant;
				  unitDisplay.armor = thisUnit.armor;
				  unitDisplay.internals = thisUnit.internals;
				  
				  unitDisplay.crits = thisUnit.crits;
				  unitDisplay.weapons = initUnitWeapons(thisUnit);

				  if(data.playerUnit == thisUnit.unit){
					  playerUnit = unitDisplay;
				  }
				  
				  // add mouse listener
				  unitDisplay.on("click", handleUnitClick);
				  unitDisplay.mouseChildren = false;
				  
				  // add to unit list
				  units[thisUnit.unit] = unitDisplay;
				  
				  if(alreadyManifested[thisUnit.image] == null){
					  manifest.push({id:thisUnit.image, src:"assets/"+thisUnit.image});
					  alreadyManifested[thisUnit.image] = true;
				  }
			  }
		  });
		  
		  queue.loadManifest(manifest);
	  });
}

/**
 * Initializes a Unit's Weapon objects from the crits that have been loaded
 * @param unit
 */
function initUnitWeapons(unit) {
	if(unit == null || unit.crits == null) return null;
	
	var weapons = {};
	
	$.each(unit.crits, function(index, c) {
		if(c.type == TYPE_WEAPON && weapons[c.id] == null){
			var w = new Weapon(c.name, c.shortName, c.damage, c.heat, 
								c.minRange, [c.shortRange, c.mediumRange, c.longRange]);
			
			weapons[c.id] = w;
		}
	});
	
	return weapons;
}

/**
 * Initializes the display of the board hex map on the stage
 */
function initHexMapDisplay() {
	if(hexMap == null){return;}
	
	stage.on("pressmove", function(evt) {
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
	    if(stage.x > (3 * hexWidth / 4)) {
	    	stage.x = (3 * hexWidth / 4);
	    }
	    
	    if(stage.y < -((hexHeight / 2) + (numRows * hexHeight)) + stage.canvas.height){
	    	stage.y = -((hexHeight / 2) + (numRows * hexHeight)) + stage.canvas.height;
	    }
	    if(stage.y > (hexHeight / 2)) {
	    	stage.y = (hexHeight / 2);
	    }
	    
	    fpsDisplay.x = -stage.x - 10;
	    fpsDisplay.y = -stage.y + 10;
	});
	stage.on("pressup", function(evt) { 
		// reset click and drag map panning
		stageInitDragMoveX = null;
		stageInitDragMoveY = null;
	})
		
	for(var y=0; y<numRows; y++){
		
		var thisDisplayRow = hexMap[y];
		
		if(thisDisplayRow == null){
			continue;
		}
		
		for(var x=0; x<numCols; x++){
			
			var thisDisplayHex = thisDisplayRow[x];
			
			if(thisDisplayHex == null){
				continue;
			}
			
			var xOffset = x * (3 * hexWidth / 4);
			var yOffset = y * hexHeight;
			
			if(thisDisplayHex.isXOdd()){
				yOffset = (hexHeight / 2) + (y * hexHeight);
			}
			
			thisDisplayHex.x = xOffset;
			thisDisplayHex.y = yOffset;
			
			var thisHexImages = thisDisplayHex.getImages();
			$.each(thisHexImages, function(i, img){
				// add the hex images to the stage
				var hexImg = new createjs.Bitmap(queue.getResult(img));
				thisDisplayHex.addChild(hexImg);
			});
			
			stage.addChild(thisDisplayHex);
		}
	}
	
	// resize the canvas and adjust the board to the canvas on first load
	resize_canvas();
}

/**
 * Initializes the display of each unit in the game on the stage
 */
function initUnitsDisplay() {
	if(units == null){return;}
	
	$.each(units, function(index, thisDisplayUnit) {
		var imgStr = thisDisplayUnit.getImageString();
		var image = queue.getResult(imgStr);
		var rgb = thisDisplayUnit.rgb;
		
		// adjust the rotation around its own center (which also adjusts its x/y reference point)
		thisDisplayUnit.regX = image.width/2;
		thisDisplayUnit.regY = image.height/2;
		
		// make the unit just a bit smaller since it currently is same size as the hex
		thisDisplayUnit.scaleX = 0.8;
		thisDisplayUnit.scaleY = 0.8;
		
		thisDisplayUnit.updateXYRot();
		
		// load the unit image as a Bitmap
		var unitImg = new createjs.Bitmap(image);
		thisDisplayUnit.addChild(unitImg);
		
		// load the unit image again and apply alpha color filter
		var unitAlphaImg = new createjs.Bitmap(image);
		unitAlphaImg.filters = [
	        new createjs.ColorFilter(0,0,0,0.5, 
	        						 rgb[0],rgb[1],rgb[2],0)
	    ];
		unitAlphaImg.cache(0, 0, image.width, image.height);
		thisDisplayUnit.addChild(unitAlphaImg);
		
		
		stage.addChild(thisDisplayUnit);
	});
}

/**
 * Long polling to retrieve updates from the game asynchronously
 */
function poll() {
    $.ajax({ url: "game/poll", success: function(data){
    	
    	// call the method that updates the client based on the polled return data
    	console.log("polled date: "+data.date);
        pollUpdate(data.updates);
        
    }, dataType: "json", complete: poll, timeout: 30000 });
}
