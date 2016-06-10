// This is a manifest file that loads the javascript files needed for running the game.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
//= require jquery.min.js
//= require jquery-ui.min.js
//= require jquery.ui.touch-punch.min.js
//= require jquery.form.js
//= require atmosphere-meteor-jquery
//= require spectrum-1.7.1.js
//= require createjs-2015.05.21.min.js
//= require amplify-1.1.2.js
//= require proton-1.0.0.js
//= require fullscreen-api.js
//= require atmosphereHPG.js
//= require game/roguemek.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){
    initLoadingStarField();
	initGame();
});

// Star field code sourced from http://www.kevs3d.co.uk/dev/warpfield/
var width, height, spaceCanvas, mousex, mousey, Rnd, Sin, Floor, warpZ, spaceUnits, stars, cycle, Z;
function initLoadingStarField() {
    // requestAnimFrame shim
    window.requestAnimFrame = (function()
    {
       return  window.requestAnimationFrame       || 
               window.webkitRequestAnimationFrame || 
               window.mozRequestAnimationFrame    || 
               window.oRequestAnimationFrame      || 
               window.msRequestAnimationFrame     || 
               function(callback)
               {
                   window.setTimeout(callback);
               };
    })();

    // get dimensions of window and resize the canvas to fit
    width = window.innerWidth;
    height = window.innerHeight;
    spaceCanvas = document.getElementById("canvas");
    mousex = width/2;
    mousey = height/2;
    
    spaceCanvas.width = width;
    spaceCanvas.height = height;
    
    // get 2d graphics context and set global alpha
    var G=spaceCanvas.getContext("2d");
    G.globalAlpha=0.25;
    
    // setup aliases
    Rnd = Math.random;
    Sin = Math.sin;
    Floor = Math.floor;
    
    // constants and storage for objects that represent star positions
    warpZ = 12;
    spaceUnits = 500;
    stars = [];
    cycle = 0;
    Z = 0.025 + (1/25 * 2);
    
    // mouse events
    addCanvasEventListener("mousemove", function(e) {
       mousex = e.clientX;
       mousey = e.clientY;
    });
    
    addCanvasEventListener("DOMMouseScroll", wheel);
    addCanvasEventListener("mousewheel", wheel);
    
    // initial star setup
    for (var i=0, n; i<spaceUnits; i++)
    {
       n = {};
       resetstar(n);
       stars.push(n);
    }
    
    // star rendering anim function
    var rf = function()
    {
       // clear background
       G.fillStyle = "#000";
       G.fillRect(0, 0, width, height);
       
       // mouse position to head towards
       var cx = (mousex - width / 2) + (width / 2),
           cy = (mousey - height / 2) + (height / 2);
       
       // update all stars
       var sat = Floor(Z * 500);       // Z range 0.01 -> 0.5
       if (sat > 100) sat = 100;
       for (var i=0; i<spaceUnits; i++)
       {
          var n = stars[i],            // the star
              xx = n.x / n.z,          // star position
              yy = n.y / n.z,
              e = (1.0 / n.z + 1) * 2;   // size i.e. z
          
          if (n.px !== 0)
          {
             // hsl colour from a sine wave
             G.strokeStyle = "hsl(" + ((cycle * i) % 360) + "," + sat + "%,80%)";
             G.lineWidth = e;
             G.beginPath();
             G.moveTo(xx + cx, yy + cy);
             G.lineTo(n.px + cx, n.py + cy);
             G.stroke();
          }
          
          // update star position values with new settings
          n.px = xx;
          n.py = yy;
          n.z -= Z;
          
          // reset when star is out of the view field
          if (n.z < Z || n.px > width || n.py > height)
          {
             // reset star
             resetstar(n);
          }
       }
       
       // colour cycle sinewave rotation
       cycle += 0.01;
       
       if(initializing) {
           // keep showing the star field until the game is finished loading
           requestAnimFrame(rf);
       }
    };
    requestAnimFrame(rf);
}

function addCanvasEventListener(name, fn)
{
   spaceCanvas.addEventListener(name, fn, false);
}

function wheel (e) {
   var delta = 0;
   if (e.detail)
   {
      delta = -e.detail / 3;
   }
   else
   {
      delta = e.wheelDelta / 120;
   }
   var doff = (delta/25);
   if (delta > 0 && Z+doff <= 0.5 || delta < 0 && Z+doff >= 0.01)
   {
      Z += (delta/25);
      //console.log(delta +" " +Z);
   }
}

// function to reset a star object
function resetstar(a)
{
   a.x = (Rnd() * width - (width * 0.5)) * warpZ;
   a.y = (Rnd() * height - (height * 0.5)) * warpZ;
   a.z = warpZ;
   a.px = 0;
   a.py = 0;
}
