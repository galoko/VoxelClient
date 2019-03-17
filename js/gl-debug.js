function glEnumToString(gl, value) {
    // Optimization for the most common enum:
    if (value === gl.NO_ERROR) {
        return "NO_ERROR";
    }
    for (const p in gl) {
        if (gl[p] === value) {
            return p;
        }
    }
    return "0x" + value.toString(16);
}

function createGLErrorWrapper(context, fname) {
    return function() {
        const rv = context[fname].apply(context, arguments);
        const err = context.getError();
        if (err !== context.NO_ERROR)
            throw "GL error " + glEnumToString(context, err) + " in " + fname;
        return rv;
    };
}

function create3DContextWithWrapperThatThrowsOnGLError(context) {

    const wrap = {};
    for (const i in context) {
        try {
            if (typeof context[i] === 'function') {
                wrap[i] = createGLErrorWrapper(context, i);
            } else {
                wrap[i] = context[i];
            }
        } catch (e) {
            error("createContextWrapperThatThrowsOnGLError: Error accessing " + i);
        }
    }
    wrap.getError = function() {
        return context.getError();
    };
    return wrap;
}