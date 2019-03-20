function Render() {
}

Render.prototype.initialize = function () {

	if (!this.setupGL())
		throw "Couldn't setup GL";
};

Render.prototype.setupGL = function() {

    var canvas = document.getElementById('scene');
	
    var gl = canvas.getContext('webgl');
    if (!gl)
        gl = canvas.getContext('experimental-webgl');

    if (!gl)
        return false;
	
	if ('create3DContextWithWrapperThatThrowsOnGLError' in window) {
		gl = create3DContextWithWrapperThatThrowsOnGLError(gl);
	}
	
	this.canvas = canvas;
	this.gl = gl;
	
	// settings
			
    gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CW);
    gl.cullFace(gl.BACK);
	
	gl.enable(gl.DEPTH_TEST);
	  
	gl.clearColor(0x8F / 255, 0xB1 / 255, 0xD2 / 255, 1);
	
	// shader
	
	this.surfaceShader = this.compileShader('surface', 
		['VP', 'blockTexture', 'mapTexture'], ['vertexPosition', 'vertexTexCoord']);
    this.surfaceShader.use();
    gl.uniform1i(this.surfaceShader.blockTexture, 0);
    gl.uniform1i(this.surfaceShader.mapTexture, 1);
	
	this.projection = glMatrix.mat4.create();
    this.view = glMatrix.mat4.create();
	this.VP = glMatrix.mat4.create();
	
	// screen
	
	window.addEventListener("resize", this.setupScreenSize.bind(this));
	this.setupScreenSize();
	
	// buffers
	
	var VERTEX_BUFFER_SIZE = 32 * 32 * 32 * 6 * 4;
	
    this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	// vertices -> floats -> bytes
	gl.bufferData(gl.ARRAY_BUFFER, VERTEX_BUFFER_SIZE * 7 * 4, gl.STATIC_DRAW);
	
	this.verticesAllocator = new Allocator(VERTEX_BUFFER_SIZE);
	
	var INDEX_BUFFER_SIZE = 32 * 32 * 32 * 6 * 6;
	
	this.indexBuffer = gl.createBuffer();	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	// indices -> shorts -> bytes
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, INDEX_BUFFER_SIZE * 1 * 2, gl.STATIC_DRAW);
	
	this.indicesAllocator = new Allocator(INDEX_BUFFER_SIZE);
	
	// vertex layout
	
    gl.vertexAttribPointer(this.surfaceShader.vertexPosition, 3, 
		gl.FLOAT, false,
		7 * Float32Array.BYTES_PER_ELEMENT, 
		0 * Float32Array.BYTES_PER_ELEMENT);
	gl.enableVertexAttribArray(this.surfaceShader.vertexPosition);
		
    gl.vertexAttribPointer(this.surfaceShader.vertexTexCoord, 4, 
		gl.FLOAT, false,
		7 * Float32Array.BYTES_PER_ELEMENT, 
		3 * Float32Array.BYTES_PER_ELEMENT);
	gl.enableVertexAttribArray(this.surfaceShader.vertexTexCoord);
	
	// camera
	
	this.cameraPosition = glMatrix.vec3.fromValues(0, 0, 0);
	this.cameraRotation = glMatrix.vec2.fromValues(0, 0);
	
	this.updateProjectionMatrix();
	this.updateViewMatrix();

    return true;
};

Render.prototype.loaded = function () {
	var gl = this.gl;
	
	gl.activeTexture(gl.TEXTURE0);
	this.blockTexture = resourceLoader.blocks;
    gl.bindTexture(gl.TEXTURE_2D, this.blockTexture);	
	
	gl.activeTexture(gl.TEXTURE1);
	this.mapTexture = resourceLoader.createTexture(512);
    gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
	
	this.mapPixelAllocator = new Allocator(512 * 512);
	
	// this.debugWritePixels();
};

