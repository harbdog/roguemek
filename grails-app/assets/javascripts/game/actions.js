/**
 * Handles all JSON actions for the game
 */

function move() {
	// make sure the player can't make another request until this one is complete
	playerActionReady = false;
	
	$.getJSON("game/action", {
		perform: "move",
		forward: true,
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
		  thisUnit.hexX = data.x;
		  thisUnit.hexY = data.y;
		  thisUnit.heading = data.heading;
		  
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
		  
		  var thisUnit = units[data.unit];
		  thisUnit.hexX = data.x;
		  thisUnit.hexY = data.y;
		  thisUnit.heading = data.heading;
		  
		  thisUnit.updateXYRot();
	  })
	  .always(function() {
		  playerActionReady = true;
	  });
}