uniform sampler2D u_baseTexture;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_bloomIntensity;
uniform float u_bloomThreshold;

varying vec2 v_uv;

void main() {
    // flip y
    vec4 color = texture2D(u_baseTexture, vec2(v_uv.x, 1.0 - v_uv.y));

    // contrast
    color = vec4((color.rgb - 0.5f) * u_contrast + 0.5f, color.a);
    // brightness
    color = vec4(color.rgb * u_brightness, color.a);

    // bloom
    if(color.r > u_bloomThreshold && color.g > u_bloomThreshold && color.b > u_bloomThreshold) {
        color = vec4(color.rgb * u_bloomIntensity, color.a);
    }

    gl_FragColor = color;
}