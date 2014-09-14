// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better 
// to create separate JavaScript files as needed.
//
//= require jquery
//= require jquery.form.js
//= require createjs-2013.12.12.min.js
//= require_tree .
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initGame(); 
});

// Base class for a displayed object
function DisplayObject(x, y, images) {
	this.x = x;
	this.y = y;
	
	if(images == null){
		images = [];
	}
	this.images = images;
}
DisplayObject.prototype.getX = function() {
	return this.x;
}
DisplayObject.prototype.getY = function() {
	return this.y;
}
DisplayObject.prototype.isXOdd = function() {
	return (this.x & 1 == 1);
}
DisplayObject.prototype.getImages = function() {
	return this.images;
}

// Class for displaying each Hex
function HexDisplay(x, y, images) {
	this.initialize(x, y, images);
}
HexDisplay.prototype = new createjs.DisplayObject();
HexDisplay.prototype.DisplayObject_initialize = HexDisplay.prototype.initialize;
HexDisplay.prototype.initialize = function(x, y, images) {
	this.DisplayObject_initialize();
	this.x = x;
	this.y = y;
	this.images = images;
}
HexDisplay.prototype.isXOdd = function() {
	return (this.x & 1 == 1);
}
HexDisplay.prototype.getImages = function() {
	return this.images;
}

// Create HexMap variables 
var numCols = 0;
var numRows = 0;

//all hex images are the same size
var hexWidth = 84;
var hexHeight = 72;

var stage, queue, hexMap;

function initGame(){
	
	// Create the EaselJS stage
	stage = new createjs.Stage("canvas");
	
	
	if(stage.canvas == null){
		// when not on the page with the canvas, this will be null 
		// so nothing else should be initialized or run
		return;
	}
	
	// apply Touch capability for touch screens
	createjs.Touch.enable(stage);
	
	// set full window size for canvas
	stage.canvas.width = window.innerWidth - 5;
	stage.canvas.height = window.innerHeight - 5;
	
	// add resizing event
	window.addEventListener('resize', resize_canvas, false);
	
	// set up image loading queue handler
	queue = new createjs.LoadQueue();
	queue.addEventListener("complete", handleComplete);
	
	// load the board and its images
	loadHexMap();
	
	$('#spinner').fadeIn();
	
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(30);
}

function resize_canvas(){
	console.log(window.innerWidth+"x"+window.innerHeight);
	if(stage != null){
		stage.canvas.width = window.innerWidth - 5;
		stage.canvas.height = window.innerHeight - 5;
	}
}

function handleComplete(event) {
	$('#spinner').fadeOut();
	
	// Initialize the hex map display objects
	initHexMapDisplay();
}

function tick(event) {
	if(queue != null && queue.progress < 1){
		console.log(queue.progress);
	}
	
	stage.update(event);
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
		  
		  var manifest = [];
		  var alreadyManifested = {};
		  $.each(data.hexMap, function(key, val) {
			  var thisHex = val;
			  
			  if(thisHex != null){
				  // TODO: Create HexDisplay object as subclass of DisplayObject
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
						  alreadyManifested[img] = true;
					  }
				  });
			  }
		  });
		  
		  queue.loadManifest(manifest);
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
			
			var thisHexImages = thisDisplayHex.getImages();
			$.each(thisHexImages, function(i, img){
				// add the hex images to the stage
				var hexImg = new createjs.Bitmap(queue.getResult(img));
				hexImg.x = xOffset;
				hexImg.y = yOffset;
				stage.addChild(hexImg);
			});
		}
	}
}
