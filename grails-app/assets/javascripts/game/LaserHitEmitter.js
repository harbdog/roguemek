/**
 * Creates a proton particle emitter for the effect of being hit by a laser
 */
(function() {
"use strict";

function LaserHitEmitter(laser, msDuration) {
	this.Container_constructor();
	
	this.laser = laser;
	this.duration = (msDuration/1000);
	
	this.x = laser.endX;
	this.y = laser.endY;
	this.proton = null;
	this.emitter = null;
	
	this.setup();
}
var c = createjs.extend(LaserHitEmitter, createjs.Container);

c.setup = function() {
	
	stage.addChild(this);
	
	var colors = [
  	    new createjs.Bitmap(queue.getResult("particle-red")),
  	    new createjs.Bitmap(queue.getResult("particle-orange"))
  	];
	
	var proton = new Proton();
	var emitter = new Proton.Emitter();
	//set Rate
	emitter.rate = new Proton.Rate(Proton.getSpan(5, 10), 0.05);
	//add Initialize
	emitter.addInitialize(new Proton.ImageTarget(colors));
	emitter.addInitialize(new Proton.Life(0.5, 1));
	emitter.addInitialize(new Proton.Velocity(0.35, Proton.getSpan(0, 360), 'polar'));
	//add Behaviour
	emitter.addBehaviour(new Proton.Alpha(1, 0.75));
	emitter.addBehaviour(new Proton.Scale(new Proton.Span(0.15, 0.25), 0.1));
	emitter.addBehaviour(new Proton.G(0.5));
	
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
	
	if(this.emitter && this.laser) {
		this.emitter.p.x = this.laser.endX - this.x;
		this.emitter.p.y = this.laser.endY - this.y;
		
		if(this.emitter.emitTime > this.emitter.emitTotalTimes
				&& this.emitter.particles.length == 0) {
			stage.removeChild(this);
			this.removeAllEventListeners();
		}
	}
};

window.LaserHitEmitter = createjs.promote(LaserHitEmitter, "Container");
}());
