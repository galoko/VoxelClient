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
	render.lookAtPoint(3, 3, 0.5);
	
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
			1, 2, 0,
			2, 1, 3,
			0, 3, 1
		],
		light: [
			15, 12, 9,
			12,  9, 6,
			 9,  6, 3	
		]
	};

	render.addSurface(surface);
	
	var surface = {
		id: 1,
		type: 4,
		vertices: [ 
			1.0, 0.0, 
			4.0, 0.0,
			4.0, 3.0,
			1.0, 3.0,
		],
		constantCoord: 4.0,
		indices: [
			0, 1, 2,
			2, 3, 0
		],
		tex: [
			0, 0, 0,
			0, 0, 0,
			0, 0, 0
		],
		light: [
			 9, 12,  9,
			12, 15, 12,
			 9, 12,  9	
		]
	};
	
	render.addSurface(surface);
	
	var surface = {
		id: 2,
		type: 2,
		vertices: [ 
			1.0, 0.0, 
			4.0, 0.0,
			4.0, 3.0,
			1.0, 3.0,
		],
		constantCoord: 4.0,
		indices: [
			0, 1, 2,
			2, 3, 0
		],
		tex: [
			1, 2, 2,
			2, 2, 2,
			2, 2, 2
		],
		light: [
			9, 9, 9,
			7, 7, 7,
			5, 5, 5	
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