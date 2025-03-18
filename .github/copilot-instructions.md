# Vue.jsでCubismSdkForWebを使い、Live2Dモデルを表示するプロジェクト

## はじめに

このプロジェクトは、Vue.jsでCubismSdkForWebを使い、Live2Dモデルを表示するサンプルプロジェクトです。

### 留意事項

CubismSdkForWebは、Live2DモデルをWebブラウザ上で表示するためのライブラリです。
CubismSdkForWebの使い方については `CubismSdkForWeb\Samples\TypeScript\Demo` 以下のサンプルコードを参考にしてください。
またライセンスの心配があるため、`CubismSdkForWeb\Samples\TypeScript\Demo`以下のファイルは**絶対に変更しないでください**。

### プロジェクトの構成

CubismSdkForWebではキャンバスを用いてLive2Dモデルを表示します。
モデルの描画はCanvasで行い、その他UIなどはVue.jsで構築します。

## コード生成時のルール

- TDDを意識して、テスト可能な単位に分割して生成すること
- 生成後には重複を排除するためにリファクタリングを行うこと

### パスの設定

import文で`@`を使って相対パスを記述することで、`src`ディレクトリ以下のファイルを参照できます。活用してください。

```json
"paths": {
    "@src/*": [
    "./src/*"
    ],
    "@core/*": [
    "./CubismSdkForWeb/Core/*"
    ],
    "@framework/*": [
    "./CubismSdkForWeb/Framework/src/*"
    ],
    "@demo/*": [
    "./CubismSdkForWeb/Samples/TypeScript/Demo/src/*"
    ]
}
```
