/**
 * user_functions.js - Methods that handle user updates in staging
 */
 
"use strict";

var camoSelectDialog;
var camoSelectUserID;

/**
 * Initializes user related UI components
 */
function initUserUI() {
    
    // Initialize camo selection dialog
	camoSelectDialog = $("#camoSelectDiv").dialog({
		title: "Select Camo",
    	autoOpen: false,
    	modal: true,
    	// not using show/hide effects since it causes the css spinning preview to start over when finished, making it look jittery
		close: function() {
			var origColor = $("button#color-revert").val();
			var inputColor = $("#color-input").val();
			if(origColor != inputColor) {
				// apply selected camo to all player units on server
				ajaxApplyUnitCamoSelection(camoSelectUserID);
			}
			
			camoSelectUserID = null;
		},
		buttons: {
			"OK": function() {
				camoSelectDialog.dialog("close");
			}
		}
    });
    
    // Initialize action specific confirmation dialog
    $("#user-leave-dialog").dialog({
    	autoOpen: false,
    	modal: true,
    	show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		},
    	buttons: {
    		Ok: function() {
    			// forward to the leaving link
    			$(this).dialog("close");
    			redirectToDropship();
    		},
	    	Cancel: function() {
	    		$(this).dialog("close");
			}
    	},
		position: {my: "center", at: "center", of: window}
    });
    
    // setup a confirmation dialog for leaving
    $("#leave-link").click(function() {
    	$("#user-leave-dialog").dialog("open");
    });
    
    // setup a confirmation dialog for starting battle
    $("#start-link").click(function() {
		// make sure all "ready" boxes are checked first
		var allReady = true;
		$("input.player-ready").each(function() {
    		if(!$(this).is(':checked')) {
				allReady = false;
			}
		});
		
		if(allReady) {
			$("<div style='font-size:0.8em;'>Launch into combat?</div>").dialog({	// TODO: i18n for deletion message
				title: "Launch Battle",
				autoOpen: true,
				resizable: false,
				modal: true,
				buttons: {
					"Launch": function() {
						$(this).dialog("close");
						var launchUrl = $("#start-link").attr("data-start-link");
						if(launchUrl != null) {
							window.location.replace(launchUrl);
						}
					},
					Cancel: function() {
						$(this).dialog("close");
					}
				},
				position: {my: "center", at: "center", of: window}
			});
		}
		else {
			// let them know everyone is not ready
			$("<div style='font-size:0.8em;'>Each combatant must be ready before launching the battle</div>").dialog({	// TODO: i18n for message
				title: "Not Ready",
				autoOpen: true,
				resizable: false,
				modal: true,
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				},
				position: {my: "center", at: "center", of: window}
			});
		}
    });
}

/**
 * Sets up or updates user UI that may need to change after certain actions
 */
