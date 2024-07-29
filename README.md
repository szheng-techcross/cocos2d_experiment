# Extending COCOS2D

Experiment extending the Cocos2D engine.

## Some notes about Cocos2D source code, how to read it and extend it

## Rendering routine
Director has all the engine part stuff.
- .drawScene() is the main function that generates all the draw commands:
    - `visit` and `visitChildren` are the main tree traversal part
    - 
- `_renderCmds` is an array with reference to commands

Structure of a XXXCmd:
```js
cc.Node.WebGLRenderCmd = function(renderable){
    cc.Node.WebGLRenderCmd.call(this, renderable);
    // example of render data
    this._needDraw = false;
};
```

Batch rendering is super weird, what it basically does is that when iterating through the list of render commands, it checks if successive textures/shaders are being used, so it increments an internal counter, and then when it is no longer the case, it calls drawElements. So batchrendering could be called multiple times, inconsistenly, per command.

The way custom rendering is done currently is render to texture and then apply that as an alpha sprite.
Since it's a custom layer, pre-render and post-render has bunch of pipeline setting work to do, and it needs to be more complete than the current version.
Because it is a sprite, it has all the conveniency of Sprite class.

To improve: size of the canvas vs sprite size, there are some hacks being done here and probably can be improved further
Transform is not being used correctly right now, but this can be improved through polymorphism with `transform`

Still have an issue of initialization, the texture thing is weird, but we dont really care, it's for demo anyway.

### Designing custom rendering path
Every Node has several methods that are being called by the Director for rendering:
    - `.rendering()`
    - `.uploadData()`
    - `.transform()`
    - `.visit()`
`Node.WebGLRenderCmd` or `Node.CanvasRenderCmd`