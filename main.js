window.onload = function () {
  cc.game.onStart = OnStart;
  cc.game.run("gameCanvas");

  imgui_init();
};

var ui_context = {
  selectedNode: null,
};

function CreateAccesor(v) {
  return new Accesor(v);
}

function imgui_inspectNodeInfo(node) {
  if (ImGui.Checkbox("Visible", () => node._visible)) {
    node.setVisible(!node._visible);
  }
}

function imgui_inspectRainSys(node) {
  imgui_inspectNodeInfo(node);

  if (ImGui.Button("Particle reset")) {
    node.born_particles = 0;
    node._renderCmd.initData(cc._renderContext);
  }

  ImGui.Text("Born particles: " + node.born_particles);
  ImGui.Text("Birth rate: " + node.birth_rate);
  ImGui.Text("Min speed: " + node.min_speed);
  ImGui.Text("Max speed: " + node.max_speed);

  ImGui.SliderInt("Max Particles", (v) => {
    if (v !== undefined) {
      node.num_particles = v;
      if (node.born_particles > node.num_particles) {
        node.born_particles = node.num_particles;
      }
    }
    return node.num_particles;
  }, 0, 10000);

  ImGui.SliderFloat("Particle Size", (v) => {
    if (v !== undefined) {
      node.size = v;
    }
    return node.size;
  }, 1, 100);

  ImGui.Separator();
  ImGui.Text("Default light")

  ImGui.SliderFloat("Light Position(X)", (v) => {
    if (v !== undefined) {
      node.lights[0].position[0] = v;
    }
    return node.lights[0].position[0];
  }, -200, 200);
  ImGui.SliderFloat("Light Position(Y)", (v) => {
    if (v !== undefined) {
      node.lights[0].position[1] = v;
    }
    return node.lights[0].position[1];
  }, -200, 200);
  ImGui.SliderFloat("Light Direction(X)", (v) => {
    if (v !== undefined) {
      node.lights[0].direction[0] = v;
    }
    return node.lights[0].direction[0];
  }, -1.0, 1.0);
  ImGui.SliderFloat("Light Direction(Y)", (v) => {
    if (v !== undefined) {
      node.lights[0].direction[1] = v;
    }
    return node.lights[0].direction[1];
  }, -1.0, 1.0);
  ImGui.SliderFloat("Light Max", (v) => {
    if (v !== undefined) {
      node.lights[0].max_light = v;
    }
    return node.lights[0].max_light;
  }, 0, 1);
  ImGui.SliderFloat("Light range", (v) => {
    if (v !== undefined) {
      node.lights[0].range = v;
    }
    return node.lights[0].range;
  }, 1, 1000);
  // ImGui.ColorEdit3("Light Color", node.lights[0].color, 0, 1);
  ImGui.SliderFloat("Light Color Red", (v) => {
    if (v !== undefined) {
      node.lights[0].color[0] = v;
    }
    return node.lights[0].color[0];
  }, 0, 1);
  ImGui.SliderFloat("Light Color Green", (v) => {
    if (v !== undefined) {
      node.lights[0].color[1] = v;
    }
    return node.lights[0].color[1];
  }, 0, 1);
  ImGui.SliderFloat("Light Color Blue", (v) => {
    if (v !== undefined) {
      node.lights[0].color[2] = v;
    }
    return node.lights[0].color[2];
  }, 0, 1);
  ImGui.SliderFloat("Light Intensity", (v) => {
    if (v !== undefined) {
      node.lights[0].intensity = v;
    }
    return node.lights[0].intensity;
  }, 0, 10000);

}

function imgui_inspectNode(node) {
  switch (node._className) {
    case "RainPSys": {
      imgui_inspectRainSys(node);
    } break;

    case "Scene": {

    } break;

    case "Sprite": {

    } break;

    case "LabelTTF": {

    } break;

    default: {
      console.error("Unsupported node type")
    } break;
  }
}

