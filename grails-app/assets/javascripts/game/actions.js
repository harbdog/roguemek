/**
 * actions.js - Handles all JSON actions for the game
 */

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
		
		if(data.weaponData){
			var u = units[data.unit];
			var t = units[data.target];
			
			// update the cooldown status of the weapons fired
			$.each(data.weaponData, function(key, wData) {
				var id = wData.weaponId;
				var hit = wData.weaponHit;
				var hitLocations = wData.weaponHitLocations;
				var cooldown = wData.weaponCooldown;
				
				var weapon = getWeaponById(id);
				if(weapon != null){
					if(hit) {
						console.log("Weapon "+weapon+" hit the target in the following locations, cooldown for "+cooldown+" turns");
						weapon.cooldown = cooldown;
						
						$.each(hitLocations, function(loc, locDamage) {
							if(locDamage == null) return;
							
							console.log("    "+getLocationText(loc)+": "+locDamage)
						});
					}
					else{
						console.log("Weapon "+weapon+" missed the target!");
					}
				}
				else{
					console.log("Weapon null? Weapon ID:"+id);
				}
			});
			
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
			setHeatDisplay(u.heat);
	
			// update UI displays of target armor if showing
			updateTargetDisplay();
			
			// update the weapons cooldown for the player weapons
			updateWeaponsCooldown();
		}
		
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
		addMessageUpdate("["+t.toLocaleTimeString()+"] "+thisUpdate.message);
		
		$.each(thisUpdate, function(j, data) {
			if(data.unit != null){
				var thisUnit = units[data.unit];
				if(data.x != null && data.y != null) {
					thisUnit.setHexLocation(data.x, data.y);
				}
				if(data.heading != null) {
					thisUnit.heading = data.heading;
				}
				if(data.actionPoints != null) {
					thisUnit.actionPoints = data.actionPoints;
				}
				  
				thisUnit.updateDisplay();
				
				if(playerUnit.id == thisUnit.id) {
					setActionPoints(thisUnit.actionPoints);
					setJumpPoints(thisUnit.jumpPoints);
					setHeatDisplay(thisUnit.heat);
				}
			}
			else if(data.turnUnit != null) {
				turnUnit = units[data.turnUnit];
				
				if(data.actionPoints != null){
					turnUnit.actionPoints = data.actionPoints;
				}
				if(data.jumpPoints != null){
					turnUnit.jumpPoints = data.jumpPoints;
				}
				
				if(playerUnit.id == turnUnit.id){
					if(data.weaponData != null) {
						$.each(data.weaponData, function(k, wData) {
							var id = wData.weaponId;
							var cooldown = wData.weaponCooldown;
							
							var weapon = getWeaponById(id);
							if(weapon != null) {
								weapon.cooldown = cooldown;
								console.log("Weapon "+weapon+" cooldown now at "+cooldown);
							}
						});
					}
					
					turnUnit.heat = data.heat;
					
					// update UI for the new player turn
					// TODO: move these out to a method that can also be used at init
					setActionPoints(turnUnit.actionPoints);
					setJumpPoints(turnUnit.jumpPoints);
					setHeatDisplay(turnUnit.heat);
					playerUnit.displayUnit.setControlsVisible(true);
					
					// update the weapons cooldown for the player weapons
					updateWeaponsCooldown();
				
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
			}
		});
	});
}