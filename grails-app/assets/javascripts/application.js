// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better 
// to create separate JavaScript files as needed.
//
//= require jquery
//= require jquery.form.js
//= require_tree .
//= require_self

if (typeof jQuery !== 'undefined') {
	(function($) {
		$('#spinner').ajaxStart(function() {
			$(this).fadeIn();
		}).ajaxStop(function() {
			$(this).fadeOut();
		});
	})(jQuery);
}

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	init(); 
});

function init(){
	// The global login form should be able to allow login regardless of the current page 
	$('#loginForm').ajaxForm(function(result) {
		$('#loginBox').html(result);
	});
	
	// Test for instant search to create links in a panel
	$("#searchField").keyup(function() {
		console.log("value: "+this.value);
		$("#searchResults").load("RogueMek/search?q="+this.value);
	});
	
	// Load a #mechLinkN into the #mechPanel
	$("a[id^='mechLink']").click (function() {
		var mechLinkId = this.id.substring(8);
        return showMech(mechLinkId);
    });
}

function showMech(mechId) {
    $.ajax({
        url: 'mech/display?id=' + mechId,
        success: function(data) {
            $('#mechPanel').html(data);
            $('#mech' + mechId).fadeIn('slow');
        }
    });
    return false;
}