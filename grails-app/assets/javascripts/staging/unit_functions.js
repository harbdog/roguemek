/**
 * unit_functions.js - Methods that handle unit updates in staging
 */

"use strict";

var unitSelectDialog;

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
    }
    else {
    	// hide the unit add/delete buttons
    	$("button.unit-delete").hide();
    	$("button.unit-add").hide();
    }
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
								
								// setup the variant sub selection functions
								setupAjaxVariantSelect();
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
 * setup ajax filters, paging and sorting for the variant subselect for units
 */
function setupAjaxVariantSelect() {
	
	// make sure to scroll to the currently selected variant
	var offset = 0;
	$('#variant-selection input').each(function() {
		var radioInput = $(this);
		
		if(radioInput.is(':checked')) {
			console.log("I'm checked!!! offset="+offset);
			$('#variant-selection').parent('div').scrollTo(offset);
		}
		
		console.log("adding offset: "+radioInput.parent('td').height());
		
		offset += radioInput.parent('td').height();
	});
	
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
										
								// setup the variant sub selection functions
								setupAjaxVariantSelect();
                			}
                		});
                	}
                })
            }
        });
	});
	
	// allow clicking on a row to select the radio button for that entry
	$("#variant-selection").find("tr").on({
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
