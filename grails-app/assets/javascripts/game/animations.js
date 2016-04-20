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

var EJECTION_POD_SPEED = 150;

// keep track of the last time in which an animation will still be playing
var lastAnimationTimeMs = 0;

/**
 * Returns if something is still animating, as the time in milliseconds until the last animation is done
 */
function getAnimatingTime() {
	var nowTime = new Date().getTime();
	var finishTime = lastAnimationTimeMs - nowTime;
	if(finishTime <= 0) {
		return 0;
	}
	
	return finishTime;
}

function addAnimatingTime(animationTimeMs) {
	var thisTime = new Date().getTime() + animationTimeMs;
	if(thisTime > lastAnimationTimeMs) {
		lastAnimationTimeMs = thisTime;
	}
}

function animateEjectionPod(srcUnit) {
	var point = new Point(srcUnit.getUnitDisplay().x, srcUnit.getUnitDisplay().y);
	
	// create the ejection pod
	var pod = new EjectionPod(point);
	stage.addChild(pod);
	
	// determine duration time based on y distance to the out of bounds area
	var duration = getProjectileTime((hexHeight*4) + point.y, EJECTION_POD_SPEED);
	
	createjs.Tween.get(pod).to({y:(-hexHeight*4)}, duration).call(removeThisFromStage, null, pod);
	
	// show smoke trail emitter for the pod
	var emitter = new EjectionPodEmitter(pod, duration);
}

function animateFallingMech(srcUnit) {
	var srcUnitDisplay = srcUnit.getUnitDisplay();
	var point = new Point(srcUnitDisplay.x, srcUnitDisplay.y);
	
	var srcUnitDisplayIndex = stage.getChildIndex(srcUnitDisplay);
	
	var emitter = new DustCloudEmitter(point, 500, 0.5, 1);
	if(srcUnitDisplayIndex == -1) {
		stage.addChild(emitter);
	}
	else{
		stage.addChildAt(emitter, srcUnitDisplayIndex);
	}
}

function animateJumpingMech(srcUnit) {
	var srcUnitDisplay = srcUnit.getUnitDisplay();
	var point = new Point(srcUnitDisplay.x, srcUnitDisplay.y);
	
	var srcUnitDisplayIndex = stage.getChildIndex(srcUnitDisplay);
	
	var emitter = new DustCloudEmitter(point, 250, 0.75, 0.75);
	if(srcUnitDisplayIndex == -1) {
		stage.addChild(emitter);
	}
	else{
		stage.addChildAt(emitter, srcUnitDisplayIndex);
	}
}

