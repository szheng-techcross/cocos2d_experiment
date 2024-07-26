(function () {
    var particle_update_vert = `
        #version 300 es
        precision mediump float;

        uniform float u_TimeDelta;
        uniform sampler2D u_RgNoise;
        uniform vec2 u_Gravity;
        uniform vec2 u_Origin;
        uniform float u_MinTheta;
        uniform float u_MaxTheta;
        uniform float u_MinSpeed;
        uniform float u_MaxSpeed;
        uniform vec2 u_WindowSize;
        uniform vec2 u_PushOut;
        uniform float u_PushStrength;

        in vec2 i_Position;
        in float i_Age;
        in float i_Life;
        in vec2 i_Velocity;

        out vec2 v_Position;
        out float v_Age;
        out float v_Life;
        out vec2 v_Velocity;

        void main() {
            if (i_Age >= i_Life) {
                ivec2 noise_coord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
                vec2 rand = texelFetch(u_RgNoise, noise_coord, 0).rg;
                float theta = u_MinTheta + rand.r*(u_MaxTheta - u_MinTheta);
                float x = cos(theta);
                float y = sin(theta);
                float gx = (rand.g - 0.5f) * u_WindowSize.x;
                v_Position = vec2(gx, u_Origin.y);
                v_Age = 0.0;
                v_Life = i_Life;
                v_Velocity = vec2(0, -1) * (u_MinSpeed + rand.g * (u_MaxSpeed - u_MinSpeed));
            } else {
                v_Position = i_Position + i_Velocity * u_TimeDelta;
                v_Age = i_Age + u_TimeDelta;
                v_Life = i_Life;
                v_Velocity = i_Velocity + u_Gravity * u_TimeDelta;
                if(v_Position.y < -u_WindowSize.y / 2.0)
                {
                    v_Position.y = -u_WindowSize.y / 2.0;
                    v_Velocity.x = 0.0;
                }
                else
                {
                    v_Velocity.x = 50.f * cos(5.f * i_Age + i_Life * 100.f);
                }

                // vec2 dir = u_PushOut - v_Position;
                // float d = length(dir);
                // float push = u_PushStrength / (d*d);
                // if(push > 0.1f) {
                //     vec2 n = normalize(dir);
                //     v_Velocity -= vec2(n.x, 0.0) * push;
                // }
            }

        }
    `;

    var passthru_frag_shader = `
        #version 300 es
        precision mediump float;
        in float v_Age;
        void main() { discard; }
    `;

    cc.RainPSys = cc.PSys.extend({
        _className: "RainPSys",
        origin: [0, 200],
        born_particles: 0,
        old_timestamp: 0,
        num_particles: 1000,
        total_time: 0,
        gravity: [0, -500.0],
        birth_rate: 0.,
        min_theta: -Math.PI,
        max_theta: Math.PI,
        min_speed: 45.0,
        max_speed: 50.5,
        size: 25.0,
        min_age: 25.5,
        max_age: 30.8,
        last_spawn_time: 0.0,

        ctor: function (filename, rect, rotated) {
            cc.PSys.prototype.ctor.call(this, filename, rect, rotated);
        },

        _createRenderCmd: function () {
            return new cc.RainPSys.WebGLRenderCmd(this);
        }
    });

    cc.RainPSys.create = function (filename, rect, rotated) {
        return new cc.RainPSys(filename, rect, rotated);
    };

    (function () {
        cc.RainPSys.WebGLRenderCmd = function (renderable) {
            this._particleProgram = null;
            this._renderVaoDescs = [];
            this._renderVaos = [];
            this._randomRG = null;
            this._update_attrib_locations = null;

            cc.PSys.WebGLRenderCmd.call(this, renderable);
        }

        var proto = cc.RainPSys.WebGLRenderCmd.prototype = Object.create(cc.PSys.WebGLRenderCmd.prototype);
        proto.constructor = cc.RainPSys.WebGLRenderCmd;

        // Overloaded 
        proto.setup = function (gl) {
            cc.PSys.WebGLRenderCmd.prototype.setup.call(this, gl);
            this._particleProgram = createGLProgram(
                gl,
                [
                    { name: "particle-update-vert", type: gl.VERTEX_SHADER, source: particle_update_vert },
                    { name: "passthru-frag-shader", type: gl.FRAGMENT_SHADER, source: passthru_frag_shader },
                ],
                [
                    "v_Position",
                    "v_Age",
                    "v_Life",
                    "v_Velocity",
                ]);
            this._renderVaos = [gl.createVertexArray(), gl.createVertexArray()];

            this._update_attrib_locations = {
                i_Position: {
                    location: gl.getAttribLocation(this._particleProgram, "i_Position"),
                    num_components: 2,
                    type: gl.FLOAT
                },
                i_Age: {
                    location: gl.getAttribLocation(this._particleProgram, "i_Age"),
                    num_components: 1,
                    type: gl.FLOAT
                },
                i_Life: {
                    location: gl.getAttribLocation(this._particleProgram, "i_Life"),
                    num_components: 1,
                    type: gl.FLOAT
                },
                i_Velocity: {
                    location: gl.getAttribLocation(this._particleProgram, "i_Velocity"),
                    num_components: 2,
                    type: gl.FLOAT
                }
            };

            this._renderVaoDescs = [
                {
                    vao: this._renderVaos[0],
                    buffers: [{
                        // TODO: This is a problem
                        buffer_object: this._renderState.buffers[0],
                        stride: 4 * 6,
                        attribs: this._update_attrib_locations
                    }]
                },
                {
                    vao: this._renderVaos[1],
                    buffers: [{
                        buffer_object: this._renderState.buffers[1],
                        stride: 4 * 6,
                        attribs: this._update_attrib_locations
                    }]
                }
            ];

            this._randomRG = gl.createTexture();
        };

        proto._initData = function (num_parts, min_age, max_age) {
            var data = [];
            for (var i = 0; i < num_parts; ++i) {
                data.push(0.0);
                data.push(250.0);
                var life = min_age + Math.random() * (max_age - min_age);
                // var life = 0.0;
                data.push(life + 1);
                data.push(life);
                data.push(0.0);
                data.push(0.0);
            }
            return data;
        }

        proto._randomRGData = function (size_x, size_y) {
            var d = [];
            for (var i = 0; i < size_x * size_y; ++i) {
                d.push(Math.random() * 255.0);
                d.push(Math.random() * 255.0);
            }
            return new Uint8Array(d);
        }

        proto.initData = function (gl) {
            cc.PSys.WebGLRenderCmd.prototype.initData.call(this, gl);

            gl.bindTexture(gl.TEXTURE_2D, this._randomRG);
            gl.texImage2D(gl.TEXTURE_2D,
                0,
                gl.RG8,
                512, 512,
                0,
                gl.RG,
                gl.UNSIGNED_BYTE,
                this._randomRGData(512, 512));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        };

        proto.draw = function (gl) {
            if(!cc.director._paused) {
                var state = this._node;
                var renderState = this._renderState;
    
                var size = cc.director.getWinSize();

                gl.useProgram(this._particleProgram);

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
                for (var i = 0; i < this._renderVaoDescs.length; i++) {
                    this._setupBufferVAO(gl, this._renderVaoDescs[i].buffers, this._renderVaoDescs[i].vao);
                }
    
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_TimeDelta"),
                    renderState.dt / 1000.0);
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_TotalTime"),
                    state.total_time);
                gl.uniform2f(
                    gl.getUniformLocation(this._particleProgram, "u_Gravity"),
                    state.gravity[0], state.gravity[1]);
                gl.uniform2f(
                    gl.getUniformLocation(this._particleProgram, "u_Origin"),
                    state.origin[0],
                    state.origin[1]);
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_MinTheta"),
                    state.min_theta);
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_MaxTheta"),
                    state.max_theta);
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_MinSpeed"),
                    state.min_speed);
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_MaxSpeed"),
                    state.max_speed);
                gl.uniform2f(
                    gl.getUniformLocation(this._particleProgram, "u_WindowSize"),
                    size.width, size.height);
                gl.uniform2f(
                    gl.getUniformLocation(this._particleProgram, "u_PushOut"),
                    0, 0);
                gl.uniform1f(
                    gl.getUniformLocation(this._particleProgram, "u_PushStrength"),
                    1000.0);
                    
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this._randomRG);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.uniform1i(
                    gl.getUniformLocation(this._particleProgram, "u_RgNoise"),
                    0);
                gl.bindVertexArray(this._renderVaos[renderState.read]);
                gl.bindBufferBase(
                    gl.TRANSFORM_FEEDBACK_BUFFER, 0, renderState.buffers[renderState.write]);
                gl.enable(gl.RASTERIZER_DISCARD);
                gl.beginTransformFeedback(gl.POINTS);
                gl.drawArrays(gl.POINTS, 0, renderState.num_part);
    
                gl.endTransformFeedback();
                gl.disable(gl.RASTERIZER_DISCARD);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    
                for (var i = 0; i < this._renderVaoDescs.length; i++) {
                    this._resetBufferVAO(gl, this._renderVaoDescs[i].buffers, this._renderVaoDescs[i].vao);
                }
            }

            cc.PSys.WebGLRenderCmd.prototype.draw.call(this, gl);
        }
    })()
})()