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
		console.log("move "+data.unit+":"+data.x+","+data.y+">"+data.heading);
		if(data.unit == null){
			return;
		}
		  
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
		console.log("rotate "+data.unit+":"+data.x+","+data.y+">"+data.heading);
		if(data.unit == null){
			return;
		}
		  
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
	
	console.log("Firing @ "+target_id+": ");
	console.log(weapons);
	
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
		
		if(data.weaponHit){
			var t = units[data.target];
			
			if(data.armorHit != null) {
				var numArmorHits = data.armorHit.length;
				for(var i=0; i<numArmorHits; i++) {
					var armorRemains = data.armorHit[i];
					if(armorRemains != null) {
						t.armor[i] = armorRemains;
					}
				}
			}
			
			if(data.internalsHit != null) {
				var numInternalsHits = data.internalsHit.length;
				for(var i=0; i<numInternalsHits; i++) {
					var internalsRemains = data.internalsHit[i];
					if(internalsRemains != null) {
						t.internals[i] = internalsRemains;
					}
				}
			}
	
			// update UI displays of target armor if showing
			updateTargetDisplay();
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
				
				if(playerUnit.id == turnUnit.id){
					// update UI for the new player turn
					// TODO: move these out to a method that can also be used at init
					setActionPoints(turnUnit.actionPoints);
					setJumpPoints(turnUnit.jumpPoints);
					setHeatDisplay(turnUnit.heat);
					playerUnit.displayUnit.setControlsVisible(true);
				
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