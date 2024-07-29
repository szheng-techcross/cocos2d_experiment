function webgl_support() {
    try {
        var canvas = document.createElement('canvas');
        return !!window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
};

cc.create3DContext = function (canvas, opt_attribs) {
    let webglVersion = "";
    if (webgl_support()) {
        webglVersion = "webgl2";
        cc._webglVersion = 2;
    } else {
        webglVersion = "webgl"
        cc._webglVersion = 1;
    }

    var names = [webglVersion, "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            context = canvas.getContext(names[ii], opt_attribs);
        } catch (e) {
        }
        if (context) {
            break;
        }
    }
    return context;
};

cc._checkWebgl2Support = function () {
    return cc._webglVersion === 2;
};