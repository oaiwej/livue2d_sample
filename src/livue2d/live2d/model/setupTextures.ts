import { logger } from '@/logger'
import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { csmVector } from '@framework/type/csmvector'

/**
 * テクスチャ情報を格納するインターフェース
 * @interface TextureInfo
 * @property {string} filename - テクスチャファイルの名前
 * @property {number} width - テクスチャの横幅
 * @property {number} height - テクスチャの高さ
 * @property {WebGLTexture} id - WebGLテクスチャオブジェクト
 * @property {boolean} usePremultiply - 乗算済みアルファを使用するか
 */
export interface TextureInfo {
  filename: string
  width: number
  height: number
  id: WebGLTexture
  usePremultiply: boolean
}

/**
 * 指定したファイルからテクスチャを読み込む
 * @param {string} fileName - テクスチャのファイルパス
 * @param {WebGLRenderingContext} gl - WebGLコンテキスト
 * @param {boolean} usePremultiply - 乗算済みアルファを使用するか（デフォルト: true）
 * @returns {Promise<TextureInfo>} テクスチャ情報を含むPromise
 */
async function loadTexture(
  fileName: string,
  gl: WebGLRenderingContext,
  usePremultiply: boolean = true,
): Promise<TextureInfo> {
  return new Promise<TextureInfo>((resolve, reject) => {
    const image = new Image()

    // 画像の読み込み完了時の処理
    image.addEventListener(
      'load',
      () => {
        // テクスチャオブジェクトの作成
        const texture = gl.createTexture()
        if (!texture) {
          logger.error('WebGLテクスチャの作成に失敗しました。')
          reject(new Error('WebGLテクスチャの作成に失敗しました。'))
          return
        }

        // テクスチャを選択し設定を行う
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // テクスチャフィルタリング設定
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        // 乗算済みアルファの設定
        if (usePremultiply) {
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
        }

        // テクスチャにピクセルデータを書き込む
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

        // ミップマップを生成
        gl.generateMipmap(gl.TEXTURE_2D)

        // テクスチャのバインドを解除
        gl.bindTexture(gl.TEXTURE_2D, null)

        // テクスチャ情報を生成して返す
        const textureInfo: TextureInfo = {
          filename: fileName,
          width: image.width,
          height: image.height,
          id: texture,
          usePremultiply: usePremultiply,
        }
        resolve(textureInfo)
      },
      { passive: true },
    )

    // 読み込み失敗時の処理
    image.addEventListener(
      'error',
      () => {
        logger.error(`テクスチャの読み込みに失敗しました: ${fileName}`)
        reject(new Error(`テクスチャの読み込みに失敗しました: ${fileName}`))
      },
      { passive: true },
    )

    // 画像の読み込みを開始
    image.src = fileName
  })
}

/**
 * モデル設定に基づいて複数のテクスチャを読み込み設定する
 * @param {string} dir - テクスチャが格納されているディレクトリのパス
 * @param {ICubismModelSetting} modelSetting - モデル設定情報
 * @param {WebGLRenderingContext} gl - WebGLコンテキスト
 * @param {boolean} usePremultiply - 乗算済みアルファを使用するか（デフォルト: true）
 * @returns {Promise<csmVector<TextureInfo>>} テクスチャ情報のベクター
 */
export async function setupTextures(
  dir: string,
  modelSetting: ICubismModelSetting,
  gl: WebGLRenderingContext,
  usePremultiply: boolean = true,
): Promise<csmVector<TextureInfo>> {
  const textures = new csmVector<TextureInfo>()
  const textureCount = modelSetting.getTextureCount()

  for (let i = 0; i < textureCount; i++) {
    const textureFileName = modelSetting.getTextureFileName(i)

    // テクスチャ名が空の場合は処理をスキップ
    if (textureFileName === '') {
      logger.warn(`テクスチャ名が空です: インデックス ${i}`)
      continue
    }

    // テクスチャをロード
    const texturePath = `${dir}${textureFileName}`
    const textureInfo = await loadTexture(texturePath, gl, usePremultiply)
    textures.pushBack(textureInfo)
  }

  return textures
}
