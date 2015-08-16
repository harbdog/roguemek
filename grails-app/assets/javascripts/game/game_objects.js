/**
 * display_objects.js - Definitions for game model related object classes and their methods
 */
"use strict";

/**
 * Class used to store Hex (not stage) X,Y coordinates
 */
function Coords(x, y) {
	this.initialize(x, y);
}
Coords.prototype.initialize = function(x, y) {
	this.setLocation(x, y);
}
Coords.prototype.setLocation = function(x, y) {
	this.x = x;
	this.y = y;
}
Coords.prototype.equals = function(thatCoord) {
	if(thatCoord == null) return false;
	return (this.x == thatCoord.x && this.y == thatCoord.y);
}
Coords.prototype.isXOdd = function() {
	return isXOdd(this.x);
}
Coords.prototype.translated = function(direction) {
	return new Coords(xInDirection(this.x, this.y, direction), yInDirection(this.x, this.y, direction));
}
Coords.prototype.getAdjacentCoords = function() {
	var adjacents = [];
	for (var dir = 0; dir < 6; dir++) {
        var adj = this.translated(dir);
        if(adj.x >= 0 && adj.x < numCols && adj.y >= 0 && adj.y < numRows){
        	adjacents[dir] = adj;
        }
	}
	return adjacents;
}
Coords.prototype.toString = function() {
	return "Coords@["+this.x+","+this.y+"]";
}

/**
 * Class for storing an x, y point on the display
 */
function Point(x, y) {
	this.initialize(x, y);
}
Point.prototype.initialize = function(x, y) {
	this.x = x;
	this.y = y;
}
Point.prototype.toString = function() {
	return "Point@["+this.x+","+this.y+"]";
}
