/**
 * animations.js - Animation related methods for the UI
 */
"use strict";

// Projectile speeds in pixels per 1000 ms
var PROJECTILE_SPEED_LRM = 600;
var PROJECTILE_SPEED_SRM = 500;
var PROJECTILE_SPEED_AC = 700;
var PROJECTILE_SPEED_MG = 400;
var PROJECTILE_SPEED_FLAMER = 400;

/**
 * Returns the time (ms) it will take to travel the given distance (px) at the given speed (px/ms)
 * @param distance
 * @param speed
 */
function getProjectileTime(distance, speed) {
	return distance * (1000/speed);
}

/**
 * handles the display of animated projectiles and related animated messages from weapon fire
 * @param hit set true if the weapon hit
 */
function animateWeaponFire(srcUnit, weapon, tgtUnit, hitLocations) {
	
	var firstHitLocation;
	if(hitLocations != null) {
		$.each(hitLocations, function(loc, damage) {
			if(firstHitLocation == null && damage != null && damage > 0) {
				firstHitLocation = loc;
			}
		});
	}

	var projectileEndPoints;
	if(weapon.isClusterWeapon()) {
		projectileEndPoints = animateClusterProjectile(srcUnit, weapon, tgtUnit, hitLocations);
	}
	else if(weapon.isBallisticWeapon()) {
		projectileEndPoints = animateBurstProjectile(srcUnit, weapon, tgtUnit, firstHitLocation);
	}
	else {
		projectileEndPoints = {};
		projectileEndPoints[firstHitLocation] = [animateProjectile(srcUnit, weapon, tgtUnit, firstHitLocation)];
		
	}
	
	$.each(projectileEndPoints, function(loc, thisLocationEndPoints) {
		if(thisLocationEndPoints == null || thisLocationEndPoints.length == 0) {
			return;
		}
		
		var damage = (hitLocations != null) ? hitLocations[loc] : null;
		var firstLocationEndPoint = thisLocationEndPoints[0];
		
		// only show a MISS if the weapon missed entirely
		if(firstHitLocation == null || damage != null){
			// TODO: make the messages play nicer with each other in positioning
			// create the floating message to display the results above the first projectile that landed
			var floatMessagePoint = new Point(firstLocationEndPoint.x, firstLocationEndPoint.y - 20);
			var floatMessageStr = (damage != null) ? getLocationText(loc) + " -" + damage : "MISS";
			createFloatMessage(floatMessagePoint, floatMessageStr, null, firstLocationEndPoint.projectileTime, 1.0, false);
		}
	});
}

/**
 * Creates multiple projectiles with slight variations on the target position for effect
 * @return Point end x,y location and projectileTime representing the time (ms) it will take for the first projectile to arrive at target 
 */
function animateClusterProjectile(srcUnit, weapon, tgtUnit, hitLocations){
	// spawn off more projectiles in slightly different target locations
	var numProjectiles = weapon.getProjectiles();
	
	// determine actual location for each projectile by cycling through a stack of counters
	var hitLocationCounters = [];
	if(hitLocations != null) {
		$.each(hitLocations, function(loc, damage) {
			if(damage == null|| damage == 0) {
				return;
			}
			
			var locCounter = new Object();
			locCounter.loc = loc;
			locCounter.damage = damage;
			hitLocationCounters.push(locCounter);
		});
	}
	
	var thisLocCounter = hitLocationCounters.shift();
	var projectileEndPoints = {};
	
	for(var i=0; i<numProjectiles; i++){
		// TODO: determine actual number that hit or missed
		
		var initialDelay = 0;
		// only add in small delay for LRM launches
		if(weapon.isLRM()) {
			initialDelay = i * 50;
		}
		else if(weapon.isSRM()) {
			initialDelay = i * 100;
		}
		
		var thisHitLocation = (thisLocCounter != null) ? thisLocCounter.loc : null;
		var thisEndPoint = animateProjectile(srcUnit, weapon, tgtUnit, thisHitLocation, initialDelay);
		
		if(projectileEndPoints[thisHitLocation] == null) {
			projectileEndPoints[thisHitLocation] = [];
		}
		projectileEndPoints[thisHitLocation].push(thisEndPoint);
		
		if(thisLocCounter != null) {
			thisLocCounter.damage -= weapon.getDamage();
			if(thisLocCounter.damage <= 0) {
				thisLocCounter = hitLocationCounters.shift();
			}
		}
	}
	
	return projectileEndPoints;
}

/**
 * Creates multiple projectiles which follow each other in the same linear path for effect
 * @return Point end x,y location and projectileTime representing the time (ms) it will take for the first projectile to arrive at target 
 */
