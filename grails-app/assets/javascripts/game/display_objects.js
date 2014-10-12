/**
 * display_objects.js - Definitions for displayable object classes and their methods
 */

// Class for displaying each Hex
function HexDisplay(hexX, hexY, images) {
	this.initialize(hexX, hexY, images);
}
HexDisplay.prototype = new createjs.Container();
HexDisplay.prototype.Container_initialize = HexDisplay.prototype.initialize;
HexDisplay.prototype.initialize = function(hexX, hexY, images) {
	this.Container_initialize();
	this.coords = new Coords(hexX, hexY);
	this.images = images;
}
HexDisplay.prototype.isXOdd = function() {
	return isXOdd(this.coords.x);
}
HexDisplay.prototype.getImages = function() {
	return this.images;
}
HexDisplay.prototype.getHexLocation = function() {
	return this.coords;
}
HexDisplay.prototype.xCoords = function() {
	return this.coords.x;
}
HexDisplay.prototype.yCoords = function() {
	return this.coords.y;
}
HexDisplay.prototype.toString = function() {
	return "[HexDisplay@"+this.x+","+this.y+":"+this.images+"]";
}

//Class for displaying each Unit
function UnitDisplay(id, imageStr, rgb) {
	this.initialize(id, imageStr, rgb);
}
UnitDisplay.prototype = new createjs.Container();
UnitDisplay.prototype.Container_initialize = UnitDisplay.prototype.initialize;
UnitDisplay.prototype.initialize = function(id, imageStr, rgb) {
	this.Container_initialize();
	this.id = id;
	this.imageStr = imageStr;
	this.rgb = rgb
}
UnitDisplay.prototype.getImageString = function() {
	return this.imageStr;
}
UnitDisplay.prototype.getUpdatedDisplayX = function(coords) {
	return coords.x * (3 * hexWidth / 4) + this.regX;
}
UnitDisplay.prototype.getUpdatedDisplayY = function(coords) {
	if(coords.isXOdd()){
		return (hexHeight / 2) + (coords.y * hexHeight) + this.regY;
	}
	else{
		return coords.y * hexHeight + this.regY;
	}
}
UnitDisplay.prototype.getUpdatedDisplayRotation = function(heading) {
	return HEADING_ANGLE[heading];
}
UnitDisplay.prototype.setControlsVisible = function(visible) {
	this.showRotateControlCW(visible);
	this.showRotateControlCCW(visible);
	this.showForwardControl(visible);
	this.showBackwardControl(visible);
}
UnitDisplay.prototype.animateUpdateDisplay = function(coords, heading) {
	var newX = this.getUpdatedDisplayX(coords);
	var newY = this.getUpdatedDisplayY(coords);
	var newRot = this.getUpdatedDisplayRotation(heading);
	
	createjs.Tween.get(this).to({x: newX, y: newY, rotation: newRot}, 500)
}
UnitDisplay.prototype.showRotateControlCW = function(visible) {
	if(visible) {
		if(this.rotateControlCW == null) {
			this.rotateControlCW = new createjs.Container();
			
			var rotateImg = queue.getResult(ACTION_ROTATE_CW);
			var rotateControlImg = new createjs.Bitmap(rotateImg);
			this.rotateControlCW.x = hexWidth - rotateImg.width + 5;
			this.rotateControlCW.y = rotateImg.height/2;
			this.rotateControlCW.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.rotateControlCW.hitArea = controlHit;
			this.rotateControlCW.on("click", function(evt){
				handleControls(ACTION_ROTATE_CW);
			});
			
			this.rotateControlCW.addChild(rotateControlImg);
		}
		
		this.addChild(this.rotateControlCW);
		
		createjs.Tween.get(this.rotateControlCW).to({alpha: 0.75}, 500);
	}
	else if(this.rotateControlCW != null) {
		createjs.Tween.get(this.rotateControlCW).to({alpha: 0}, 250);
		this.removeChild(this.rotateControlCW);
	}
}
UnitDisplay.prototype.showRotateControlCCW = function(visible) {
	if(visible) {
		if(this.rotateControlCCW == null) {
			this.rotateControlCCW = new createjs.Container();
			
			var rotateImg = queue.getResult(ACTION_ROTATE_CCW);
			var rotateControlImg = new createjs.Bitmap(rotateImg);
			this.rotateControlCCW.x = -5;
			this.rotateControlCCW.y = rotateImg.height/2;
			this.rotateControlCCW.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.rotateControlCCW.hitArea = controlHit;
			this.rotateControlCCW.on("click", function(evt){
				handleControls(ACTION_ROTATE_CCW);
			});
			
			this.rotateControlCCW.addChild(rotateControlImg);
		}
		
		this.addChild(this.rotateControlCCW);
		
		createjs.Tween.get(this.rotateControlCCW).to({alpha: 0.75}, 500);
	}
	else if(this.rotateControlCCW != null) {
		createjs.Tween.get(this.rotateControlCCW).to({alpha: 0}, 250);
		this.removeChild(this.rotateControlCCW);
	}
}
UnitDisplay.prototype.showForwardControl = function(visible) {
	if(visible) {
		if(this.forwardControl == null) {
			this.forwardControl = new createjs.Container();
			
			var forwardImg = queue.getResult(ACTION_FORWARD);
			var forwardControlImg = new createjs.Bitmap(forwardImg);
			this.forwardControl.x = (hexWidth/2) - (forwardImg.width/2);
			this.forwardControl.y = -(forwardImg.height/2);
			this.forwardControl.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.forwardControl.hitArea = controlHit;
			this.forwardControl.on("click", function(evt){
				handleControls(ACTION_FORWARD);
			});
			
			this.forwardControl.addChild(forwardControlImg);
		}
		
		this.addChild(this.forwardControl);
		
		createjs.Tween.get(this.forwardControl).to({alpha: 0.75}, 500);
	}
	else if(this.forwardControl != null) {
		createjs.Tween.get(this.forwardControl).to({alpha: 0}, 250);
		this.removeChild(this.forwardControl);
	}
}
UnitDisplay.prototype.showBackwardControl = function(visible) {
	if(visible) {
		if(this.backwardControl == null) {
			this.backwardControl = new createjs.Container();
			
			var backwardImg = queue.getResult(ACTION_BACKWARD);
			var backwardControlImg = new createjs.Bitmap(backwardImg);
			this.backwardControl.x =(hexWidth/2) - (backwardImg.width/2);
			this.backwardControl.y = hexHeight - (backwardImg.height/2);
			this.backwardControl.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.backwardControl.hitArea = controlHit;
			this.backwardControl.on("click", function(evt){
				handleControls(ACTION_BACKWARD);
			});
			
			this.backwardControl.addChild(backwardControlImg);
		}
		
		this.addChild(this.backwardControl);
		
		createjs.Tween.get(this.backwardControl).to({alpha: 0.75}, 500);
	}
	else if(this.backwardControl != null) {
		createjs.Tween.get(this.backwardControl).to({alpha: 0}, 250);
		this.removeChild(this.backwardControl);
	}
}
UnitDisplay.prototype.toString = function() {
	return "[UnitDisplay@"+this.x+","+this.y+":"+this.imageStr+"]";
}