Render.prototype.setupScreenSize = function () {
	
	var width = this.canvas.clientWidth;
	var height = this.canvas.clientHeight;
	
	var dpr = window.devicePixelRatio;
	
	this.screenWidth = width * dpr;
	this.screenHeight = height * dpr;
	
	this.canvas.width = this.screenWidth;
	this.canvas.height = this.screenHeight;
	
	this.updateProjectionMatrix();
	
	this.gl.viewport(0.0, 0.0, this.screenWidth, this.screenHeight);
};

Render.prototype.setCameraPosition = function (x, y, z) {
	
	this.cameraPosition[0] = x;
	this.cameraPosition[1] = y;
	this.cameraPosition[2] = z;
	
	this.updateViewMatrix();
};

Render.prototype.lookAtPoint = function (x, y, z) {
	
	var point = glMatrix.vec3.fromValues(x, y, z);
	
	var direction = glMatrix.vec3.create();
	glMatrix.vec3.subtract(direction, point, this.cameraPosition);
	glMatrix.vec3.normalize(direction, direction);

    var sinX = Math.sqrt(1 - direction[2] * direction[2]);

    this.cameraRotation[0] = Math.atan2(sinX, direction[2]);
    this.cameraRotation[1] = Math.atan2(direction[0] / sinX, direction[1] / sinX);

    this.updateViewMatrix();
};

Render.prototype.updateProjectionMatrix = function () {
	
	var aspectRatio = this.screenWidth / this.screenHeight;
	
	var FOV = 60;
	
    glMatrix.mat4.perspective(this.projection, glMatrix.glMatrix.toRadian(FOV), 
		aspectRatio, 0.1, 1000.0);
	
	this.projectionMatrixNeedUpdate = true;
	this.vpMatrixNeedUpdate = true;
};

Render.prototype.updateViewMatrix = function () {

    // limit angles
	this.cameraRotation.z %= Math.PI * 2;
    this.cameraRotation.x = Math.min(Math.max(0.1, this.cameraRotation.x), 3.13);

    var sinX = Math.sin(this.cameraRotation[0]);
	var cosX = Math.cos(this.cameraRotation[0]);
    var sinZ = Math.sin(this.cameraRotation[1]);
	var cosZ = Math.cos(this.cameraRotation[1]);
	
	var lookPosition = glMatrix.vec3.fromValues(
		this.cameraPosition[0] + sinX * sinZ, 
		this.cameraPosition[1] + sinX * cosZ, 
		this.cameraPosition[2] + cosX);
	
	var up = glMatrix.vec3.fromValues(0, 0, 1);
	
    glMatrix.mat4.lookAt(this.view, this.cameraPosition, lookPosition, up);
	
	this.viewMatrixNeedUpdate = true;
	this.vpMatrixNeedUpdate = true;
};

Render.prototype.transferViewProjection = function (shader) {
	var gl = this.gl;
		
	if (shader.VP) {
			
		if (this.vpMatrixNeedUpdate) {
			glMatrix.mat4.mul(this.VP, this.projection, this.view);
			this.vpMatrixNeedUpdate = false;
		}
		
		gl.uniformMatrix4fv(shader.VP, gl.FALSE, this.VP);
	}
};

// surface data -> gpu representation

Render.prototype.setPixelsSubRegion = function (dstPixel, srcPixel, surface, width, height) {
	var gl = this.gl;
	
	var dstX = dstPixel % 512;
	var dstY = Math.trunc(dstPixel / 512);
	
	var size = width * height;
	var byteSize = size * 4;
	var pixels = new Uint8Array(byteSize);
	
	// TODO calc this value using block texture size in pixels
	var BLOCK_TEX_SIZE_IN_BLOCKS = 2;
	
	for (var i = srcPixel, j = 0; i < srcPixel + size; i++, j += 4) {
		
		var blockId = surface.tex[i]; // 0..65535
		var lightLevel = surface.light[i]; // 0..15
		
		var blockX = blockId % BLOCK_TEX_SIZE_IN_BLOCKS;
		var blockY = Math.trunc(blockId / BLOCK_TEX_SIZE_IN_BLOCKS);
		
		pixels[j + 0] = blockX;
		pixels[j + 1] = blockY;
		pixels[j + 2] = lightLevel * 17; // 0..15 -> 0..255
		pixels[j + 3] = 0;
	}
	
	gl.texSubImage2D(gl.TEXTURE_2D, 0, dstX, dstY, width, height, 
		gl.RGBA, gl.UNSIGNED_BYTE, pixels);
};

