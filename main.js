window.onload = function()
{
  cc.game.onStart = OnStart;
  cc.game.run("gameCanvas");
};

var vsShader = 
`
uniform mat4 u_vp;
uniform mat4 u_world;

attribute vec3 iPos;
attribute vec2 iTex;
attribute vec4 iColor;

varying vec2 oTex;
varying vec4 oColor;

void main()
{
    oTex = iTex;
    oColor = iColor;
    gl_Position = u_world * u_vp * vec4(iPos, 1.0);
}

`;
var psShader =
//uniform sampler2D sprite;
`

varying vec2 oTex;
varying vec4 oColor;

void main()
{
    // gl_FragColor = oColor * texture2D(sprite, oTex);
    gl_FragColor = oColor;
}
`;

cc.CustomRenderer = cc.Class.extend({
    _shaderProgram: null,
    _active:false,
    
    ctor:function() {
        cc.sys._checkWebGLRenderMode();
        this._active = false;
        this._shaderProgram = null;
    },
    
    setIsActive:function(active) {
        this._active = active;
    },
    
    beforeDraw:function() {
    },
    
    draw:function() {
        cc.Log("");
    },
    
    afterDraw:function(target) {
    },
});

cc.Cube = cc.CustomRenderer.extend({
    _vertices: null,
    _texCoords: null,
    _colors: null,
    _indices: null,
    _texCoordsBuffer: null,
    _verticesBuffer: null,
    _colorsBuffer: null,
    _indicesBuffer: null,
    
    // ctor
    ctor:function () {
        this._vertices = null;
        this._texCoords = null;
        this._colors = null;
        this._indices = null;
        this._texCoordsBuffer = null;
        this._verticesBuffer = null;
        this._colorsBuffer = null;
        this._indicesBuffer = null;
    },
    
    // vertex:function() {},
    // getVertex:function() {},
    // setVertex:function() {},
    computeRenderData:function() {
        var gl = cc._renderContext;
        var numPoints = 8;
        this._vertices = new Float32Array(numPoints * 3);
        this._texCoords = new Float32Array(numPoints * 2);
        this._colors = new Float32Array(numPoints * 4);
        this._indices = new Uint16Array(36);
        
        if(this._verticesBuffer) gl.deleteBuffer(this._verticesBuffer);
        if(this._texCoordsBuffer) gl.deleteBuffer(this._texCoordsBuffer);
        if(this._colorsBuffer) gl.deleteBuffer(this._colorsBuffer);
        if(this._indicesBuffer) gl.deleteBuffer(this._indicesBuffer);
        
        this._texCoordsBuffer = gl.createBuffer();
        this._verticesBuffer = gl.createBuffer();
        this._colorsBuffer = gl.createBuffer();
        this._indicesBuffer = gl.createBuffer();
        
        // 
        this._vertices[0] = -0.5;
        this._vertices[1] = -0.5;
        this._vertices[2] = -0.5;
        this._texCoords[0] = 0.0;
        this._texCoords[1] = 0.0;
        this._colors[0] = 1.0;
        this._colors[1] = 1.0;
        this._colors[2] = 1.0;
        this._colors[3] = 1.0;

        this._vertices[3] = +0.5;
        this._vertices[4] = -0.5;
        this._vertices[5] = -0.5;
        this._texCoords[2] = 1.0;
        this._texCoords[3] = 0.0;
        this._colors[4] = 1.0;
        this._colors[5] = 1.0;
        this._colors[6] = 1.0;
        this._colors[7] = 1.0;

        this._vertices[6] = +0.5;
        this._vertices[7] = +0.5;
        this._vertices[8] = -0.5;
        this._texCoords[4] = 1.0;
        this._texCoords[5] = 1.0;
        this._colors[8] = 1.0;
        this._colors[9] = 1.0;
        this._colors[10] = 1.0;
        this._colors[11] = 1.0;

        this._vertices[9]  = -0.5;
        this._vertices[10] = +0.5;
        this._vertices[11] = -0.5;
        this._texCoords[6] = 0.0;
        this._texCoords[7] = 1.0;
        this._colors[12] = 1.0;
        this._colors[13] = 1.0;
        this._colors[14] = 1.0;
        this._colors[15] = 1.0;

        //
        this._vertices[12] = +0.5;
        this._vertices[13] = -0.5;
        this._vertices[14] = +0.5;
        this._texCoords[8] = 0.0;
        this._texCoords[9] = 0.0;
        this._colors[16] = 1.0;
        this._colors[17] = 1.0;
        this._colors[18] = 1.0;
        this._colors[19] = 1.0;

        this._vertices[15] = -0.5;
        this._vertices[16] = -0.5;
        this._vertices[17] = +0.5;
        this._texCoords[10] = 1.0;
        this._texCoords[11] = 0.0;
        this._colors[20] = 1.0;
        this._colors[21] = 1.0;
        this._colors[22] = 1.0;
        this._colors[23] = 1.0;

        this._vertices[18] = -0.5;
        this._vertices[19] = +0.5;
        this._vertices[20] = +0.5;
        this._texCoords[12] = 1.0;
        this._texCoords[13] = 1.0;
        this._colors[24] = 1.0;
        this._colors[25] = 1.0;
        this._colors[26] = 1.0;
        this._colors[27] = 1.0;

        this._vertices[21]  = +0.5;
        this._vertices[22] = +0.5;
        this._vertices[23] = +0.5;
        this._texCoords[14] = 0.0;
        this._texCoords[15] = 1.0;
        this._colors[28] = 1.0;
        this._colors[29] = 1.0;
        this._colors[30] = 1.0;
        this._colors[31] = 1.0;

        // Indices
        // Front
        this._indices[0] = 0;
        this._indices[1] = 1;
        this._indices[2] = 2;
        this._indices[3] = 0;
        this._indices[4] = 2;
        this._indices[5] = 3;
        
        // Top
        this._indices[6] = 3;
        this._indices[7] = 2;
        this._indices[8] = 6;
        this._indices[9] = 3;
        this._indices[10] = 6;
        this._indices[11] = 7;
        
        // Bottom
        this._indices[12] = 0;
        this._indices[13] = 1;
        this._indices[14] = 4;
        this._indices[15] = 0;
        this._indices[16] = 4;
        this._indices[17] = 5;
        
        // Right
        this._indices[18] = 1;
        this._indices[19] = 4;
        this._indices[20] = 7;
        this._indices[21] = 1;
        this._indices[22] = 7;
        this._indices[23] = 2;
        
        // Left
        this._indices[24] = 0;
        this._indices[25] = 3;
        this._indices[26] = 6;
        this._indices[27] = 0;
        this._indices[28] = 6;
        this._indices[29] = 5;
        
        // Back
        this._indices[30] = 5;
        this._indices[31] = 6;
        this._indices[32] = 7;
        this._indices[33] = 5;
        this._indices[34] = 7;
        this._indices[35] = 8;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._texCoords, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._colorsBuffer, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices, gl.STATIC_DRAW);
    }, // computes AND upload

    beforeDraw: function() {
        // super.beforeDraw();

        var gl = cc._renderContext;
        var size = cc.director.getWinSizeInPixels();
        var view = cc.view,
            ox = view._viewPortRect.x / view._scaleX,
            oy = view._viewPortRect.y / view._scaleY;

        var matrixPerspective = new cc.math.Matrix4(), matrixLookup = new cc.math.Matrix4(), resultMatrix = new cc.math.Matrix4();
        cc.kmGLMatrixMode(cc.KM_GL_PROJECTION);
        cc.kmGLLoadIdentity();
        matrixPerspective = cc.math.Matrix4.createPerspectiveProjection(60, size.width / size.height, 0.1, 1000.0);
        cc.kmGLMultMatrix(matrixPerspective);
        cc.kmGLMatrixMode(cc.KM_GL_MODELVIEW);
        cc.kmGLLoadIdentity();
        var eye = new cc.math.Vec3(-ox + size.width / 2, -oy + size.height / 2, 10.0);
        var center = new cc.math.Vec3( -ox + size.width / 2, -oy + size.height / 2, 0.0);
        var up = new cc.math.Vec3( 0.0, 1.0, 0.0);
        matrixLookup.lookAt(eye, center, up);
        cc.kmGLMultMatrix(matrixLookup);
        cc.kmMat4Multiply(resultMatrix, matrixPerspective, matrixLookup);

        this._shaderProgram.setUniformLocationWithMatrix4fv("u_vp", resultMatrix.mat);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this._shaderProgram._programObj, "u_vp", name), 
        //     false, resultMatrix);
        var identity = new cc.math.Matrix4();
        identity.identity();
        this._shaderProgram.setUniformLocationWithMatrix4fv("u_world", identity.mat);
    },

    draw: function() {
        var gl = cc._renderContext;
        var size = cc.director.getWinSizeInPixels();
        gl.viewport(0, 0, size.width , size.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._verticesBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordsBuffer);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorsBuffer);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);

        gl.drawElements(gl.TRIANGLES, 35, gl.UNSIGNED_SHORT, 0);
        cc.incrementGLDraws(1);
    },

    afterDraw: function() {
        // super.afterDraw();


    }
});

