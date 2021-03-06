/**
 * unit_functions.js - Methods that handle unit updates in staging
 */

"use strict";

var unitSelectDialog;
var unitPreviewDialog;

/**
 * Initializes unit related UI components
 */
function initUnitUI() {
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
	
	// Initialize unit preview dialog
	unitPreviewDialog = $("#unitPreviewDiv").dialog({
		title: "Preview Unit",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 350
		},
		open: function () {
			// after finished opening dialog, swap out the static for the animated preview image class
	        $(this).parent().promise().done(function () {
				$(".unit-preview-static")
						.removeClass("unit-preview-static")
						.addClass("unit-preview");
	        });
	    },
		hide: {
			effect: "fade",
			duration: 250
		},
		buttons: {
			Close: function() {
				unitPreviewDialog.dialog("close");
			}
		}
    });
}

/**
 * Sets up or updates unit UI that may need to change after certain actiona
 */
function setupDynamicUnitUI() {
    // setup editable users/units
    if(unitsEditable) {
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
		
		// setup click preview for units
		$("div.player-unit-model").on({
			click: function(event) {
				var unitId = $(this).attr("data-model-id");
				previewUnitSelect(unitId);
			}
		});
    }
    else {
    	// hide the unit add/delete buttons
    	$("button.unit-delete").hide();
    	$("button.unit-add").hide();
    }
}

/**
 * Called when a game participant clicks to view the unit preview
 */
function previewUnitSelect(unitId) {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	var data = {unitId: unitId};
	
	unitPreviewDialog.load("previewUnit", data, function() {
		dialogLoading.dialog("close");
		
		var idealDialogWidth = 500;
		
		var windowWidth = $(window).width();
		
		// make sure the width of the dialog in the window isn't too small to show everything
        var dialogWidth = idealDialogWidth;
		if(windowWidth < idealDialogWidth) {
			dialogWidth = windowWidth;
		}
		
		unitPreviewDialog.dialog("option", "position", {my: "center", at: "center", of: window});
		unitPreviewDialog.dialog("option", "width", dialogWidth);
		unitPreviewDialog.dialog("open");
    });
}

/**
 * Prompts the user to confirm deletion of the unit before requesting it
 */
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

/**
 * Request sent to the server to delete the unit
 */
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

/**
 * Called when the player clicks to add a new unit
 */
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

/**
 * Prepares the unit selection dialog for being shown
 */
function showUnitSelect() {
	var idealDialogWidth = 800;
	
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	var dialogWidth = idealDialogWidth;
	if(windowWidth < dialogWidth) {
		// make sure the width of the dialog in the window isn't too small to show everything
		dialogWidth = windowWidth;
	}
	
	unitSelectDialog.dialog("option", "position", {my: "top", at: "top", of: window});
	unitSelectDialog.dialog("option", "width", dialogWidth);
	//unitSelectDialog.dialog("option", "height", windowHeight);	// do not bound the height so it won't have an inner scroll pane
	unitSelectDialog.dialog("open");
	
	setupAjaxUnitSelect();
}

/**
 * setup ajax filters, paging and sorting for the unit select
 */
