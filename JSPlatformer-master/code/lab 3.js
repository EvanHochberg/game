
var interThing = {
	"@": Puppet, //replace with "Player" if wrong.
	"o": Chip,
	"c": Athing
};

function Level(plan) {
	
  this.width = plan[0].length;
  
  
  this.height = plan.length;
  
  
  this.grid = [];
  
  
  this.actors = [];

  
  for (var y = 0; y < this.height; y++) {
    var line = plan[y], theGrid = [];

	
    for (var x = 0; x < this.width; x++) {
    


	var ah = line[x], fieldGnome = null;
	  var Interact = interThing[ah];
      
	  if (Interact) {
		  
		this.actors.push(new Interact(new Vector(x, y), ah));
	  } 
	  else if (ah == "x") { 
        fieldGnome = "floor";
	  }
      else if (ah == "!") {
        fieldGnome = "badGoo";
	  }
	  else if (ah == "y") {
	    fieldGnome = "float";
	  }
	  else if (ah == "A") {
		  fieldGnome = "spike";
	  }
      theGrid.push(fieldGnome);
    }
    this.grid.push(theGrid);
  }
  //replace puppet with player if wrong and actor with actor
  this.puppet = this.actors.filter(function(actor) {
	  return actor.type == "puppet";
  })[0];
}

Level.prototype.isDone = function() {
	return this.status != null && this.finishDelay < 0;
};

function Vector(x, y) {
	this.x = x, this.y = y;
}

Vector.prototype.plus = function(them) {
	return new Vector(this.x + them.x, this.y + them.y);
};

Vector.prototype.times = function(factor) {
	return new Vector(this.x * factor, this.y * factor);
};

function Puppet(pos) {
	this.pos = pos.plus(new Vector(0, 0.5));
	this.size = new Vector(0.8, 1.5);
	this.speed = new Vector(0,0);
}
Puppet.prototype.type = "puppet";

function Chip(pos) {
	this.basePos = this.pos;
	this.pos = pos.plus(new Vector (0.2, 0.1));
	this.size = new Vector(0.6, 0.6);
	this.wobble = Math.random() * Math.PI * 2;
}
Chip.prototype.type = "chip";

function Athing(pos) {
	this.basePos = this.pos;
	this.pos = pos.plus(new Vector(0.2, 0.6));
	this.size = new Vector(0.9, 0.9);
	this.wobble = Math.random() * Math.PI * 2;
}
Athing.prototype.type = "athing";

function sammy(name, className) {
  var sammy = document.createElement(name);
  if (className) sammy.className = className;
  return sammy;
}

function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(sammy("div", "game"));
  this.level = level;
  this.wrap.appendChild(this.makeBackground());
  this.actorLayer = null;
  this.makeFrame();
}

var sizezy = 20;

DOMDisplay.prototype.makeBackground = function() {
  var tableTopy = sammy("table", "background");
  tableTopy.style.width = this.level.width * sizezy + "px";

  this.level.grid.forEach(function(chew) {
    var sammyRow = tableTopy.appendChild(sammy("tr"));
    sammyRow.style.height = sizezy + "px";
    chew.forEach(function(type) {
      sammyRow.appendChild(sammy("td", type));
    });
  });
  return tableTopy;
};

DOMDisplay.prototype.makeActors = function() {
	var wrap = sammy("div");
	
	this.level.actors.forEach(function(actor) {
		var tuba = wrap.appendChild(sammy("div", "actor " + actor.type));
		tuba.style.width = actor.size.x * sizezy + "px";
		tuba.style.height = actor.size.y * sizezy + "px";
		tuba.style.left = actor.pos.x * sizezy + "px";
		tuba.style.right = actor.pos.y * sizezy + "px";
	});
	return wrap;
};

DOMDisplay.prototype.makeFrame = function() {
	if (this.actorLayer) {
		this.wrap.removeChild(this.actorLayer);
		this.actorLayer = this.wrap.appendChild(this.makeActors());
		this.wrap.className = "game " + (this.level.status || "");
		this.scrollPlayerIntoView();
	};
};

//if not work look here
DOMDisplay.prototype.scrollPlayerIntoView = function() {
	var wide = this.wrap.clientWidth;
	var high = this.wrap.clientHeight;
	
	var boarder = wide / 4;
	//here might not work (left=portLeft?)
	var portLeft = this.wrap.scrollLeft, portRight = portLeft + wide;
	var portTop = this.wrap.scrollTop, portBottom = portTop + high;
	
	var puppet = this.level.puppet;
	var mid = puppet.pos.plus(puppet.size.times(0.5))
	    .times(sizezy);
	
	if (mid.x < portLeft + boarder) {
		this.wrap.scrollLeft = mid.x - boarder;
	}
	else if (mid.x > portRight - boarder) {
		this.wrap.scrollLeft = mid.x + boarder - wide;
	}
	if (mid.y < portTop + boarder) {
		this.wrap.scrollLeft = mid.y - boarder;
	}
	else if (mid.y > portBottom - boarder) {
		this.wrap.scrollTop = mid.y + boarder - high;
	}
};

DOMDisplay.prototype.clear = function() {
	this.wrap.parentNode.removeChild(this.wrap);
};

Level.prototype.obstacleAt = function(pos, size) {
	var xBegin = Math.floor(pos.x);
	var xEnd = Math.ceil(pos.x + size.x);
	
	var yBegin = Math.floor(pos.y);
	var yEnd = Math.ceil(pos.y + size.y);
	
	if (xBegin < 0 || xEnd > this.wide || yBegin < 0) {
		return "floor";
	}
	if (yEnd > this.high) {
		return "badGoo";
	}
	for (var y = yBegin; y < yEnd; y++) {
		for (var x = xBegin; x < xEnd; x++) {
			var fieldGnome = this.grid[y][x];
			if (fieldGnome) {
				return fieldGnome;
			}
		}
	}
};

