window.onload = function()
{
  cc.game.onStart = OnStart;
  cc.game.run("gameCanvas");
};

function OnStart()
{
    cc.log = cc.warn = cc.error = function(content) {
        console.log(content);
    }

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
            
            var cube = cc.RainPSys.create("feather_white.png");
            this.addChild(cube, 1);

            var label = cc.LabelTTF.create("Hello World", "Arial", 40);
            label.setPosition(size.width / 2, size.height / 2);
            this.addChild(label, 2);

          },
      });
      cc.director.runScene(new MyScene());
      
    }, this);
}
