#version 300 es
precision mediump float;

uniform sampler2D sprite;

in vec2 iTex;
in vec4 iColor;

out vec4 oColor;

void main()
{
    oColor = iColor * texture(sprite, iTex);
}