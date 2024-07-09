#version 300 es
precision mediump float;

// per frame
uniform mat4 viewProjection;

// per object
uniform mat4 world;

in vec3 iPos;
in vec2 iTex;
in vec4 iColor;

out vec2 oTex;
out vec4 oColor;

void main()
{
    oTex = iTex;
    oColor = iColor;
    gl_Position = world * viewProjection * vec4(iPos, 1.f);
}
