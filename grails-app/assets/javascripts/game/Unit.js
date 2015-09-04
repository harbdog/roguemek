/**
 * Class used to store Unit information and its display object
 */
(function() {
"use strict";

function Unit(id, hexX, hexY, heading) {
	this.id = id;
	this.setHexLocation(hexX, hexY);
	this.heading = heading;
}
var u = Unit.prototype;

u.setHexLocation = function(hexX, hexY) {
	var locationChanged = false;
	
	if(this.coords == null){
		this.coords = new Coords(hexX, hexY);
		locationChanged = true;
	}
	else if(this.xCoords() != hexX || this.yCoords() != hexY){
		this.coords.setLocation(hexX, hexY);
		locationChanged = true;
	}
	
	return locationChanged;
}
u.getHexLocation = function() {
	return this.coords;
}
u.getHex = function() {
	return getHex(this.coords);
}
u.getHeading = function() {
	return this.heading;
}
u.xCoords = function() {
	return this.coords.x;
}
u.yCoords = function() {
	return this.coords.y;
}
u.setUnitDisplay = function(displayUnit) {
	this.displayUnit = displayUnit;
}
u.getUnitDisplay = function() {
	return this.displayUnit;
}
u.toString = function() {
	return "[Unit@"+this.xCoords()+","+this.yCoords()+">"+this.heading+"]";
}

window.Unit = Unit;
}());