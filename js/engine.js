var engine = new Engine();
var render = new Render();
var resourceLoader = new ResourceLoader();

function Engine() {
}

Engine.prototype.initialize = function () {	
	render.initialize();
	resourceLoader.initialize();
	
	resourceLoader.loadAllResources(this.loaded.bind(this));
};

Engine.prototype.loaded = function () {
	
	render.loaded();
	
	render.setCameraPosition(0, 0, 1);
	render.lookAtPoint(1, 1, 0);
	
	this.debugRender();
	
	this.tickCallback = this.tick.bind(this);
	this.scheduleNextTick();
};

Engine.prototype.debugRender = function () {
	
	var surface = {
		id: 0,
		type: 0,
		vertices: [ 
			1.0, 1.0, 
			4.0, 1.0,
			4.0, 4.0,
			1.0, 4.0,
		],
		constantCoord: 0.0,
		indices: [
			0, 1, 2,
			2, 3, 0
		],
		tex: [
			0, 1, 2,
			2, 1, 3,
			1, 0, 2
		],
		light: [
			0, 1, 2,
			3, 4, 5,
			5, 6, 7	
		]
	};
	
	render.addSurface(surface);
};

Engine.prototype.scheduleNextTick = function () {
	window.requestAnimationFrame(this.tickCallback);
};

Engine.prototype.tick = function () {
	this.scheduleNextTick();
	
	render.draw();
};

engine.initialize();