function animateAmmoExplosion(srcUnit, ammoObj) {
	var ammoId = ammoObj.id;
	
	var ammoWeaponObj = null;
	// find the type of weapon the ammo belonged to for determining effect of explosion
	$.each(srcUnit.weapons, function(key, w) {
		if(w.ammo != null 
				&& w.ammo[ammoId] != null
				&& ammoWeaponObj == null) {
			ammoWeaponObj = w;
		}
	});
	
	if(ammoWeaponObj != null) {
		var targetPoint = new Point(srcUnit.getUnitDisplay().x, srcUnit.getUnitDisplay().y);
		var point = getPositionFromLocationAngle(targetPoint, srcUnit.heading, ammoObj.location);
		
		var durationMs = 100 * ammoObj.ammoRemaining;
		if(durationMs > 1000) {
			durationMs = 1000;
		}
		
		if(ammoWeaponObj.weaponType == WEAPON_BALLISTIC) {
			var casings = new BallisticShellEmitter(point, durationMs);
			
			var emitter = new BallisticHitEmitter(point, durationMs);
			emitter.emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
			
			var explosionEmitter = new MissileHitEmitter(point, durationMs/4);
			explosionEmitter.emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
		}
		else if(ammoWeaponObj.weaponType == WEAPON_MISSILE) {
			var emitter = new BallisticHitEmitter(point, durationMs);
			emitter.emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
			
			var explosionEmitter = new MissileHitEmitter(point, durationMs/2);
			explosionEmitter.emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
		}
		else {
			console.error("Ammo explosion animation not defined for weapon type "+ammoWeaponObj.weaponType);
		}
		
		addAnimatingTime(durationMs);
	}
	else {
		console.error("Could not find corresponding weapon for exploded ammo "
					+ammoObj.shortName+" ["+ammoId+"] on "+srcUnit);
	}
}

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
			// create the floating message to display the results above the first projectile that missed, or in the simple location position of the hit
			var floatMessagePoint = (damage != null) ? 
					getSimplePositionForLocation(new Point(tgtUnit.getUnitDisplay().x, tgtUnit.getUnitDisplay().y), loc) 
					: new Point(firstLocationEndPoint.x, firstLocationEndPoint.y - 20);
					
			var floatMessageStr = (damage != null) 
					? getLocationText(loc) + " -" + damage 
					: "MISS";
					
			createFloatMessage(floatMessagePoint, floatMessageStr, null, firstLocationEndPoint.projectileTime, 1.0, false);
			
			addAnimatingTime(firstLocationEndPoint.projectileTime);
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
		case Weapon.WeaponMGUN: 
			burstProjectiles = 10;
			break;
			
		case Weapon.WeaponAC5:
		case Weapon.WeaponAC2:
			burstProjectiles = 5;
			break;
			
		case Weapon.WeaponAC10:
			burstProjectiles = 4;
			break;
			
		case Weapon.WeaponAC20:
		default:
			burstProjectiles = 3;
			break;	
	}

	var thisLocationEndPoints = [];
	for(var i=0; i<burstProjectiles; i++){
		var initialDelay = i * 100;
		if(wName == Weapon.WeaponMGUN) {
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
		if(wName == Weapon.WeaponSLAS 
				|| wName == Weapon.WeaponMLAS 
				|| wName == Weapon.WeaponLLAS ){
			
			var laserConf;
			switch(wName) {
				case Weapon.WeaponSLAS:
					laserConf = {
						laserDuration: 300,
						laserWidth: 1,
						laserColor: "#FF0000",
						glowWidth: 2,
						glowColor: "#FF6666"
					};
					break;
					
				case Weapon.WeaponMLAS:
					laserConf = {
						laserDuration: 500,
						laserWidth: 2,
						laserColor: "#00FF00",
						glowWidth: 2,
						glowColor: "#66FF66"
					};
					break;
					
				case Weapon.WeaponLLAS:
					laserConf = {
						laserDuration: 700,
						laserWidth: 2,
						laserColor: "#0000FF",
						glowWidth: 3,
						glowColor: "#6666FF"
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
			
			createjs.Tween.get(laser).wait(initialDelay).to({visible:true}).wait(laser.getDuration()).to({alpha:0}, 200).call(removeThisFromStage, null, laser);
			
			addAnimatingTime(initialDelay + laser.getDuration());
			
			if(hit) {
				// instantly create the laser's particle hit effect on the target if it hit
				var emitter = new LaserHitEmitter(laser, laser.getDuration());
			}
		}
		else if(wName == Weapon.WeaponPPC) {
			var ppcDuration = 500;
			
			// create a PPC projectile as lightning
			var lightning = new Lightning();
			lightning.visible = false;
			lightning.show(weaponPoint.x, weaponPoint.y, weaponEndPoint.x, weaponEndPoint.y);
			stage.addChild(lightning);
			
			createjs.Tween.get(lightning).wait(initialDelay).to({visible:true}).wait(ppcDuration).to({alpha:0}, 200).call(removeThisFromStage, null, lightning);
			
			addAnimatingTime(initialDelay + ppcDuration);
			
			if(hit) {
				// instantly create the laser's particle hit effect on the target if it hit
				var emitter = new PPCHitEmitter(lightning, ppcDuration);
			}
		}
		else if(wName == Weapon.WeaponFlamer) {
			// create a Flamer projectile
			projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_FLAMER);
			
			var flames = new Flames(weaponPoint.x, weaponPoint.y, angle);
			flames.visible = false;
			stage.addChild(flames);
			
			createjs.Tween.get(flames).wait(initialDelay).to({visible:true}).to({x:weaponEndPoint.x, y:weaponEndPoint.y}, projectileTime).to({alpha:0}, 100).call(removeThisFromStage, null, flames);
			
			addAnimatingTime(initialDelay + projectileTime);
			
			if(hit) {
				// delay the particle hit effect until after the initial delay and missile travel time
				setTimeout(
					function() {
						var emitter = new FlamerHitEmitter(weaponEndPoint, 400);
					}, 
					initialDelay + projectileTime
				);
			}
		}
	}
	else if(weapon.isBallisticWeapon()) {
		
		projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_AC);
		
		var projectileWidth = 1;
		var projectileLength = 1;
		
		if(wName == Weapon.WeaponAC20 
				|| wName == Weapon.WeaponAC10 
				|| wName == Weapon.WeaponAC5
				|| wName == Weapon.WeaponAC2
				|| wName == Weapon.WeaponMGUN){
			// for ACs and Machine guns use lines of a given width and length as tracers
			if(wName == Weapon.WeaponAC20){
				projectileTime *= 1.3;
				
				projectileWidth = 3;
				projectileLength = 20;
			}
			else if(wName == Weapon.WeaponAC10){
				projectileTime *= 1.2;
				
				projectileWidth = 2.5;
				projectileLength = 15;
			}
			else if(wName == Weapon.WeaponAC5){
				projectileTime *= 1.1;
				
				projectileWidth = 2;
				projectileLength = 15;
			}
			else if(wName == Weapon.WeaponAC2){
				projectileWidth = 2;
				projectileLength = 10;
			}
			else if(wName == Weapon.WeaponMGUN){
				projectileTime = getProjectileTime(distance, PROJECTILE_SPEED_MG);
				
				projectileWidth = 1;
				projectileLength = 5;
			}
			
			// create an autocannon projectile
			var projectile = new Projectile(weaponPoint, projectileWidth, projectileLength, angle);
			projectile.visible = false;
			stage.addChild(projectile);
			
			createjs.Tween.get(projectile).wait(initialDelay).to({visible:true}).to({x:weaponEndPoint.x, y:weaponEndPoint.y}, projectileTime).call(removeThisFromStage, null, projectile);
			
			// add shell casing ejection animation
			setTimeout(
				function() {
					var casings = new BallisticShellEmitter(weaponPoint, 50);
				}, 
				initialDelay
			);
			
			addAnimatingTime(initialDelay + projectileTime);
			
			if(hit) {
				// delay the particle hit effect until after the initial delay and projectile travel time
				setTimeout(
					function() {
						var emitter = new BallisticHitEmitter(weaponEndPoint, 100);
					}, 
					initialDelay + projectileTime
				);
			}
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
		
		addAnimatingTime(initialDelay + projectileTime);
		
		if(hit) {
			// delay the particle hit effect until after the initial delay and missile travel time
			setTimeout(
				function() {
					var emitter = new MissileHitEmitter(weaponEndPoint, 100);
				}, 
				initialDelay + projectileTime
			);
		}
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
	var floatDuration = 2000 * durationMultiplier;
	
	var floatMessageBox = new FloatMessage(message);
	floatMessageBox.visible = false;
	stage.addChild(floatMessageBox);
	
	setTimeout(function() {
		// sort existing floating messages by y position
		var sortedFloatingMessages = floatingMessages.slice();
		sortedFloatingMessages.sort(function(a, b){
			var aBounds = a.getBounds();
			var bBounds = b.getBounds();
			return (aBounds.y + aBounds.height) - (bBounds.y + bBounds.height);
		});
		
		// modify the source point if existing messages are going to be in the way
		var floatBox = new createjs.Rectangle(srcPoint.x - floatMessageBox.width/2, srcPoint.y - floatMessageBox.height/2, floatMessageBox.width, floatMessageBox.height);
		for(var i=0; i<sortedFloatingMessages.length; i++) {
			var thisFloater = sortedFloatingMessages[i];
			if(thisFloater != null) {
				var chkBox = thisFloater.getBounds();
				var intersects = checkIntersection(floatBox, chkBox);
				if(intersects) {
					floatBox.y = chkBox.y + chkBox.height + 1;
				}
			}
		}
		
		floatMessageBox.setBounds(floatBox.x, floatBox.y, floatBox.width, floatBox.height);
		floatMessageBox.x = floatBox.x;
		floatMessageBox.y = floatBox.y;
		
		floatingMessages.push(floatMessageBox);
		
		var endPoint = new Point(floatBox.x, floatBox.y);
		if(!staticMessage) {
			// message floats upward
			endPoint.y = floatBox.y - 100;
		}
		
		createjs.Tween.get(floatMessageBox).to({visible:true}).to({x:endPoint.x, y:endPoint.y}, floatDuration).to({alpha:0}, 200).call(removeFloatMessage, null, floatMessageBox);
	}, delay);
	
	addAnimatingTime(delay + (floatDuration*0.8));
}
