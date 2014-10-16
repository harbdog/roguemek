/**
 * display_objects.js - Definitions for game model related object classes and their methods
 */

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
	return "["+this.x+","+this.y+"]";
}

/**
 * Class used to store Hex information and its display object
 */
function Hex(hexX, hexY, hexDisplay) {
	this.initialize(hexX, hexY, hexDisplay);
}
Hex.prototype.initialize = function(hexX, hexY, hexDisplay) {
	this.coords = new Coords(hexX, hexY);
	this.hexDisplay = hexDisplay;
}
Hex.prototype.isXOdd = function() {
	return isXOdd(this.xCoords());
}
Hex.prototype.getHexLocation = function() {
	return this.coords;
}
Hex.prototype.xCoords = function() {
	return this.coords.x;
}
Hex.prototype.yCoords = function() {
	return this.coords.y;
}
Hex.prototype.toString = function() {
	return "[Hex@"+this.xCoords()+","+this.yCoords()+"]";
}


/**
 * Class used to store Unit information and its display object
 */ 
function Unit(id, hexX, hexY, heading, displayUnit) {
	this.initialize(id, hexX, hexY, heading, displayUnit);
}
Unit.prototype.initialize = function(id, hexX, hexY, heading, displayUnit) {
	this.id = id;
	this.setHexLocation(hexX, hexY);
	this.heading = heading;
	this.displayUnit = displayUnit;
}
Unit.prototype.setHexLocation = function(hexX, hexY) {
	if(this.coords == null){
		this.coords = new Coords(hexX, hexY);
	}
	else{
		this.coords.setLocation(hexX, hexY);
	}
}
Unit.prototype.getHexLocation = function() {
	return this.coords;
}
Unit.prototype.getHeading = function() {
	return this.heading;
}
Unit.prototype.xCoords = function() {
	return this.coords.x;
}
Unit.prototype.yCoords = function() {
	return this.coords.y;
}
Unit.prototype.updateDisplay = function() {
	if(this.displayUnit != null) {
		this.displayUnit.x = this.displayUnit.getUpdatedDisplayX(this.coords);
		this.displayUnit.y = this.displayUnit.getUpdatedDisplayY(this.coords);
		this.displayUnit.rotation = this.displayUnit.getUpdatedDisplayRotation(this.heading);
	}
}
Unit.prototype.toString = function() {
	return "[Unit@"+this.xCoords()+","+this.yCoords()+">"+this.heading+"]";
}


/**
 * Class used to store Weapon information that may be used for display purposes at times
 */
function Weapon(id, name, shortName, weaponType, damage, heat, minRange, range) {
	this.initialize(id, name, shortName, weaponType, damage, heat, minRange, range);
}
Weapon.prototype.initialize = function(id, name, shortName, weaponType, location, damage, heat, minRange, range) {
	this.id = id;
	this.name = name;
	this.shortName = shortName;
	this.weaponType = weaponType;
	this.location = location;
	this.damage = damage;
	this.heat = heat;
	this.minRange = minRange;
	
	this.range = range || [0, 0, 0];
}
Weapon.prototype.toString = function() {
	return this.name;
}