Render.prototype.writePixels = function (surface) {
		
	var currentDstPixel = surface.startPixel;
	var currentSrcPixel = 0;
	
	var inputPixelRemaining = surface.pixelCount - currentSrcPixel;
	if (inputPixelRemaining < 1)
		return;
		
	var allowedToWriteToCurrentRow = 512 - currentDstPixel % 512;
	if (allowedToWriteToCurrentRow < 512) {
				
		var writeCount = Math.min(allowedToWriteToCurrentRow, inputPixelRemaining);
			
		this.setPixelsSubRegion(currentDstPixel, currentSrcPixel, surface, 
			writeCount, 1);
		
		currentDstPixel += writeCount;
		currentSrcPixel += writeCount;
		
		// update remaining pixels
		inputPixelRemaining = surface.pixelCount - currentSrcPixel;
		if (inputPixelRemaining < 1)
			return;
	}
	
	var inputFullRowCount = Math.trunc(inputPixelRemaining / 512);
	if (inputFullRowCount > 0) {
		
		var writeCount = inputFullRowCount * 512;
		
		this.setPixelsSubRegion(currentDstPixel, currentSrcPixel, surface, 
			512, inputFullRowCount);
		
		currentDstPixel += writeCount;
		currentSrcPixel += writeCount;
		
		// update remaining pixels
		inputPixelRemaining = surface.pixelCount - currentSrcPixel;
		if (inputPixelRemaining < 1)
			return;
	}
	
	this.setPixelsSubRegion(currentDstPixel, currentSrcPixel, surface, 
		inputPixelRemaining, 1);
};

Render.prototype.convertFunctions = [
	// x y c
	function (x, y, c, dstVertices, dstIndex) {
		dstVertices[dstIndex + 0] = x;
		dstVertices[dstIndex + 1] = y;
		dstVertices[dstIndex + 2] = c;
	},
	// x c z
	function (x, z, c, dstVertices, dstIndex) {
		dstVertices[dstIndex + 0] = x;
		dstVertices[dstIndex + 1] = c;
		dstVertices[dstIndex + 2] = z;
	},
	// c y z
	function (y, z, c, dstVertices, dstIndex) {
		dstVertices[dstIndex + 0] = c;
		dstVertices[dstIndex + 1] = y;
		dstVertices[dstIndex + 2] = z;
	}
];

Render.prototype.writeVertices = function (surface) {
	var gl = this.gl;
	
	var rect = { };
	var shaderVertices = new Float32Array(surface.vertexCount * 7);

	var convertFunction = this.convertFunctions[Math.trunc(surface.type / 2)];

	for (var srcIndex = 0, dstIndex = 0; srcIndex < surface.vertices.length; 
		srcIndex += 2, dstIndex += 7) {
			
		var x = surface.vertices[srcIndex + 0];
		var y = surface.vertices[srcIndex + 1];
		
		rect.left = Math.min(rect.left !== undefined ? rect.left : x, x);
		rect.right = Math.max(rect.right !== undefined ? rect.right : x, x);	
		rect.top = Math.min(rect.top !== undefined ? rect.top : y, y);
		rect.bottom = Math.max(rect.bottom !== undefined ? rect.bottom : y, y);		
		
		convertFunction(x, y, surface.constantCoord, shaderVertices, dstIndex);
	}
	
	rect.width = rect.right - rect.left;
	rect.height = rect.bottom - rect.top;
	
	var start = surface.startPixel / 512;
	var stride = rect.width / 512;
	
	for (var srcIndex = 0, dstIndex = 3; srcIndex < surface.vertices.length; 
		srcIndex += 2, dstIndex += 7) {
			
		var x = surface.vertices[srcIndex + 0] - rect.left;
		var y = surface.vertices[srcIndex + 1] - rect.top;
		
		var e = 0.5 / 512.0;
				
		shaderVertices[dstIndex + 0] = Math.max(0, x - e); // x in blocks
		shaderVertices[dstIndex + 1] = Math.max(0, y - e); // y in blocks
		shaderVertices[dstIndex + 2] = start; // start in 1/512
		shaderVertices[dstIndex + 3] = stride; // stride in 1/512
	}
	
	// vertices -> floats -> bytes
	gl.bufferSubData(gl.ARRAY_BUFFER, surface.startVertex * 7 * 4, shaderVertices);
};

