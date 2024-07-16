window.onload = function()
{
  cc.game.onStart = OnStart;
  cc.game.run("gameCanvas");
};

var vsShader = 
`
uniform mat4 u_vp;
uniform mat4 u_world;

attribute vec3 i_Pos;
attribute vec2 i_Tex;
attribute vec4 i_Color;

varying vec2 oTex;
varying vec4 oColor;

void main()
{
    oTex = i_Tex;
    oColor = i_Color;
    gl_Position = u_vp * u_world * vec4(i_Pos, 1.0);
}

`;
var psShader =
`
uniform sampler2D sprite;

varying vec2 oTex;
varying vec4 oColor;

void main()
{
    // gl_FragColor = oColor * texture2D(sprite, oTex);
    gl_FragColor = oColor;
}
`;

function OnStart()
{
    cc.log = cc.warn = cc.error = function(content) {
        console.log(content);
    }
    // Load custom elements
    cc._customProgram = new cc.GLProgram();
    cc._customProgram.initWithVertexShaderByteArray(vsShader, psShader);
    cc._customProgram.link();
    cc._customProgram.updateUniforms();

    //load resources
    cc.LoaderScene.preload(["HelloWorld.png"], function () {
      var MyScene = cc.Scene.extend({
          _cube: null,
          onEnter:function () {
            this._super();
            var size = cc.director.getWinSize();
            
            var cube = cc.ParticleGPU.create("feather.png");
            cube.setPosition(size.width / 2, size.height / 2);
            this.addChild(cube, 1);
            
            var sprite = cc.Sprite.create("HelloWorld.png");
            sprite.setPosition(size.width / 2, size.height / 2);
            sprite.setScale(0.8);
            this.addChild(sprite, 0);

            var label = cc.LabelTTF.create("Hello World", "Arial", 40);
            label.setPosition(size.width / 2, size.height / 2);
            this.addChild(label, 2);
          },
      });
      cc.director.runScene(new MyScene());
      
    }, this);
}
