/**
 * Creates a proton particle emitter for the effect of being hit by a missile
 */
(function() {
"use strict";

function FlamerHitEmitter(impactPoint, msDuration) {
	this.Container_constructor();
	
	this.duration = (msDuration/1000);
	
	this.x = impactPoint.x;
	this.y = impactPoint.y;
	this.proton = null;
	this.emitter = null;
	
	this.smoke = null;
	this.smokeEmitter = null;
	
	this.setup();
}
var c = createjs.extend(FlamerHitEmitter, createjs.Container);

c.setup = function() {
	
	stage.addChild(this);
	
	// create the explosion particles
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
	emitter.addInitialize(new Proton.Life(0.4, 0.8));
	emitter.addInitialize(new Proton.Velocity(0.4, Proton.getSpan(0, 360), 'polar'));
	//add Behaviour
	emitter.addBehaviour(new Proton.Alpha(1, 0.75));
	emitter.addBehaviour(new Proton.Scale(new Proton.Span(0.3, 0.4), 0.1));
	
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
	
  	// create the smoke that is also created with the explosions
  	var smoke = new Proton();
  	var smokeEmitter = new Proton.Emitter();
  	//set Rate
  	smokeEmitter.rate = new Proton.Rate(Proton.getSpan(2, 3), 0.05);
  	//add Initialize
  	smokeEmitter.addInitialize(new Proton.ImageTarget(new createjs.Bitmap(queue.getResult("particle-smoke"))));
  	smokeEmitter.addInitialize(new Proton.Life(1, 2));
  	smokeEmitter.addInitialize(new Proton.Velocity(0.2, Proton.getSpan(0, 360), 'polar'));
  	//add Behaviour
  	smokeEmitter.addBehaviour(new Proton.Alpha(0.75, 0.5));
  	smokeEmitter.addBehaviour(new Proton.Scale(new Proton.Span(0.2, 0.3), 0.1));
  	
  	//set emitter position
  	smokeEmitter.p.x = 0;
  	smokeEmitter.p.y = 0;
  	smokeEmitter.emit(this.duration*2);
  	//add emitter to the proton
  	smoke.addEmitter(smokeEmitter);
  	// add canvas renderer
  	var renderer = new Proton.Renderer('easeljs', smoke, this);
  	renderer.start();
  	
  	this.smoke = smoke;
  	this.smokeEmitter = smokeEmitter;
	
	this.on("tick", this.update);
};

c.update = function() {
	if(this.proton) {
		this.smoke.update();
		this.proton.update();
	}
};

window.FlamerHitEmitter = createjs.promote(FlamerHitEmitter, "Container");
}());
