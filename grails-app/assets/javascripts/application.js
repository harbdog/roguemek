// This is a manifest file that loads the javascript files needed for the non-gameplay aspects.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
//= require jquery
//= require jquery-ui.min.js
//= require jquery.form.js
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
	// make the spinner show while ajax is going on
	$(document)
		.ajaxStart(function() {
			$("#spinner").fadeIn('slow');
		})
		.ajaxComplete(function() {
			$("#spinner").fadeOut('slow');
		});
	
	// The global login form should be able to allow login regardless of the current page 
	$('#loginForm').ajaxForm(function(result) {
		$('#loginBox').html(result);
	});
}