// Runtime extending the object
// (function(){
//     cc.3DRender.CanvasRenderCmd = function(rendableObject){
//         cc.Node.WebGLRenderCmd.call(this, rendableObject);
//         //
//         this.initCmd();
//     }
    
//     var proto = cc.3DRender.WebGLRenderCmd.prototype = Object.create(cc.Node.WebGLRenderCmd.prototype);
//     proto.constructor = cc.3DRender.WebGLRenderCmd;
//     proto.transform = function(parentCmd, recursive) {
        
//     }
// })();


function OnStart()
{
        // Load custom elements
    var program = new cc.GLProgram();
    var shader = program.initWithVertexShaderByteArray(vsShader, psShader); 
    program.addAttribute("iPos", 0);
    program.addAttribute("iTex", 1);
    program.addAttribute("iColor", 2);
        
    program.link();
    //load resources
    cc.LoaderScene.preload(["HelloWorld.png"], function () {
      var MyScene = cc.Scene.extend({
          _cube: null,
          onEnter:function () {
              this._super();
              var size = cc.director.getWinSize();
              var sprite = cc.Sprite.create("HelloWorld.png");
              sprite.setPosition(size.width / 2, size.height / 2);
              sprite.setScale(0.8);
              this.addChild(sprite, 0);
    
              var label = cc.LabelTTF.create("Hello World", "Arial", 40);
              label.setPosition(size.width / 2, size.height / 2);
              this.addChild(label, 1);
              
              // var primitives = new cc.DrawingPrimitiveWebGL();
              this._cube = new cc.Cube();
              this._cube.computeRenderData();
              this._cube._shaderProgram = program;
              
              this.schedule(
                function(dt) {
                    console.log(dt);
                    if(this._cube) {
                        this._cube.beforeDraw();
                        this._cube.draw();
                    }
              }, 0, 33, 0);
          },
      });
      cc.director.runScene(new MyScene());
      
      
    }, this);
}

