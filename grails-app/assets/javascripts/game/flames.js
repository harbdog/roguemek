/**
 * Flame code originally sourced from 
 * http://thecodeplayer.com/walkthrough/html5-canvas-experiment-a-cool-flame-fire-effect-using-particles
 */
function Flames(x, y) {
	this.particles = [];
	this.initialize(x, y);
}
Flames.prototype = new createjs.Shape();
Flames.prototype.Shape_initialize = Flames.prototype.initialize;
Flames.prototype.initialize = function(x, y) {
	this.Shape_initialize();
	this.x = x;
	this.y = y;
	
	//Lets create some particles now
	var particle_count = 50;
	for(var i = 0; i < particle_count; i++)
	{
		this.particles.push(new Particle(0, 0));
	}
	
	this.g = this.graphics;
	
	this.on("tick", this.update);
}
Flames.prototype.update = function() {
	for(var i = 0; i < this.particles.length; i++)
	{
		var p = this.particles[i];
		//ctx.beginPath();
		//changing opacity according to the life.
		//opacity goes to 0 at the end of life of a particle
		p.opacity = Math.round(p.remaining_life/p.life*100)/100
		//a gradient instead of white fill
		//var gradient = ctx.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius);
		//gradient.addColorStop(0, "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")");
		//gradient.addColorStop(0.5, "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")");
		//gradient.addColorStop(1, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
		//ctx.fillStyle = gradient;
		//ctx.arc(p.location.x, p.location.y, p.radius, Math.PI*2, false);
		//ctx.fill();
		this.g.beginRadialGradientFill(
				["rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")", "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")", "rgba("+p.r+", "+p.g+", "+p.b+", 0)"],
				[0, 0.5, 1], p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius
		).arc(p.location.x, p.location.y, p.radius, 0, Math.PI*2, false);
		
		
		//lets move the particles
		p.remaining_life--;
		p.radius--;
		p.location.x += p.speed.x;
		p.location.y += p.speed.y;
		
		//regenerate particles
		if(p.remaining_life < 0 || p.radius < 0)
		{
			//a brand new particle replacing the dead one
			this.particles[i] = new Particle(0, 0);
		}
	}
}

function Particle(x, y) {
	this.initialize(x, y);
}
Particle.prototype.initialize = function(x, y) {
	//speed, life, location, life, colors
	//speed.x range = -2.5 to 2.5 
	//speed.y range = -15 to -5 to make it move upwards
	//lets change the Y speed to make it look like a flame
	this.speed = {x: -Math.random()*2.5, y: -Math.random()*2.5};
	//location = given coordinates
	//Now the flame follows the given coordinates
	this.location = {x: x, y: y};
	//radius range = 10-30
	this.radius = 5+Math.random()*5;
	//life range = 20-30
	this.life = 20+Math.random()*100;
	this.remaining_life = this.life;
	//colors
	this.r = Math.round(Math.random()*55 + 200);
	this.g = Math.round(Math.random()*100);
	this.b = Math.round(0);
}
