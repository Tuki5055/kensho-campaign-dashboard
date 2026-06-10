# GitHub Pages公開・運用ガイド

このドキュメントは「懸賞キャンペーン応募支援ダッシュボード」をGitHub Pagesで公開するための手順です。

このアプリは通常のHTML + CSS + JavaScript構成です。ビルド、外部API、バックエンドは不要です。

## ローカル起動方法

プロジェクトフォルダで以下を実行します。

```bash
python3 -m http.server 4173
```

通常画面:

```text
http://localhost:4173/
```

テスト画面:

```text
http://localhost:4173/tests.html
```

## GitHub Pages公開方法

1. GitHubで新しいリポジトリを作成します。
2. ローカルリポジトリにremoteを追加します。
3. `main` ブランチへpushします。
4. GitHubの `Settings` → `Pages` を開きます。
5. `Source` を `Deploy from a branch` に設定します。
6. `Branch` を `main`、folderを `/root` に設定します。
7. GitHub Pagesの公開URLへアクセスします。

コマンド例:

```bash
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git branch -M main
git push -u origin main
```

公開URL例:

```text
https://ユーザー名.github.io/リポジトリ名/
```

このリポジトリでの公開URL見込み:

```text
https://tuki5055.github.io/kensho-campaign-dashboard/
```

TODO: GitHub Pages設定後、実際の公開URLが表示されたらこのURLで通常画面とテスト画面を確認してください。

テスト画面:

```text
https://ユーザー名.github.io/リポジトリ名/tests.html
```

## 更新時のpush方法

変更を確認します。

```bash
git status
```

変更を追加してコミットします。

```bash
git add .
git commit -m "docs: update deployment notes"
git push
```

GitHub Pagesへの反映には数十秒から数分かかる場合があります。

## 公開後の確認方法

- 公開URLで通常画面が開く
- `tests.html` が開く
- CSSが反映されている
- タブが表示される
- サンプルデータ投入ができる
- JSONエクスポートができる
- CSVエクスポートができる
- 投稿URLは新しいタブで開くだけで、SNS操作を自動化していない

## テスト方法

1. 公開URLの末尾に `tests.html` を付けて開きます。
2. 「テスト実行」を押します。
3. 全テスト件数、成功件数、失敗件数を確認します。

ローカルでも同じ手順で確認できます。

```text
http://localhost:4173/tests.html
```

## localStorageの注意

GitHub Pagesに公開しても、データはクラウド同期されません。

- データは各ブラウザの localStorage に保存されます。
- localStorageキーは `kensho_campaign_dashboard_v1` です。
- Macで登録したデータはスマホに自動同期されません。
- スマホで登録したデータはMacに自動同期されません。
- 端末間で移す場合はJSONエクスポート / インポートを使ってください。
- ブラウザのキャッシュ削除、サイトデータ削除、別プロファイル利用でデータが見えなくなることがあります。

## データバックアップ方法

復元用途にはJSONエクスポートを使います。

1. 「バックアップ」タブを開きます。
2. 「JSONエクスポート」を押します。
3. ダウンロードされた `.json` ファイルを安全な場所に保存します。

別端末で復元する場合:

1. 移行先でアプリを開きます。
2. 「バックアップ」タブを開きます。
3. 「JSONインポート」でバックアップファイルを選びます。
4. 確認ダイアログを確認してインポートします。

CSVは閲覧・集計向けです。完全な復元にはJSONを使ってください。

## 公開前チェックリスト

- 通常画面が開く
- テスト画面が開く
- 全テストが成功する
- サンプルデータ投入ができる
- JSONエクスポートできる
- JSONインポートできる
- CSVエクスポートできる
- スマホ幅で崩れない
- 禁止機能が追加されていない
- localStorageの注意を書いている

## トラブルシューティング

### CSSが反映されない

- `index.html` から `css/style.css` を相対パスで読み込んでいるか確認してください。
- GitHub Pagesの反映待ちの可能性があります。数分待って再読み込みしてください。
- ブラウザキャッシュが残っている場合は、強制再読み込みしてください。

### JSが読み込まれない

- `js/*.js` のパスが相対パスになっているか確認してください。
- ファイル名の大文字小文字が一致しているか確認してください。
- ブラウザの開発者ツールで404が出ていないか確認してください。

### 404になる

- GitHub Pagesの `Source` が `Deploy from a branch` になっているか確認してください。
- Branchが `main`、folderが `/root` になっているか確認してください。
- 初回公開直後は反映に時間がかかることがあります。

### データがスマホに出てこない

データはクラウド同期されません。PCでJSONエクスポートし、スマホ側でJSONインポートしてください。

### GitHub Pagesの反映が遅い

数十秒から数分待ってください。GitHubのリポジトリ画面の `Actions` または `Pages` 設定でデプロイ状態を確認できます。

### テスト画面が開けない

- `tests.html` がリポジトリのルートにあるか確認してください。
- URLが `https://ユーザー名.github.io/リポジトリ名/tests.html` になっているか確認してください。
- JSファイルの読み込みエラーがないか確認してください。

## 安全上の注意

このアプリはSNS自動応募Botではありません。GitHub Pagesで公開しても、自動ログイン、自動フォロー、自動リポスト、自動いいね、自動コメント、自動DM、自動投稿、SNS API応募、CAPTCHA回避、レート制限回避、凍結回避、ブラウザ自動操作によるSNS応募は行いません。

投稿URLを新しいタブで開くだけで、応募操作は必ず人間が手動で行います。
