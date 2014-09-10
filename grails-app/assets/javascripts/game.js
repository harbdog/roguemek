// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better 
// to create separate JavaScript files as needed.
//
//= require jquery
//= require jquery.form.js
//= require createjs-2013.12.12.min.js
//= require_tree .
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initGame(); 
});

var stage, circle, arm

function initGame(){
	
	// Test some CreateJS (EaselJS) code
	stage = new createjs.Stage("canvas");
	
	circle = new createjs.Shape();
	circle.graphics.beginFill("red").drawCircle(0, 0, 50);
	circle.x = 100;
	circle.y = 100;
	stage.addChild(circle);
	
	// add test listener to circle
	circle.addEventListener("click", function(event) { alert("clicked"); })
	
	// add drag and drop to circle
	circle.on("pressmove", function(evt) {
	    evt.target.x = evt.stageX;
	    evt.target.y = evt.stageY;
	});
	circle.on("pressup", function(evt) { console.log("up"); })
	
	// add obstacle
	arm = stage.addChild(new createjs.Shape());
	arm.graphics.beginFill("black").drawRect(-2,-2,100,4)
		.beginFill("blue").drawCircle(0,0,8);
	arm.x = 180;
	arm.y = 100;
	
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(30);
}

function tick(event) {
	// rotate the arm
	arm.rotation += 5;
	
	// time based circle movement
	circle.x = circle.x + (event.delta)/1000*100;
	if (circle.x > stage.canvas.width) { circle.x = 0; }
	
	// not time based circle movement
	//circle.x = circle.x + 5; // 100 / 20 = 5
	//if (circle.x > stage.canvas.width) { circle.x = 0; }
	
	// hitTest with mouse
	circle.alpha = 0.2;
	var pt = circle.globalToLocal(stage.mouseX, stage.mouseY);
	if (stage.mouseInBounds && circle.hitTest(pt.x, pt.y)) { circle.alpha = 1; }
	
	// hitTest with swinging arm (only the circle part?)
	var armpt = arm.localToLocal(0, 0, circle);
	if (circle.hitTest(armpt.x, armpt.y)) { circle.alpha = 1; }
	
	stage.update(event);
}
