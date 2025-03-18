import { logger } from '@/logger'

export function createShader(gl: WebGLRenderingContext): WebGLProgram | null {
  // バーテックスシェーダーのコンパイル
  const vertexShaderId = gl.createShader(gl.VERTEX_SHADER)

  if (vertexShaderId == null) {
    console.error('failed to create vertexShader')
    return null
  }

  const vertexShader: string =
    'precision mediump float;' +
    'attribute vec3 position;' +
    'attribute vec2 uv;' +
    'varying vec2 vuv;' +
    'void main(void)' +
    '{' +
    '   gl_Position = vec4(position, 1.0);' +
    '   vuv = uv;' +
    '}'

  gl.shaderSource(vertexShaderId, vertexShader)
  gl.compileShader(vertexShaderId)

  // フラグメントシェーダのコンパイル
  const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER)

  if (fragmentShaderId == null) {
    logger.error('failed to create fragmentShader')
    return null
  }

  const fragmentShader: string =
    'precision mediump float;' +
    'varying vec2 vuv;' +
    'uniform sampler2D texture;' +
    'void main(void)' +
    '{' +
    '   gl_FragColor = texture2D(texture, vuv);' +
    '}'

  gl.shaderSource(fragmentShaderId, fragmentShader)
  gl.compileShader(fragmentShaderId)

  // プログラムオブジェクトの作成
  const programId = gl.createProgram()
  gl.attachShader(programId, vertexShaderId)
  gl.attachShader(programId, fragmentShaderId)

  gl.deleteShader(vertexShaderId)
  gl.deleteShader(fragmentShaderId)

  // リンク
  gl.linkProgram(programId)
  gl.useProgram(programId)

  return programId
}
