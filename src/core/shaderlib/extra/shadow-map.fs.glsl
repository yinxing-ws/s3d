/**
 * Decompose and save depth value.
*/
vec4 pack (float depth) {

  // Use rgba 4 bytes with a total of 32 bits to store the z value, and the accuracy of 1 byte is 1/256.
  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);

  vec4 rgbaDepth = fract(depth * bitShift); // Calculate the z value of each point

  // Cut off the value which do not fit in 8 bits
  rgbaDepth -= rgbaDepth.gbaa * bitMask;

  return rgbaDepth;
}

void main() {

  // Store the z value separately in the rgba component, and the shadow color is also the depth value z
  gl_FragColor = pack(gl_FragCoord.z);

}