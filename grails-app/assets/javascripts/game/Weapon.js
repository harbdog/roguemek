/**
 * Class used to store Weapon information that may be used for display purposes at times
 */
(function() {
"use strict";

//Weapon classifications
Weapon.WEAPON_PHYSICAL = "Physical";
Weapon.WEAPON_ENERGY = "Energy";
Weapon.WEAPON_BALLISTIC = "Ballistic";
Weapon.WEAPON_MISSILE = "Missile";

//Specific weapons
Weapon.Punch = "PUNCH";
Weapon.Kick = "KICK";
Weapon.Charge = "CHARGE";
Weapon.DFA = "DFA";

Weapon.WeaponAC20 = "AC/20";
Weapon.WeaponAC10 = "AC/10";
Weapon.WeaponAC5 = "AC/5";
Weapon.WeaponAC2 = "AC/2";
Weapon.WeaponMGUN = "MGUN";

Weapon.WeaponSLAS = "SLAS";
Weapon.WeaponMLAS = "MLAS";
Weapon.WeaponLLAS = "LLAS";
Weapon.WeaponPPC = "PPC";
Weapon.WeaponFlamer = "FLAMR";

Weapon.WeaponSRM2 = "SRM2";
Weapon.WeaponSRM4 = "SRM4";
Weapon.WeaponSRM6 = "SRM6";

Weapon.WeaponLRM5 = "LRM5";
Weapon.WeaponLRM10 = "LRM10";
Weapon.WeaponLRM15 = "LRM15";
Weapon.WeaponLRM20 = "LRM20";

function Weapon(id, name, shortName, weaponType, location, damage, projectiles, heat, cycle, cooldown, minRange, range, equipObj) {
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
	this.equipment = equipObj;
}

var w = Weapon.prototype;

w.isActive = function() {
	return (this.equipment.status == "A");
}
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
	return (this.weaponType == Weapon.WEAPON_PHYSICAL);
}
w.isPunch = function() {
	return (this.shortName == Weapon.Punch);
}
w.isKick = function() {
	return (this.shortName == Weapon.Kick);
}
w.isCharge = function() {
	return (this.shortName == Weapon.Charge);
}
w.isDFA = function() {
	return (this.shortName == Weapon.DFA);
}
w.isEnergyWeapon = function() {
	return (this.weaponType == Weapon.WEAPON_ENERGY);
}
w.isBallisticWeapon = function() {
	return (this.weaponType == Weapon.WEAPON_BALLISTIC);
}
w.isMissileWeapon = function() {
	return (this.weaponType == Weapon.WEAPON_MISSILE);
}
w.isLRM = function() {
	return (this.shortName == Weapon.WeaponLRM5
			|| this.shortName == Weapon.WeaponLRM10
			|| this.shortName == Weapon.WeaponLRM15
			|| this.shortName == Weapon.WeaponLRM20);
}
w.isSRM = function() {
	return (this.shortName == Weapon.WeaponSRM2
			|| this.shortName == Weapon.WeaponSRM4
			|| this.shortName == Weapon.WeaponSRM6);
}
w.toString = function() {
	return this.name;
}

window.Weapon = Weapon;
}());