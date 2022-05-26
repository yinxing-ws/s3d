#define PI 3.14159265359
#define RECIPROCAL_PI 0.31830988618
#define EPSILON 1e-6
#define LOG2 1.442695

#define saturate( a ) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )

vec4 RGBMToLinear(vec4 value, float maxRange) {
    return vec4(value.rgb * value.a * maxRange, 1.0);
}

vec4 gammaToLinear(vec4 srgbIn) {
    return vec4(pow(srgbIn.rgb, vec3(2.2)), srgbIn.a);
}

vec4 linearToGamma(vec4 linearIn) {
    return vec4(pow(linearIn.rgb, vec3(1.0 / 2.2)), linearIn.a);
}

varying vec2 v_uv;

uniform vec4 u_baseColor;
uniform float u_alphaCutoff;

#ifdef O3_BASE_TEXTURE
uniform sampler2D u_baseTexture;
#endif

#ifdef O3_HAS_NORMAL

    #if defined( O3_HAS_TANGENT ) && defined( O3_NORMAL_TEXTURE )

    varying mat3 v_TBN;

    #else

    varying vec3 v_normal;

    #endif

#endif


void main() {
    vec4 baseColor = u_baseColor;

    #ifdef O3_BASE_TEXTURE
    vec4 textureColor = texture2D(u_baseTexture, v_uv);
        #ifndef OASIS_COLORSPACE_GAMMA
    textureColor = gammaToLinear(textureColor);
        #endif
    baseColor *= textureColor;
    #endif

    #ifdef ALPHA_CUTOFF
    if(baseColor.a < u_alphaCutoff) {
        discard;
    }
    #endif

    #ifndef OASIS_COLORSPACE_GAMMA
    baseColor = linearToGamma(baseColor);
    #endif

    gl_FragColor = baseColor;
}
