/**
 * Handles all JSON actions for the game
 */

function move(forward) {
	// make sure the player can't make another request until this one is complete
	playerActionReady = false;
	
	$.getJSON("game/action", {
		perform: "move",
		forward: forward,
		jumping: false
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
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
		  
		  thisUnit.updateXYRot();
	  })
	  .always(function() {
		  playerActionReady = true;
	  });
}

function rotate(rotation) {
	// make sure the player can't make another request until this one is complete
	playerActionReady = false;
	
	$.getJSON("game/action", {
		perform: "rotate",
		rotation: rotation,
		jumping: false
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		  console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
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
		  
		  thisUnit.updateXYRot();
	  })
	  .always(function() {
		  playerActionReady = true;
	  });
}

function skip() {
	// make sure the player can't make another request until this one is complete
	playerActionReady = false;
	
	$.getJSON("game/action", {
		perform: "skip"
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		  console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
		  console.log("skipped turn");
	  })
	  .always(function() {
		  playerActionReady = true;
	  });
}

function pollUpdate(updates) {
	if(updates == null) return;
	
	$.each(updates, function(i, thisUpdate) {
		console.log("["+thisUpdate.time+"] "+thisUpdate.message);
		
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
				  
				thisUnit.updateXYRot();
				
				if(playerUnit.id == thisUnit.id) {
					apDisplay.text = "AP: "+thisUnit.actionPoints;
				}
			}
			else if(data.turnUnit != null) {
				var turnUnit = units[data.turnUnit];
				
				if(data.actionPoints != null){
					turnUnit.actionPoints = data.actionPoints;
				}
				
				// TODO: indicate non-player unit turn starting
				
				if(playerUnit.id == turnUnit.id){
					apDisplay.text = "AP: "+turnUnit.actionPoints;
				}
			}
		});
	});
}