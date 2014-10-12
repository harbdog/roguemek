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
UnitDisplay.prototype.showRotateControlCW = function(visible) {
	if(visible) {
		if(this.rotateControlCW == null) {
			var rotateImg = queue.getResult("rotatecw");
			this.rotateControlCW = new createjs.Bitmap(rotateImg);
			this.rotateControlCW.x = hexWidth - rotateImg.width + 5;
			this.rotateControlCW.y = rotateImg.height/2;
			this.rotateControlCW.alpha = 0;
		}
		
		this.addChild(this.rotateControlCW);
		
		createjs.Tween.get(this.rotateControlCW).to({alpha: 0.75}, 500);
	}
	else if(this.rotateControlCW != null) {
		this.removeChild(this.rotateControlCW);
	}
}
UnitDisplay.prototype.showRotateControlCCW = function(visible) {
	if(visible) {
		if(this.rotateControlCCW == null) {
			var rotateImg = queue.getResult("rotateccw");
			this.rotateControlCCW = new createjs.Bitmap(rotateImg);
			this.rotateControlCCW.x = -5;
			this.rotateControlCCW.y = rotateImg.height/2;
			this.rotateControlCCW.alpha = 0;
		}
		
		this.addChild(this.rotateControlCCW);
		
		createjs.Tween.get(this.rotateControlCCW).to({alpha: 0.75}, 500);
	}
	else if(this.rotateControlCCW != null) {
		this.removeChild(this.rotateControlCCW);
	}
}
UnitDisplay.prototype.showForwardControl = function(visible) {
	if(visible) {
		if(this.forwardControl == null) {
			var forwardImg = queue.getResult("forward");
			this.forwardControl = new createjs.Bitmap(forwardImg);
			this.forwardControl.x = (hexWidth/2) - (forwardImg.width/2);
			this.forwardControl.y = -(forwardImg.height/2);
			this.forwardControl.alpha = 0;
		}
		
		this.addChild(this.forwardControl);
		
		createjs.Tween.get(this.forwardControl).to({alpha: 0.75}, 500);
	}
	else if(this.forwardControl != null) {
		this.removeChild(this.forwardControl);
	}
}
UnitDisplay.prototype.showBackwardControl = function(visible) {
	if(visible) {
		if(this.backwardControl == null) {
			var backwardImg = queue.getResult("backward");
			this.backwardControl = new createjs.Bitmap(backwardImg);
			this.backwardControl.x =(hexWidth/2) - (backwardImg.width/2);
			this.backwardControl.y = hexHeight - (backwardImg.height/2);
			this.backwardControl.alpha = 0;
		}
		
		this.addChild(this.backwardControl);
		
		createjs.Tween.get(this.backwardControl).to({alpha: 0.75}, 500);
	}
	else if(this.backwardControl != null) {
		this.removeChild(this.backwardControl);
	}
}
UnitDisplay.prototype.toString = function() {
	return "[UnitDisplay@"+this.x+","+this.y+":"+this.imageStr+"]";
}