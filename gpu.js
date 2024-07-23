// function gl_createProgram() {

// }

// function gl_createShader() {

// }

// function camera_OrthoProjection() {

// }

// (function (global) {
//     var kh = global.kh;
//     var cc = global.cc;

//     // Replacement for SPRITE
//     kh.RenderToTexture = cc.Sprite.extend({
//         _className: "RenderToTexture",
//         _texture: null, // WEBGL
//         _textureLoaded: false,
//         ctor: function (filename) {
//             cc.Sprite.prototype.ctor.call(self);
//             this.setAnchorPoint(0.5, 0.5);
//         },

//         init: function () {
//             if (cc.isString(fileName)) {

//             }
//         },

//         _createRenderCmd: function () {
//             return new cc.PSys.WebGLRenderCmd(this);
//         }
//     });

//     kh.RenderToTexture.WebGLRenderCmd = function (renderable) {
//         this._shader = null;
//         this._depthWriteValue = null;
//         this._framebuffer = null;
//         this._targetTexture = null;
//     };
//     var proto = kh.RenderToTexture.WebGLRenderCmd.prototype = Object.create(kh.RenderToTexture.WebGLRenderCmd.prototype);

//     kh.RenderToTexture.WebGLRenderCmd.prototype = {
//         constructor: cc.RenderToTexture.WebGLRenderCmd,

//         setShaderProgram: function (shaderProgram) {
//             this._shaderProgram = shaderProgram;
//         },
//         getShaderProgram: function () {
//             return this._shaderProgram;
//         },

//         needDraw: function () {
//             return this._needDraw;
//         },

//         getAnchorPointInPoints: function () {
//             return cc.p(this._anchorPointInPoints);
//         },
//         getDisplayedColor: function () {
//             var tmpColor = this._displayedColor;
//             return cc.color(tmpColor.r, tmpColor.g, tmpColor.b, tmpColor.a);
//         },
//         getDisplayedOpacity: function () {
//             return this._displayedOpacity;
//         },
//         setCascadeColorEnabledDirty: function () {
//             this._cascadeColorEnabledDirty = true;
//             this.setDirtyFlag(cc.Node._dirtyFlags.colorDirty);
//         },
//         setCascadeOpacityEnabledDirty: function () {
//             this._cascadeOpacityEnabledDirty = true;
//             this.setDirtyFlag(cc.Node._dirtyFlags.opacityDirty);
//         },

//     }

// })(this);

// (function () {
//     var kh = global.kh;
//     var cc = global.cc;

//     kh.WebGLParticleSystem = kh.RenderToTexture.extend({
//         _className: "WebGLParticleSystem",
//         origin: [0, 0],
//         born_particles: 0,
//         old_timestamp: 0,
//         num_particles: 20,
//         total_time: 0,
//         gravity: [0, 0],
//         birth_rate: 0,
//         min_theta: 0,
//         max_theta: 0,
//         min_speed: 0,
//         max_speed: 0,
//         size: 0,
//         min_age: 0,
//         max_age: 0,

//         ctor: function () {
//             cc.sys._checkWebGLRenderMode();
//         },

//         _createRenderCmd: function () {
//             kh.WebGLParticleSystem.WebGLRenderCmd(this);
//         }
//     });

//     kh.WebGLParticleSystem.create = function

//         cc.WebGLParticleSystem.WebGLRenderCmd = function (renderable) {
//             cc.RenderToTexture.WebGLRenderCmd.call(this, renderable);


//         }

// })(this);