Render.prototype.writeIndices = function (surface) {
	var gl = this.gl;
	
	var shaderIndices = new Uint16Array(surface.indices.length);
	
	for (var index = 0; index < shaderIndices.length; index++) {
		shaderIndices[index] = surface.startVertex + surface.indices[index];
	}
	
	// indices -> shorts -> bytes
	gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, surface.startIndex * 1 * 2, 
		shaderIndices);
};

// specific data allocators

Render.prototype.allocateTextureData = function (surface) {
	var gl = this.gl;
	
	surface.pixelCount = surface.tex.length;
	surface.startPixel = this.mapPixelAllocator.malloc(surface.pixelCount);
	
	this.writePixels(surface);
};

Render.prototype.allocateVertexData = function (surface) {
	var gl = this.gl;
	
	surface.vertexCount = surface.vertices.length / 2;
	surface.startVertex = this.verticesAllocator.malloc(surface.vertexCount);
	
	this.writeVertices(surface);
};

Render.prototype.allocateIndexData = function (surface) {
	var gl = this.gl;
	
	surface.indexCount = surface.indices.length;
	surface.startIndex = this.indicesAllocator.malloc(surface.indexCount);
	
	this.writeIndices(surface);
};

Render.prototype.addSurface = function (surface) {
	var gl = this.gl;
	
	this.allocateTextureData(surface);
	this.allocateVertexData(surface);
	this.allocateIndexData(surface);
};

Render.prototype.draw = function () {
	var gl = this.gl;
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	this.surfaceShader.use();
	this.transferViewProjection(this.surfaceShader);
	
	gl.drawElements(gl.TRIANGLES, this.indicesAllocator.getAllocatedCount(), 
		gl.UNSIGNED_SHORT, 0);
	
	this.projectionMatrixNeedUpdate = false;
	this.viewMatrixNeedUpdate = false;
	this.vpMatrixNeedUpdate = false;
};

Render.prototype.compileShader = function (name, uniforms, attributes) {
	
	var gl = this.gl;

	var vertexShaderCode = document.getElementById(name + '.vert').textContent;
	var fragmentShaderCode = document.getElementById(name + '.frag').textContent;

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.shaderSource(fragmentShader, fragmentShaderCode);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader for ' + name + '!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader for ' + name + '!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    var instance = {
        program: program,

        use: function () {
            gl.useProgram(this.program);
        }
    };

    uniforms.forEach(function (uniform) {
        instance[uniform] = gl.getUniformLocation(program, uniform);
    });
	
    attributes.forEach(function (attribute) {
        instance[attribute] = gl.getAttribLocation(program, attribute);
    });

    return instance;
};

// tests

Render.prototype.debugWritePixels = function () {
	
	var tex0 = new Uint16Array(12);
	var light0 = new Uint16Array(12);
	
	var tex1 = new Uint16Array((512 - 12) + 512 + 512 + 8);
	var light1 = new Uint16Array((512 - 12) + 512 + 512 + 8);
	
	var tex2 = new Uint16Array((512 - 8));
	var light2 = new Uint16Array((512 - 8));
	
	this.writePixels(this.allocateMapPixels(tex0.length), tex0, light0);	
	this.writePixels(this.allocateMapPixels(tex1.length), tex1, light1);	
	this.writePixels(this.allocateMapPixels(tex2.length), tex2, light2);
};