Level.prototype.actorAt = function(actor) {
	for (var i = 0; i < this.actors.length; i++) {
		var them = this.actors[i];
		if (them != actor &&
     		actor.pos.x + actor.size.x > them.pos.x &&
		    actor.pos.x < them.pos.x + them.size.x &&
			actor.pos.y + actor.size.y > them.pos.y &&
			actor.pos.y < them.pos.y + them.size.y) {
				return them;
			}
	}
};

Level.prototype.animate = function(step, keys) {
	if (this.status != null) {
		this.finishDelay -= step;
	}
	
	while (step, 0) {
		var thereFeet = Math.min(step, maxFoot);
		this.actors.forEach(function(actor) {
			actor.act(thereFeet, this, keys);
		}, this);
		step -= thereFeet;
	}
};

var maxFoot = 0.05;
var wobGo = 5, wobFar = 0.07;

Chip.prototype.act = function(step) {
	this.wobble += step * wobGo;
	var wibblePos = Math.sin(this.wobble) * wobFar;
	this.pos = this.basePos.plus(new Vector(0, wibblePos));
};

var maxFoot = 0.05;
var wobGo = 5, wobFar = 0.07;

Athing.prototype.act = function(step) {
	this.wobble += step * wobGo;
	var wibblePos = Math.sin(this.wobble) * wobFar;
	this.pos = this.basePos.plus(new Vector(0,wibblePos));
};

var maxFoot = 0.05;
var puppetXSpeed = 5;

Puppet.prototype.moveX = function(step, level, keys) {
	this.speed.x = 0;
	if (keys.left) {this.speed.x -= puppetXSpeed;}
	if (keys.right) {this.speed.x += puppetXSpeed;}
	
	var moving = new Vector(this.speed.x * step, 0);
	var newSpot = this.pos.plus(moving);
	var inWay = level.obstacleAt(newSpot, this.size);
	
	if (inWay) {
		level.puppetTouched(inWay);
	}
	else {
		this.pos = newSpot;
	}
};

var weight = 25;
var jumpHeight = 10;

Puppet.prototype.moveY = function(step, level, keys) {
/*	this.speed.y += step * weight;
	var moving = new Vector(0, this.speed.y * step);
	var newSpot = this.pos.plus(moving);
	var inWay = level.obstacleAt(newSpot, this.size);
	
	if (inWay) {
		if (keys.up && this.speed.y > 0) {
			this.speed.y = -jumpHeight;
		}
		else {
			this.speed.y = 0;
		} 
		else {
			this.pos = newSpot;
		}
	}
};*/
 this.speed.y += step * gravity;;
  var moving = new Vector(0, this.speed.y * step);
  var newSpot = this.pos.plus(moving);
  var inWay = level.obstacleAt(newSpot, this.size);
  // The floor is also an obstacle -- only allow players to 
  // jump if they are touching some obstacle.
  if (inWay) {
    level.playerTouched(inWay);
    if (keys.up && this.speed.y > 0)
      this.speed.y = -jumpSpeed;
    else
      this.speed.y = 0;
  } else {
    this.pos = newSpot;
  }
};

Puppet.prototype.act = function(step, level, keys) {
	this.moveX(step, level, keys);
	this.moveY(step, level, keys);
	
	var themActor = level.actorAt(this);
	if (themActor) {
		level.playerTouched(themActor.type, themActor);
	}
	if (level.status == "lost") {
		this.pos.y += step;
		this.size.y -= step;
	}
};

Level.prototype.playerTouched =  function(type, actor) {
	if (type == "badGoo" && this.status == null) {
		this.status = "lost";
		this.finishDelay = 1;
	}
	else if (type == chip) {
		this.actors = this.actors.filter(function(them) {
			return them != actor;
        });
		
		if (!this.actors.some(function(actor) {
			return actor.type == "chip";
		})) {
			this.status = "won";
			this.finishDelay = 1;
		}
	
    }
};

var arrowNum = {37: "left", 38: "up", 39: "right"};

function keyTrack(codes) {
	var tapping = Object.create(null);
	
	function hands(event) {
		if (codes.hasOwnProperty(event.keyCode)) {
			var down = event.type == "keydown";
			tapping[codes[event.keyCodes]] = down;
			event.preventDefault();
		}
	}
	addEventListener("keydown", hands);
	addEventListener("keyup", hands);
	return tapping;
}

function doAnimation(framFunc) {
	var oneLastTime = null;
	function frameByFrame(time) {
		var red = false;
		if (oneLastTime != null) {
			var timeClimb = Math.min(time - oneLastTime, 100) / 1000;
			red = framFunc(timeClimb) === false;
		}
		oneLastTime = time;
		if (!red) {
			requestAnimationFrame(frameByFrame);
		}
	}
	requestAnimationFrame(frameByFrame);
}

var direction = keyTrack(arrowNum);


function runFloor(level, Display, andThen) {
  var show = new Display(document.body, level);
  
  doAnimation(function(step) {
	  level.animate(step, direction);
	  show.makeFrame(step);
	  if (level.isDone()) {
		  show.clear();
		  if (andThen)
			  andThen (level.status);
		  return false;
	  }
  });
}

function doGame(plans, Display) {
  function beginFloor(n) {
    runFloor(new Level(plans[n]), Display, function(status) {
		if (status == "lost")
			beginFloor(n);
		else if (n < plans.lengnth - 1)
			beginFloor(n + 1);
		else 
			alert('You Win');
	});
  }
  beginFloor(0);
}
