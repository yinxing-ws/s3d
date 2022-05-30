// rollup.config.js
const path = require('path');

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import serve from 'rollup-plugin-serve';
import glslify from 'rollup-plugin-glslify';

const { NODE_ENV } = process.env;

const extensions = ['.js', '.ts'];
const mainFields = NODE_ENV === 'development' ? ['module', 'main'] : undefined;

export default {
  input: 'src/index.ts',
  output: [
    {
      file: path.resolve(__dirname, 'dist/module.js'),
      format: 'es',
      sourcemap: true,
    },
    {
      file: path.resolve(__dirname, 'dist/main.js'),
      format: 'commonjs',
      sourcemap: false,
    },
  ],
  plugins: [
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
  ],
};
