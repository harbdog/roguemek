/**
 * actions.js - Handles all JSON actions for the game
 */
"use strict";

function handleActionJSON(inputMap) {
	// make sure the player can't make another request until this one is complete
	if(playerActionReady) {
		playerActionReady = false;
	
		$.getJSON("game/action", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(updateGameData)
		.always(function() {
			playerActionReady = true;
		});
	}
	else {
		// TODO: indicate on UI they are waiting
		console.log("waiting...");
	}
}

function target(playerTarget) {
	if(playerTarget == null) return;
	
	var target_id = playerTarget.id;
	
	handleActionJSON({
		perform: "target",
		target_id: target_id
	});
}

function move(forward) {
	//playerUnit.displayUnit.setControlsVisible(false);
	
	handleActionJSON({
		perform: "move",
		forward: forward,
		jumping: false
	});
}

function rotate(rotation) {
	//playerUnit.displayUnit.setControlsVisible(false);
	
	handleActionJSON({
		perform: "rotate",
		rotation: rotation,
		jumping: false
	});
}

function skip() {
	//playerUnit.displayUnit.setControlsVisible(false);
	//turnUnit.displayUnit.setOtherTurnVisible(false);
	handleActionJSON({
		perform: "skip"
	});
	
	console.log("skipped turn");
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
	});
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
			updateGameData(data);
		});
	});
}