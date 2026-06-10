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
          <button class="secondary" id="exportIcs">全リマインダーをICS出力</button>
          <button class="secondary" id="exportDiscoveryJsonBackup">探索履歴JSONエクスポート</button>
          <label class="check-pill">探索履歴JSONインポート<input type="file" id="importDiscoveryJsonBackup" accept="application/json,.json"></label>
          <button class="secondary" id="exportDiscoveryCsvBackup">探索履歴CSVエクスポート</button>
          <button class="danger" id="clearAll">全データ削除</button>
        </div>
        <p class="small">localStorageに保存します。JSONインポート時は最低限の型チェックを行い、不正な形式は読み込みません。</p>
      </section>`;
    document.getElementById('sample').addEventListener('click', K.SampleData.install);
    document.getElementById('exportJson').addEventListener('click', K.Export.exportJson);
    document.getElementById('exportCsv').addEventListener('click', K.Export.exportCsv);
    document.getElementById('exportIcs').addEventListener('click', () => K.Ics.downloadIcs(K.state.campaigns));
    document.getElementById('exportDiscoveryJsonBackup').addEventListener('click', K.Discovery.exportDiscoveryHistoryJson);
    document.getElementById('exportDiscoveryCsvBackup').addEventListener('click', K.Discovery.exportDiscoveryHistoryCsv);
    document.getElementById('importJson').addEventListener('change', K.Export.importJson);
    document.getElementById('importDiscoveryJsonBackup').addEventListener('change', K.Discovery.importDiscoveryHistoryJson);
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