function imgui_renderNode(node) {
  if (node) {

    var nodeflags = 0;
    if (node.children?.length === 0) {
      nodeflags |= ImGui.TreeNodeFlags.Leaf | ImGui.TreeNodeFlags.Bullet |
        ImGui.TreeNodeFlags.NoTreePushOnOpen;
    } else {
      nodeflags |= ImGui.TreeNodeFlags.OpenOnArrow | ImGui.TreeNodeFlags.Framed | ImGui.TreeNodeFlags.SpanAvailWidth;
    }
    const label = `[${node._className}]` + `[${node.__instanceId}]` + node._name + ` [${node.childrenCount}]`;
    if (node.children?.length > 0) {
      if (ImGui.TreeNodeEx(label, nodeflags)) {
        if (ImGui.IsItemClicked() && !ImGui.IsItemToggledOpen()) {
          ui_context.selectedNode = node;
        }

        for (let i = 0;
          i < node.children.length;
          i += 1) {
          imgui_renderNode(node.children[i]);
        }
        ImGui.TreePop();
      }
    }
    else {
      if (ImGui.Selectable(label)) {
        ui_context.selectedNode = node;
      }
    }
  }
}

function OnStart() {
  cc.log = cc.warn = cc.error = function (content) {
    console.log(content);
  }

  //load resources
  cc.LoaderScene.preload(["HelloWorld.png"], function () {
    var MyScene = cc.Scene.extend({
      _cube: null,
      onEnter: function () {
        this._super();
        var size = cc.director.getWinSize();

        var sprite = cc.Sprite.create("HelloWorld.png");
        sprite.setPosition(size.width / 2, size.height / 2);
        sprite.setScale(0.8);
        this.addChild(sprite, 0, "main sprite");

        var cube = cc.RainPSys.create("feather_blue2.png");
        this.addChild(cube, 1, "particle feather");

        var label = cc.LabelTTF.create("Hello World", "Arial", 40);
        label.setPosition(size.width / 2, size.height / 2);
        this.addChild(label, 2, "hello world");

        var label2 = cc.LabelTTF.create("Hello World 2", "Arial", 40);
        label2.setPosition(size.width / 2, size.height / 2);
        sprite.addChild(label2, 2, "hello world 2");

      },
    });
    cc.director.runScene(new MyScene());

  }, this);
}

function imgui_render(dt) {
  ImGui_Impl.NewFrame(dt);
  ImGui.NewFrame();

  ImGui.SetNextWindowPos(new ImGui.ImVec2(20, 20), ImGui.Cond.FirstUseEver);
  ImGui.SetNextWindowSize(new ImGui.ImVec2(294, 140), ImGui.Cond.FirstUseEver);
  ImGui.Begin("Debug");
  {
    if (cc) {
      if (ImGui.Button("Play")) {
        cc.director.resume();
      }

      if (ImGui.Button("Pause")) {
        cc.director.pause();
      }
    }
  }
  ImGui.End();

  ImGui.Begin("Node tree");
  {
    imgui_renderNode(cc.director._runningScene);
  }
  ImGui.End();

  if (ui_context.selectedNode) {
    ImGui.Begin(`[${ui_context.selectedNode.__instanceId}]${ui_context.selectedNode._className} - ${ui_context.selectedNode._name}`);
    {
      imgui_inspectNode(ui_context.selectedNode);
    }
    ImGui.End();
  }

  ImGui.EndFrame();
  ImGui.Render();

  const gl = ImGui_Impl.gl;
  if (gl) {
    const clear_color = new ImGui.ImVec4(0.45, 0.55, 0.60, 1.00);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(clear_color.x, clear_color.y, clear_color.z, clear_color.w);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  //gl.useProgram(0); // You may want this if using this code in an OpenGL 3+ context where shaders may be bound

  ImGui_Impl.RenderDrawData(ImGui.GetDrawData());

  window.requestAnimationFrame(imgui_render);
}

async function imgui_init() {
  var canvas = document.getElementById("debug_canvas");
  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.scrollWidth * devicePixelRatio;
  canvas.height = canvas.scrollHeight * devicePixelRatio;
  window.addEventListener("resize", () => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.scrollWidth * devicePixelRatio;
    canvas.height = canvas.scrollHeight * devicePixelRatio;
  });
  await ImGui.default();

  ImGui.CreateContext();
  ImGui_Impl.Init(canvas);

  ImGui.StyleColorsDark();

  window.requestAnimationFrame(imgui_render);
}