<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import { Constant } from '@framework/live2dcubismframework';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { isPointInTriangle } from '../utils/isPointInTriangle';
import { safeInject } from '../utils/safeInject';
import { type ProvidedWebGLProgram, type ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';
import { type ProvidedRegisterRenderFunction, type ProvidedUnregisterRenderFunction } from './VCubismRenderLoopProvider.vue';

const props = withDefaults(defineProps<{
  src: string;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  zIndex?: number;
}>(), {
  rect: null,
  zIndex: 0,
});

// コンポーネントが初期化されたかどうかのフラグ
const initialized = ref(false);

// 親コンポーネントから提供されるWebGL関連の依存関係を注入
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');
const registerRenderFunction = safeInject<ProvidedRegisterRenderFunction>('RegisterRenderFunction');
const unregisterRenderFunction = safeInject<ProvidedUnregisterRenderFunction>('UnregisterRenderFunction');
const defaultProgramId = safeInject<ProvidedWebGLProgram>('WebGLProgram');

// スプライト描画に必要なWebGLリソース
const programId = shallowRef<WebGLProgram | null>(null);
const image = shallowRef<HTMLImageElement>(new Image);
const texture = shallowRef<WebGLTexture | null>(null);
const positionBuffer = shallowRef<WebGLBuffer | null>(null);
const uvBuffer = shallowRef<WebGLBuffer | null>(null);


/**
 * スプライトをWebGLでレンダリングする関数
 * この関数はレンダリングループ内で呼び出され、スプライトを描画します
 */
function render() {
  if (!gl.value || !defaultProgramId.value || !programId.value) {
    return;
  }
  if (!texture.value) {
    return;
  }
  // canvasの取得
  const canvas = gl.value.canvas as HTMLCanvasElement;
  // スプライト描画用のシェーダープログラムに切り替え
  gl.value.useProgram(programId.value);

  // キャンバス座標からWebGL座標への変換行列を作成
  const width = canvas.width;
  const height = canvas.height;
  const left = -1.0;
  const right = 1.0;
  const top = -1.0;
  const bottom = 1.0;
  const canvasToScreeen = new CubismMatrix44();
  canvasToScreeen.loadIdentity();
  const screenW = Math.abs(right - left);
  const screenH = Math.abs(top - bottom);
  canvasToScreeen.scaleRelative(screenW / width, -screenH / height);
  canvasToScreeen.translateRelative(-width * 0.5, -height * 0.5);

  // スプライトの描画領域（デフォルトはキャンバス全体）
  const rect = props.rect ?? { x: 0, y: 0, width, height };
  const canvasVertices = [
    rect.x, rect.y,
    rect.x + rect.width, rect.y,
    rect.x, rect.y + rect.height,
    rect.x + rect.width, rect.y + rect.height,
  ];

  // キャンバス座標からWebGL座標に変換
  const vertices = canvasVertices.map((v, index) => {
    if (index % 2 === 0) {
      // X座標の変換
      return canvasToScreeen.transformX(v);
    } else {
      // Y座標の変換
      return canvasToScreeen.transformY(v);
    }
  });

  // 頂点位置属性を設定
  const positionLocation = gl.value.getAttribLocation(programId.value, 'position');
  gl.value.enableVertexAttribArray(positionLocation);
  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer.value);
  gl.value.bufferData(gl.value.ARRAY_BUFFER, new Float32Array(vertices), gl.value.STATIC_DRAW);
  gl.value.vertexAttribPointer(positionLocation, 2, gl.value.FLOAT, false, 0, 0);

  // UVマッピング属性を設定
  const uvLocation = gl.value.getAttribLocation(programId.value, 'uv');
  gl.value.enableVertexAttribArray(uvLocation);
  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, uvBuffer.value);
  gl.value.bufferData(gl.value.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ]), gl.value.STATIC_DRAW);
  gl.value.vertexAttribPointer(uvLocation, 2, gl.value.FLOAT, false, 0, 0);

  // テクスチャをバインドしてフラグメントシェーダーに設定
  gl.value.activeTexture(gl.value.TEXTURE0);
  gl.value.bindTexture(gl.value.TEXTURE_2D, texture.value);
  gl.value.uniform1i(gl.value.getUniformLocation(programId.value, 'texture'), 0);

  // 四角形を描画
  gl.value.drawArrays(gl.value.TRIANGLE_STRIP, 0, 4);

  // デフォルトのシェーダープログラムに戻す
  gl.value.useProgram(defaultProgramId.value);
}

