# livue2d_sample

Live2DのモデルをVue.jsで表示するサンプルです。

試してみたい方は、以下の手順でセットアップしてください。

## セットアップ

1. リポジトリをクローンします。

```powershell
git clone https://github.com/oaiwej/livue2d_sample.git
cd livue2d_sample
```

2. 依存パッケージをインストールします。

```powershell
npm install
```

3. [Cubism SDK for Web](https://www.live2d.com/sdk/download/web/)をダウンロードし、`CubismSdkForWeb`ディレクトリに配置します。

```plaintext
livue2d_sample
│
├───CubismSdkForWeb
│   │
│   ├───Core
│   │       ...
│   │
│   ├───Framework
│   │       ...
│   │
│   └───Samples
│           ...
│
```

4. デバッグ用サーバーを起動します。

```powershell
npm run dev
```

5. ブラウザで `http://localhost:5173/` にアクセスします。
