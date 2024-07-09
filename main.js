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
`
uniform sampler2D sprite;

varying vec2 oTex;
varying vec4 oColor;

void main()
{
    gl_FragColor = oColor * texture2D(sprite, oTex);
}
`;

cc.CustomRenderer = cc.Class.extend({
    _shaderProgram: null,
    
    ctor:function() {},
});

cc.Cube = cc.CustomRenderer.extend({
    _vertices: null;
    _texCoords: null;
    _colors: null;
    _indices: null;
    _texCoordsBuffer: null;
    _verticesBuffer: null;
    _colorsBuffer: null;
    _indicesBuffer: null;
    
    // ctor
    ctor:function () {
    }
    
    vertex:function() {}
    getVertex:function() {}
    setVertex:function() {}
    computeRenderData:function() {} // computes AND upload
});

// Runtime extending the object
(function(){
    cc.3DRender.CanvasRenderCmd = function(rendableObject){
        cc.Node.WebGLRenderCmd.call(this, rendableObject);
        //
        this.initCmd();
    }
    
    var proto = cc.3DRender.WebGLRenderCmd.prototype = Object.create(cc.Node.WebGLRenderCmd.prototype);
    proto.constructor = cc.3DRender.WebGLRenderCmd;
    proto.transform = function(parentCmd, recursive) {
        
    }
})();


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
              
              var node = cc.Node.create();
              node.getShaderProgram(program);
              node.RenderCmd. ;
              this.addChild(node);
          }
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