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
UnitDisplay.prototype.toString = function() {
	return "[UnitDisplay@"+this.x+","+this.y+":"+this.imageStr+"]";
}