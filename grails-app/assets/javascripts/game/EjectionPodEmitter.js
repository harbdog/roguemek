/**
 * Creates a proton particle emitter for the effect of being hit by a laser
 */
(function() {
"use strict";

function EjectionPodEmitter(pod, msDuration) {
	this.Container_constructor();
	
	this.pod = pod;
	this.duration = (msDuration/1000);
	
	this.x = pod.x;
	this.y = pod.y;
	this.smoke = null;
	this.smokeEmitter = null;
	
	this.setup();
}
var c = createjs.extend(EjectionPodEmitter, createjs.Container);

c.setup = function() {
	
	stage.addChild(this);
	
	// create the smoke that is also created with the explosions
  	var smoke = new Proton();
  	var smokeEmitter = new Proton.Emitter();
  	//set Rate
  	smokeEmitter.rate = new Proton.Rate(Proton.getSpan(2, 3), 0.02);
  	//add Initialize
  	smokeEmitter.addInitialize(new Proton.ImageTarget(new createjs.Bitmap(queue.getResult("particle-smoke"))));
  	smokeEmitter.addInitialize(new Proton.Life(2, 3));
  	smokeEmitter.addInitialize(new Proton.Velocity(0.1, Proton.getSpan(100, 260), 'polar'));
  	//add Behaviour
  	smokeEmitter.addBehaviour(new Proton.Alpha(1, 0.75));
  	smokeEmitter.addBehaviour(new Proton.Scale(new Proton.Span(0.05, 0.1), 0.1));
  	
  	//set emitter position
  	smokeEmitter.p.x = this.pod.image.width/2;
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
	if(this.smoke) {
		this.smoke.update();
	}
	
	if(this.smokeEmitter && this.pod) {
		this.smokeEmitter.p.x = this.pod.x - this.x;
		this.smokeEmitter.p.y = this.pod.y - this.y + this.pod.image.height;
		
		if(this.smokeEmitter.emitTime > this.smokeEmitter.emitTotalTimes
				&& this.smokeEmitter.particles.length == 0) {
			stage.removeChild(this);
			this.removeAllEventListeners();
		}
	}
};

window.EjectionPodEmitter = createjs.promote(EjectionPodEmitter, "Container");
}());
