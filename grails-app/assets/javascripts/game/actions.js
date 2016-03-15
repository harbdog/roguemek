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
		.done(function(data) {
			var keyCount = Object.keys(data).length;
			
			if(keyCount == 0 || 
					(keyCount == 1 && data.success)) {
				// no data to update game with
			}
			else {
				updateGameData(data);
			}
		})
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

function jump(jumping) {
	if(isPlayerUnitTurn() && turnUnit.jumpJets > 0) {
		handleActionJSON({
			perform: "jump",
			jumping: jumping
		});
	}
}

function move(forward, jumping) {
	handleActionJSON({
		perform: "move",
		forward: forward,
		jumping: jumping
	});
}

function rotate(rotation, jumping) {
	handleActionJSON({
		perform: "rotate",
		rotation: rotation,
		jumping: jumping
	});
}

function skip() {
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