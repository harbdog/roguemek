/**
 * actions.js - Handles all JSON actions for the game
 */
"use strict";

function target(playerTarget) {
	if(playerTarget == null) return;
	
	var target_id = playerTarget.id;
	
	handleActionJSON({
		perform: "target",
		target_id: target_id
	}, function( data ) {
		
		if(data.target == null){
			return;
		}
		
		console.log("targeting "+data.target);
		
		if(data.weaponData){
			var t = units[data.target];
			
			// TODO: move clearing previous toHit for each weapon to its own method
			$.each(turnUnit.weapons, function(key, w) {
				w.toHit = null;
			});
			
			// update the cooldown status of the weapons fired
			$.each(data.weaponData, function(key, wData) {
				var id = wData.weaponId;
				var toHit = wData.toHit;
				
				var weapon = getPlayerWeaponById(id);
				if(weapon != null){
					weapon.toHit = toHit;
				}
			});
			
			updateWeaponsDisplay();
		}
	});
}

function move(forward) {
	//playerUnit.displayUnit.setControlsVisible(false);
	
	handleActionJSON({
		perform: "move",
		forward: forward,
		jumping: false
	}, function( data ) {
		// update the unit based on new data
		if(data.message != null) {
			// display the message to the player
			var t = new Date(data.time);
			addMessageUpdate("["+t.toLocaleTimeString()+"] "+data.message);
		}
		
		if(data.unit == null){
			return;
		}
		
		console.log("move "+data.unit+":"+data.x+","+data.y+">"+data.heading);
		  
		var thisUnit = units[data.unit];
		if(data.x != null && data.y != null){
			thisUnit.setHexLocation(data.x, data.y);
		}
		if(data.heading != null){
			thisUnit.heading = data.heading;
		}
		if(data.heat != null) {
			thisUnit.heat = data.heat;
		}
		
		// update heat display
		updateHeatDisplay(thisUnit);
		
		// update selected weapons display that also updates the heat display
		updateSelectedWeapons();
		
		// hide the target line before starting the animated move
		setPlayerTargetLineVisible(false);
		
		thisUnit.displayUnit.animateUpdateDisplay(thisUnit.getHexLocation(), thisUnit.getHeading(),  performUnitPositionUpdates);
		
		//playerUnit.displayUnit.setControlsVisible(true);
	});
}

function rotate(rotation) {
	//playerUnit.displayUnit.setControlsVisible(false);
	
	handleActionJSON({
		perform: "rotate",
		rotation: rotation,
		jumping: false
	}, function( data ) {
		// update the unit based on new data
		if(data.unit == null){
			return;
		}
		
		console.log("rotate "+data.unit+":"+data.x+","+data.y+">"+data.heading);
		  
		var thisUnit = units[data.unit];
		if(data.x != null && data.y != null){
			thisUnit.setHexLocation(data.x, data.y);
		}
		if(data.heading != null){
			thisUnit.heading = data.heading;
		}
		if(data.heat != null) {
			thisUnit.heat = data.heat;
		}
		
		// update heat display
		updateHeatDisplay(thisUnit);
		
		// update selected weapons display that also updates the heat display
		updateSelectedWeapons();
		  
		thisUnit.displayUnit.animateUpdateDisplay(thisUnit.getHexLocation(), thisUnit.getHeading(), performUnitPositionUpdates);
		//playerUnit.displayUnit.setControlsVisible(true);
	});
}

function skip() {
	//playerUnit.displayUnit.setControlsVisible(false);
	//turnUnit.displayUnit.setOtherTurnVisible(false);
	handleActionJSON({
		perform: "skip"
	}, function( data ) {
		console.log("skipped turn");
	});
}

