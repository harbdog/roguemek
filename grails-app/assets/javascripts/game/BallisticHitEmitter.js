/**
 * Creates a proton particle emitter for the effect of being hit by a ballistic projectile
 */
(function() {
"use strict";

function BallisticHitEmitter(impactPoint, msDuration) {
	this.Container_constructor();
	
	this.duration = (msDuration/1000);
	
	this.x = impactPoint.x;
	this.y = impactPoint.y;
	this.proton = null;
	this.emitter = null;
	
	this.setup();
}
var c = createjs.extend(BallisticHitEmitter, createjs.Container);

BallisticHitEmitter.DIRECTIONS = [
    [0, 1], [1, 0], [1, 1],
    [0, -1], [-1, 0], [-1, -1],
    [1, -1], [-1, 1]
];

c.setup = function() {
	
	stage.addChild(this);
	
	var colors = [
  	    new createjs.Bitmap(queue.getResult("spark-yellow")),
  	    new createjs.Bitmap(queue.getResult("spark-white"))
  	];
	
	var proton = new Proton();
	var emitter = new Proton.Emitter();
	//set Rate
	emitter.rate = new Proton.Rate(Proton.getSpan(3, 6), 0.02);
	//add Initialize
	emitter.addInitialize(new Proton.ImageTarget(colors));
	emitter.addInitialize(new Proton.Life(0.15, 0.3));
	emitter.addInitialize(new Proton.Velocity(1.0, Proton.getSpan(0, 360), 'polar'));
	//add Behaviour
	emitter.addBehaviour(new Proton.Scale(new Proton.Span(0.1, 0.2), 0.1));
	
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
		// add some random emitter movement around the impact point for effect
      	var directionArray = BallisticHitEmitter.DIRECTIONS[getDieRollTotal(1, BallisticHitEmitter.DIRECTIONS.length) - 1];
      	var directionX = directionArray[0];
      	var directionY = directionArray[1];
      	
		this.emitter.p.x = (directionX * getDieRollTotal(1, hexWidth/16));
		this.emitter.p.y = (directionY * getDieRollTotal(1, hexWidth/16));
		
		this.proton.update();
		
		if(this.emitter.emitTime > this.emitter.emitTotalTimes
				&& this.emitter.particles.length == 0) {
			stage.removeChild(this);
			this.removeAllEventListeners();
		}
	}
};

window.BallisticHitEmitter = createjs.promote(BallisticHitEmitter, "Container");
}());
