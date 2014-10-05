/**
 * display_objects.js - Definitions for game model related object classes and their methods
 */

// Class used to store Hex (not stage) X,Y coordinates
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
	return "["+this.x+","+this.y+"]";
}

// Class used to store Weapon information that may be used for display purposes at times
function Weapon(name, shortName, damage, heat, minRange, range) {
	this.initialize(name, shortName, damage, heat, minRange, range);
}
Weapon.prototype.initialize = function(name, shortName, location, damage, heat, minRange, range) {
	this.name = name;
	this.shortName = shortName;
	this.location = location;
	this.damage = damage;
	this.heat = heat;
	this.minRange = minRange;
	
	this.range = range || [0, 0, 0];
}
Weapon.prototype.toString = function() {
	return this.name;
}