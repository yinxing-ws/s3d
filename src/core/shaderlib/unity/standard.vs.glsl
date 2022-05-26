attribute vec3 POSITION;

#ifdef O3_HAS_UV
attribute vec2 TEXCOORD_0;
#endif

uniform mat4 u_localMat;
uniform mat4 u_modelMat;
uniform mat4 u_viewMat;
uniform mat4 u_projMat;
uniform mat4 u_MVMat;
uniform mat4 u_MVPMat;
uniform mat4 u_normalMat;
uniform vec3 u_cameraPos;
uniform vec4 u_tilingOffset;

#ifndef OMIT_NORMAL

    #ifdef O3_HAS_NORMAL

    attribute vec3 NORMAL;

    #endif

    #ifdef O3_HAS_TANGENT

    attribute vec4 TANGENT;

    #endif

#endif

varying vec2 v_uv;
varying vec3 v_position;

void main() {
    vec4 position = vec4(POSITION, 1.0);

    #ifdef O3_HAS_UV

    v_uv = TEXCOORD_0;

    #else

    // may need this calculate normal
    v_uv = vec2(0., 0.);

    #endif

    #ifdef O3_NEED_TILINGOFFSET

    v_uv = v_uv * u_tilingOffset.xy + u_tilingOffset.zw;

    #endif

    #ifndef O3_GENERATE_SHADOW_MAP

    gl_Position = u_MVPMat * position;

    #endif
}
