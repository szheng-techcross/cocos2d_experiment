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

(function () {
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
        out vec2 v_Normal;
        out vec2 v_Position;

        vec2 rotate(vec2 v, float a) {
            float s = sin(a);
            float c = cos(a);
            mat2 m = mat2(c, s, -s, c);
            return m * v;
        }

        void main() {
            float m = mod(i_Age, 0.25);
            // vec2 vert_coord = i_Position + (0.75*(1.0-i_Age / i_Life) + 0.25) * u_size * i_Coord; // size reduction
            int s = gl_InstanceID % 2;
            vec2 vert_coord = i_Position;
            float angle = 0.25 * cos(i_Age / i_Life * 40.f) + 0.785398f;
            if(s == 0) {
                vert_coord += u_size * rotate(i_Coord, angle); // self rotation
            } else {
                vert_coord += u_size * -rotate(i_Coord, angle); // self rotation
            }
            // vec2 vert_coord = i_Position + u_size * i_Coord;
            v_Age = i_Age;
            v_Life = i_Life;
            v_TexCoord = i_TexCoord;
            // v_Normal = normalize(rotate(vec2(0, 1), angle));
            v_Normal = vec2(0, 1.0);
            v_Position = i_Position;
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
        in vec2 v_Normal;
        in vec2 v_Position;

        out vec4 o_FragColor;
        // vec3(0.75164, 0.60648, 0.22648);
        // vec3(0.628281, 0.555802, 0.366065)

        void main() {
            vec4 texColor = texture(u_Sprite, v_TexCoord);
            float t =  v_Age/v_Life;
            vec2 dir = normalize(-vec2(-1.0, -1.0));
            vec2 viewDir = normalize(v_Position);
            vec2 r   = reflect(viewDir, v_Normal);
            float diff = max(dot(v_Normal, dir), 0.0);
            vec4 diffColor = diff * texColor;
            float spec = pow(max(dot(viewDir, r), 0.0), 51.2f);
            vec3 specColor = 0.5 * spec * vec3(1.0, 0.83, 0.0);
            o_FragColor = vec4(specColor, 1.0f) + diffColor;
            o_FragColor.a = texColor.a;
        }
    `;

    cc.PSys = cc.Node.extend({
        _className: "PSys",
        _loader: null,
        _textureLoaded: false,
        // TODO: plug the final vertices
        _rect: cc.rect(0, 0, 0, 0),
        _particleTextureAtlas: null,

        origin: [0, 0],
        born_particles: 0,
        old_timestamp: 0,
        num_particles: 0,
        total_time: 0,
        gravity: [0, 0],
        birth_rate: 0,
        min_theta: 0,
        max_theta: 0,
        min_speed: 0,
        max_speed: 0,
        size: 0,
        min_age: 0,
        max_age: 0,
        last_spawn_time: 0.0,

        _blendFunc: {},

        ctor: function (filename) {
            cc.Node.prototype.ctor.call(this);

            this._blendFunc.src = cc.BLEND_SRC;
            this._blendFunc.dst = cc.BLEND_DST;

            this._loader = new cc.PSys.LoadManager();
            
            this._loadTexture(filename);
        },

        _loadTexture: function(filename, rect) {
            var tex = cc.textureCache.getTextureForKey(filename);
            if(!tex) {
                tex = cc.textureCache.addImage(filename);
            }
            if(!tex.isLoaded()) {
                this._loader.clear();
                this._loader.once(tex, function() {
                    this._loadTexture(filename, rect);
                    this.dispatchEvent("load");
                }, this);
                return false;
            }
            if(!rect) {
                var size = tex.getContentSize();
                rect = cc.rect(0, 0, size.width, size.height);
            }

            return this._initTexture(tex, rect);
        },
        
        _initTexture: function(texture, rect) {
            this._loader.clear();

            this._textureLoaded = texture.isLoaded();
            if(!this._textureLoaded) {
                this._loader.once(texture, function() {
                    this._initTexture(texture, rect);
                    this.dispatchEvent("load");
                }, this);

                return false;
            }

            if (rect) {
                this._rect.x = rect.x;
                this._rect.y = rect.y;
                this._rect.width = rect.width;
                this._rect.height = rect.height;
            }
            else {
                rect = cc.rect(0, 0, texture.width, texture.height);
            }
            this._particleTextureAtlas = texture;
            
            return true;
        },

        _createRenderCmd: function () {
            return new cc.PSys.WebGLRenderCmd(this);
        }
    });

    (function() {
        var manager = cc.PSys.LoadManager = function () {
            this.list = [];
        }
        
        manager.prototype.add = function (source, callback, target) {
            if (!source || !source.addEventListener) return;

            source.addEventListener('load', callback, target);
            this.list.push({
                source,
                listener: callback,
                target,
            });
        };

        manager.prototype.once = function (source, callback, target) {
            if (!source || !source.addEventListener) return;
            var tmpCallback = function (event) {
                source.removeEventListener('load', tmpCallback, target);
                callback.call(target, event);
            };
            source.addEventListener('load', tmpCallback, target);
            this.list.push({
                source: source,
                listener: tmpCallback,
                target: target
            });
        };

        manager.prototype.clear = function () {
            while (this.list.length > 0) {
                var item = this.list.pop();
                item.source.removeEventListener('load', item.listener, item.target);
            }
        };
    })();
    cc.EventHelper.prototype.apply(cc.PSys.prototype);

    (function () {
        cc.PSys.WebGLRenderCmd = function (renderable) {
            cc.Node.WebGLRenderCmd.call(this, renderable);
            var gl = cc._renderContext;
            var size = cc.director.getWinSize();

            this._color = new Uint32Array(1);
            this._recursiveDirty = false;
            this._dirty = false;
            this._needDraw = true;
            this._vertices = [
                {x: 0, y: size.height, u: 0, v: 1},
                {x: 0, y: 0, u: 0, v: 0},
                {x: size.width, y: size.height, u: 1, v: 1},
                {x: size.width, y: 0, u: 1, v: 0}
            ];

            this._oldRenderState = {
                shader: null,
                depthWriteValue: null,
                framebuffer: null,
                texture: null,
            };

            this._renderState = {
                renderShader: null,
                depthWriteValue: null,
                framebuffer: null,
                targetTexture: null,
                texture: null,
                vaos: [],
                buffers: [],
                read: 0,
                write: 1,
                particle_tex: null,
                viewportSize: null,
                vao_desc: null,
                dt: 0,
                num_part: 0,
            };

            this.setup.call(this, gl);
            this._setupRenderTarget.call(this, gl, size);
            this.initData.call(this, gl);
        }
        var proto = cc.PSys.WebGLRenderCmd.prototype = Object.create(cc.Node.WebGLRenderCmd.prototype);
        proto.constructor = cc.PSys.WebGLRenderCmd;

        proto.setup = function (gl) {
            this._renderState.renderShader = createGLProgram(
                gl,
                [
                    { name: "particle-render-vert", type: gl.VERTEX_SHADER, source: particle_render_vert },
                    { name: "particle-render-frag", type: gl.FRAGMENT_SHADER, source: particle_render_frag },
                ],
                null);

            // Setup VAOs
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
                        attribs: this._renderState.render_attrib_locations
                    },
                    {
                        buffer_object: this._renderState.sprite_vert_buf,
                        stride: 4 * 4,
                        attribs: this._renderState.sprite_attrib_locations
                    }],
                },
                {
                    vao: this._renderState.vaos[1],
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
        };

        // This exists for re-instancing/changing parameters of the system
        proto.initData = function (gl) {
            var node = this._node;
            var initial_data =
                new Float32Array(this._initData(node.num_particles,
                    this._node.min_age, node.max_age));
            gl.bindBuffer(gl.ARRAY_BUFFER, this._renderState.buffers[0]);
            gl.bufferData(gl.ARRAY_BUFFER, initial_data, gl.STREAM_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._renderState.buffers[1]);
            gl.bufferData(gl.ARRAY_BUFFER, initial_data, gl.STREAM_DRAW);
        };

        proto._setupRenderTarget = function (gl, viewport) {
            if (this._renderState.framebuffer) {
                gl.deleteFramebuffer(this._renderState.framebuffer);
                this._renderState.framebuffer = null;
            }
            if (this._renderState.targetTexture) {
                gl.deleteTexture(this._renderState.targetTexture);
                this._renderState.targetTexture = null;
            }

            this._renderState.framebuffer = gl.createFramebuffer();
            this._renderState.targetTexture = gl.createTexture();
            this._renderState.viewportSize = viewport;

            gl.bindTexture(gl.TEXTURE_2D, this._renderState.targetTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                viewport.width, viewport.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null);
            // set the filtering so we don't need mips
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };

        proto._beginDraw = function (ctx) {
            var gl = ctx || cc._renderContext;
            var state = this._node;
            var renderState = this._renderState;

            // Save gl states to restore after custom rendering
            this._oldRenderState.shader = gl.getParameter(gl.CURRENT_PROGRAM);
            this._oldRenderState.depthWriteValue = gl.getParameter(gl.DEPTH_WRITEMASK);
            this._oldRenderState.texture = gl.getParameter(gl.TEXTURE_BINDING_2D);

            gl.bindFramebuffer(gl.FRAMEBUFFER, this._renderState.framebuffer);
            gl.bindTexture(gl.TEXTURE_2D, this._renderState.targetTexture);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, this._renderState.targetTexture, 0);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.viewport(0, 0, this._renderState.viewportSize.width,
                this._renderState.viewportSize.height);

            var dt = Date.now();
            this._renderState.num_part = state.born_particles;
            // Update internal timestamp
            this._renderState.dt = 0.0;
            if (state.old_timestamp != 0) {
                this._renderState.dt = dt - state.old_timestamp;
                if (this._renderState.dt > 500.0) {
                    this._renderState.dt = 0.0;
                }
            }
            state.old_timestamp = dt;
            // Set born_particles (new frame number)
            renderState.num_part = state.born_particles;
            if (state.born_particles < state.num_particles && state.last_spawn_time > 2000.0) {
                // state.born_particles = Math.min(state.num_particles,
                //     Math.floor(state.born_particles + state.birth_rate * this._renderState.dt));
                state.born_particles = Math.min(state.num_particles, state.born_particles + 1);
                state.last_spawn_time = 0.0;
            }
            state.last_spawn_time += this._renderState.dt;
            state.total_time += this._renderState.dt;
        };

        proto._afterDraw = function (ctx) {
            var gl = ctx || cc._renderContext;

            gl.useProgram(this._oldRenderState.shader);
            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(this._oldRenderState.depthWriteValue);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            cc.glBindTexture2D(null);
            gl.disable(gl.CULL_FACE);
            cc.director.setViewport();
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        };

        proto.draw = function (ctx) {
            var gl = ctx || cc._renderContext;
            var size = cc.director.getWinSize();
            var state = this._node;
            var renderState = this._renderState;

            for (var i = 0; i < this._renderState.vao_desc.length; i++) {
                this._setupBufferVAO(gl, this._renderState.vao_desc[i].buffers, this._renderState.vao_desc[i].vao);
            }
            gl.bindVertexArray(renderState.vaos[renderState.read]);
            gl.useProgram(renderState.renderShader);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, state._particleTextureAtlas?._webTextureObj);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(renderState.renderShader, "u_wvp"),
                false, camera_OrthoProjection([0, 0], size.width, size.height));
            gl.uniform1f(
                gl.getUniformLocation(renderState.renderShader, "u_size"),
                state.size);
            gl.uniform1i(
                gl.getUniformLocation(renderState.renderShader, "u_Sprite"),
                0);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, renderState.num_part);
            for (var i = 0; i < this._renderState.vao_desc.length; i++) {
                this._resetBufferVAO(gl, this._renderState.vao_desc[i].buffers, this._renderState.vao_desc[i].vao);
            }

            if(!cc.director._paused) {
                var tmp = renderState.read;
                renderState.read = renderState.write;
                renderState.write = tmp;
            }
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
                for (var attrib_name in buffer.attribs) {
                    if (buffer.attribs.hasOwnProperty(attrib_name)) {
                        var attrib_desc = buffer.attribs[attrib_name];
                        gl.disableVertexAttribArray(attrib_desc.location);
                    }
                }
            }
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        // Render API callable
        proto.uploadData = function (f32buffer, ui32buffer, vertexDataOffset) {
            var gl = cc._renderContext;
            this._beginDraw.call(this, gl);
            this.draw(gl);
            this._afterDraw.call(this, gl);

            var node = this._node, locTexture = node._texture;

            // Cheating
            node._texture = new cc.Texture2D();
            node._texture._contentSize.width = this._renderState.viewportSize.width;
            node._texture._contentSize.height = this._renderState.viewportSize.height;
            node._texture._webTextureObj = this._renderState.targetTexture;

            if (!this._displayedOpacity)
                return false;
            var opacity = this._displayedOpacity;
            var r = this._displayedColor.r,
                g = this._displayedColor.g,
                b = this._displayedColor.b;
            if (node._opacityModifyRGB) {
                var a = opacity / 255;
                r *= a;
                g *= a;
                b *= a;
            }
            this._color[0] = ((opacity<<24) | (b<<16) | (g<<8) | r);
            var z = node._vertexZ;
            var vertices = this._vertices;
            var i, len = vertices.length, vertex, offset = vertexDataOffset;
            for (i = 0; i < len; ++i) {
                vertex = vertices[i];
                f32buffer[offset] = vertex.x;
                f32buffer[offset + 1] = vertex.y;
                f32buffer[offset + 2] = z;
                ui32buffer[offset + 3] = this._color[0];
                f32buffer[offset + 4] = vertex.u;
                f32buffer[offset + 5] = vertex.v;
                offset += 6;
            }
            return len;
        }


    })();

})();