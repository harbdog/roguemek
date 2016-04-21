/**
 * Creates a proton particle emitter for the effect of being hit by a laser
 */
(function() {
"use strict";

function MissileTrailEmitter(missile, msDuration) {
	this.Container_constructor();
	
	this.missile = missile;
	this.duration = (msDuration/1000);
	
	this.x = missile.x;
	this.y = missile.y;
	this.smoke = null;
	this.smokeEmitter = null;
	
	this.setup();
}
var c = createjs.extend(MissileTrailEmitter, createjs.Container);

c.setup = function() {
	
	stage.addChild(this);
	
	// create the smoke that is also created with the explosions
  	var smoke = new Proton();
  	var smokeEmitter = new Proton.Emitter();
  	//set Rate
  	smokeEmitter.rate = new Proton.Rate(Proton.getSpan(2, 3), 0.03);
  	//add Initialize
  	smokeEmitter.addInitialize(new Proton.ImageTarget(new createjs.Bitmap(queue.getResult("particle-smoke"))));
  	smokeEmitter.addInitialize(new Proton.Life(0.5, 0.75));
  	smokeEmitter.addInitialize(new Proton.Velocity(0.1, Proton.getSpan(100, 260), 'polar'));
  	//add Behaviour
  	smokeEmitter.addBehaviour(new Proton.Alpha(0.85, 0.6));
  	smokeEmitter.addBehaviour(new Proton.Scale(new Proton.Span(0.05, 0.1), 0.1));
  	
  	//set emitter position
  	smokeEmitter.p.x = this.missile.conf.burnerRadius;
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
	
	if(this.smokeEmitter && this.missile) {
		this.smokeEmitter.p.x = this.missile.x - this.x;
		this.smokeEmitter.p.y = this.missile.y - this.y + this.missile.conf.burnerRadius;
		
		if(this.smokeEmitter.emitTime > this.smokeEmitter.emitTotalTimes
				&& this.smokeEmitter.particles.length == 0) {
			stage.removeChild(this);
			this.removeAllEventListeners();
		}
	}
};

window.MissileTrailEmitter = createjs.promote(MissileTrailEmitter, "Container");
}());
