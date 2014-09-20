/**
 * Definitions for displayable object classes and their methods
 */

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