function setupDynamicUserUI() {
    // setup editable player teams
    if(playersEditable) {
    	// setup draggable/droppable elements
	    var teams = $(".team");
	    var players = $(".player");
	    
	    players.each(function() {
	    	if($(this).draggable("instance") != null) return
	    	
	    	$(this).draggable({
		    	revert: "invalid",
		    	containment: "document",
		    	helper: "clone",
		    	cursor: "move",
		    	scroll: true,
		    	cancel: ".ui-widget"
		    });
	    });
	    
	    teams.each(function(){
	    	if($(this).droppable("instance") != null) return
	    	
	    	$(this).droppable({
		    	accept: ".player",
		    	hoverClass: "ui-state-active",
		    	tolerance: "pointer",
		    	drop: function(event, ui) {
		    		transferPlayer(ui.draggable, $(this));
		    	}
		    });
	    });
    }
    
    // setup editable users/units
    if(unitsEditable) {
    	// setup ready button
    	$("input.player-ready").each(function() {
    		if($(this).button("instance") != null) return
    		
    		var checkedIcon = "ui-icon-check";
    		var uncheckedIcon = "ui-icon-clock";
    		
			$(this).button({
        		icons: {
        			primary: ($(this).is(':checked')) ? checkedIcon : uncheckedIcon
        		},
        		text: false
        	})
        	.change(function() {
        		var isReady = $(this).is(':checked');
        		$(this).button("option", {
        			icons: {
            			primary: (isReady) ? checkedIcon : uncheckedIcon
            		}
        		});
    		})
        	.click(function() {
        		var isReady = $(this).is(':checked');
        		var inputMap = {ready: isReady};
        		
        		$.getJSON("readyUser", inputMap)
        			.fail(function(jqxhr, textStatus, error) {
        				var err = textStatus + ", " + error;
        				console.log( "Request Failed: " + err );
        			})
        			.done(function() {
        				// nothing to do here since it will be updated via atmosphere
        			});
        	});
    	});
    	
    	// setup camo button
    	$("button.player-camo").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			primary: "ui-icon-pencil"
        		},
        		text: false
        	}).click(loadCamoSelect);
    	});
    	
    	$("span.player-camo").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			primary: "ui-icon-blank"
        		},
        		text: false
        	});
    	});
    	
    	// setup starting location menu
    	$("select.location").each(function() {
    		if($(this).iconselectmenu("instance") != null) return
    		
    		$(this).iconselectmenu({change: updateLocation})
				.iconselectmenu("menuWidget")
				.addClass("ui-menu-icons");
    	});
    	
    	// setup user join button - the join button does not currently exist
    	// but may be added back when teams are enabled
    	/*$("button.user-join").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			secondary: "ui-icon-arrowreturnthick-1-n"
    	    	}
        	}).click(addUser);
    	});*/
    	
    	// setup user delete button
    	$("button.user-delete").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
    	    	icons: {
    				primary: "ui-icon-closethick"
    	    	},
    	        text: false
    	    }).click(deleteUser);
    	});
    }
    else {
    	// hide the user add/delete buttons
    	$("button.user-delete").hide();
    	$("button.user-add").hide();
    }
}

/**
 * Used with the click and drag to move players to another team
 */
function transferPlayer($playerDiv, $teamDiv) {
	$playerDiv.fadeOut(function() {
		$playerDiv.appendTo($teamDiv).fadeIn();
	})
	
	// TODO: implement teams in the game and update the database data from the drop
}

/**
 * Loops through each player location label and sets the appropriate directional label for it
 */
function updateLocationIcons() {
	// first map out each location value to its icon class using the location selection shown for this player
	var locationOptions = $("select.location[data-userid='"+currentUserId+"']  option");
	
	var locationClassMap = {};
	$.each(locationOptions, function() {
		var location = $(this).text();
		var locationClass = $(this).attr("data-class");
		
		locationClassMap[location] = locationClass;
	});
	
	// find each player location element and set the appropriate icon class
	var locationLabels = $("div.player-info span.location, div.player-info select.location + span.ui-selectmenu-button");
	$.each(locationLabels, function() {
		var locationText = $(this).find("span.location-label, span.ui-selectmenu-text").text();
		
		var locationIconClass = locationClassMap[locationText];
		var locationIconSpan = $(this).find("span.ui-icon");
		
		locationIconSpan.removeClass();
		locationIconSpan.addClass("ui-icon "+locationIconClass);
	});
}

/**
 * Sends update for player starting location to server
 */
function updateLocation(event, data) {
	var $this = $(this);
	var userId = $this.attr("data-userid");
	
	var locationValue = data.item.value;
	
	var inputMap = {
		userId: userId,
		location: locationValue
	};
	
	$.getJSON("locationUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				//console.log("updated location: "+locationValue)
			}
		});
}

/**
 * Stages the given user by fetching their info from the server and updating the page with ajax
 */