function animateBurstProjectile(srcUnit, weapon, tgtUnit, hitLocation){
	var burstProjectiles = 3;
	
	var wName = weapon.shortName;
	switch(wName) {
		case WeaponMGUN: 
			burstProjectiles = 10;
			break;
			
		case WeaponAC5:
		case WeaponAC2:
			burstProjectiles = 5;
			break;
			
		case WeaponAC10:
			burstProjectiles = 4;
			break;
			
		case WeaponAC20:
		default:
			burstProjectiles = 3;
			break;	
	}

	var thisLocationEndPoints = [];
	for(var i=0; i<burstProjectiles; i++){
		var initialDelay = i * 100;
		if(wName == WeaponMGUN) {
			initialDelay = i * 50;
		}
		
		var thisEndPoint = animateProjectile(srcUnit, weapon, tgtUnit, hitLocation, initialDelay);
		thisLocationEndPoints.push(thisEndPoint);
	}
	
	var projectileEndPoints = {};
	projectileEndPoints[hitLocation] = thisLocationEndPoints;
	
	return projectileEndPoints;
}

/**
 * Animates a single weapon projectile to be fired at the target
 * @param srcUnit
 * @param weapon
 * @param tgtUnit
 * @param hitLocation
 * @return Point end x,y location and projectileTime representing the time (ms) it will take for the first projectile to arrive at target 
 */
