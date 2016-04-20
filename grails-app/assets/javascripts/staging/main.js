// This is the main javascript file for the RogueMek staging client 
//
//= require_self
//= require_tree .

var dialogLoading;
var mapSelectDialog;
var mapPreviewDialog;
var unitSelectDialog;
var camoSelectDialog;
var camoSelectUserID;

/**
 * Prepares staging page on load
 */
function initStaging() {
	window.onbeforeunload = function() {
		HPG.disconnectUplink();
	};
	
	// setup code to render custom icons on a dropdown menu
	$.widget( "custom.iconselectmenu", $.ui.selectmenu, {
	      _renderItem: function( ul, item ) {
	        var li = $( "<li>", { text: item.label } );
	 
	        if ( item.disabled ) {
	          li.addClass( "ui-state-disabled" );
	        }
	 
	        $( "<span>", {
	          style: item.element.attr( "data-style" ),
	          "class": "ui-icon " + item.element.attr( "data-class" )
	        })
	          .appendTo( li );
	 
	        return li.appendTo( ul );
	      }
	    });
	
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
	
	// Initialize map preview dialog
	mapPreviewDialog = $("#mapPreviewDiv").dialog({
		title: "Preview Map",
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
			Close: function() {
				mapPreviewDialog.dialog("close");
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
    
    // setup a confirmation dialog for leaving
    $("#leave-link").click(function() {
    	$("#user-leave-dialog").dialog("open");
    });
    
    // add buttons and their actions
    $("#map-button").button({
    	icons: {
    		primary: "ui-icon-carat-1-e",
    		secondary: "ui-icon-carat-1-w"
    	}
    }).click(loadMapSelect);
    
    $("#map-selected").button({
    	icons: {
    		secondary: "ui-icon-image"
    	}
    }).click(previewMapSelect);
    
    $("button.disabled").button();
    
    // setup any dynamic UI pieces present at init
    setupDynamicUI();
    
    // update icons for locations
    updateLocationIcons();
    
    // load list of chat users just before connecting to the Atmosphere server
    loadChatUsersList();
    
    // begin HPG communications
    initAtmosphere();
    
    // auto scroll to bottom of chat at load
    var $chat = $('#chat-window');
    $chat.scrollTop($chat[0].scrollHeight);
}

/**
 * Sets up any parts of the UI that may be added or removed with ajax
 */
function setupDynamicUI() {
	
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
    	
    	// setup unit add/delete buttons
	    $("button.unit-add").each(function() {
	    	if($(this).button("instance") != null) return
    		
    		$(this).button({
		    	icons: {
		    		primary: "ui-icon-plusthick"
		    	}
		    }).click(loadUnitSelect);
	    });
	    
	    $("button.unit-delete").each(function() {
	    	if($(this).button("instance") != null) return
    		
    		$(this).button({
		    	icons: {
	    			primary: "ui-icon-closethick"
		    	},
		        text: false
		    }).click(deleteUnit);
	    });
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

function deleteUnit() {
	// ask user to confirm deletion
	var $this = $(this);
	var unitId = $this.attr("data-unitid");
	
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
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
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
	var idealDialogWidth = 800;
	
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	var dialogWidth = 3*windowWidth/4;
	if(dialogWidth < idealDialogWidth) {
		// make sure the width of the dialog in the window isn't too small to show everything
		if(windowWidth < idealDialogWidth) {
			dialogWidth = windowWidth;
		}
		else {
			dialogWidth = idealDialogWidth;
		}
	}
	
	unitSelectDialog.dialog("option", "position", {my: "top", at: "top", of: window});
	unitSelectDialog.dialog("option", "width", dialogWidth);
	//unitSelectDialog.dialog("option", "height", windowHeight);	// do not bound the height so it won't have an inner scroll pane
	unitSelectDialog.dialog("open");
	
	setupAjaxUnitSelect();
}

//setup ajax filters, paging and sorting for the unit select
function setupAjaxUnitSelect() {
	// Disable the Select button until a selection is made
	// http://stackoverflow.com/a/3646440/854696
	var selectButton = $("div.ui-dialog-buttonpane button:contains('Select')").button("disable");
	
	// setup radio change events
	$('input:radio[name="unit-radio"]').change(function() {
		// show the select button since a selection has been made
		selectButton.button("enable");
		
		var unitId = $(this).val();
        
        var selection = $("#unit-selection-preview");

        $.ajax({
            type: 'GET',
            url: 'previewUnit',
            data: {unitId: unitId},
            success: function(data) {
            	// hide, load, then slide in the new unit preview
                $(selection).hide({
                	effect: 'slide',
                	duration: 250,
                	complete: function() {
                		$(this).html(data).effect({
                			effect: 'slide',
                			duration: 350,
                			complete: function() {
                				// swap out the static for the animated preview image class
                				// since it jitters if it starts out animated on load
                				$(".unit-preview-static")
                						.removeClass("unit-preview-static")
                						.addClass("unit-preview");
                			}
                		});
                	}
                })
            }
        });
	});
	
	// setup sorting and paginationg
	$("#unit-selection").find(".pagination a, th.sortable a").on({
		click: function(event) {
	        event.preventDefault();
	        var url = $(this).attr('href');
	        
	        var selection = $("#unit-selection");
	        $(selection).html($("#spinner").html());
	
	        $.ajax({
	            type: 'GET',
	            url: url,
	            success: function(data) {
	            	selectButton.button("disable");
	                $(selection).fadeOut('fast', function() {$(this).html(data).fadeIn({complete: setupAjaxUnitSelect});});
	            }
	        });
		}
    });
	
	// setup ajax filter functionality for the unit select
	$("div.unit-filters form").submit(function(event) {
		event.preventDefault();
		selectButton.button("disable");
		var filterBox = $(this).parents("div.unit-filters");
		filterAjaxUnitSelect(filterBox);
		return false;
	});
	
	var $inputFilter = $("div.unit-filters input#name");
	if($inputFilter && $inputFilter.length) {
		if (Modernizr.touchevents) {
			// touch supported, don't focus the input
		} else {
			// touch not-supported, focus the input
			setCaretToPos($inputFilter[0], $inputFilter.val().length);
		}
		
		if($inputFilter.val().length > 0) {
			// setup clear filter button only when a filter has been entered
			var $clearFilter = $("button.clear-unit-filter");
			$clearFilter.css({opacity: 0, "visibility": "visible"}).animate({opacity: 1.00}, 250);
			$clearFilter.button({
		    	icons: {
					primary: "ui-icon-closethick"
		    	},
		        text: false
		    }).click(function(event) {
		    	// by not using event.preventDefault, it seems to automatically submit after clearing the field
		    	$inputFilter.val("");
		    });
		}
		else {
			var $clearFilter = $("button.clear-unit-filter");
			$clearFilter.css({opacity: 0, "visibility": "visible"}).animate({opacity: 1.00}, 250);
			$clearFilter.button({
		    	icons: {
					primary: "ui-icon-close"
		    	},
		        text: false,
		        disabled: true
		    });
		}
	}
	
	// allow clicking on a row to select the radio button for that entry
	$("#unit-selection").find("tr").on({
		click: function(event) {
			if(event.target.type !== 'radio') {
				$(":radio", this).trigger("click");
			}
		}
	});
}

/**
 * Use the provided filter to subset the standard unit query
 */
function filterAjaxUnitSelect(filterBox) {
	var selection = $("#unit-selection");
    $(selection).html($("#spinner").html());
	
	var form = $(filterBox).find("form");
	var url = $(form).attr("action");
	var data = $(form).serialize();

	$.ajax({
		type: 'POST',
		url: url,
		data: data,
		success: function(data) {
			$(selection).fadeOut('fast', function() {$(this).html(data).fadeIn({complete: setupAjaxUnitSelect});});
		}
	});
}

/**
 * Stages a unit added by another player
 * @param unitId
 * @param userId
 */
function ajaxStageUnit(unitId, userId) {
	var inputMap = {
		userId: userId,
		unitId: unitId
	};
	
	var $tempDiv = $("<div>", {class: "player-unit"});
	
	$tempDiv.load("stageUnit", inputMap, function(response, status, xhr) {
		if (status == "error") {
			var msg = "Error staging unit "+unitId+": ";
			$("#stagingError").html( msg + xhr.status + " " + xhr.statusText ).show();
		}
		
		// move the unit content to the player area
		var playerDiv = $("div.player[data-userid='"+userId+"']");
		$tempDiv.children().appendTo(playerDiv);
		$tempDiv.remove();
		
		// may need to move the "add unit" button back down to the bottom
		$("div.player-footer[data-userid='"+userId+"']").appendTo(playerDiv);
		
		setupDynamicUI();
		
		var effectOptions = {color: "#3399FF"};
		$("div.player-unit[data-unitid='"+unitId+"']").effect("highlight", effectOptions, 2000);
		
		// update displayed counts of units/tonnage
		updateUnitCounts(userId);
    });
}

/**
 * Updates the displayed unit and tonnage count for when a given userId has had changes to units made
 * @param userId
 */
function updateUnitCounts(userId) {
	if(userId == null) return;
	
	var playerDiv = $("div.player[data-userid='"+userId+"']");
	
	// update the total unit count
	var unitCountSpan = playerDiv.closest(".team").find(".team-unit-count");
	var unitCountString = unitCountSpan.text();
	var unitCount = playerDiv.find(".player-unit").length;
	unitCountSpan.text(unitCountString.replace(/\d+/, unitCount));
	
	// update the total tonnage
	var tonnageCountSpan = playerDiv.closest(".team").find(".team-tonnage-count");
	var tonnageCountString = tonnageCountSpan.text();
	var tonnageCount = 0;
	$.each(playerDiv.find(".player-unit"), function() {
		tonnageCount += parseInt($(this).attr("data-unit-mass"));
	});
	tonnageCountSpan.text(tonnageCountString.replace(/\d+/, tonnageCount));
	
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
				// the polling will add the unit
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

/**
 * Called when a game participant clicks to view the map preview
 */
function previewMapSelect() {
	if(selectedMapId == null) return;
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	var data = {mapId: selectedMapId}
	
	mapPreviewDialog.load("previewMap", data, function() {
		dialogLoading.dialog("close");
		
		var idealDialogWidth = 500;
		
		var windowWidth = $(window).width();
		
		// make sure the width of the dialog in the window isn't too small to show everything
		if(windowWidth < idealDialogWidth) {
			dialogWidth = windowWidth;
		}
		else {
			dialogWidth = idealDialogWidth;
		}
		
		mapPreviewDialog.dialog("option", "position", {my: "center", at: "center", of: window});
		mapPreviewDialog.dialog("option", "width", dialogWidth);
		//mapPreviewDialog.dialog("option", "height", windowHeight);
		mapPreviewDialog.dialog("open");
    });
}

/**
 * Called when the game owner clicks to change the map
 */
function loadMapSelect() {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
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
	
	var idealDialogWidth = 800;
	
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	var dialogWidth = 3*windowWidth/4;
	if(dialogWidth < idealDialogWidth) {
		// make sure the width of the dialog in the window isn't too small to show everything
		if(windowWidth < idealDialogWidth) {
			dialogWidth = windowWidth;
		}
		else {
			dialogWidth = idealDialogWidth;
		}
	}
	
	mapSelectDialog.dialog("option", "position", {my: "top", at: "top", of: window});
	mapSelectDialog.dialog("option", "width", dialogWidth);
	//mapSelectDialog.dialog("option", "height", windowHeight);
	mapSelectDialog.dialog("open");
	
	setupAjaxMapSelect();
	
	if(selectedMapId) {
		// have the selected map show its preview after opening the dialog
		ajaxUpdateMapPreview(selectedMapId);
	}
}

// load the given map id into the map preview div using ajax
function ajaxUpdateMapPreview(mapId) {
	var selection = $("#map-selection-preview");
	
	$.ajax({
        type: 'GET',
        url: 'previewMap',
        data: {mapId: mapId},
        success: function(data) {
        	// hide, load, then slide in the new unit preview
            $(selection).hide({
            	effect: 'fade',
            	duration: 250,
            	complete: function() {
            		$(this).html(data).effect({
            			effect: 'fade',
            			duration: 350
            		});
            	}
            })
        }
    });
}

//setup ajax paging and sorting for the map select
function setupAjaxMapSelect() {
	// Disable the Select button until a selection is made
	// http://stackoverflow.com/a/3646440/854696
	var selectButton = $("div.ui-dialog-buttonpane button:contains('Select')").button("disable");
	
	$('input:radio[name="map-radio"]').change(function() {
		// show the select button since a selection has been made
		selectButton.button("enable");
		
		var mapId = $(this).val();
        
		ajaxUpdateMapPreview(mapId);
	});
	
	// enable ajax paging and sorting
	$("#map-selection").find(".pagination a, th.sortable a").on({
		click: function(event) {
	        event.preventDefault();
	        selectButton.button("disable");
	        
	        var url = $(this).attr('href');
	        
	        var selection = $("#map-selection");
	        $(selection).html($("#spinner").html());
	
	        $.ajax({
	            type: 'GET',
	            url: url,
	            success: function(data) {
	                $(selection).fadeOut('fast', function() {$(this).html(data).fadeIn({complete: setupAjaxMapSelect});});
	            }
	        });
		}
    });
	
	// allow clicking on a row to select the radio button for that entry
	$("#map-selection").find("tr").on({
		click: function(event) {
			if(event.target.type !== 'radio') {
				$(":radio", this).trigger("click");
			}
		}
	});
}

function ajaxUpdateMapSelection() {
	selectedMapId = $("input[type='radio'][name='map-radio']:checked").val();
	
	var selectedMapName = $($("input[type='radio'][name='map-radio']:checked").prop("labels")).text();
	var inputMap = {mapId: selectedMapId};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	
	mapSelectDialog.dialog("close");
	dialogLoading.dialog("open");
	
	$.getJSON("mapUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// updateStagingData will handle updating the name on the button element
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

/**
 * Loads initial list of users connected to chat
 */
function loadChatUsersList() {
	lastPing = new Date().getTime();
	$.getJSON("../game/listChatUsers", 
		null
	)
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(handleChatUsersList);
}

/**
 * Handles initializing the list of chat users
 * @param userDataList
 */
function handleChatUsersList(userDataList) {
	$.each(userDataList, function(index, userData) {
		userData.add = true;
		handleChatUsersUpdate(userData);
	});
}

/**
 * Handles adding and removing users from the chat users list
 * @param userData
 */
function handleChatUsersUpdate(userData) {
	//<div><span class="chat-user">CapperDeluxe</span></div>
	var userId = userData.userid;
	var userName = userData.username;
	
	var $chatUserDiv = $("div[data-chat-userid='"+userId+"']")
	
	if(userData.add) {
		// first, make sure it doesn't already exist
		if($chatUserDiv.length) {
			$chatUserDiv.fadeIn();
			return
		}
		
		var $chatUsers = $('#chat-users');
		
		// create the div section containing the user name
		var $chatUserDiv = $("<div>").attr("data-chat-userid", userId);
		var $chatUserSpan = $("<span>", {class: "chat-user"}).text(userName);
		
		$chatUserDiv.append($chatUserSpan);
		$chatUsers.append($chatUserDiv);
		
		// TODO: allow customization of colors in chat!
		var effectOptions = {color: shadeColor("#3399FF", -0.5)};
		$chatUserDiv.effect("highlight", effectOptions, 1000);
	}
	else if(userData.remove){
		$chatUserDiv.fadeOut(function() {
			var $this = $(this);
			// waiting a short while before complete removal just in case it was only a refresh event
			setTimeout(function(){
				if($this.is(":visible") == false) {
					$this.remove()
				}
			},500);
		});
	}
}

/**
 * Handle all staging updates resulting from server actions
 * @param data
 */
function updateStagingData(data) {
	var effectOptions = {color: "#3399FF"};
	var userId = data.user;
	
	if(data.chatUser != null) {
		// update displayed list of users in the staging chat room
		handleChatUsersUpdate(data.chatUser);
	}
	else if(data.map != null) {
		var mapName = data.map;
		selectedMapId = data.mapId;
		
		// since only the game owner can select using #map-button, others will get updates on #map-selected
		$("#map-selected").button("option", "label", mapName)
				.effect("highlight", effectOptions, 2000);
		
		// show highlight effect if button showing
		$("#map-button").button("option", "label", mapName)
				.effect("highlight", effectOptions, 2000);
	}
	else if(data.location != null && userId != null) {
		var location = data.location;
		
		// update if it is a select menu
		$("div.player-info[data-userid='"+userId+"'] select.location").val(location).iconselectmenu("refresh");
		
		// update if it is a label
		$("div.player-info[data-userid='"+userId+"'] span.location-label").text(location);
		
		// update the icons associated with the location
		updateLocationIcons();
		
		// highlight only the location that got updated
		var locationLabels = $("div.player-info[data-userid='"+userId+"'] span.location, div.player-info[data-userid='"+userId+"'] select.location + span.ui-selectmenu-button");
		locationLabels.effect("highlight", effectOptions, 1500);
	}
	else if(data.rgbCamo != null && userId != null) {
		// update the units on the page without forcing reload
		ajaxStageUser(userId);
	}
	else if(data.unitAdded != null) {
		var unitId = data.unitAdded;
		
		// add the unit on the page without forcing reload
		ajaxStageUnit(unitId, userId);
	}
	else if(data.unitRemoved != null) {
		var unitId = data.unitRemoved;
		$("div[data-unitid='"+unitId+"']").closest("div.player-unit").fadeOut(
			function() {
				$(this).remove();
				
				// update displayed counts of units/tonnage
				updateUnitCounts(userId);
			}
		);
	}
	else if(data.userAdded != null) {
		var userId = data.userAdded;
		
		// update the users and teams on the page without forcing reload
		ajaxStageUser(userId);
	}
	else if(data.userRemoved != null) {
		var userId = data.userRemoved;
		
		var $playerDiv = $("div.player[data-userid='"+userId+"']");
		var $teamDiv = $playerDiv.parent("div.team");
		$playerDiv.fadeOut();
		
		// TODO: only remove the team div if no players remain in it
		$teamDiv.fadeOut(function() {
			$(this).remove();
		});
		
		// if the user removed is the current user, show alert and redirect back to dropship
		if(currentUserId == userId) {
			alert("You have been removed from battle by the owner, returning to dropship");	// TODO: i18n this message
			redirectToDropship();
		}
	}
	else if(data.userReady != null) {
		var isReady = data.userReady;
		
		var readyCheckbox = $("input#ready-"+userId+".player-ready[type=checkbox]");
		readyCheckbox.prop('checked', isReady).trigger("change");
	}
	else if(data.gameState != null) {
		if(data.gameState == "A") {
			console.log("The game is now active");
			
			$("#launch-button").button();
			
			// show a modal dialog with the launch button
			$("#launch-dialog").dialog({
		    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
		    	title: "Prepare for Battle",
		    	autoOpen: true,
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
		}
	}
}

/**
 * Redirects to the leave link automatically, which brings user back to the dropship
 */
function redirectToDropship() {
	var dropshipUrl = $("#leave-link").attr("data-leave-link");
	if(dropshipUrl != null) {
		// setting currentUserId null so when it redirects it doesn't show the removed from game message
		currentUserId = null;
		window.location.replace(dropshipUrl);
	}
}

/**
 * Used to set the selection range of a given element 
 * from http://stackoverflow.com/a/499158/854696
 */
function setSelectionRange(input, selectionStart, selectionEnd) {
	if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(selectionStart, selectionEnd);
	}
	else if (input.createTextRange) {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character', selectionEnd);
		range.moveStart('character', selectionStart);
		range.select();
	}
}

/**
 * Used to set the caret position of a given element
 * from http://stackoverflow.com/a/499158/854696
 */
function setCaretToPos (input, pos) {
	setSelectionRange(input, pos, pos);
}

/**
 * Lightens or darkens given given
 * From http://stackoverflow.com/questions/5560248/
 * @param color as hex notation
 * @param percent as -1.0 to 1.0 positive for lighten, negative for darken
 * @returns {String} newly shaded color as hex notation
 */
function shadeColor(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}
/**
 * Blends two colors together
 * From http://stackoverflow.com/questions/5560248/
 * @param c0 first color
 * @param c1 secont color
 * @param p percent as 0 to 1.0
 * @returns {String} newly blended color as hex notation
 */
function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}

//http://stackoverflow.com/a/9458996/128597
function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};
