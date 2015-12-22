//= require jquery
//= require jquery-ui.min.js
//= require jquery.form.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initStaging(); 
});

function initStaging() {
	// prepare staging page on load
	
	$("#map-button").button()
					.click(showMapSelect);
}

function showMapSelect() {
	var mapSelectDialog = $("<div>"+"Select"+"</div>").dialog({
    	title: "Select Map",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "blind",
			duration: 350
		},
		hide: {
			effect: "blind",
			duration: 350
		},
		buttons: {
			"Select": ajaxUpdateMapSelection,
			Cancel: function() {
				mapSelectDialog.dialog( "close" );
			}
		},
		close: function() {
			$("#map-button").button("option", "label", "Test");
		}
    });
	
	mapSelectDialog.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	mapSelectDialog.dialog("open");
}

function ajaxUpdateMapSelection() {
	console.log("AJAXIT");
}