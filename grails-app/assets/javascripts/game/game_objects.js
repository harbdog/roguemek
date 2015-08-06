/**
 * display_objects.js - Definitions for game model related object classes and their methods
 */

// Weapon classifications
var WEAPON_MELEE = "Melee";
var WEAPON_ENERGY = "Energy";
var WEAPON_BALLISTIC = "Ballistic";
var WEAPON_MISSILE = "Missile";

// Specific weapons
var WeaponAC20 = "AC/20";
var WeaponAC10 = "AC/10";
var WeaponAC5 = "AC/5";
var WeaponAC2 = "AC/2";
var WeaponMGUN = "MGUN";

var WeaponSLAS = "SLAS";
var WeaponMLAS = "MLAS";
var WeaponLLAS = "LLAS";
var WeaponPPC = "PPC";
var WeaponFlamer = "FLAMR";

var WeaponSRM2 = "SRM2";
var WeaponSRM4 = "SRM4";
var WeaponSRM6 = "SRM6";

var WeaponLRM5 = "LRM5";
var WeaponLRM10 = "LRM10";
var WeaponLRM15 = "LRM15";
var WeaponLRM20 = "LRM20";

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
 * Class used to store Hex information and its display object
 */
function Hex(hexX, hexY, elevation, terrains, images) {
	this.initialize(hexX, hexY, elevation, terrains, images);
}
Hex.prototype.initialize = function(hexX, hexY, elevation, terrains, images) {
	this.coords = new Coords(hexX, hexY);
	this.elevation = elevation;
	this.images = images;
	
	this.terrains = [];
	if(terrains != null && terrains.length > 0) {
		for(var i=0; i<terrains.length; i++){
			var terrainData = terrains[i];
			var thisTerrain = new Terrain(terrainData.type, terrainData.level, 
					terrainData.exits, terrainData.terrainFactor);
			
			this.terrains[i] = thisTerrain;
		}
	}
}
Hex.prototype.containsTerrain = function(type) {
	if(this.terrains != null && this.terrains.length > 0){
		for(var i=0; i<this.terrains.length; i++){
			var thisTerrain = this.terrains[i];
			if(thisTerrain.type == type) {
				return true;
			}
		}
	}
	
	return false;
}
Hex.prototype.getTerrain = function(type) {
	if(this.terrains != null && this.terrains.length > 0){
		for(var i=0; i<this.terrains.length; i++){
			var thisTerrain = this.terrains[i];
			if(thisTerrain.type == type) {
				return thisTerrain;
			}
		}
	}
	
	return null;
}
Hex.prototype.setHexDisplay = function(hexDisplay) {
	this.hexDisplay = hexDisplay;
}
Hex.prototype.getHexDisplay = function() {
	return this.hexDisplay;
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
Hex.prototype.getElevation = function() {
	return this.elevation;
}
Hex.prototype.getImages = function() {
	return this.images;
}
Hex.prototype.toString = function() {
	return "[Hex@"+this.xCoords()+","+this.yCoords()+" +"+this.elevation+"; "+this.terrains+"]";
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
Unit.prototype.getUnitDisplay = function() {
	return this.displayUnit;
}
Unit.prototype.toString = function() {
	return "[Unit@"+this.xCoords()+","+this.yCoords()+">"+this.heading+"]";
}


/**
 * Class used to store Weapon information that may be used for display purposes at times
 */
function Weapon(id, name, shortName, weaponType, location, damage, projectiles, heat, cycle, cooldown, minRange, range) {
	this.initialize(id, name, shortName, weaponType, location, damage, projectiles, heat, cycle, cooldown, minRange, range);
}
Weapon.prototype.initialize = function(id, name, shortName, weaponType, location, damage, projectiles, heat, cycle, cooldown, minRange, range) {
	this.id = id;
	this.name = name;
	this.shortName = shortName;
	this.weaponType = weaponType;
	this.location = location;
	this.damage = damage;
	this.projectiles = projectiles;
	this.heat = heat;
	this.minRange = minRange;
	
	this.range = range || [0, 0, 0];
	this.cycle = cycle;
	this.cooldown = cooldown;
	
	this.ammo = null;
}
Weapon.prototype.getProjectiles = function() {
	return this.projectiles;
}
Weapon.prototype.getDamage = function() {
	return this.damage;
}
Weapon.prototype.isClusterWeapon = function() {
	return (this.projectiles > 1);
}
Weapon.prototype.isMeleeWeapon = function() {
	return (this.weaponType == WEAPON_MELEE);
}
Weapon.prototype.isEnergyWeapon = function() {
	return (this.weaponType == WEAPON_ENERGY);
}
Weapon.prototype.isBallisticWeapon = function() {
	return (this.weaponType == WEAPON_BALLISTIC);
}
Weapon.prototype.isMissileWeapon = function() {
	return (this.weaponType == WEAPON_MISSILE);
}
Weapon.prototype.isLRM = function() {
	return (this.shortName == WeaponLRM5
			|| this.shortName == WeaponLRM10
			|| this.shortName == WeaponLRM15
			|| this.shortName == WeaponLRM20);
}
Weapon.prototype.isSRM = function() {
	return (this.shortName == WeaponSRM2
			|| this.shortName == WeaponSRM4
			|| this.shortName == WeaponSRM6);
}
Weapon.prototype.toString = function() {
	return this.name;
}