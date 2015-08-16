/**
 * Class used to store Weapon information that may be used for display purposes at times
 */
(function() {
"use strict";

//Weapon classifications
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

function Weapon(id, name, shortName, weaponType, location, damage, projectiles, heat, cycle, cooldown, minRange, range) {
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

var w = Weapon.prototype;

w.getProjectiles = function() {
	return this.projectiles;
}
w.getDamage = function() {
	return this.damage;
}
w.isClusterWeapon = function() {
	return (this.projectiles > 1);
}
w.isMeleeWeapon = function() {
	return (this.weaponType == WEAPON_MELEE);
}
w.isEnergyWeapon = function() {
	return (this.weaponType == WEAPON_ENERGY);
}
w.isBallisticWeapon = function() {
	return (this.weaponType == WEAPON_BALLISTIC);
}
w.isMissileWeapon = function() {
	return (this.weaponType == WEAPON_MISSILE);
}
w.isLRM = function() {
	return (this.shortName == WeaponLRM5
			|| this.shortName == WeaponLRM10
			|| this.shortName == WeaponLRM15
			|| this.shortName == WeaponLRM20);
}
w.isSRM = function() {
	return (this.shortName == WeaponSRM2
			|| this.shortName == WeaponSRM4
			|| this.shortName == WeaponSRM6);
}
w.toString = function() {
	return this.name;
}

window.Weapon = Weapon;
}());