/**
 * スプライト描画用のシェーダープログラムを作成する
 * 頂点シェーダーとフラグメントシェーダーをコンパイルして、
 * プログラムとしてリンクします
 */
function createShader() {
  if (!gl.value) {
    return null;
  }

  // 頂点シェーダー：頂点位置とUV座標を受け取り、フラグメントシェーダーに渡す
  const vertexShaderSource = `
    precision mediump float;
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 vuv;
    void main() {
      gl_Position = vec4(position, 1.0);
      vuv = uv;
    }
  `;

  // フラグメントシェーダー：テクスチャからピクセル色を取得して表示
  const fragmentShaderSource = `
    precision mediump float;
    varying vec2 vuv;
    uniform sampler2D texture;
    void main() {
      gl_FragColor = texture2D(texture, vuv);
    }
  `;

  // 頂点シェーダーのコンパイル
  const vertexShader = gl.value.createShader(gl.value.VERTEX_SHADER);
  if (!vertexShader) {
    return null;
  }
  gl.value.shaderSource(vertexShader, vertexShaderSource);
  gl.value.compileShader(vertexShader);
  if (!gl.value.getShaderParameter(vertexShader, gl.value.COMPILE_STATUS)) {
    logger.error('頂点シェーダーのコンパイルに失敗しました', gl.value.getShaderInfoLog(vertexShader));
    return null;
  }

  // フラグメントシェーダーのコンパイル
  const fragmentShader = gl.value.createShader(gl.value.FRAGMENT_SHADER);
  if (!fragmentShader) {
    return null;
  }
  gl.value.shaderSource(fragmentShader, fragmentShaderSource);
  gl.value.compileShader(fragmentShader);
  if (!gl.value.getShaderParameter(fragmentShader, gl.value.COMPILE_STATUS)) {
    logger.error('フラグメントシェーダーのコンパイルに失敗しました', gl.value.getShaderInfoLog(fragmentShader));
    return null;
  }

  // シェーダープログラムの作成とリンク
  const program = gl.value.createProgram();
  if (!program) {
    return null;
  }
  gl.value.attachShader(program, vertexShader);
  gl.value.attachShader(program, fragmentShader);
  gl.value.linkProgram(program);

  if (!gl.value.getProgramParameter(program, gl.value.LINK_STATUS)) {
    logger.error('シェーダープログラムのリンクに失敗しました');
    return null;
  }

  // 作成したプログラムを保存
  programId.value = program;

  // 頂点データとUVデータ用のバッファを作成
  positionBuffer.value = gl.value.createBuffer();
  uvBuffer.value = gl.value.createBuffer();
}

/**
 * WebGLリソースを解放する関数
 * コンポーネントのアンマウント時に呼び出され、メモリリークを防止します
 */
function removeShader() {
  if (!gl.value || !programId.value) {
    return;
  }

  // 作成したバッファを削除
  if (positionBuffer.value) {
    gl.value.deleteBuffer(positionBuffer.value);
  }
  if (uvBuffer.value) {
    gl.value.deleteBuffer(uvBuffer.value);
  }
  if (texture.value) {
    gl.value.deleteTexture(texture.value);
  }
  if (programId.value) {
    gl.value.deleteProgram(programId.value);
  }
}

/**
 * 画像を読み込み、WebGLテクスチャを作成する関数
 * src属性が変更されるたびに再実行されます
 */
