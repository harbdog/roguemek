/**
 * actions.js - Handles all JSON actions for the game
 */

function target() {
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
				
				var weapon = getWeaponById(id);
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
					weapon.cooldown = cooldown;
					
					// TODO: show floating miss/hit numbers
					
					if(hit) {
						console.log("Weapon "+weapon+" hit the target in the following locations, cooldown for "+cooldown+" turns");
						
						$.each(hitLocations, function(loc, locDamage) {
							if(locDamage == null) return;
							
							console.log("    "+getLocationText(loc)+": "+locDamage)
						});
					}
					else{
						console.log("Weapon "+weapon+" missed the target!");
					}
					
					// TODO: reuse getPositionFromLocationAngle
					
					// testing creating a laser beam
					/*var laser = new createjs.Shape();
					laser.alpha = 0;
					laser.x = 0;
					laser.y = 0;
					laser.graphics.setStrokeStyle(3).beginStroke("#FF0000").moveTo(u.displayUnit.x, u.displayUnit.y).lineTo(t.displayUnit.x, t.displayUnit.y).endStroke();
					stage.addChild(laser);
					
					createjs.Tween.get(laser).to({alpha:1}, 250).to({alpha:0}, 250).call(removeThisFromStage, null, laser);*/
					
					
					// testing creating a stream of projectiles
					/*for(var i=0; i<3; i++) {
						var waitTime = i * 100;
						
						var angle = getAngleToTarget(u.displayUnit.x, u.displayUnit.y, t.displayUnit.x, t.displayUnit.y);
						var point = getMovementDestination(0, 0, 20, angle);
						var projectile = new createjs.Shape();
						projectile.visible = false;
						projectile.x = u.displayUnit.x;
						projectile.y = u.displayUnit.y;
						projectile.graphics.setStrokeStyle(3).beginStroke("#FFD700").moveTo(0, 0).lineTo(point.x, point.y).endStroke();
						stage.addChild(projectile);
						
						createjs.Tween.get(projectile).wait(waitTime).to({visible:true}).to({x:t.displayUnit.x, y:t.displayUnit.y}, 500).call(removeThisFromStage, null, projectile);
					}*/
					
					
					// testing creating a volley of missiles (straight flight path)
					/*var isCluster = true;
					for(var i=0; i<6; i++) {
						var weaponX = u.displayUnit.x;
						var weaponY = u.displayUnit.y;
						var targetX = t.displayUnit.x;
						var targetY = t.displayUnit.y;
						if(isCluster){
							// give cluster projectiles a tiny variation in the source and target pixel position for effect
							var randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
							var randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
	
							var randomOffsetX = getDieRollTotal(1, 4) * randomPosNegX;
							var randomOffsetY = getDieRollTotal(1, 4) * randomPosNegY;
							
							weaponX += randomOffsetX;
							weaponY += randomOffsetY;
						
							// now for the target variation
							randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
							randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
	
							randomOffsetX = getDieRollTotal(1, 16) * randomPosNegX;
							randomOffsetY = getDieRollTotal(1, 16) * randomPosNegY;
							
							targetX += randomOffsetX;
							targetY += randomOffsetY;
						}
						
						var missile = new createjs.Shape();
						missile.x = weaponX;
						missile.y = weaponY;
						missile.graphics.beginStroke("#FFFFFF").beginFill("#FFFFFF").drawCircle(0, 0, 1.5).endStroke();
						stage.addChild(missile);
						
						createjs.Tween.get(missile).to({x:targetX, y:targetY}, 500).call(removeThisFromStage, null, missile);
					}*/
					
					
					// testing creating a volley of missiles (curved flight path)
					//createjs.MotionGuidePlugin.install();// Don't use this plugin, just use same curve logic used in the legacy game
					/*var isCluster = true;
					for(var i=0; i<20; i++) {
						var delayTime = i * 25;
						
						var weaponX = u.displayUnit.x;
						var weaponY = u.displayUnit.y;
						var targetX = t.displayUnit.x;
						var targetY = t.displayUnit.y;
						if(isCluster){
							// give cluster projectiles a tiny variation in the source and target pixel position for effect
							var randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
							var randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
	
							var randomOffsetX = getDieRollTotal(1, 4) * randomPosNegX;
							var randomOffsetY = getDieRollTotal(1, 4) * randomPosNegY;
							
							weaponX += randomOffsetX;
							weaponY += randomOffsetY;
						
							// now for the target variation
							randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
							randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
	
							randomOffsetX = getDieRollTotal(1, 16) * randomPosNegX;
							randomOffsetY = getDieRollTotal(1, 16) * randomPosNegY;
							
							targetX += randomOffsetX;
							targetY += randomOffsetY;
						}
						
						var missile = new createjs.Shape();
						missile.visible = false;
						missile.x = weaponX;
						missile.y = weaponY;
						missile.graphics.beginStroke("#FFFFFF").beginFill("#FFFFFF").drawCircle(0, 0, 1).endStroke();
						stage.addChild(missile);
						createjs.Tween.get(missile).wait(delayTime).to({visible:true}).to({guide:{ path:[weaponX,weaponY, 200, 200, 200, 200, 0,targetY,targetX,targetY]}}, 1000).call(removeThisFromStage, null, missile);
					}*/
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
			setHeatDisplay(u.heat, false, false);
	
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
				if(data.apRemaining != null) {
					thisUnit.apRemaining = data.apRemaining;
				}
				  
				thisUnit.updateDisplay();
				
				if(playerUnit.id == thisUnit.id) {
					setActionPoints(thisUnit.apRemaining);
					setJumpPoints(thisUnit.jpRemaining);
					setHeatDisplay(thisUnit.heat, false, false);
				}
			}
			else if(data.turnUnit != null) {
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
							
							var weapon = getWeaponById(id);
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