function fire_weapons(weapons) {
	var playerTarget = unitTargets[turnUnit.id];
	if(playerTarget == null) return;
	
	var target_id = playerTarget.id;
	var weapon_ids = []
	$.each(weapons, function(key, w) {
		if(w != null) weapon_ids.push(w.id);
	});
		
	handleActionJSON({
		perform: "fire_weapons",
		weapon_ids: weapon_ids,
		target_id: target_id
	}, function( data ) {
		// update the units based on new data
		if(data.unit == null){
			return;
		}
		
		// TODO: consolidate to a single method than handles various update dynamically for all actions and polling data
		var u = units[data.unit];
		var t = units[data.target];
		
		// weapon fire results and animations will come through the next poll update
		
		// update armor values of the target
		if(data.armorHit) {
			var numArmorHits = data.armorHit.length;
			for(var i=0; i<numArmorHits; i++) {
				var armorRemains = data.armorHit[i];
				if(armorRemains != null) {
					t.armor[i] = armorRemains;
					
					applyUnitDamage(t, i, false);
				}
			}
		}
		
		// update internal values of the target
		if(data.internalsHit) {
			var numInternalsHits = data.internalsHit.length;
			for(var i=0; i<numInternalsHits; i++) {
				var internalsRemains = data.internalsHit[i];
				if(internalsRemains != null) {
					t.internals[i] = internalsRemains;
					
					applyUnitDamage(t, i, true);
				}
			}
		}
		
		// update ammo remaining
		if(data.ammoRemaining) {
			$.each(data.ammoRemaining, function(ammoId, ammoRemaining) {
				var ammoObj = getCritObjectById(u, ammoId);
				ammoObj.ammoRemaining = ammoRemaining;
			});
		}
		
		u.heat = data.heat;
		
		// update heat display
		updateHeatDisplay(u);

		// update UI displays of target armor if showing
		updateTargetDisplay();
		
		// Toggle off all selected weapons
		updateSelectedWeapons();
	});
}