async function loadImage() {
  return new Promise<void>((resolve, reject) => {
    image.value.onload = () => {
      if (!gl.value) {
        return;
      }

      // 古いテクスチャがある場合は削除
      if (texture.value) {
        gl.value.deleteTexture(texture.value);
      }

      // 新しいテクスチャを作成
      texture.value = gl.value.createTexture();
      if (!texture.value) {
        return;
      }

      // テクスチャのバインドと設定
      gl.value.bindTexture(gl.value.TEXTURE_2D, texture.value);
      gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.RGBA, gl.value.RGBA, gl.value.UNSIGNED_BYTE, image.value);

      // テクスチャのフィルタリング設定
      gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.LINEAR);
      gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.LINEAR);
      gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE);
      gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE);

      // テクスチャのバインドを解除
      gl.value.bindTexture(gl.value.TEXTURE_2D, null);

      resolve();
    };

    image.value.onerror = (e) => {
      reject(e);
    };

    // 画像の読み込み開始
    image.value.src = props.src;
  });
}

/**
 * スプライト領域のクリック判定を行う関数
 * クリック座標がスプライト内にあるかをチェックします
 */
function onClick(e: MouseEvent) {
  if (!gl.value || !defaultProgramId.value || !programId.value) {
    return;
  }
  // canvasの取得
  const canvas = gl.value.canvas as HTMLCanvasElement;

  // デバイス座標からWebGL座標への変換行列を作成
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const left = -1.0;
  const right = 1.0;
  const top = -1.0;
  const bottom = 1.0;
  const deviceToScreen = new CubismMatrix44();
  deviceToScreen.loadIdentity();
  const screenW = Math.abs(right - left);
  const screenH = Math.abs(top - bottom);

  deviceToScreen.scaleRelative(screenW / width, -screenH / height);
  deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

  // スプライトの描画領域の頂点座標
  const rect = props.rect ?? { x: 0, y: 0, width, height };
  const deviceVertices = [
    rect.x, rect.y,
    rect.x + rect.width, rect.y,
    rect.x, rect.y + rect.height,
    rect.x + rect.width, rect.y + rect.height,
  ];

  // デバイス座標からWebGL座標に変換
  const vertices = deviceVertices.map((v, index) => {
    if (index % 2 === 0) {
      return deviceToScreen.transformX(v);
    } else {
      return deviceToScreen.transformY(v);
    }
  });

  // クリック座標をWebGL座標に変換
  let x = e.offsetX;
  let y = e.offsetY;
  x = deviceToScreen.transformX(x);
  y = deviceToScreen.transformY(y);

  // スプライト領域内の三角形で当たり判定を行う
  const offset = Constant.vertexOffset;
  const dim = Constant.vertexStep;
  const TRIANGLE_VERTEX_COUNT = 3;
  for (let i = offset; i <= vertices.length - (dim * TRIANGLE_VERTEX_COUNT); i += dim) {
    const v1 = [vertices[i], vertices[i + 1]];
    const v2 = [vertices[i + dim], vertices[i + dim + 1]];
    const v3 = [vertices[i + dim * 2], vertices[i + dim * 2 + 1]];
    if (isPointInTriangle([x, y], v1, v2, v3)) {
      break;
    }
  }
}

// コンポーネントのマウント時の初期化
onMounted(async () => {
  if (!gl.value) {
    return;
  }

  // シェーダープログラムの作成
  createShader();
  // レンダー関数をレンダーループに登録
  registerRenderFunction(render, props.zIndex);
  // 画像の読み込みとテクスチャ作成
  await loadImage();

  // クリックイベントのリスナー登録
  const canvas = gl.value.canvas as HTMLCanvasElement;
  canvas.removeEventListener('click', onClick);
  canvas.addEventListener('click', onClick);

  // 初期化完了
  initialized.value = true;
});

// コンポーネントのアンマウント時のクリーンアップ
onBeforeUnmount(() => {
  initialized.value = false;
  if (!gl.value) {
    return;
  }

  // WebGLリソースの解放
  removeShader();
  // レンダーループからの登録解除
  unregisterRenderFunction(render);
  // イベントリスナーの削除
  const canvas = gl.value.canvas as HTMLCanvasElement;
  canvas.removeEventListener('click', onClick);
});

// src属性の変更を監視して画像を再読み込み
watch(() => props.src, async () => {
  if (!gl.value) {
    return;
  }
  await loadImage();
});

// zIndex属性の変更を監視してレンダリング優先度を更新
watch(() => props.zIndex, (zIndex: number) => {
  unregisterRenderFunction(render);
  registerRenderFunction(render, zIndex);
});
</script>

<style scoped></style>
