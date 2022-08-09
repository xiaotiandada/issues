import typescript from 'rollup-plugin-typescript'
import sourceMaps from 'rollup-plugin-sourcemaps'

export default {
  input: './src/index.ts',
  plugins: [typescript(), sourceMaps()],
  external: ['date-fns'],
  output: [
    {
      format: 'cjs',
      file: 'lib/index.js',
      sourcemap: false,
    },
  ],
}
