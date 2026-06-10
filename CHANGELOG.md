# CHANGELOG

このプロジェクトの主な変更履歴です。

## v1.0.0

- PWA対応
- `manifest.json` を追加
- Service Workerを追加
- PWAアイコンを追加
- オフライン時に最低限画面を開けるよう静的ファイルをキャッシュ
- README、SAFETY、DEPLOYを更新

## v0.9.0

- リマインダー機能を追加
- 今日やること画面に締切・確認予定日・連絡待ち・発送待ち・受取待ちのリマインダーを追加
- リマインダータブを追加
- 任意のブラウザ通知許可ボタンを追加
- ICSカレンダー出力を追加
- JSON/CSVにリマインダー設定項目を追加
- リマインダー関連テストを追加
- GitHub Pages公開手順をREADMEに追加
- `docs/DEPLOY.md` を追加
- `docs/BACKUP.md` を追加
- GitHub Pages向けに `.nojekyll` を追加
- localStorage運用上の注意と公開前チェックリストを追記

## v0.8.0

- Git管理を開始
- `.gitignore` を追加
- `README.md` を追加
- `DATA_SCHEMA.md` を追加
- `SAFETY.md` を追加
- 現在の機能、使い方、安全設計、データ仕様、テスト方法を文書化

## v0.7.0

- UI関連コードを責務別ファイルに分割
- `baseUi.js`、`todayUi.js`、`listUi.js`、`formUi.js`、`detailUi.js`、`historyUi.js`、`commentsUi.js`、`analyticsUi.js`、`backupUi.js` を追加
- `ui.js` を全体レンダーの統合呼び出しに縮小
- 既存の `K.UI` 名前空間と主要render関数を維持

## v0.6.0

- 応募履歴管理を追加
- 応募日、結果ステータス、連絡日、発送日、受取日、確認予定日、応募後メモを追加
- 「応募済みにする」処理で応募日と連絡待ちステータスを自動補完
- 応募履歴タブを追加
- 今日やること画面に応募後フォローを追加
- 分析・集計に応募件数、当選件数、当選率、月別集計を追加
- JSON/CSVエクスポートに応募履歴項目を追加

## v0.5.0

- キーワード検索を追加
- 詳細フィルターを追加
- タグ管理を追加
- 自動タグ候補を追加
- タグクリックによる絞り込みを追加
- CSVエクスポートにタグカラムを追加
- タグ関連テストを追加

## v0.4.0

- `tests.html` と `js/tests.js` を追加
- 外部ライブラリなしのブラウザ実行テストを追加
- URL安全性、日付処理、リスク判定、スコア計算、本文解析、コメント案、ストレージ正規化、localStorage破損復旧をテスト

## v0.3.0

- 単一HTML中心の実装から通常HTML + CSS + JavaScript構成へ整理
- `storage.js`、`risk.js`、`score.js`、`parser.js`、`comments.js`、`export.js`、`sampleData.js` などに責務を分割
- localStorageの既存データ互換性を維持

## v0.2.0

- リスク判定を改善
- スコア計算を改善
- コメント案生成を改善
- URL安全性チェックを追加
- JSONインポートの検証を強化
- CSVのBOM対応を追加

## v0.1.0

- 単一HTML版の初期実装
- キャンペーン登録
- 一覧表示
- 今日やること
- 詳細・編集
- コメント案
- 分析・集計
- バックアップ
- localStorage保存
- サンプルデータ投入
