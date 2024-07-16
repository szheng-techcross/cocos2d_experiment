cc.ParticleGPU = cc.Sprite.extend({
    _className:"ParticleGPU",

    ctor:function (fileName, rect, rotated) {
        cc.Sprite.prototype.ctor.call(this, fileName, rect, rotated);
    },

    // This is mandatory as it will help generate the right render cmd
    // For now only supports webgl
    _createRenderCmd: function(){
        return new cc.ParticleGPU.WebGLRenderCmd(this);
    }
});

cc.ParticleGPU.create = function(fileName, rect, rotated) {
    return new cc.ParticleGPU(fileName, rect, rotated);
};

(function () {
    cc.ParticleGPU.WebGLRenderCmd = function(renderable) {
        cc.Sprite.WebGLRenderCmd.call(this, renderable);
        // Variables for the custom rendering path per command
        this._needDraw = true;
        this._matrix = new cc.math.Matrix4();
        this._matrix.identity();

        this._shaderProgram = cc._customProgram;

        this.computeRenderData();

        this._angle = 0.0;

        this._frameBuffer = gl.createFramebuffer();
        this._targetTexture = gl.createTexture();
        this._viewportSize = 1024;

        gl.bindTexture(gl.TEXTURE_2D, this._targetTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            this._viewportSize, this._viewportSize, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, null);

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    var proto = cc.ParticleGPU.WebGLRenderCmd.prototype = Object.create(cc.Sprite.WebGLRenderCmd.prototype);
    proto.constructor = cc.ParticleGPU.WebGLRenderCmd;

    proto.beforeRender = function (ctx) {
        var gl = ctx || cc._renderContext;

        this._beforeShader = gl.getParameter(gl.CURRENT_PROGRAM);
        this._oldDepthWriteValue = gl.getParameter(gl.DEPTH_WRITEMASK);
        this._oldFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        this._oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, this._targetTexture);
        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._targetTexture, 0);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);
    };

    proto.afterRender = function (ctx) {
        var gl = ctx || cc._renderContext;

        // Restore previous states
        gl.useProgram(this._beforeShader);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(this._oldDepthWriteValue);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._oldFBO);
        gl.bindTexture(gl.TEXTURE_2D, this._oldTex);
        cc.director.setViewport();

        gl.disable(gl.CULL_FACE);
    };

    proto.setTargetTexture = function() {
        var node = this._node;

        // Cheating
        node._texture._contentSize.width = this._viewportSize;
        node._texture._contentSize.height = this._viewportSize;
        node._texture._webTextureObj = this._targetTexture;
    };

    proto.uploadData = function (f32buffer, ui32buffer, vertexDataOffset) {
        var gl = cc._renderContext;
        this.beforeRender(gl);

        var node = this._node;
        if (!node._texture)
            return;

        var size = cc.director.getWinSizeInPixels();
        var view = cc.view,
            ox = view._viewPortRect.x / view._scaleX,
            oy = view._viewPortRect.y / view._scaleY;

        this._shaderProgram.use();
        var matrixPerspective = new cc.math.Matrix4(), 
            matrixLookup = new cc.math.Matrix4();
        cc.kmMat4PerspectiveProjection(matrixPerspective, 60, 1, 0.1, 1000.0);
        var eye = new cc.math.Vec3(0.0, 3.0, -5.0);
        var center = new cc.math.Vec3(0.0, 0.0, 0.0);
        var up = new cc.math.Vec3( 0.0, 1.0, 0.0);
        cc.kmMat4LookAt(matrixLookup, eye, center, up);
        matrixPerspective.multiply(matrixLookup);

        this._shaderProgram.setUniformLocationWithMatrix4fv("u_vp", matrixPerspective.mat);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this._shaderProgram._programObj, "u_vp", name), 
        //     false, resultMatrix);
        var mat = new cc.math.Matrix4();
        cc.math.Matrix4.createByRotationY(this._angle, mat);
        this._shaderProgram.setUniformLocationWithMatrix4fv("u_world", mat.mat);

        this._angle += 0.01;
        if(this._angle > 2 * Math.PI) {
            this._angle = 0.0;
        }

        gl.viewport(0, 0, this._viewportSize, this._viewportSize);

        this._shaderProgram.use();

        var iPos = gl.getAttribLocation(this._shaderProgram._programObj, 'i_Pos');
        var iTex = gl.getAttribLocation(this._shaderProgram._programObj, 'i_Tex');
        var iColor = gl.getAttribLocation(this._shaderProgram._programObj, 'i_Color');

        gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
        gl.vertexAttribPointer(iPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(iPos);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorsBuffer);
        gl.vertexAttribPointer(iColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(iColor);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer);
        gl.vertexAttribPointer(iTex, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(iTex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        this.afterRender(gl);
        
        this.setTargetTexture();
        return cc.Sprite.WebGLRenderCmd.prototype.uploadData.call(this, f32buffer, ui32buffer, vertexDataOffset);
    };

    proto.computeRenderData = function() {
        var gl = cc._renderContext;

        var numPoints = 8;
        this._verticesData = new Float32Array(numPoints * 3);
        this._texCoordsData = new Float32Array(numPoints * 2);
        this._colorsData = new Float32Array(numPoints * 4);
        this._indicesData = new Uint16Array(36);
        
        if(this._verticesBuffer) gl.deleteBuffer(this._verticesBuffer);
        if(this._texCoordsBuffer) gl.deleteBuffer(this._texCoordsBuffer);
        if(this._colorsBuffer) gl.deleteBuffer(this._colorsBuffer);
        if(this._indicesBuffer) gl.deleteBuffer(this._indicesBuffer);
        
        this._texCoordsBuffer = gl.createBuffer();
        this._verticesBuffer = gl.createBuffer();
        this._colorsBuffer = gl.createBuffer();
        this._indicesBuffer = gl.createBuffer();
        
        // 
        this._verticesData[0] = -0.5;
        this._verticesData[1] = -0.5;
        this._verticesData[2] = +0.5;
        this._texCoordsData[0] = 0.0;
        this._texCoordsData[1] = 0.0;
        this._colorsData[0] = 1.0;
        this._colorsData[1] = 0.0;
        this._colorsData[2] = 0.0;
        this._colorsData[3] = 0.65;

        this._verticesData[3] = +0.5;
        this._verticesData[4] = -0.5;
        this._verticesData[5] = +0.5;
        this._texCoordsData[2] = 1.0;
        this._texCoordsData[3] = 0.0;
        this._colorsData[4] = 0.0;
        this._colorsData[5] = 1.0;
        this._colorsData[6] = 0.0;
        this._colorsData[7] = 0.65;

        this._verticesData[6] = +0.5;
        this._verticesData[7] = +0.5;
        this._verticesData[8] = +0.5;
        this._texCoordsData[4] = 1.0;
        this._texCoordsData[5] = 1.0;
        this._colorsData[8] = 0.0;
        this._colorsData[9] = 0.0;
        this._colorsData[10] = 1.0;
        this._colorsData[11] = 0.65;

        this._verticesData[9]  = -0.5;
        this._verticesData[10] = +0.5;
        this._verticesData[11] = +0.5;
        this._texCoordsData[6] = 0.0;
        this._texCoordsData[7] = 1.0;
        this._colorsData[12] = 1.0;
        this._colorsData[13] = 1.0;
        this._colorsData[14] = 1.0;
        this._colorsData[15] = 0.65;

        //
        this._verticesData[12] = -0.5;
        this._verticesData[13] = -0.5;
        this._verticesData[14] = -0.5;
        this._texCoordsData[8] = 0.0;
        this._texCoordsData[9] = 0.0;
        this._colorsData[16] = 1.0;
        this._colorsData[17] = 0.0;
        this._colorsData[18] = 0.0;
        this._colorsData[19] = 0.65;

        this._verticesData[15] = +0.5;
        this._verticesData[16] = -0.5;
        this._verticesData[17] = -0.5;
        this._texCoordsData[10] = 1.0;
        this._texCoordsData[11] = 0.0;
        this._colorsData[20] = 0.0;
        this._colorsData[21] = 1.0;
        this._colorsData[22] = 0.0;
        this._colorsData[23] = 0.65;

        this._verticesData[18] = +0.5;
        this._verticesData[19] = +0.5;
        this._verticesData[20] = -0.5;
        this._texCoordsData[12] = 1.0;
        this._texCoordsData[13] = 1.0;
        this._colorsData[24] = 0.0;
        this._colorsData[25] = 0.0;
        this._colorsData[26] = 1.0;
        this._colorsData[27] = 0.65;

        this._verticesData[21]  = -0.5;
        this._verticesData[22] = +0.5;
        this._verticesData[23] = -0.5;
        this._texCoordsData[14] = 0.0;
        this._texCoordsData[15] = 1.0;
        this._colorsData[28] = 1.0;
        this._colorsData[29] = 1.0;
        this._colorsData[30] = 1.0;
        this._colorsData[31] = 0.65;

        // Indices
        // Front
        this._indicesData[0] = 0;
        this._indicesData[1] = 1;
        this._indicesData[2] = 2;
        this._indicesData[3] = 2;
        this._indicesData[4] = 3;
        this._indicesData[5] = 0;
        
        // Top
        this._indicesData[6] = 1;
        this._indicesData[7] = 5;
        this._indicesData[8] = 6;
        this._indicesData[9] = 6;
        this._indicesData[10] = 2;
        this._indicesData[11] = 1;
        
        // Bottom
        this._indicesData[12] = 7;
        this._indicesData[13] = 6;
        this._indicesData[14] = 5;
        this._indicesData[15] = 5;
        this._indicesData[16] = 4;
        this._indicesData[17] = 7;
        
        // Right
        this._indicesData[18] = 4;
        this._indicesData[19] = 0;
        this._indicesData[20] = 3;
        this._indicesData[21] = 3;
        this._indicesData[22] = 7;
        this._indicesData[23] = 4;
        
        // Left
        this._indicesData[24] = 4;
        this._indicesData[25] = 5;
        this._indicesData[26] = 1;
        this._indicesData[27] = 1;
        this._indicesData[28] = 0;
        this._indicesData[29] = 4;
        
        // Back
        this._indicesData[30] = 3;
        this._indicesData[31] = 2;
        this._indicesData[32] = 6;
        this._indicesData[33] = 6;
        this._indicesData[34] = 7;
        this._indicesData[35] = 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._verticesData, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._texCoordsData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._colorsData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indicesData, gl.STATIC_DRAW);
    }; // computes AND upload
})();
