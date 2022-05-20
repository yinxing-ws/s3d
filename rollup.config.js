// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import serve from 'rollup-plugin-serve';
import glslify from 'rollup-plugin-glslify';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const mainFields =
  NODE_ENV === 'development' ? ['debug', 'module', 'main'] : undefined;

const plugins = [
  resolve({ extensions, preferBuiltins: true, mainFields }),
  glslify({
    include: [/\.glsl$/],
  }),
  babel({
    extensions,
    babelHelpers: 'bundled',
    exclude: ['node_modules/**', 'packages/**/node_modules/**'],
  }),
  commonjs(),
  NODE_ENV === 'development'
    ? serve({
        port: 8080,
      })
    : null,
];

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'module',
    sourcemap: false,
  },
  plugins,
};
