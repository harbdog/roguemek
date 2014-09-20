// This is the main javascript file for the RogueMek game client 
//
//= require_self
//= require_tree .

function isXOdd(X) {
	return (X & 1 == 1);
}

// Class for displaying each Hex
function HexDisplay(hexX, hexY, images) {
	this.initialize(hexX, hexY, images);
}
HexDisplay.prototype = new createjs.Container();
HexDisplay.prototype.Container_initialize = HexDisplay.prototype.initialize;
HexDisplay.prototype.initialize = function(hexX, hexY, images) {
	this.Container_initialize();
	this.hexX = hexX;
	this.hexY = hexY;
	this.images = images;
}
HexDisplay.prototype.isXOdd = function() {
	return isXOdd(this.hexX);
}
HexDisplay.prototype.getImages = function() {
	return this.images;
}

//Class for displaying each Unit
function UnitDisplay(hexX, hexY, heading, imageStr) {
	this.initialize(hexX, hexY, heading, imageStr);
}
UnitDisplay.prototype = new createjs.Container();
UnitDisplay.prototype.Container_initialize = UnitDisplay.prototype.initialize;
UnitDisplay.prototype.initialize = function(hexX, hexY, heading, imageStr) {
	this.Container_initialize();
	this.hexX = hexX;
	this.hexY = hexY;
	this.heading = heading;
	this.imageStr = imageStr;
}
UnitDisplay.prototype.getImageString = function() {
	return this.imageStr;
}
UnitDisplay.prototype.updateXYRot = function() {
	this.x = this.hexX * (3 * hexWidth / 4) + this.regX;
	
	if(isXOdd(this.hexX)){
		this.y = (hexHeight / 2) + (this.hexY * hexHeight) + this.regY;
	}
	else{
		this.y = this.hexY * hexHeight + this.regY;
	}
	
	this.rotation = HEADING_ANGLE[this.heading];
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

var stage, queue, progress, hexMap, units;

var hexImagesReady, unitImagesReady;

var manifest = [];
var alreadyManifested = {};

function initGame(){
	
	// Create the EaselJS stage
	stage = new createjs.Stage("canvas");
	
	// apply Touch capability for touch screens
	createjs.Touch.enable(stage);
	
	// set full window size for canvas
	resize_canvas();
	
	// add resizing event
	window.addEventListener('resize', resize_canvas, false);
	
	// add keyboard listener.
	window.addEventListener('keydown', handleKeyboard, true);  
	
	// set up image loading queue handler
	queue = new createjs.LoadQueue();
	queue.addEventListener("complete", handleComplete);
	queue.addEventListener("progress", handleProgress);
	
	// create progress bar during image loading
	progress = new createjs.Shape();
	progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
	stage.addChild(progress);
	
	
	// load the board and its images
	loadHexMap();
	
	// load units and their images
	loadUnits();
	
	$('#spinner').fadeIn();
	
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(30);
}

function resize_canvas(){
	if(stage != null){
		stage.canvas.width = window.innerWidth - 5;
		stage.canvas.height = window.innerHeight - 5;
	}
}



function move() {
	
	$.getJSON("game/action", {
		perform: "move",
		gameId: "1",
		forward: true,
		jumping: false
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
		  // update the unit based on new data
		  console.log("move "+data.unit+":"+data.x+","+data.y+">"+data.heading);
		  if(data.unit == null){
			  return;
		  }
		  
		  var thisUnit = units[data.unit];
		  thisUnit.hexX = data.x;
		  thisUnit.hexY = data.y;
		  thisUnit.heading = data.heading;
		  
		  thisUnit.updateXYRot();
	  });
}

function rotate(rotation) {
	
	$.getJSON("game/action", {
		perform: "rotate",
		gameId: "1",
		rotation: rotation,
		jumping: false
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
		  // update the unit based on new data
		  console.log("rotate "+data.unit+":"+data.x+","+data.y+">"+data.heading);
		  
		  var thisUnit = units[data.unit];
		  thisUnit.hexX = data.x;
		  thisUnit.hexY = data.y;
		  thisUnit.heading = data.heading;
		  
		  thisUnit.updateXYRot();
	  });
}

function loadHexMap() {
	
	$.getJSON("game/getHexMap", {
	    gameId: "1"
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
		  
		  numCols = data.numCols;
		  numRows = data.numRows;
		  hexMap = [];
		  
		  $.each(data.hexMap, function(key, val) {
			  var thisHex = val;
			  
			  if(thisHex != null){
				  var hexDisplay = new HexDisplay(thisHex.x, thisHex.y, thisHex.images);
				  
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
		  
		  hexImagesReady = true;
	  });
}

function loadUnits() {
	
	$.getJSON("game/getUnits", {
	    gameId: "1"
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
		  
		  units = {};
		  
		  $.each(data, function(index, thisUnit) {
			  if(thisUnit != null){
				  var unitDisplay = new UnitDisplay(thisUnit.x, thisUnit.y, thisUnit.heading, thisUnit.image);
				  units[thisUnit.unit] = unitDisplay;
				  
				  if(alreadyManifested[thisUnit.image] == null){
					  manifest.push({id:thisUnit.image, src:"assets/"+thisUnit.image});
					  alreadyManifested[thisUnit.image] = true;
				  }
			  }
		  });
		  
		  unitImagesReady = true;
	  });
}


// Track when the stage map is dragged to pan the board
var stageInitDragMoveX = null;
var stageInitDragMoveY = null;

function initHexMapDisplay() {
	if(hexMap == null){return;}
	
	stage.on("pressmove", function(evt) {
		// Add click and drag to pan the map
		if(stageInitDragMoveX == null){
			stageInitDragMoveX = evt.stageX - stage.x;
			stageInitDragMoveY = evt.stageY - stage.y;
		}
		
	    stage.x = evt.stageX - stageInitDragMoveX;
	    stage.y = evt.stageY - stageInitDragMoveY;
	    
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
}

function initUnitsDisplay() {
	if(units == null){return;}
	
	$.each(units, function(index, thisDisplayUnit) {
		var imgStr = thisDisplayUnit.getImageString();
		var image = queue.getResult(imgStr)
		
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
	        						 255,0,0,0)
	    ];
		unitAlphaImg.cache(0, 0, image.width, image.height);
		thisDisplayUnit.addChild(unitAlphaImg);
		
		
		stage.addChild(thisDisplayUnit);
	});
}

// TESTING ALSO
function getForwardCoords(fromCoords, heading){
	var x = fromCoords[0];
	var y = fromCoords[1];
	
	var newXY = [x, y];
	switch(heading){
		case 0:
			if(y > 0){
				newXY = [x,y-1];
			}
			break;
			
		case 1:
			if(x % 2 == 0 && x < numCols - 1 && y > 0){
				newXY = [x+1,y-1];
			}
			else if(x % 2 != 0 && x < numCols - 1){
				newXY = [x+1,y];
			}
			break;
			
		case 2:
			if(x % 2 == 0 && x < numCols - 1){
				newXY = [x+1,y];
			}
			else if(x % 2 != 0 && x < numCols - 1 && y < numRows - 1){
				newXY = [x+1,y+1];
			}
			break;
			
		case 3:
			if(y < numRows - 1){
				newXY = [x,y+1];
			}
			break;
			
		case 4:
			if(x % 2 == 0 && x > 0){
				newXY = [x-1,y];
			}
			else if(x % 2 != 0 && x > 0 && y < numRows - 1){
				newXY = [x-1,y+1];
			}
			break;
			
		case 5:
			if(x % 2 == 0 && x > 0 && y > 0){
				newXY = [x-1,y-1];
			}
			else if(x % 2 != 0 && x > 0){
				newXY = [x-1,y];
			}
			break;
	}
	
	return newXY;
}
