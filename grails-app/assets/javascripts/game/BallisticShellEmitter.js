/**
 * Creates a proton particle emitter for the effect of being hit by a ballistic projectile
 */
(function() {
"use strict";

function BallisticShellEmitter(impactPoint, msDuration) {
	this.Container_constructor();
	
	this.duration = (msDuration/1000);
	
	this.x = impactPoint.x;
	this.y = impactPoint.y;
	this.proton = null;
	this.emitter = null;
	
	this.setup();
}
var c = createjs.extend(BallisticShellEmitter, createjs.Container);

c.setup = function() {
	
	stage.addChild(this);
	
	var colors = [
  	    new createjs.Bitmap(queue.getResult("shell-yellow"))
  	];
	
	var proton = new Proton();
	var emitter = new Proton.Emitter();
	//set Rate
	emitter.rate = new Proton.Rate(Proton.getSpan(1, 1), this.duration/10);
	//add Initialize
	emitter.addInitialize(new Proton.ImageTarget(colors));
	emitter.addInitialize(new Proton.Mass(1));
	emitter.addInitialize(new Proton.Life(0.4, 0.75));
	emitter.addInitialize(new Proton.Velocity(1.5, Proton.getSpan(-20, 20), 'polar'));
	//add Behaviour
	emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
	emitter.addBehaviour(new Proton.Rotate(new Proton.Span(0, 360), new Proton.Span([-10, -5, 5, 15, 10]), 'add'));
	emitter.addBehaviour(new Proton.Scale(new Proton.Span(0.2, 0.3), 0.1));
	emitter.addBehaviour(new Proton.G(5));
	
	//set emitter position
	emitter.p.x = 0;
	emitter.p.y = 0;
	emitter.emit(this.duration);
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

window.BallisticShellEmitter = createjs.promote(BallisticShellEmitter, "Container");
}());
