/**
 * display_objects.js - Definitions for game model related object classes and their methods
 */

// Class used to store Weapon information that may be used for display purposes at times
function Weapon(name, shortName, damage, heat, minRange, range) {
	this.initialize(name, shortName, damage, heat, minRange, range);
}
Weapon.prototype.initialize = function(name, shortName, damage, heat, minRange, range) {
	this.name = name;
	this.shortName = shortName;
	this.damage = damage;
	this.heat = heat;
	this.minRange = minRange;
	
	this.range = range || [0, 0, 0];
}
Weapon.prototype.toString = function() {
	return this.name;
}