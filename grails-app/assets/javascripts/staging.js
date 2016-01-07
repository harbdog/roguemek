//= require jquery
//= require jquery-ui.min.js
//= require jquery.form.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initStaging(); 
});

var dialogLoading;
var mapSelectDialog;

/**
 * Prepares staging page on load
 */
function initStaging() {
	
	// Initialize map selection dialog
	mapSelectDialog = $("#mapSelectDiv").dialog({
		title: "Select Map",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "blind",
			duration: 350
		},
		hide: {
			effect: "blind",
			duration: 250
		},
		buttons: {
			"Select": ajaxUpdateMapSelection,
			Cancel: function() {
				mapSelectDialog.dialog("close");
			}
		}
    });
	
	// Initialize unit selection dialog
	unitSelectDialog = $("#unitSelectDiv").dialog({
		title: "Select Unit",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "blind",
			duration: 350
		},
		hide: {
			effect: "blind",
			duration: 250
		},
		buttons: {
			"Select": ajaxAddUnit,
			Cancel: function() {
				unitSelectDialog.dialog("close");
			}
		}
    });
    
    // Initialize loading dialog
    dialogLoading = $("#loadingDiv").dialog({
    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
    	title: "Loading...",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		}
    });
    
    // add buttons and their actions
    $("#map-button").button({
    	icons: {
    		primary: "ui-icon-carat-1-e",
    		secondary: "ui-icon-carat-1-w"
    	}
    }).click(loadMapSelect);
    
    
    // setup editable player teams
    if(playersEditable) {
    	// setup draggable/droppable elements
	    var teams = $(".team");
	    var players = $(".player");
	    
	    players.draggable({
	    	revert: "invalid",
	    	containment: "document",
	    	helper: "clone",
	    	cursor: "move",
	    	scroll: true
	    });
	    
	    teams.droppable({
	    	accept: ".player",
	    	hoverClass: "ui-state-active",
	    	tolerance: "pointer",
	    	drop: function(event, ui) {
	    		transferPlayer(ui.draggable, $(this));
	    	}
	    });
    }
    
    // setup editable users/units
    if(unitsEditable) {
    	// setup user join button
    	$("button.user-join").button({
    		icons: {
    			secondary: "ui-icon-arrowreturnthick-1-n"
	    	}
    	}).click(addUser);
    	
    	// setup user add/delete buttons
	    $("button.user-delete").button({
	    	icons: {
    			primary: "ui-icon-closethick"
	    	},
	        text: false
	    }).click(deleteUser);
    	
    	// setup unit add/delete buttons
	    $("button.unit-add").button({
	    	icons: {
	    		primary: "ui-icon-plusthick"
	    	}
	    }).click(loadUnitSelect);
	    
	    $("button.unit-delete").button({
	    	icons: {
    			primary: "ui-icon-closethick"
	    	},
	        text: false
	    }).click(deleteUnit);
    }
    else {
    	// hide the user add/delete buttons
    	$("button.user-delete").hide();
    	$("button.user-add").hide();
    	
    	// hide the unit add/delete buttons
    	$("button.unit-delete").hide();
    	$("button.unit-add").hide();
    }
}

function addUser() {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	$.getJSON("addUser", null)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// TODO: update the elements on the page without forcing reload
				location.reload();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function deleteUser() {
	// ask user to confirm deletion
	var $this = $(this);
	var userId = $this.prop("id");
	
	$("<div style='font-size:0.8em;'>Are you sure you want to remove this player from battle?</div>").dialog({	// TODO: i18n for deletion message
		title: "Remove Player",
		resizable: false,
		modal: true,
		buttons: {
			"Remove": function() {
				$(this).dialog("close");
				ajaxDeleteUser(userId, $this);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		position: {my: "left top", at: "left bottom", of: $this}
	});
}

function ajaxDeleteUser(userId, $this) {
	dialogLoading.dialog("option", "position", {my: "left top", at: "left bottom", of: $this});
	dialogLoading.dialog("open");

	var inputMap = {userId: userId};
	
	$.getJSON("removeUser", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				$this.closest("div.player").fadeOut();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function deleteUnit() {
	// ask user to confirm deletion
	var $this = $(this);
	var unitId = $this.prop("id");
	
	$("<div style='font-size:0.8em;'>Are you sure you want to remove this unit from battle?</div>").dialog({	// TODO: i18n for deletion message
		title: "Remove Unit",
		resizable: false,
		modal: true,
		buttons: {
			"Remove": function() {
				$(this).dialog("close");
				ajaxDeleteUnit(unitId, $this);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		position: {my: "left top", at: "left bottom", of: $this}
	});
}

function ajaxDeleteUnit(unitId, $this) {
	dialogLoading.dialog("option", "position", {my: "left top", at: "left bottom", of: $this});
	dialogLoading.dialog("open");

	var inputMap = {unitId: unitId};
	
	$.getJSON("removeUnit", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				$this.closest("div.player-unit").fadeOut();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function loadUnitSelect() {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		unitSelectDialog.load("unitSelect", function() {
			dialogLoading.dialog("close");
			showUnitSelect();
	    });
	},250);
}

function showUnitSelect() {
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	unitSelectDialog.dialog("option", "position", {my: "center", at: "center", of: window});
	unitSelectDialog.dialog("option", "width", windowWidth/2);
	unitSelectDialog.dialog("option", "height", windowHeight);
	unitSelectDialog.dialog("open");
}

function ajaxAddUnit() {
	// add selected unit to the battle
	var selectedUnitId = $("input[type='radio'][name='unit-radio']:checked").val();
	var selectedUnitName = $($("input[type='radio'][name='unit-radio']:checked").prop("labels")).text();
	var inputMap = {unitId: selectedUnitId};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	
	unitSelectDialog.dialog("close");
	dialogLoading.dialog("open");
	
	$.getJSON("addUnit", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// TODO: update the elements on the page without forcing reload
				location.reload();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function transferPlayer($playerDiv, $teamDiv) {
	$playerDiv.fadeOut(function() {
		$playerDiv.appendTo($teamDiv).fadeIn();
	})
	
	// TODO: implement teams in the game and update the database data from the drop
}

function loadMapSelect() {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		mapSelectDialog.load("mapSelect", function() {
			dialogLoading.dialog("close");
			showMapSelect();
	    });
	},250);
}

function showMapSelect() {
	
	if(selectedMapId == null) {
		// TODO: select RANDOM
	}
	else {
		$("input[type='radio'][name='map-radio'][value='"+selectedMapId+"']").prop("checked", true);
	}
	
	mapSelectDialog.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	mapSelectDialog.dialog("open");
}

function ajaxUpdateMapSelection() {
	selectedMapId = $("input[type='radio'][name='map-radio']:checked").val();
	
	var selectedMapName = $($("input[type='radio'][name='map-radio']:checked").prop("labels")).text();
	var inputMap = {mapId: selectedMapId};
	
	dialogLoading.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	
	mapSelectDialog.dialog("close");
	dialogLoading.dialog("open");
	
	$.getJSON("mapUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				$("#map-button").button("option", "label", selectedMapName);
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}