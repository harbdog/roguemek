/**
 * Handles all JSON actions for the game
 */

function move() {
	
	$.getJSON("game/action", {
		perform: "move",
		gameId: "1",
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
	  });
}

function rotate(rotation) {
	
	$.getJSON("game/action", {
		perform: "rotate",
		gameId: "1",
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
	  });
}