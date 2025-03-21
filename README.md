# livue2d_sample

Live2DのモデルをVue.jsで表示するサンプルです。

試してみたい方は、以下の手順でセットアップしてください。

私が動作確認した時の `Cubism SDK for Web` のバージョンは `5-r.3` です。

## セットアップ

1. リポジトリをクローンします。

```powershell
git clone https://github.com/oaiwej/livue2d_sample.git
cd livue2d_sample
```

<br>

2. 依存パッケージをインストールします。

```powershell
npm install
```

<br>

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

<br>

4. `.env.example` をコピーして `.env` ファイルを作成します。内容は適宜変更してください。

```powershell
cp .env.example .env
```

<br>

5. デバッグ用サーバーを起動します。

```powershell
npm run dev
```

<br>

6. ブラウザで `http://localhost:5173/` にアクセスします。