(function () {
    // var particle_update_vert = `
    //     #version 300 es
    //     precision mediump float;

    //     uniform float u_TimeDelta;
    //     uniform sampler2D u_RgNoise;
    //     uniform vec2 u_Gravity;
    //     uniform vec2 u_Origin;
    //     uniform float u_MinTheta;
    //     uniform float u_MaxTheta;
    //     uniform float u_MinSpeed;
    //     uniform float u_MaxSpeed;

    //     in vec2 i_Position;
    //     in float i_Age;
    //     in float i_Life;
    //     in vec2 i_Velocity;

    //     out vec2 v_Position;
    //     out float v_Age;
    //     out float v_Life;
    //     out vec2 v_Velocity;

    //     void main() {
    //         if (i_Age >= i_Life) {
    //             ivec2 noise_coord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
    //             vec2 rand = texelFetch(u_RgNoise, noise_coord, 0).rg;
    //             float theta = u_MinTheta + rand.r*(u_MaxTheta - u_MinTheta);
    //             float x = cos(theta);
    //             float y = sin(theta);
    //             v_Position = u_Origin;
    //             v_Age = 0.0;
    //             v_Life = i_Life;
    //             v_Velocity = vec2(x, y) * (u_MinSpeed + rand.g * (u_MaxSpeed - u_MinSpeed));
    //         } else {
    //             v_Position = i_Position + i_Velocity * u_TimeDelta;
    //             v_Age = i_Age + u_TimeDelta;
    //             v_Life = i_Life;
    //             v_Velocity = i_Velocity + u_Gravity * u_TimeDelta;
    //             v_Velocity.x = 600.f * cos(5.f * i_Age + i_Life * 100.f);
    //         }

    //     }
    // `;

    // Falling slowly effect
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
                v_Position = vec2(500.0 * x, u_Origin.y);
                v_Age = 0.0;
                v_Life = i_Life;
                v_Velocity = vec2(0, 2.0);
            } else {
                v_Position = i_Position + i_Velocity * u_TimeDelta;
                v_Age = i_Age + u_TimeDelta;
                v_Life = i_Life;
                // v_Velocity = i_Velocity + u_Gravity * u_TimeDelta;
                v_Velocity = i_Velocity;
                // v_Velocity.x = 600.f * cos(5.f * i_Age + i_Life * 100.f);
            }

        }
    `;

    var passthru_frag_shader = `
        #version 300 es
        precision mediump float;
        in float v_Age;
        void main() { discard; }
    `;

    var particle_render_vert = `
        #version 300 es
        precision mediump float;

        uniform mat4 u_wvp;
        uniform float u_size;

        in vec2 i_Position;
        in float i_Age;
        in float i_Life;
        in vec2 i_Coord;
        in vec2 i_TexCoord;

        out float v_Age;
        out float v_Life;
        out vec2 v_TexCoord;

        void main() {
            // vec2 vert_coord = i_Position + (0.75*(1.0-i_Age / i_Life) + 0.25) * u_size * i_Coord;
            vec2 vert_coord = i_Position + u_size * i_Coord;
            v_Age = i_Age;
            v_Life = i_Life;
            v_TexCoord = i_TexCoord;
            gl_Position = u_wvp * vec4(vert_coord, 0.0, 1.0);
        }
    `;

    var particle_render_frag = `
        #version 300 es
        precision mediump float;

        uniform mediump sampler2D u_Sprite;

        in float v_Age;
        in float v_Life;
        in vec2 v_TexCoord;

        out vec4 o_FragColor;

        void main() {
            float t =  v_Age/v_Life;
            vec4 color = vec4(1.0, 1.f, 1.f, 1.f);
            o_FragColor = color * texture(u_Sprite, v_TexCoord);
        }
    `;

    var camera_OrthoProjection = function (pos, width, height) {
        var L = pos[0] - width / 2;
        var R = pos[0] + width / 2;
        var T = pos[1] + height / 2;
        var B = pos[1] - height / 2;
        var res =
            [
                2.0 / (R - L), 0.0, 0.0, 0.0,
                0.0, 2.0 / (T - B), 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                (R + L) / (L - R), (T + B) / (B - T), 0.5, 1.0,
            ];

        return res;
    }

    function createShader(gl, shader_info) {
        var shader = gl.createShader(shader_info.type);
        var i = 0;
        var shader_source = shader_info.source;
        /* skip whitespace to avoid glsl compiler complaining about
        #version not being on the first line*/
        while (/\s/.test(shader_source[i])) i++;
        shader_source = shader_source.slice(i);
        gl.shaderSource(shader, shader_source);
        gl.compileShader(shader);
        var compile_status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compile_status) {
            var error_message = gl.getShaderInfoLog(shader);
            throw "Could not compile shader \"" +
            shader_info.name +
            "\" \n" +
            error_message;
        }
        return shader;
    }

    function createGLProgram(gl, shader_list, transform_feedback_varyings) {
        var program = gl.createProgram();
        for (var i = 0; i < shader_list.length; i++) {
            var shader_info = shader_list[i];
            var shader = createShader(gl, shader_info);
            gl.attachShader(program, shader);
        }

        /* Specify varyings that we want to be captured in the transform
           feedback buffer. */
        if (transform_feedback_varyings != null) {
            gl.transformFeedbackVaryings(program,
                transform_feedback_varyings,
                gl.INTERLEAVED_ATTRIBS);
        }
        gl.linkProgram(program);
        var link_status = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!link_status) {
            var error_message = gl.getProgramInfoLog(program);
            throw "Could not link program.\n" + error_message;
        }
        return program;
    }

    cc.PSys = cc.Sprite.extend({
        _className: "PSys",

        ctor: function (filename, rect, rotated) {
            cc.Sprite.prototype.ctor.call(this, filename, rect, rotated);
        },

        _createRenderCmd: function () {
            return new cc.PSys.WebGLRenderCmd(this);
        }
    });

    cc.PSys.create = function (filename, rect, rotated) {
        return new cc.PSys(filename, rect, rotated);
    };

    (function () {
        cc.PSys.WebGLRenderCmd = function (renderable) {
            cc.Sprite.WebGLRenderCmd.call(this, renderable);
            this._needDraw = true;

            var gl = cc._renderContext;

            // Draw pass specific state (pre-fill the variables, saving on alloc latency)

            this._oldRenderState = {
                shader: null,
                depthWriteValue: null,
                framebuffer: null,
                texture: null,
            };

            this._renderState = {
                generateShader: null,
                renderShader: null,
                depthWriteValue: null,
                framebuffer: null,
                targetTexture: null,
                texture: null,
                randomRG: null,
                vaos: [],
                buffers: [],
                read: 0,
                write: 1,
                particle_tex: null,
                viewportSize: null,
                vao_desc: null,
            };

            this._particleState = {
                origin: [0, 0],
                born_particles: 0,
                old_timestamp: 0,
                num_particles: 20,
                total_time: 0,
                gravity: [0, 500.0],
                birth_rate: 0.15,
                min_theta: 0,
                max_theta: Math.PI,
                min_speed: 6.0,
                max_speed: 10.5,
                size: 35.0,
                min_age: 15.0,
                max_age: 20.0,
            };

            // Cache texture for rendering use
            this._renderState.texture = { ...this._node._texture };

            // Compile programs
            {
                if (!cc._particleGPUProgramGenerate) {
                    cc._particleGPUProgramGenerate = createGLProgram(
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
                }
                this._renderState.generateShader = cc._particleGPUProgramGenerate;

                if (!cc._particleGPUProgramRender) {
                    cc._particleGPUProgramRender = createGLProgram(
                        gl,
                        [
                            { name: "particle-render-vert", type: gl.VERTEX_SHADER, source: particle_render_vert },
                            { name: "particle-render-frag", type: gl.FRAGMENT_SHADER, source: particle_render_frag },
                        ],
                        null);
                }
                this._renderState.renderShader = cc._particleGPUProgramRender;
            }

            // Prepare GL resources
            {
                this._renderState.framebuffer = gl.createFramebuffer();
                this._renderState.targetTexture = gl.createTexture();
                this._renderState.viewportSize = cc.size(1024, 1024);

                // Init target texture
                gl.bindTexture(gl.TEXTURE_2D, this._renderState.targetTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                    this._renderState.viewportSize.width, this._renderState.viewportSize.height, 0,
                    gl.RGBA, gl.UNSIGNED_BYTE, null);
                // set the filtering so we don't need mips
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                // Setup VAOs
                this._renderState.update_attrib_locations = {
                    i_Position: {
                        location: gl.getAttribLocation(this._renderState.generateShader, "i_Position"),
                        num_components: 2,
                        type: gl.FLOAT
                    },
                    i_Age: {
                        location: gl.getAttribLocation(this._renderState.generateShader, "i_Age"),
                        num_components: 1,
                        type: gl.FLOAT
                    },
                    i_Life: {
                        location: gl.getAttribLocation(this._renderState.generateShader, "i_Life"),
                        num_components: 1,
                        type: gl.FLOAT
                    },
                    i_Velocity: {
                        location: gl.getAttribLocation(this._renderState.generateShader, "i_Velocity"),
                        num_components: 2,
                        type: gl.FLOAT
                    }
                };
                this._renderState.render_attrib_locations = {
                    i_Position: {
                        location: gl.getAttribLocation(this._renderState.renderShader, "i_Position"),
                        num_components: 2,
                        type: gl.FLOAT,
                        divisor: 1
                    },
                    i_Age: {
                        location: gl.getAttribLocation(this._renderState.renderShader, "i_Age"),
                        num_components: 1,
                        type: gl.FLOAT,
                        divisor: 1
                    },
                    i_Life: {
                        location: gl.getAttribLocation(this._renderState.renderShader, "i_Life"),
                        num_components: 1,
                        type: gl.FLOAT,
                        divisor: 1
                    }
                };

                this._renderState.vaos = [
                    gl.createVertexArray(),
                    gl.createVertexArray(),
                    gl.createVertexArray(),
                    gl.createVertexArray()
                ];

                this._renderState.buffers = [gl.createBuffer(), gl.createBuffer()];
                var sprite_vert_data =
                    new Float32Array([
                        1, 1,
                        1, 1,

                        -1, 1,
                        0, 1,

                        -1, -1,
                        0, 0,

                        1, 1,
                        1, 1,

                        -1, -1,
                        0, 0,

                        1, -1,
                        1, 0]);
                this._renderState.sprite_attrib_locations = {
                    i_Coord: {
                        location: gl.getAttribLocation(this._renderState.renderShader, "i_Coord"),
                        num_components: 2,
                        type: gl.FLOAT,
                    },
                    i_TexCoord: {
                        location: gl.getAttribLocation(this._renderState.renderShader, "i_TexCoord"),
                        num_components: 2,
                        type: gl.FLOAT
                    }
                };
                this._renderState.sprite_vert_buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this._renderState.sprite_vert_buf);
                gl.bufferData(gl.ARRAY_BUFFER, sprite_vert_data, gl.STATIC_DRAW);

                this._renderState.vao_desc = [
                    {
                        vao: this._renderState.vaos[0],
                        buffers: [{
                            buffer_object: this._renderState.buffers[0],
                            stride: 4 * 6,
                            attribs: this._renderState.update_attrib_locations
                        }]
                    },
                    {
                        vao: this._renderState.vaos[1],
                        buffers: [{
                            buffer_object: this._renderState.buffers[1],
                            stride: 4 * 6,
                            attribs: this._renderState.update_attrib_locations
                        }]
                    },
                    {
                        vao: this._renderState.vaos[2],
                        buffers: [{
                            buffer_object: this._renderState.buffers[0],
                            stride: 4 * 6,
                            attribs: this._renderState.render_attrib_locations
                        },
                        {
                            buffer_object: this._renderState.sprite_vert_buf,
                            stride: 4 * 4,
                            attribs: this._renderState.sprite_attrib_locations
                        }],
                    },
                    {
                        vao: this._renderState.vaos[3],
                        buffers: [{
                            buffer_object: this._renderState.buffers[1],
                            stride: 4 * 6,
                            attribs: this._renderState.render_attrib_locations
                        },
                        {
                            buffer_object: this._renderState.sprite_vert_buf,
                            stride: 4 * 4,
                            attribs: this._renderState.sprite_attrib_locations
                        }],
                    },
                ];
                var initial_data =
                    new Float32Array(this._initData(this._particleState.num_particles,
                        this._particleState.min_age, this._particleState.max_age));
                gl.bindBuffer(gl.ARRAY_BUFFER, this._renderState.buffers[0]);
                gl.bufferData(gl.ARRAY_BUFFER, initial_data, gl.STREAM_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, this._renderState.buffers[1]);
                gl.bufferData(gl.ARRAY_BUFFER, initial_data, gl.STREAM_DRAW);
                for (var i = 0; i < this._renderState.vao_desc.length; i++) {
                    proto._setupBufferVAO(gl, this._renderState.vao_desc[i].buffers, this._renderState.vao_desc[i].vao);
                }

                this._renderState.randomRG = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this._renderState.randomRG);
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
            }

        }
        var proto = cc.PSys.WebGLRenderCmd.prototype = Object.create(cc.Sprite.WebGLRenderCmd.prototype);
        proto.constructor = cc.PSys.WebGLRenderCmd;

        proto._beginDraw = function (ctx) {
            var gl = ctx || cc._renderContext;

            this._oldRenderState.shader = gl.getParameter(gl.CURRENT_PROGRAM);
            this._oldRenderState.depthWriteValue = gl.getParameter(gl.DEPTH_WRITEMASK);
            // this._oldRenderState.framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            this._oldRenderState.texture = gl.getParameter(gl.TEXTURE_BINDING_2D);

            // Prepare for rendering
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._renderState.framebuffer);
            gl.bindTexture(gl.TEXTURE_2D, this._renderState.targetTexture);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, this._renderState.targetTexture, 0);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);
            gl.viewport(0, 0, this._renderState.viewportSize.width,
                this._renderState.viewportSize.height);
        };

        proto._afterDraw = function (ctx) {
            var gl = ctx || cc._renderContext;

            gl.useProgram(this._oldRenderState.shader);
            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(this._oldRenderState.depthWriteValue);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, this._oldRenderState.texture);
            gl.disable(gl.CULL_FACE);
            cc.director.setViewport();
            cc.glBindTexture2D(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        };

        proto._draw = function (ctx) {
            var dt = Date.now();
            var gl = ctx || cc._renderContext;

            var size = cc.director.getWinSize();

            var state = this._particleState;
            var renderState = this._renderState;
            var num_part = this._particleState.born_particles;
            // Update internal timestamp
            var time_delta = 0.0;
            if (state.old_timestamp != 0) {
                time_delta = dt - state.old_timestamp;
                if (time_delta > 500.0) {
                    time_delta = 0.0;
                }
            }
            state.old_timestamp = dt;
            // Set born_particles (new frame number)
            if (state.born_particles < state.num_particles) {
                state.born_particles = Math.min(state.num_particles,
                    Math.floor(state.born_particles + state.birth_rate * time_delta));
            }

            gl.useProgram(this._renderState.generateShader);

            for (var i = 0; i < this._renderState.vao_desc.length; i++) {
                proto._setupBufferVAO(gl, this._renderState.vao_desc[i].buffers, this._renderState.vao_desc[i].vao);
            }
            gl.uniform1f(
                gl.getUniformLocation(renderState.generateShader, "u_TimeDelta"),
                time_delta / 1000.0);
            gl.uniform1f(
                gl.getUniformLocation(renderState.generateShader, "u_TotalTime"),
                state.total_time);
            gl.uniform2f(
                gl.getUniformLocation(renderState.generateShader, "u_Gravity"),
                state.gravity[0], state.gravity[1]);
            gl.uniform2f(
                gl.getUniformLocation(renderState.generateShader, "u_Origin"),
                state.origin[0],
                state.origin[1]);
            gl.uniform1f(
                gl.getUniformLocation(renderState.generateShader, "u_MinTheta"),
                state.min_theta);
            gl.uniform1f(
                gl.getUniformLocation(renderState.generateShader, "u_MaxTheta"),
                state.max_theta);
            gl.uniform1f(
                gl.getUniformLocation(renderState.generateShader, "u_MinSpeed"),
                state.min_speed);
            gl.uniform1f(
                gl.getUniformLocation(renderState.generateShader, "u_MaxSpeed"),
                state.max_speed);
            state.total_time += time_delta;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, renderState.randomRG);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.uniform1i(
                gl.getUniformLocation(renderState.generateShader, "u_RgNoise"),
                0);
            gl.bindVertexArray(renderState.vaos[renderState.read]);
            gl.bindBufferBase(
                gl.TRANSFORM_FEEDBACK_BUFFER, 0, renderState.buffers[renderState.write]);
            gl.enable(gl.RASTERIZER_DISCARD);
            gl.beginTransformFeedback(gl.POINTS);
            gl.drawArrays(gl.POINTS, 0, num_part);
            gl.endTransformFeedback();
            gl.disable(gl.RASTERIZER_DISCARD);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
            gl.bindVertexArray(renderState.vaos[renderState.read + 2]);
            gl.useProgram(renderState.renderShader);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._renderState.texture._webTextureObj);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(renderState.renderShader, "u_wvp"),
                false, camera_OrthoProjection([0, 0], size.width, size.height));
            gl.uniform1f(
                gl.getUniformLocation(renderState.renderShader, "u_size"),
                state.size);
            gl.uniform1i(
                gl.getUniformLocation(renderState.renderShader, "u_Sprite"),
                0);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, num_part);
            var tmp = renderState.read;
            renderState.read = renderState.write;
            renderState.write = tmp;

            for (var i = 0; i < this._renderState.vao_desc.length; i++) {
                proto._resetBufferVAO(gl, this._renderState.vao_desc[i].buffers, this._renderState.vao_desc[i].vao);
            }
        }

        proto._initData = function (num_parts, min_age, max_age) {
            var data = [];
            for (var i = 0; i < num_parts; ++i) {
                data.push(0.0);
                data.push(0.0);
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

        proto._setupBufferVAO = function (gl, buffers, vao) {
            gl.bindVertexArray(vao);
            for (var i = 0; i < buffers.length; i++) {
                var buffer = buffers[i];
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer_object);
                var offset = 0;
                for (var attrib_name in buffer.attribs) {
                    if (buffer.attribs.hasOwnProperty(attrib_name)) {
                        var attrib_desc = buffer.attribs[attrib_name];
                        gl.enableVertexAttribArray(attrib_desc.location);
                        gl.vertexAttribPointer(
                            attrib_desc.location,
                            attrib_desc.num_components,
                            attrib_desc.type,
                            false,
                            buffer.stride,
                            offset);
                        var type_size = 4;
                        offset += attrib_desc.num_components * type_size;
                        if (attrib_desc.hasOwnProperty("divisor")) {
                            gl.vertexAttribDivisor(attrib_desc.location, attrib_desc.divisor);
                        }
                    }
                }
            }
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        proto._resetBufferVAO = function (gl, buffers, vao) {
            gl.bindVertexArray(vao);
            for (var i = 0; i < buffers.length; i++) {
                var buffer = buffers[i];
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer_object);
                var offset = 0;
                for (var attrib_name in buffer.attribs) {
                    if (buffer.attribs.hasOwnProperty(attrib_name)) {
                        var attrib_desc = buffer.attribs[attrib_name];
                        gl.disableVertexAttribArray(attrib_desc.location);
                        if (attrib_desc.hasOwnProperty("divisor")) {
                            gl.vertexAttribDivisor(attrib_desc.location, 1);
                        }
                    }
                }
            }
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        // Render API callable
        proto.uploadData = function (f32buffer, ui32buffer, vertexDataOffset) {
            var gl = cc._renderContext;
            proto._beginDraw.call(this, gl);
            proto._draw.call(this, gl);
            proto._afterDraw.call(this, gl);

            var node = this._node;

            // Cheating
            node._texture._contentSize.width = this._renderState.viewportSize.width;
            node._texture._contentSize.height = this._renderState.viewportSize.height;
            node._texture._webTextureObj = this._renderState.targetTexture;

            return cc.Sprite.WebGLRenderCmd.prototype.uploadData.call(this, f32buffer, ui32buffer, vertexDataOffset);
        }


    })();

})();