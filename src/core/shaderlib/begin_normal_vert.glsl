    #ifdef O3_HAS_NORMAL

    vec3 normal = vec3( NORMAL );

        #if defined( O3_HAS_TANGENT ) && defined( O3_NORMAL_TEXTURE )

        vec4 tangent = vec4( TANGENT );

        #endif

    #endif
