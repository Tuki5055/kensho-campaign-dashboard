# DATA_SCHEMA

このアプリはキャンペーン配列をブラウザの localStorage に保存します。

- localStorageキー: `kensho_campaign_dashboard_v1`
- 保存形式: JSON配列
- 1要素: キャンペーンオブジェクト
- 正規化処理: `K.Storage.normalizeCampaign`
- インポート検証: `K.Storage.validateImport`

## 注意

画面上の表示名と保存キーが一部異なります。

- 画面表示「キャンペーン名」: 保存キー `title`
- 画面表示「メモ」: 保存キー `notes`
- 要望や外部仕様で `campaignName` / `memo` と呼ぶ場合がありますが、現在の実データでは `title` / `notes` を使います。
- `updatedAt` は将来のデータ移行用に予約できる項目です。現在の保存処理では自動付与していません。

## キャンペーンデータ

| 項目 | 実保存キー | 型 | 説明 | 初期値 |
| --- | --- | --- | --- | --- |
| id | `id` | string | キャンペーンID。未指定なら自動生成。 | `crypto.randomUUID()` または代替ID |
| createdAt | `createdAt` | string | 追加日時。ISO文字列。 | 現在日時 |
| updatedAt | `updatedAt` | string | 更新日時。将来拡張用。現行では未使用。 | なし |
| campaignName | `title` | string | キャンペーン名。 | `""` |
| organizer | `organizer` | string | 主催者名。 | `""` |
| snsType | `snsType` | string | SNS種別。`X`、`Instagram`、`TikTok`、`公式サイト`、`その他`。 | `"X"` |
| url | `url` | string | 投稿URL。`http://` または `https://` のみ許可。 | `""` |
| body | `body` | string | キャンペーン本文。 | `""` |
| prize | `prize` | string | 賞品。 | `""` |
| winners | `winners` | string | 当選人数。数値だけでなく「10名」などの文字列を許容。 | `""` |
| deadline | `deadline` | string | 応募締切。`YYYY-MM-DD`。不正値は空文字へ補正。 | `""` |
| conditions | `conditions` | string[] | 応募条件。許可値のみ保持。 | `[]` |
| contactMethod | `contactMethod` | string | 当選連絡方法。 | `""` |
| memo | `notes` | string | ユーザーメモ。 | `""` |
| cautions | `cautions` | string | 本文解析やリスク判定で見つけた注意点。 | `""` |
| tags | `tags` | string[] | タグ。文字列や不正値は正規化される。 | `[]` |
| status | `status` | string | 管理ステータス。 | `"未確認"` |
| reminderEnabled | `reminderEnabled` | boolean | 締切リマインダーを有効にするか。boolean以外はtrueへ補正。 | `true` |
| reminderDaysBefore | `reminderDaysBefore` | number | 締切何日前からリマインダー対象にするか。許可値は1、3、7、14。 | `3` |
| followUpReminderEnabled | `followUpReminderEnabled` | boolean | 応募後フォローリマインダーを有効にするか。boolean以外はtrueへ補正。 | `true` |
| checklist | `checklist` | object | 手動応募チェックリストのチェック状態。キーはチェック項目名、値はboolean。 | `{}` |
| risk | `risk` | object | リスク判定結果。`level` と `reasons` を含む。保存時・読込時に再計算。 | `{ level: "要確認", reasons: ["未判定"] }` |
| score | `score` | number | 応募優先度スコア。保存時・読込時に再計算。 | `0` |
| comments | `comments` | string[] | コメント案。保存時・読込時に再生成。 | `[]` |
| appliedAt | `appliedAt` | string | 応募日。`YYYY-MM-DD`。 | `""` |
| resultStatus | `resultStatus` | string | 結果ステータス。`未確認`、`連絡待ち`、`当選`、`落選`、`発送待ち`、`受取済み`。 | `"未確認"` |
| resultNotifiedAt | `resultNotifiedAt` | string | 当選・落選連絡日。`YYYY-MM-DD`。 | `""` |
| prizeShippedAt | `prizeShippedAt` | string | 発送日。`YYYY-MM-DD`。 | `""` |
| prizeReceivedAt | `prizeReceivedAt` | string | 受取日。`YYYY-MM-DD`。 | `""` |
| followUpDate | `followUpDate` | string | 確認予定日。`YYYY-MM-DD`。 | `""` |
| applicationMemo | `applicationMemo` | string | 応募後メモ。 | `""` |
| applicationMethodMemo | `applicationMethodMemo` | string | 実際に行った応募操作メモ。 | `""` |

## conditions の許可値

- `フォロー`
- `リポスト`
- `いいね`
- `コメント`
- `ハッシュタグ`
- `引用投稿`
- `会員登録`
- `アンケート回答`
- `個人情報入力`

## status の許可値

- `未確認`
- `応募候補`
- `応募済み`
- `見送り`
- `当選`
- `落選`
- `締切切れ`

締切を過ぎた未応募キャンペーンは、元の `status` を保持したまま画面上では `締切切れ` として扱います。

## resultStatus の許可値

- `未確認`
- `連絡待ち`
- `当選`
- `落選`
- `発送待ち`
- `受取済み`

## risk の形式

```json
{
  "level": "要確認",
  "reasons": ["個人情報入力が必要"]
}
```

`level` の値は以下です。

- `低リスク`
- `要確認`
- `応募非推奨`

## JSONインポート時の扱い

- JSON全体は配列である必要があります。
- 件数上限は2000件です。
- `url` は `http://` / `https://` のみ許可します。
- `deadline` や履歴日付は `YYYY-MM-DD` のみ有効です。
- `tags` は配列または文字列を許容し、配列へ正規化します。
- `reminderEnabled` がbooleanでなければ `true` へ補正します。
- `reminderDaysBefore` が1、3、7、14以外なら `3` へ補正します。
- `followUpReminderEnabled` がbooleanでなければ `true` へ補正します。
- 不正なステータスやSNS種別は既定値へ補正します。
- 読み込み後にリスク、スコア、コメント案を再計算します。

## CSVエクスポート

CSVはBOM付きUTF-8、CRLF改行で出力します。主な列は以下です。

- 追加日
- 締切
- 主催者
- キャンペーン名
- SNS種別
- 賞品
- 当選人数
- URL
- 応募条件
- タグ
- 締切リマインダー有効
- 締切リマインダー日数
- 応募後フォローリマインダー有効
- 応募日
- 結果ステータス
- 当選・落選連絡日
- 発送日
- 受取日
- 確認予定日
- 応募後メモ
- 応募操作メモ
- リスク判定
- リスク理由
- 応募優先度スコア
- ステータス
- コメント案
- メモ

## ICSエクスポート

ICSはカレンダー取り込み用の補助ファイルです。

- 締切日があるキャンペーンは `【懸賞締切】キャンペーン名` の終日予定として出力します。
- 確認予定日があるキャンペーンは `【懸賞確認】キャンペーン名` の終日予定として出力します。
- 説明には主催者、賞品、URL、ステータス、リスク、メモを含めます。
- ICSは復元用ではありません。復元にはJSONを使ってください。