function animateProjectile(srcUnit, weapon, tgtUnit, hitLocation, initialDelay) {
	var hit = (hitLocation != null);
	
	if(initialDelay == null || initialDelay < 0) {
		initialDelay = 0;
	}
	
	var projectileTime = 0;
	var wName = weapon.shortName;
	
	var srcPoint = new Point(srcUnit.displayUnit.x, srcUnit.displayUnit.y);
	var weaponPoint = getPositionFromLocationAngle(srcPoint, srcUnit.heading, weapon.location);
	
	var targetPoint = new Point(tgtUnit.displayUnit.x, tgtUnit.displayUnit.y);
	
	if(weapon.isClusterWeapon()){
		// give cluster projectiles a tiny variation in the source and target pixel position for effect
		var randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
		var randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;

		var randomOffsetX = getDieRollTotal(1, 4) * randomPosNegX;
		var randomOffsetY = getDieRollTotal(1, 4) * randomPosNegY;
		
		weaponPoint.x += randomOffsetX;
		weaponPoint.y += randomOffsetY;
	
		// now for the target variation
		randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
		randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;

		randomOffsetX = getDieRollTotal(1, 16) * randomPosNegX;
		randomOffsetY = getDieRollTotal(1, 16) * randomPosNegY;
		
		targetPoint.x += randomOffsetX;
		targetPoint.y += randomOffsetY;
	}
	
	// determine the end point of the projectile based on whether it hit or missed
	var weaponEndPoint;
	var distance;
	var angle;
	if(hit) {
		distance = getDistanceToTarget(weaponPoint.x, weaponPoint.y, targetPoint.x, targetPoint.y);
		angle = getAngleToTarget(weaponPoint.x, weaponPoint.y, targetPoint.x, targetPoint.y);
		
		weaponEndPoint = getPositionFromLocationAngle(targetPoint, tgtUnit.heading, hitLocation);
	}
	else{
		// randomize the angle and distance of a miss
		var randomPosNegAngle = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
		
		var randomAngleOffset = getDieRollTotal(1, 12) * randomPosNegAngle;
		var randomDistanceOffset = getDieRollTotal(4, 20);
		
		distance = getDistanceToTarget(weaponPoint.x, weaponPoint.y, targetPoint.x, targetPoint.y) + randomDistanceOffset;
		angle = getAngleToTarget(weaponPoint.x, weaponPoint.y, targetPoint.x, targetPoint.y) + randomAngleOffset;
		
		weaponEndPoint = getMovementDestination(weaponPoint.x, weaponPoint.y, distance, angle);
	}
	
	if(weapon.isEnergyWeapon()) {
		if(wName == WeaponSLAS 
				|| wName == WeaponMLAS 
				|| wName == WeaponLLAS ){
			
			var laserConf;
			switch(wName) {
				case WeaponSLAS:
					laserConf = {
						laserWidth: 1,
						laserColor: "#990000",
						glowWidth: 2,
						glowColor: "#FF0000"
					};
					break;
					
				case WeaponMLAS:
					laserConf = {
						laserWidth: 2,
						laserColor: "#00FF00",
						glowWidth: 2,
						glowColor: "#009900"
					};
					break;
					
				case WeaponLLAS:
					laserConf = {
						laserWidth: 2,
						laserColor: "#0000FF",
						glowWidth: 3,
						glowColor: "#000099"
					};
					break;
					
				default:
					laserConf = {};
					break;
			}
			
			// create a laser beam
			var laser = new Laser(laserConf);
			laser.visible = false;
			laser.show(weaponPoint.x, weaponPoint.y, weaponEndPoint.x, weaponEndPoint.y);
			stage.addChild(laser);
			
			createjs.Tween.get(laser).wait(initialDelay).to({visible:true}).wait(500).to({alpha:0}, 200).call(removeThisFromStage, null, laser);
		}
		else if(wName == WeaponPPC) {
			// create a PPC projectile as lightning
			var lightning = new Lightning();
			lightning.visible = false;
			lightning.show(weaponPoint.x, weaponPoint.y, weaponEndPoint.x, weaponEndPoint.y);
			stage.addChild(lightning);
			
			createjs.Tween.get(lightning).wait(initialDelay).to({visible:true}).wait(500).to({alpha:0}, 200).call(removeThisFromStage, null, lightning);
		}
		else if(wName == WeaponFlamer) {
			// create a Flamer projectile
			projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_FLAMER);
			
			var flames = new Flames(weaponPoint.x, weaponPoint.y, angle);
			flames.visible = false;
			stage.addChild(flames);
			
			createjs.Tween.get(flames).wait(initialDelay).to({visible:true}).to({x:weaponEndPoint.x, y:weaponEndPoint.y}, projectileTime).to({alpha:0}, 100).call(removeThisFromStage, null, flames);
		}
	}
	else if(weapon.isBallisticWeapon()) {
		
		projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_AC);
		
		var projectileWidth = 1;
		var projectileLength = 1;
		
		if(wName == WeaponAC20 
				|| wName == WeaponAC10 
				|| wName == WeaponAC5
				|| wName == WeaponAC2
				|| wName == WeaponMGUN){
			// for ACs and Machine guns use lines of a given width and length as tracers
			if(wName == WeaponAC20){
				projectileTime *= 1.3;
				
				projectileWidth = 3;
				projectileLength = 20;
			}
			else if(wName == WeaponAC10){
				projectileTime *= 1.2;
				
				projectileWidth = 2.5;
				projectileLength = 15;
			}
			else if(wName == WeaponAC5){
				projectileTime *= 1.1;
				
				projectileWidth = 2;
				projectileLength = 15;
			}
			else if(wName == WeaponAC2){
				projectileWidth = 2;
				projectileLength = 10;
			}
			else if(wName == WeaponMGUN){
				projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_MG);
				
				projectileWidth = 1;
				projectileLength = 5;
			}
			
			var point = getMovementDestination(0, 0, projectileLength, angle);
			
			// TODO: make Projectile use the new class methods similar to Laser/Lightning
			var projectile = new Projectile(weaponPoint.x, weaponPoint.y);
			projectile.visible = false;
			projectile.shadow = new createjs.Shadow("#FFCC00", 0, 0, 10);
			projectile.graphics.setStrokeStyle(projectileWidth).beginStroke("#FFD700").moveTo(0, 0).lineTo(point.x, point.y).endStroke();
			stage.addChild(projectile);
			
			createjs.Tween.get(projectile).wait(initialDelay).to({visible:true}).to({x:weaponEndPoint.x, y:weaponEndPoint.y}, projectileTime).call(removeThisFromStage, null, projectile);
			
			// TODO: add shell casing ejection animation
		}
	}
	else if(weapon.isMissileWeapon()) {
		var isLRM = weapon.isLRM();
		var isSRM = weapon.isSRM();
		
		var missileConf;
		if(isLRM) {
			projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_LRM);
			
			missileConf = {
				missileLength: 7.5,
				missileWidth: 2,
				missileColor: "#333333",
				burnerRadius: 2.5,
				burnerColor: "#FFFF99",
				burnerGlowSize: 20,
				burnerGlowColor: "#FFCC00"
			};
		}
		else if(isSRM) {
			projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_SRM);
			missileConf = {
				missileLength: 10,
				missileWidth: 3,
				missileColor: "#333333",
				burnerRadius: 3,
				burnerColor: "#FF9900",
				burnerGlowSize: 25,
				burnerGlowColor: "#FF3300"
			};
		}
		
		var missile = new Missile(weaponPoint.x, weaponPoint.y, angle, missileConf);
		missile.visible = false;
		stage.addChild(missile);
		
		createjs.Tween.get(missile).wait(initialDelay).to({visible:true}).to({x:weaponEndPoint.x, y:weaponEndPoint.y}, projectileTime).call(removeThisFromStage, null, missile);
	}
	
	var projectileEndPoint = new Point(weaponEndPoint.x, weaponEndPoint.y);
	projectileEndPoint.projectileTime = initialDelay + projectileTime;
	
	return projectileEndPoint;
}

/**
 * Creates an animated floating message
 * @param srcLocation
 * @param message
 * @param color
 * @param delay
 * @param durationMultiplier
 * @param staticMessage
 */
function createFloatMessage(srcPoint, message, color, delay, durationMultiplier, staticMessage){
	var endPoint = new Point(srcPoint.x, srcPoint.y);
	if(!staticMessage) {
		// message floats upward
		endPoint.y = srcPoint.y - 100;
	}
	
	var floatMessageBox = new FloatMessage(message);
	floatMessageBox.visible = false;
	floatMessageBox.x = srcPoint.x;
	floatMessageBox.y = srcPoint.y;
	stage.addChild(floatMessageBox);
	
	createjs.Tween.get(floatMessageBox).wait(delay).to({visible:true}).to({x:endPoint.x, y:endPoint.y}, 2000 * durationMultiplier).to({alpha:0}, 200).call(removeThisFromStage, null, floatMessageBox);
}