function handleActionJSON(inputMap, outputFunction) {
	// make sure the player can't make another request until this one is complete
	if(playerActionReady) {
		playerActionReady = false;
	
		$.getJSON("game/action", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(outputFunction)
		.always(function() {
			playerActionReady = true;
		});
	}
	else {
		// TODO: indicate on UI they are waiting
		console.log("waiting...");
	}
}

function pollUpdate(updates) {
	if(updates == null) return;
	
	$.each(updates, function(i, thisUpdate) {
		
		// Add the message from the update to the message display area
		var t = new Date(thisUpdate.time);
		if(thisUpdate.message != null && thisUpdate.message.length > 0) {
			addMessageUpdate("["+t.toLocaleTimeString()+"] "+thisUpdate.message);
		}
		
		$.each(thisUpdate, function(j, data) {
			if(data.unit != null){
				var unitMoved = false;
				
				var thisUnit = units[data.unit];
				var tgtUnit = (data.target != null) ? units[data.target] : null;
				
				if(data.x != null && data.y != null) {
					unitMoved = true;
					thisUnit.setHexLocation(data.x, data.y);
				}
				if(data.heading != null) {
					unitMoved = true;
					thisUnit.heading = data.heading;
				}
				if(data.apRemaining != null) {
					thisUnit.apRemaining = data.apRemaining;
				}
				
				if(data.weaponFire != null){
					// update result of weapons fire from another unit
					var wData = data.weaponFire;
					
					var id = wData.weaponId;
					var hit = wData.weaponHit;
					var hitLocations = wData.weaponHitLocations;
					var cooldown = wData.weaponCooldown;
					
					var weapon = getUnitWeaponById(id);
					if(weapon != null){
						
						weapon.cooldown = cooldown;
						
						// TODO: show floating miss/hit numbers
						animateWeaponFire(thisUnit, weapon, tgtUnit, hitLocations);
						
					}
					else{
						console.log("Weapon null? Weapon ID:"+id);
					}
				}
				
				// update armor values of the target
				if(data.armorHit) {
					var numArmorHits = data.armorHit.length;
					for(var i=0; i<numArmorHits; i++) {
						var armorRemains = data.armorHit[i];
						if(armorRemains != null) {
							tgtUnit.armor[i] = armorRemains;
							
							applyUnitDamage(tgtUnit, i, false);
						}
					}
				}
				
				// update internal values of the target
				if(data.internalsHit) {
					var numInternalsHits = data.internalsHit.length;
					for(var i=0; i<numInternalsHits; i++) {
						var internalsRemains = data.internalsHit[i];
						if(internalsRemains != null) {
							tgtUnit.internals[i] = internalsRemains;
							
							applyUnitDamage(tgtUnit, i, true);
						}
					}
				}
				
				if(tgtUnit != null) {
					if(isPlayerUnit(tgtUnit)
							&& (data.armorHit || data.internalsHit)) {
						// update player armor/internals after being hit
						//setArmorDisplay(tgtUnit.armor, tgtUnit.internals);
					}
					else if(!isPlayerUnit(tgtUnit)
							&& (data.armorHit || data.internalsHit)) {
						// update target armor/internals after being hit
						//updateTargetDisplay();
					}
				}
				
				if(isPlayerUnit(thisUnit)) {
					if(data.heat) thisUnit.heat = data.heat;
					if(data.heatDiss) thisUnit.heatDiss = data.heatDiss;
					
					setActionPoints(thisUnit.apRemaining);
					setJumpPoints(thisUnit.jpRemaining);
					updateHeatDisplay(thisUnit);
					updateWeaponsDisplay();
					
					// update selected weapons display that also updates the heat display
					updateSelectedWeapons();
				}
				else if(unitMoved){
					thisUnit.displayUnit.animateUpdateDisplay(thisUnit.getHexLocation(), thisUnit.getHeading());
				}
			}
			else if(data.turnUnit != null) {
				
				var prevTurnUnit = turnUnit;
				
				if(isPlayerUnit(prevTurnUnit)) {
					// clear selection and toHit of weapons before next turn unit begins
					clearSelectedWeapons();
					resetWeaponsToHit();
					updateWeaponsDisplay();
					
					// update selected weapons display that also updates the heat display
					updateSelectedWeapons();
				}
				
				turnUnit = units[data.turnUnit];
				
				if(isPlayerUnitTurn()) {
					if(data.weaponData != null) {
						$.each(data.weaponData, function(k, wData) {
							var id = wData.weaponId;
							var cooldown = wData.weaponCooldown;
							
							var weapon = getPlayerWeaponById(id);
							if(weapon != null) {
								weapon.cooldown = cooldown;
							}
						});
					}
					
					if(data.heat) turnUnit.heat = data.heat;
					if(data.heatDiss) turnUnit.heatDiss = data.heatDiss;
				}
				
				var prevTurnTarget = getUnitTarget(prevTurnUnit);
				var newTurnTarget = getUnitTarget(turnUnit);
				
				if(prevTurnUnit != null && prevTurnUnit.id != turnUnit.id) {
					if(isPlayerUnit(prevTurnUnit)) {
						if(!isPlayerUnitTurn()) {
							setPlayerTarget(null);
						}
						
						if(prevTurnTarget != null) {
							prevTurnTarget.getUnitDisplay().setUnitIndicatorVisible(true);
						}
					}
					
					var prevUnitDisplay = prevTurnUnit.getUnitDisplay();
					var turnUnitDisplay = turnUnit.getUnitDisplay();
					
					prevUnitDisplay.updateUnitIndicator();
					turnUnitDisplay.updateUnitIndicator();
					
					if(isPlayerUnitTurn()) {
						// update player unit displays to prepare for its new turn
						updateHeatDisplay(turnUnit);
						showPlayerUnitDisplay(turnUnit);
						showPlayerUnitControls(turnUnit);
						updateWeaponsDisplay();
						
						// update selected weapons display that also updates the heat display
						updateSelectedWeapons();
						
						if(newTurnTarget != null) {
							newTurnTarget.getUnitDisplay().setUnitIndicatorVisible(false);
						}
						setPlayerTarget(newTurnTarget);
						
						// re-acquire the target
						target(newTurnTarget);
					}
					else {
						showOtherUnitDisplay(turnUnit);
						showPlayerUnitControls(null);
					}
				}
				
				updatePlayerUnitListDisplay();
				
				update = true;
			}
		});
	});
}