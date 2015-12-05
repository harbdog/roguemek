/**
 * Creates a proton particle emitter for the effect of being hit by a PPC
 */
(function() {
"use strict";

function PPCHitEmitter(lightning, msDuration) {
	this.Container_constructor();
	
	this.lightning = lightning;
	this.duration = (msDuration/1000);
	
	this.x = lightning.endX;
	this.y = lightning.endY;
	this.proton = null;
	this.emitter = null;
	
	this.setup();
}
var c = createjs.extend(PPCHitEmitter, createjs.Container);

c.setup = function() {
	
	stage.addChild(this);
	
	var colors = [
	    new createjs.Bitmap(queue.getResult("particle-blue")),
	    new createjs.Bitmap(queue.getResult("particle-white"))
	];
	
	var proton = new Proton();
	var emitter = new Proton.Emitter();
	//set Rate
	emitter.rate = new Proton.Rate(Proton.getSpan(5, 10), 0.05);
	//add Initialize
	emitter.addInitialize(new Proton.ImageTarget(colors));
	emitter.addInitialize(new Proton.Life(0.5, 1));
	emitter.addInitialize(new Proton.Velocity(0.4, Proton.getSpan(0, 360), 'polar'));
	//add Behaviour
	emitter.addBehaviour(new Proton.Alpha(1, 0.75));
	emitter.addBehaviour(new Proton.Scale(new Proton.Span(0.2, 0.3), 0.1));
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
	
	if(this.emitter && this.lightning) {
		this.emitter.p.x = this.lightning.endX - this.x;
		this.emitter.p.y = this.lightning.endY - this.y;
	}
};

window.PPCHitEmitter = createjs.promote(PPCHitEmitter, "Container");
}());
