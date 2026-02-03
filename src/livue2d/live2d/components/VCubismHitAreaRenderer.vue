<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import { Constant } from '@framework/live2dcubismframework';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { safeInject } from '../utils/safeInject';
import { type ProvidedWebGLProgram, type ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';
import type { ProvidedCubismModelMatrix } from './VCubismModelMatrixProvider.vue';
import type { ProvidedCubismProjectionMatrix } from './VCubismProjectionMatrixProvider.vue';
import { type ProvidedRegisterRenderFunction, type ProvidedUnregisterRenderFunction } from './VCubismRenderLoopProvider.vue';
import type { ProvidedCubismViewMatrix } from './VCubismViewMatrixProvider.vue';

const props = withDefaults(defineProps<{
  zIndex?: number;
}>(), {
  zIndex: 0,
});

// コンポーネントの初期化状態
const initialized = ref(false);

// 依存関係の注入
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');
const projectionMatrix = safeInject<ProvidedCubismProjectionMatrix>('CubismProjectionMatrix');
const viewMatrix = safeInject<ProvidedCubismViewMatrix>('CubismViewMatrix');
const modelMatrix = safeInject<ProvidedCubismModelMatrix>('CubismModelMatrix');
const registerRenderFunction = safeInject<ProvidedRegisterRenderFunction>('RegisterRenderFunction');
const unregisterRenderFunction = safeInject<ProvidedUnregisterRenderFunction>('UnregisterRenderFunction');
const defaultProgramId = safeInject<ProvidedWebGLProgram>('WebGLProgram');

// 当コンポーネント用のシェーダープログラム参照
const programId = ref<WebGLProgram | null>(null);

/**
 * Live2Dモデルのヒットエリア（当たり判定領域）を可視化して描画する関数
 * 各ヒットエリアを半透明の赤色で表示します
 */
function render() {
  if (!gl.value || !defaultProgramId.value || !programId.value) {
    return;
  }

  const { modelSetting, model } = assets.value;
  if (!modelSetting || !model) {
    return;
  }

  // ヒットエリア描画用シェーダーに切り替え
  gl.value.useProgram(programId.value);

  const areaCount = modelSetting.getHitAreasCount(); // ヒットエリアの数
  const dim = Constant.vertexStep;      // 頂点座標の次元数（x,y,z）
  const offset = Constant.vertexOffset; // 頂点座標のオフセット値

  // 各ヒットエリアを順番に描画
  for (let i = 0; i < areaCount; i++) {
    const hitAreaId = modelSetting.getHitAreaId(i);
    const drawIndex = model.getDrawableIndex(hitAreaId);
    if (drawIndex < 0) {
      continue;
    }

    // ヒットエリアの頂点座標を取得して変換（モデル座標系→ワールド座標系→スクリーン座標系）
    const vertices = model.getDrawableVertices(drawIndex)
      .map((v, index) => {
        if (index % dim === 0) {
          // X座標の変換
          let x = modelMatrix.value.transformX(v);
          x = viewMatrix.value.transformX(x);
          return projectionMatrix.value.transformX(x);
        } else if (index % dim === 1) {
          // Y座標の変換
          let y = modelMatrix.value.transformY(v);
          y = viewMatrix.value.transformY(y);
          return projectionMatrix.value.transformY(y);
        } else {
          // Z座標（変更なし）
          return v;
        }
      });

    // 描画に必要なバッファとパラメータの設定
    const vertexBuffer = gl.value.createBuffer();
    if (!vertexBuffer) {
      continue;
    }

    // 頂点バッファの設定
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, vertexBuffer);
    gl.value.bufferData(gl.value.ARRAY_BUFFER, vertices, gl.value.STATIC_DRAW);

    // 頂点シェーダーの入力変数（position）の設定
    const position = gl.value.getAttribLocation(programId.value, 'position');
    if (position < 0) {
      gl.value.deleteBuffer(vertexBuffer);
      continue;
    }
    gl.value.vertexAttribPointer(position, dim, gl.value.FLOAT, false, 0, 0);
    gl.value.enableVertexAttribArray(position);

    // フラグメントシェーダーの色設定（半透明の赤色）
    const color = gl.value.getUniformLocation(programId.value, 'fragColor');
    if (color) {
      gl.value.uniform4f(color, 1.0, 0.0, 0.0, 0.5);
    }

    // 三角形ストリップとしてヒットエリアを描画
    gl.value.drawArrays(gl.value.TRIANGLE_STRIP, offset, vertices.length / dim);

    // 使用後のバッファを解放
    gl.value.deleteBuffer(vertexBuffer);
  }

  // 標準のシェーダープログラムに戻す
  gl.value.useProgram(defaultProgramId.value);
}

/**
 * ヒットエリア可視化用のシェーダープログラムを作成する
 * シンプルな頂点シェーダーとフラグメントシェーダーを定義して結合します
 */
function createShader() {
  if (!gl.value) {
    return null;
  }

  // 頂点シェーダー：頂点位置をそのまま出力
  const vertexShaderSource = `
    precision mediump float;
    attribute vec3 position;
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  // フラグメントシェーダー：指定された単色で塗りつぶし
  const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 fragColor;
    void main() {
      gl_FragColor = fragColor;
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
}

/**
 * 使用したシェーダープログラムをWebGLコンテキストから削除する
 */
function removeShader() {
  if (!gl.value || !programId.value) {
    return;
  }

  gl.value.deleteProgram(programId.value);
  programId.value = null;
}

// コンポーネントのライフサイクル管理
onMounted(() => {
  if (!gl.value) {
    return;
  }

  // シェーダープログラムの作成とレンダリング関数の登録
  createShader();
  registerRenderFunction(render, props.zIndex);
  initialized.value = true;
});

onBeforeUnmount(() => {
  initialized.value = false;
  if (!gl.value) {
    return;
  }

  // リソースの解放
  removeShader();
  unregisterRenderFunction(render);
});

// zIndexプロパティの変更を監視し、レンダリング関数の登録を更新
watch(() => props.zIndex, (zIndex: number) => {
  unregisterRenderFunction(render);
  registerRenderFunction(render, zIndex);
});
</script>

<style scoped></style>
