/**
 * actions.js - Handles all JSON actions for the game
 */

function target() {
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
			$.each(playerUnit.weapons, function(key, w) {
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
		setHeatDisplay(thisUnit.heat, false, false);
		  
		playerUnit.displayUnit.animateUpdateDisplay(thisUnit.getHexLocation(), thisUnit.getHeading());
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
		setHeatDisplay(thisUnit.heat, false, false);
		  
		playerUnit.displayUnit.animateUpdateDisplay(thisUnit.getHexLocation(), thisUnit.getHeading());
		//playerUnit.displayUnit.setControlsVisible(true);
	});
}

function skip() {
	playerUnit.displayUnit.setControlsVisible(false);
	turnUnit.displayUnit.setOtherTurnVisible(false);
	handleActionJSON({
		perform: "skip"
	}, function( data ) {
		console.log("skipped turn");
	});
}

function fire_weapons(weapons) {
	var target_id = playerTarget.id;
	var weapon_ids = []
	$.each(weapons, function(key, w) {
		weapon_ids.push(w.id);
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
				}
			}
		}
		
		u.heat = data.heat;
		
		// update heat display
		setHeatDisplay(u.heat, false, false);

		// update UI displays of target armor if showing
		updateTargetDisplay();
		
		// Toggle off all selected weapons
		deselectWeapons();
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
						
						if(hit) {
							$.each(hitLocations, function(loc, locDamage) {
								if(locDamage == null) return;
								
								console.log("    "+getLocationText(loc)+": "+locDamage)
							});
						}
						
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
						}
					}
				}
				
				if(playerUnit.id == tgtUnit.id 
						&& (data.armorHit || data.internalsHit)) {
					// update player armor/internals after being hit
					setArmorDisplay(playerUnit.armor, playerUnit.internals);
				}
				else if(playerTarget.id == tgtUnit.id 
						&& (data.armorHit || data.internalsHit)) {
					// update target armor/internals after being hit
					updateTargetDisplay();
				}
				
				if(playerUnit.id == thisUnit.id) {
					setActionPoints(thisUnit.apRemaining);
					setJumpPoints(thisUnit.jpRemaining);
					setHeatDisplay(thisUnit.heat, false, false);
					updateWeaponsCooldown();
				}
				else if(unitMoved){
					thisUnit.displayUnit.animateUpdateDisplay(thisUnit.getHexLocation(), thisUnit.getHeading());
				}
			}
			else if(data.turnUnit != null) {
				// used to determine if the player turn just ended
				var playerTurnEnded = (playerUnit.id == turnUnit.id);
				
				turnUnit = units[data.turnUnit];
				
				if(data.apRemaining != null){
					turnUnit.apRemaining = data.apRemaining;
				}
				if(data.jpRemaining != null){
					turnUnit.jpRemaining = data.jpRemaining;
				}
				
				if(playerUnit.id == turnUnit.id){
					if(data.weaponData != null) {
						$.each(data.weaponData, function(k, wData) {
							var id = wData.weaponId;
							var cooldown = wData.weaponCooldown;
							
							var weapon = getPlayerWeaponById(id);
							if(weapon != null) {
								weapon.cooldown = cooldown;
								console.log("Weapon "+weapon+" cooldown now at "+cooldown);
							}
						});
					}
					
					turnUnit.heat = data.heat;
					turnUnit.heatDiss = data.heatDiss;
					
					// update UI for the new player turn
					// TODO: move these out to a method that can also be used at init
					setActionPoints(turnUnit.apRemaining);
					setJumpPoints(turnUnit.jpRemaining);
					setHeatDisplay(turnUnit.heat, false, turnUnit.heatDiss);
					playerUnit.displayUnit.setControlsVisible(true);
					
					// update the weapons cooldown for the player weapons
					updateWeaponsCooldown();
					
					// re-acquire the target
					target();
				
					$('.action_end').removeClass("hidden");
					$('.action_wait').addClass("hidden");
				}
				else{
					// indicate non-player unit turn starting
					turnUnit.displayUnit.setOtherTurnVisible(true);
					
					$('.action_fire').addClass("hidden");
					$('.action_end').addClass("hidden");
					$('.action_wait').removeClass("hidden");
				}
				
				if(playerTurnEnded) {
					// clear toHit of weapons
					resetWeaponsToHit();
					updateWeaponsDisplay();
				}
			}
		});
	});
}