function setupAjaxUnitSelect() {
	// Disable the Select button until a selection is made
	// http://stackoverflow.com/a/3646440/854696
	var selectButton = $("div.ui-dialog-buttonpane button:contains('Select')").button("disable");
	
	// setup radio change events
	$('input:radio[name="unit-chassis-radio"]').change(function() {
		// show the select button since a selection has been made
		selectButton.button("enable");
		
		var unitId = $(this).val();
		var unitName = $(this).attr("data-unit-name");
		var unitChassis = $(this).attr("data-unit-chassis");
		var unitVariant = $(this).attr("data-unit-variant");
        
        var selection = $("#unit-selection-preview");
		var variantSelection = $('#unit-selection-variant');

        $.ajax({
            type: 'GET',
            url: 'previewUnit',
            data: {unitId: unitId},
            success: function(data) {
            	// hide, load, then slide in the new unit preview
				var hideDuration = ($(selection).children().length == 0) ? 0 : 250;
				
                $(selection).hide({
                	effect: 'slide',
                	duration: hideDuration,
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
                });
				
				// also hide, load, and slide in the variant selection list
				$(variantSelection).hide({
					effect: 'slide',
					direction: 'down',
                	duration: hideDuration,
                	complete: function() {
						variantSelection.removeClass("clear");
						
						// generate the variants table before showing again
						var variantTable = $("<table>");
						$("input:radio[name='unit-chassis-radio'][data-unit-name='"+unitName+"']").each(function(index) {
							var subVariant = $(this).attr("data-unit-variant");
							var subVariantId = $(this).val();
							
							var variantRow = $("<tr>", {class: (index % 2 == 0) ? 'even' : 'odd'}).appendTo(variantTable);
							var variantCell = $("<td>").appendTo(variantRow);
							var placeholderCell = $("<td>").appendTo(variantRow);
							
							var variantInput = $("<input>", {type:"radio",
									name:"unit-variant-radio",
									value:subVariantId,
									id:subVariantId})
									.appendTo(variantCell);
							var variantLabel = $("<label>", {for: subVariantId})
									.text(unitChassis+"-"+subVariant)
									.appendTo(variantCell);
									
							if(unitVariant == subVariant) {
								variantInput.prop("checked", true);
							}
						});
												
                		$(this).html(variantTable).effect({
							effect: 'slide',
							direction: 'down',
							duration: 350,
							complete: function() {
								// setup the variant sub selection functions
								setupAjaxVariantSelect();
							}
						});
                	}
				});
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
	                $(selection).fadeOut('fast', function() {$(this).html(data)
						.fadeIn({complete: setupAjaxUnitSelect});}
					);
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
 * setup ajax filters, paging and sorting for the variant subselect for units
 */
function setupAjaxVariantSelect() {
	
	// setup radio change events
	$('input:radio[name="unit-variant-radio"]').change(function() {
		
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
	
	// allow clicking on a row to select the radio button for that entry
	$("#unit-selection-variant").find("tr").on({
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
			$(selection).fadeOut('fast', function() {$(this).html(data)
				.fadeIn({complete: setupAjaxUnitSelect});
			});
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
		updateUserUnitCounts(userId);
    });
}

/**
 * Updates the displayed unit and tonnage count for all teams
 */
function updateUnitCounts() {
	var allTeamDivs = $("div.team[data-teamnum]");
	$.each(allTeamDivs, function() {
		var teamNum = $(this).attr("data-teamnum");
		updateTeamUnitCounts(teamNum);
	});
}

/**
 * Updates the displayed unit and tonnage count for when a given userId has had changes to units made
 * @param userId
 */
function updateUserUnitCounts(userId) {
	if(userId == null) return;
	
	var playerDiv = $("div.player[data-userid='"+userId+"']");
	var playerTeamDiv = playerDiv.closest("div.team[data-teamnum]");
	var playerTeamNum = playerTeamDiv.attr("data-teamnum");
	if(playerTeamNum) {
		updateTeamUnitCounts(playerTeamNum);
	}
}

/**
 * Updates the displayed unit and tonnage count for when a given teamNum has had changes to units made
 * @param userId
 */
function updateTeamUnitCounts(teamNum) {
	if(teamNum == null) return;
	
	var teamDiv = $("div.team[data-teamnum='"+teamNum+"']");
	
	// update the total unit count
	var unitCountSpan = teamDiv.find(".team-unit-count");
	var unitCountString = unitCountSpan.text();
	var unitCount = teamDiv.find(".player-unit").length;
	unitCountSpan.text(unitCountString.replace(/\d+/, unitCount));
	
	// update the total tonnage
	var tonnageCountSpan = teamDiv.find(".team-tonnage-count");
	var tonnageCountString = tonnageCountSpan.text();
	var tonnageCount = 0;
	$.each(teamDiv.find(".player-unit"), function() {
		tonnageCount += parseInt($(this).attr("data-unit-mass"));
	});
	tonnageCountSpan.text(tonnageCountString.replace(/\d+/, tonnageCount));
	
}

/**
 * Request the selected unit be added to the game for the player
 */
function ajaxAddUnit() {
	// add selected unit to the battle
	var selectedUnitId = $("input[type='radio'][name='unit-variant-radio']:checked").val();
	var selectedUnitName = $($("input[type='radio'][name='unit-variant-radio']:checked").prop("labels")).text();
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
