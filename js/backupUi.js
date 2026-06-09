(function () {
  'use strict';

  const K = window.Kensho;

  K.UI = K.UI || {};

  K.UI.renderBackup = function () {
    document.getElementById('view-backup').innerHTML = `
      <section class="panel">
        <h2>バックアップ</h2>
        <div class="toolbar">
          <button id="sample">サンプルデータ投入</button>
          <button class="secondary" id="exportJson">JSONエクスポート</button>
          <label class="check-pill">JSONインポート<input type="file" id="importJson" accept="application/json,.json"></label>
          <button class="secondary" id="exportCsv">CSVエクスポート</button>
          <button class="danger" id="clearAll">全データ削除</button>
        </div>
        <p class="small">localStorageに保存します。JSONインポート時は最低限の型チェックを行い、不正な形式は読み込みません。</p>
      </section>`;
    document.getElementById('sample').addEventListener('click', K.SampleData.install);
    document.getElementById('exportJson').addEventListener('click', K.Export.exportJson);
    document.getElementById('exportCsv').addEventListener('click', K.Export.exportCsv);
    document.getElementById('importJson').addEventListener('change', K.Export.importJson);
    document.getElementById('clearAll').addEventListener('click', () => {
      if (confirm('全データを削除しますか？')) {
        K.state.campaigns = [];
        K.state.selectedId = null;
        K.Storage.saveCampaigns(K.state.campaigns);
        K.UI.render();
        K.toast('全データを削除しました');
      }
    });
  };
})();
