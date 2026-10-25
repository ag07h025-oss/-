# Trip Map

旅行・移動の軌跡を CSV から読み込み、[MapLibre GL JS](https://maplibre.org/) の地図上にルートと地点を可視化するプロジェクトです。
将来的にはルートのアニメーション表示や、動画（mp4）への書き出しを想定しています。

## 必要環境

- Node.js 20 以上（推奨: 22）
- npm

## セットアップ

```bash
npm install
```

## 使い方

```bash
npm run dev      # 開発サーバーを起動（http://localhost:5173）
npm run build    # 本番用ビルド（dist/ に出力）
npm run preview  # ビルド結果をローカルで確認
```

### データの差し替え

`data/trip.csv` を編集すると、地図上のルートが変わります。フォーマットは次のとおりです。

| 列名        | 型     | 説明                                   |
| ----------- | ------ | -------------------------------------- |
| `timestamp` | string | ISO 8601 形式の日時（例: `2026-10-01T09:00:00+09:00`） |
| `lat`       | number | 緯度（WGS84）                          |
| `lon`       | number | 経度（WGS84）                          |
| `label`     | string | 地点名（ポップアップに表示）           |

行は時系列順に並べてください。ラベルにカンマは使えません。

## ディレクトリ構成

```
.
├── data/trip.csv   # サンプルの移動データ
├── index.html      # エントリー HTML
└── src/
    ├── main.js     # 地図の初期化・描画
    └── csv.js      # CSV パーサー
```

## 補足

- ベースマップには MapLibre のデモタイル（`demotiles.maplibre.org`）を使っています。詳細な地図が必要な場合は、別のスタイル URL に差し替えてください。
- 生成した動画ファイル（`*.mp4` など）は `.gitignore` の対象で、リポジトリには含めません。
