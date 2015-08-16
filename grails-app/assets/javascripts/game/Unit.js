/**
 * Class used to store Unit information and its display object
 */
(function() {
"use strict";

function Unit(id, hexX, hexY, heading, displayUnit) {
	this.id = id;
	this.setHexLocation(hexX, hexY);
	this.heading = heading;
	this.displayUnit = displayUnit;
}
var u = Unit.prototype;

u.setHexLocation = function(hexX, hexY) {
	if(this.coords == null){
		this.coords = new Coords(hexX, hexY);
	}
	else{
		this.coords.setLocation(hexX, hexY);
	}
}
u.getHexLocation = function() {
	return this.coords;
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
u.getUnitDisplay = function() {
	return this.displayUnit;
}
u.toString = function() {
	return "[Unit@"+this.xCoords()+","+this.yCoords()+">"+this.heading+"]";
}

window.Unit = Unit;
}());