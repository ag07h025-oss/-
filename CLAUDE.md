# CLAUDE.md

## プロジェクト概要

旅行・移動の軌跡（`data/trip.csv`）を MapLibre GL JS の地図上に可視化する Web アプリ。
ルートの線・地点マーカーに加え、タイムスタンプに沿ったルートのアニメーション表示（`src/animation.js`）と再生コントロール（`src/controls.js`）、mp4 書き出し（`src/exporter.js`）を実装済み。

## 技術スタック

- ビルド / 開発サーバー: Vite
- 地図: MapLibre GL JS
- ベースマップ: 国土地理院 地理院タイル（標準地図・ラスタ）。設定は `src/basemap.js`
- 動画書き出し: Mediabunny（WebCodecs で H.264 エンコード → MP4 に mux）
- 言語: JavaScript（ES Modules、`"type": "module"`）。フレームワークは使わない
- データ: CSV（`timestamp,lat,lon,label`）。`?raw` インポートで読み込み、`src/csv.js` でパースする

## コマンド

- `npm install` — 依存関係をインストール
- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド（`dist/`）
- `npm run preview` — ビルド結果の確認

変更後は最低限 `npm run build` が通ることを確認する。

## コーディング方針

- 依存は最小限に。標準 API や MapLibre の機能で足りるなら新しいライブラリを追加しない
- モジュールは責務ごとに分ける（データ読み込み・地図描画・アニメーションなど）。1 ファイルに詰め込まない
- 座標は MapLibre / GeoJSON に合わせて `[lon, lat]` の順で扱う。CSV の列順（lat, lon）と逆になる点に注意
- 地図レイヤーやソースは `map.on('load')` の後に追加する
- アニメーションの描画は `renderAt(progress)`（0〜1）の純粋な関数として保つ。requestAnimationFrame のループと描画を分離しておくことで、動画書き出し時にフレームを決定的に生成できる
- インデント 2 スペース、シングルクォート、セミコロンあり
- コメントは「なぜそうしたか」が自明でない箇所だけ書く
- 動画に映すものは地図の canvas 上にレイヤーとして描く。DOM 要素（`maplibregl.Marker` など）は動画に写らない。canvas 外の情報（時刻など）は `exporter.js` で 2D canvas に重ねて描く
- mp4 書き出しは実時間ではなく `seek(progress)` → `map.once('idle')` → フレーム取得の順で 1 フレームずつ進める。読み取りのため Map は `preserveDrawingBuffer: true` で作成している
- 地理院タイルの出典表示（画面のアトリビューションと動画右下の「出典: 国土地理院」）は利用条件なので消さない
- 生成物（`dist/`、`*.mp4` などの動画）はコミットしない
