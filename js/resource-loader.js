function ResourceLoader() {
}

ResourceLoader.prototype.initialize = function() {
	this.state = 0;
};

ResourceLoader.prototype.loadAllResources = function (callback) {
	
    if (this.state !== 0)
        return;
	
	this.callback = callback;
    this.state = 1;
	
    this.blocks = this.loadTexture('res/blocks.png');
};

ResourceLoader.prototype.advanceState = function () {

    if (this.state === 0) {
        console.warn("resourceLoader: state is advanced beyond finish state");
        return;
    }

    this.state--;
    if (this.state === 0)
        this.callback();
};

ResourceLoader.prototype.loadTexture = function(url) {
	var gl = render.gl;

    var tex = gl.createTexture();

    var image = new Image();

	var self = this;
    image.onload = function() {
		var gl = render.gl;

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        self.setupTextureFiltering();

        self.advanceState();
    };
    image.src = url;

    return tex;
};

ResourceLoader.prototype.createTexture = function (size) {
    return this.createTextureWithData(size, null);
};

ResourceLoader.prototype.createTextureWithData = function (size, pixels) {
	var gl = render.gl;

    var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    this.setupTextureFiltering();

    return tex;
};

ResourceLoader.prototype.setupTextureFiltering = function () {
	var gl = render.gl;
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
};