function ajaxStageUser(userId) {
	var inputMap = {
		userId: userId
	};
	
	var $tempDiv = $("<div>", {class: "player"});
	
	var playerDiv = $("div.player[data-userid='"+userId+"']");
	
	var $this = null;
	if(playerDiv != null) {
		$this = $("div.player[data-userid='"+userId+"']").parents('div').eq(0);
	}
	
	var tempTeamHeader = null;
	if($this == null || $this.length == 0) {
		// create a new temporary team div for the player until teams are introduced to the game
		$this = $("<div>", {class: "team"});
		$("div#teams").append($this);
		
		// TODO: when teams implemented, have a team template generate this stuff instead
		/*<div class="team-header">
			<h2>Team ${thisUser}</h2>
			<span class="team-unit-count">${totalUnits} Units</span>
			<span class="team-tonnage-count right">${totalTonnage} Tons</span>
		</div>*/
		
		var divTeamHeader = $("<div>", {class: "team-header"});
		
		tempTeamHeader = $("<h2>");
		tempTeamHeader.text("Team Temp");
		divTeamHeader.append(tempTeamHeader);
		
		var spanTeamUnitCount = $("<span>", {class: "team-unit-count"});
		spanTeamUnitCount.text("0 Units");
		divTeamHeader.append(spanTeamUnitCount);
		
		var spanTeamTonnageCount = $("<span>", {class: "team-tonnage-count right"});
		spanTeamTonnageCount.text("0 Tons");
		divTeamHeader.append(spanTeamTonnageCount);
		
		$this.prepend(divTeamHeader);
	}
	
	$tempDiv.load("stageUser", inputMap, function() {
		
		if(playerDiv != null) {
			playerDiv.remove();
		}
		
		// move the unit content to the player area
		$tempDiv.children().appendTo($this);
		$tempDiv.remove();
		
		// rename team header (for now, just the name of the player since teams aren't implemented yet)
		if(tempTeamHeader != null) {
			var playerName = $("div.player[data-userid='"+userId+"'] span.player-name").text();
			tempTeamHeader.text("Team "+playerName);
		}
		
		// TODO: implement actual Teams
		setupDynamicUI();
		
		var effectOptions = {color: "#3399FF"};
		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
    });
}

/**
 * Sends request to the server to add the session user to the staging for the game
 */
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
				// the polling will update the users and teams
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

/**
 * Prompts the user if they want to remove the user from the game before doing so
 */
function deleteUser() {
	// ask user to confirm deletion
	var $this = $(this);
	var userId = $this.attr("data-userid");
	
	$("#user-remove-dialog").dialog({
		resizable: false,
		modal: true,
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		},
		buttons: {
			Ok: function() {
				$(this).dialog("close");
				ajaxDeleteUser(userId, $this);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		position: {my: "center", at: "center", of: window}
	});
}

/**
 * Sends request to the server to remove the user from the staging for the game
 */
function ajaxDeleteUser(userId, $this) {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
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

/**
 * Requests for the camo selection screen from the server
 */
function loadCamoSelect() {
	
	var $this = $(this);
	var userId = $this.attr("data-userid");
	
	var inputMap = {
		userId: userId
	};
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		camoSelectDialog.load("camoSelect", inputMap, function() {
			dialogLoading.dialog("close");
			showCamoSelect();
	    });
	},250);
}

/**
 * Prepares the camo selection screen for being shown
 */
function showCamoSelect() {
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	camoSelectUserID = $(".camo-selection").attr("data-userid");
	
	camoSelectDialog.dialog("option", "position", {my: "center", at: "center", of: window});
	camoSelectDialog.dialog("option", "width", windowWidth/2);
	camoSelectDialog.dialog("option", "height", windowHeight/2);
	
	$("#color-input").spectrum({
		preferredFormat: "rgb",
		showInitial: true,
		clickoutFiresChange: false,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor($("#color-input").val()));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed
				ajaxUpdateCamoColorSelection(camoSelectUserID, tinycolor($("#color-input").val()));
			} else {
				// cancelled
			}
		}
	});
	
	$("button#color-revert").click(function() {
		var origColor = $("button#color-revert").val();
		var inputColor = $("#color-input").val();
		if(origColor != inputColor) {
			$("#color-input").spectrum("set", origColor);
			ajaxUpdateCamoColorSelection(camoSelectUserID, tinycolor(origColor));
		}
	});
	
	camoSelectDialog.dialog("open");
}

/**
 * Updates the camo color section from server with unit preview
 */
function ajaxUpdateCamoColorSelection(userId, rgbTinyColor) {
	var inputMap = {
			userId: userId, 
			rgbCamo: rgbTinyColor.toRgb()
	};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	$.getJSON("camoUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				if(data.image != null) {
					// update the preview unit image
					var base64 = _arrayBufferToBase64(data.image);
					
					$("img.camo-unit-preview").attr("src", "data:image/gif;base64," + base64);
				}
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

/**
 * Requests the server to update to the new camo selection for the user
 */
function ajaxApplyUnitCamoSelection(userId) {
	var inputMap = {
		userId: userId, 
	};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	$.getJSON("camoApply", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// the polling will update the user and units
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}
