// This is the main javascript file for the RogueMek game client 
//
//= require_self
//= require_tree .

function isXOdd(X) {
	return (X & 1 == 1);
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

// Global variables used throughout the game
var stage, queue, progress, hexMap, units;

// Keep track of which unit's turn it currently is
var playerTurnIndex = 0;

// Keep track of when actions are ready to be performed during the player turn
var playerActionReady = false;

// Track when the stage map is dragged to pan the board
var stageInitDragMoveX = null;
var stageInitDragMoveY = null;

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
	
	// load the board, units and their images
	loadGameElements();
	
	// begin long polling for game updates during play
	poll();
	
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(30);
}

function resize_canvas(){
	if(stage != null){
		stage.canvas.width = window.innerWidth - 5;
		stage.canvas.height = window.innerHeight - 5;
	}
}

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
		  $.each(data.board.hexMap, function(key, val) {
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
		  
		  // create each unit display
		  $.each(data.units, function(index, thisUnit) {
			  if(thisUnit != null){
				  var unitDisplay = new UnitDisplay(thisUnit.x, thisUnit.y, thisUnit.heading, thisUnit.image);
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

function poll() {
    $.ajax({ url: "game/poll", success: function(data){
        console.log("polled data: "+data.date);
    }, dataType: "json", complete: poll, timeout: 30000 });
}
