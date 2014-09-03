// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better 
// to create separate JavaScript files as needed.
//
//= require jquery
//= require jquery.form.js
//= require jqModal.js
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
	
	// Testing weapons fire on the BattleMech model using a Weapon
	$("#testWeaponForm").ajaxForm(function(result) {
		$('#testWeaponResults').html(result);
	});
}

function showMech(mechId) {
    var jqxhr = $.ajax({
    	timeout: 5000,
        url: 'mech/display?id=' + mechId,
        success: function(data, status, jqxhr) {
        	clearInterval(timerID);
        	
            $('#mechPanel').html(data);
            $('#mech' + mechId).fadeIn('slow');
            $('#mechPanel').css("color", "blue");
        },
        error: function(jqxhr, status, errorMsg) {
        	clearInterval(timerID);
        	
        	var showMsg = status == "timeout" ? "TIMEOUT" : "ERROR";
        	$('#mechPanel').html(showMsg);
        	$('#mechPanel').css("color", "red");
        },
        complete: showMechCompleted
    });
    
    var waitTime = -1;
    var intervalTime = 100;
    
    var timerID = setInterval(function() {
    	if(waitTime == -1){
    		waitTime = 0;
    	}
    	else{
    		waitTime += intervalTime;
    	}
    	
    	if(jqxhr != null){
			console.log(waitTime+" | Status: "+jqxhr.status+" "+jqxhr.statusText+" | "+jqxhr.readyState);

			var dots = ".";
			for(var i=0; i<waitTime/100; i++){
				dots += ".";
			}
			
			$('#mechPanel').html(dots);
    	}
	}, intervalTime);
    return false;
}
function showMechCompleted(jqxhr, status){
	console.log("Show Mech Completed (success or error): "+status);
}