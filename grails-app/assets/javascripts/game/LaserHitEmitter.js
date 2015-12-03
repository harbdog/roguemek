/**
 * Creates a proton particle emitter for the effect of being hit by a laser
 */
(function() {
"use strict";

function LaserHitEmitter(x, y) {
	this.Container_constructor();
	
	this.x = x;
	this.y = y;
	this.proton = null;
	this.emitter = null;
	
	this.setup(x, y);
}
var c = createjs.extend(LaserHitEmitter, createjs.Container);

c.setup = function(x, y) {
	this.x = x;
	this.y = y;
	
	stage.addChild(this);
	
	var colors = ["#FF0000"];
	
	for(var n=20; n < 100; n+=5) {
		colors.push(blendColors("#FF0000", "#FF8000", n/100));
	}
	
	var proton = new Proton();
	var emitter = new Proton.Emitter();
	//set Rate
	emitter.rate = new Proton.Rate(Proton.getSpan(10, 20), 0.1);
	//add Initialize
	emitter.addInitialize(new Proton.Mass(1), new Proton.Radius(Proton.getSpan(5, 10)));
	emitter.addInitialize(new Proton.Radius(1, 2));
	emitter.addInitialize(new Proton.Life(0.5, 1));
	emitter.addInitialize(new Proton.Velocity(0.5, Proton.getSpan(0, 360), 'polar'));
	//add Behaviour
	emitter.addBehaviour(new Proton.Alpha(1, 0));
	emitter.addBehaviour(new Proton.Scale(new Proton.Span(2, 3.5), 0.1));
	emitter.addBehaviour(new Proton.Color(colors, 'random'));
	
	//set emitter position
	emitter.p.x = 0;
	emitter.p.y = 0;
	emitter.emit(0.25);
	//add emitter to the proton
	proton.addEmitter(emitter);
	// add canvas renderer
	var renderer = new Proton.Renderer('easeljs', proton, this);
	renderer.start();
	
	this.proton = proton;
	this.emitter = emitter;
	
	this.on("tick", this.update);
};

c.update = function() {
	if(this.proton) {
		this.proton.update();
	}
};

window.LaserHitEmitter = createjs.promote(LaserHitEmitter, "Container");
}());