// function Init(gl)
// {
//     var program = createGLProgram(gl, 
//     [
//         {name: "vert-shader", type: gl.VERTEX_SHADER},
//         {name: "frag-shader", type: gl.FRAGMENT_SHADER},
//     ]);
    
//     var attribute_locations = 
//     {
//         i_Position: {
//           location: gl.getAttribLocation(program, "i_Position"),
//           num_components: 3,
//           type: gl.FLOAT
//         },
//         i_Position: {
//           location: gl.getAttribLocation(program, "i_Position"),
//           num_components: 2,
//           type: gl.FLOAT
//         },
//         i_Position: {
//           location: gl.getAttribLocation(program, "i_Position"),
//           num_components: 4,
//           type: gl.FLOAT
//         },
//     };
    
//     var vaos = [
//         gl.createVertexArray(),
//     ];
//     var buffers = [
//         gl.createBuffer(),
//         gl.createBuffer(),
//     ];
    
//     var vao_desc = [
//         {
//             vao: vaos[0],
//             buffers: [
//                 {
//                     buffer_object: buffers[0],
//                     stride: 3 + 2 + 4,
//                     attribs: attribute_locations
//                 },
//                 {
//                     buffer_object: buffers[1],
//                     stride: 4,
//                     attribs: attribute_locations
//                 },
//             ]
//         },
//     ]
    
