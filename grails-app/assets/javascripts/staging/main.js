// This is the main javascript file for the RogueMek staging client 
//
//= require_self
//= require_tree .

var dialogLoading;
var mapSelectDialog;
var unitSelectDialog;
var camoSelectDialog;
var camoSelectUserID;

/**
 * Prepares staging page on load
 */
function initStaging() {
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
			position: {my: "left bottom", at: "right top", of: $(this)}
		});
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
    
    $("button.disabled").button();
    
    // setup any dynamic UI pieces present at init
    setupDynamicUI();
    
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
    	
    	// setup user join button
    	$("button.user-join").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			secondary: "ui-icon-arrowreturnthick-1-n"
    	    	}
        	}).click(addUser);
    	});
    	
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
					
					$("img.unit-preview").attr("src", "data:image/gif;base64," + base64);
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
				console.log("updated location: "+locationValue)
			}
		});
}

function ajaxStageUser(userId) {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");

	var inputMap = {
		userId: userId
	};
	
	var $tempDiv = $("<div>", {class: "player"});
	
	var playerDiv = $("div.player[data-userid='"+userId+"']");
	
	var $this = null;
	if(playerDiv != null) {
		$this = $("div.player[data-userid='"+userId+"']").parents('div').eq(0);
	}
	
	if($this == null || $this.length == 0) {
		// create a new temporary team div for the player until teams are introduced to the game
		$this = $("<div>", {class: "team"});
		$("div#teams").append($this);
		
		var tempTeamHeader = $("<h2>");
		tempTeamHeader.text("Team Temp");
		$this.prepend(tempTeamHeader);
	}
	
	$tempDiv.load("stageUser", inputMap, function() {
		
		if(playerDiv != null) {
			playerDiv.remove();
		}
		
		// move the unit content to the player area
		$tempDiv.children().appendTo($this);
		$tempDiv.remove();
		
		// TODO: implement actual Teams
		setupDynamicUI();
		
		var effectOptions = {color: "#3399FF"};
		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
		
		dialogLoading.dialog("close");
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
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	unitSelectDialog.dialog("option", "position", {my: "top", at: "top", of: window});
	unitSelectDialog.dialog("option", "width", 3*windowWidth/4);
	//unitSelectDialog.dialog("option", "height", windowHeight);	// do not bound the height so it won't have an inner scroll pane
	unitSelectDialog.dialog("open");
	
	setupAjaxUnitSelect();
}

//setup ajax filters, paging and sorting for the unit select
function setupAjaxUnitSelect() {
	// setup radio change events
	$('input:radio[name="unit-radio"]').change(function() {
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
	                $(selection).fadeOut('fast', function() {$(this).html(data).fadeIn({complete: setupAjaxUnitSelect});});
	            }
	        });
		}
    });
	
	//setup ajax filter functionality for the unit select
	$("div.unit-filters form").submit(function(event) {
		event.preventDefault();
		var filterBox = $(this).parents("div.unit-filters");
		filterAjaxUnitSelect(filterBox);
		return false;
	});
	
	var $inputFilter = $("div.unit-filters input#name")
	if($inputFilter && $inputFilter.length) {
		setCaretToPos($inputFilter[0], $inputFilter.val().length);
	}
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


function ajaxStageUnit(unitId, userId) {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");

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
		$("button.unit-add[data-userid='"+userId+"']").appendTo(playerDiv);
		
		setupDynamicUI();
		
		var effectOptions = {color: "#3399FF"};
		$("div.player-unit[data-unitid='"+unitId+"']").effect("highlight", effectOptions, 2000);
		
		dialogLoading.dialog("close");
    });
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
	
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	mapSelectDialog.dialog("option", "position", {my: "center", at: "center", of: window});
	mapSelectDialog.dialog("option", "width", windowWidth/2);
	mapSelectDialog.dialog("option", "height", windowHeight);
	mapSelectDialog.dialog("open");
	
	setupAjaxMapSelect();
}

//setup ajax paging and sorting for the map select
function setupAjaxMapSelect() {
	$("#map-selection").find(".pagination a, th.sortable a").on({
		click: function(event) {
	        event.preventDefault();
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
				$("#map-button").button("option", "label", selectedMapName);
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
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
		// since only the game owner can select using #map-button, others will get updates on the span #map-selection
		$("#map-selection").text(mapName)
				.effect("highlight", effectOptions, 2000);
		
		// show highlight effect if button showing
		$("#map-button").effect("highlight", effectOptions, 2000);
	}
	else if(data.location != null && userId != null) {
		var location = data.location;
		
		// update if it is a select menu
		$("div[data-userid='"+userId+"'] select.location").val(location).iconselectmenu("refresh")
				.iconselectmenu("widget").effect("highlight", effectOptions, 2000);
		
		// update if it is a label
		$("div[data-userid='"+userId+"'] label.location").text(location)
				.effect("highlight", effectOptions, 2000);
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
		$("div[data-unitid='"+unitId+"']").closest("div.player-unit").fadeOut();
	}
	else if(data.userAdded != null) {
		var userId = data.userAdded;
		
		// update the users and teams on the page without forcing reload
		ajaxStageUser(userId);
	}
	else if(data.userRemoved != null) {
		var userId = data.userRemoved;
		$("div.player[data-userid='"+userId+"']").fadeOut();
		
		// TODO: update the users and teams on the page without forcing reload
		//window.location.reload();
		
		// if the user removed is the current user, show alert and redirect back to dropship
		if(currentUserId == userId) {
			alert("You have been removed from battle by the owner, returning to dropship");	// TODO: i18n this message
			redirectToDropship();
		}
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