/**
 * Creates a proton particle emitter for the effect of showing a dust cloud
 */
(function() {
"use strict";

function DustCloudEmitter(impactPoint, msDuration, velocity, life) {
	this.Container_constructor();
	
	this.duration = (msDuration/1000);
	this.velocity = velocity;
	this.life = life;
	
	this.x = impactPoint.x;
	this.y = impactPoint.y;
	
	this.smoke = null;
	this.smokeEmitter = null;
	
	this.setup();
}
var c = createjs.extend(DustCloudEmitter, createjs.Container);

c.setup = function() {
	
  	// create the smoke that is also created with the explosions
  	var smoke = new Proton();
  	var smokeEmitter = new Proton.Emitter();
  	//set Rate
  	smokeEmitter.rate = new Proton.Rate(Proton.getSpan(20, 35), 2*this.duration/3);
  	//add Initialize
  	smokeEmitter.addInitialize(new Proton.ImageTarget(new createjs.Bitmap(queue.getResult("particle-smoke"))));
  	smokeEmitter.addInitialize(new Proton.Life(3*this.life/4, this.life));
  	smokeEmitter.addInitialize(new Proton.Velocity(this.velocity, Proton.getSpan(0, 360), 'polar'));
  	//add Behaviour
  	smokeEmitter.addBehaviour(new Proton.Alpha(1, 0.9));
  	smokeEmitter.addBehaviour(new Proton.Scale(new Proton.Span(0.2, 0.3), 0.1));
  	
  	//set emitter position
  	smokeEmitter.p.x = 0;
  	smokeEmitter.p.y = 0;
  	smokeEmitter.emit(this.duration);
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
		
		if(this.smokeEmitter.emitTime > this.smokeEmitter.emitTotalTimes
				&& this.smokeEmitter.particles.length == 0) {
			stage.removeChild(this);
			this.removeAllEventListeners();
		}
	}
};

window.DustCloudEmitter = createjs.promote(DustCloudEmitter, "Container");
}());
