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
HexDisplay.prototype.hexX = function() {
	return this.coords.x;
}
HexDisplay.prototype.hexY = function() {
	return this.coords.y;
}
HexDisplay.prototype.toString = function() {
	return "[Hex@"+this.hexX()+","+this.hexY()+"]";
}

//Class for displaying each Unit
function UnitDisplay(id, hexX, hexY, heading, actionPoints, imageStr, rgb) {
	this.initialize(id, hexX, hexY, heading, actionPoints, imageStr, rgb);
}
UnitDisplay.prototype = new createjs.Container();
UnitDisplay.prototype.Container_initialize = UnitDisplay.prototype.initialize;
UnitDisplay.prototype.initialize = function(id, hexX, hexY, heading, actionPoints, imageStr, rgb) {
	this.Container_initialize();
	this.id = id;
	this.setHexLocation(hexX, hexY);
	this.heading = heading;
	this.actionPoints = actionPoints;
	this.imageStr = imageStr;
	this.rgb = rgb
}
UnitDisplay.prototype.getImageString = function() {
	return this.imageStr;
}
UnitDisplay.prototype.setHexLocation = function(hexX, hexY) {
	if(this.coords == null){
		this.coords = new Coords(hexX, hexY);
	}
	else{
		this.coords.setLocation(hexX, hexY);
	}
}
UnitDisplay.prototype.getHexLocation = function() {
	return this.coords;
}
UnitDisplay.prototype.hexX = function() {
	return this.coords.x;
}
UnitDisplay.prototype.hexY = function() {
	return this.coords.y;
}
UnitDisplay.prototype.updateXYRot = function() {
	this.x = this.hexX() * (3 * hexWidth / 4) + this.regX;
	
	if(this.coords.isXOdd()){
		this.y = (hexHeight / 2) + (this.hexY() * hexHeight) + this.regY;
	}
	else{
		this.y = this.hexY() * hexHeight + this.regY;
	}
	
	this.rotation = HEADING_ANGLE[this.heading];
}
UnitDisplay.prototype.toString = function() {
	return "[Unit@"+this.hexX()+","+this.hexY()+">"+this.heading+"]";
}