// }

// function createShader(gl, shader_info) {
//   var shader = gl.createShader(shader_info.type);
//   var i = 0;
//   var shader_source = document.getElementById(shader_info.name).text;
//   /* skip whitespace to avoid glsl compiler complaining about
//   #version not being on the first line*/
//   while (/\s/.test(shader_source[i])) i++;
//   shader_source = shader_source.slice(i);
//   gl.shaderSource(shader, shader_source);
//   gl.compileShader(shader);
//   var compile_status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
//   if (!compile_status) {
//     var error_message = gl.getShaderInfoLog(shader);
//     throw "Could not compile shader \"" +
//           shader_info.name +
//           "\" \n" +
//           error_message;
//   }
//   return shader;
// }

// /* Creates an OpenGL program object.
//    `gl' shall be a WebGL 2 context.
//    `shader_list' shall be a list of objects, each of which have a `name'
//       and `type' properties. `name' will be used to locate the script tag
//       from which to load the shader. `type' shall indicate shader type (i. e.
//       gl.FRAGMENT_SHADER, gl.VERTEX_SHADER, etc.)
//   `transform_feedback_varyings' shall be a list of varying that need to be
//     captured into a transform feedback buffer.*/
// function createGLProgram(gl, shader_list) {
//   var program = gl.createProgram();
//   for (var i = 0; i < shader_list.length; i++) {
//     var shader_info = shader_list[i];
//     var shader = createShader(gl, shader_info);
//     gl.attachShader(program, shader);
//   }

//   /* Specify varyings that we want to be captured in the transform
//      feedback buffer. */
//   // if (transform_feedback_varyings != null) {
//   //   gl.transformFeedbackVaryings(program,
//   //                                transform_feedback_varyings,
//   //                                gl.INTERLEAVED_ATTRIBS);
//   // }
//   gl.linkProgram(program);
//   var link_status = gl.getProgramParameter(program, gl.LINK_STATUS);
//   if (!link_status) {
//     var error_message = gl.getProgramInfoLog(program);
//     throw "Could not link program.\n" + error_message;
//   }
//   return program;
// }

// function setupParticleBufferVAO(gl, buffers, vao) {
//   gl.bindVertexArray(vao);
//   for (var i = 0; i < buffers.length; i++) {
//     var buffer = buffers[i];
//     gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer_object);
//     var offset = 0;
//     for (var attrib_name in buffer.attribs) {
//       if (buffer.attribs.hasOwnProperty(attrib_name)) {
//         var attrib_desc = buffer.attribs[attrib_name];
//         gl.enableVertexAttribArray(attrib_desc.location);
//         gl.vertexAttribPointer(
//           attrib_desc.location,
//           attrib_desc.num_components,
//           attrib_desc.type,
//           false, 
//           buffer.stride,
//           offset);
//         var type_size = 4; /* we're only dealing with types of 4 byte size in this demo, unhardcode if necessary */
//         offset += attrib_desc.num_components * type_size; 
//         if (attrib_desc.hasOwnProperty("divisor")) {
//           gl.vertexAttribDivisor(attrib_desc.location, attrib_desc.divisor);
//         }
//       }
//     }
//   }
//   gl.bindVertexArray(null);
//   gl.bindBuffer(gl.ARRAY_BUFFER, null);
// }