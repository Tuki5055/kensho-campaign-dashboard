(function () {
  'use strict';

  const K = window.Kensho;

  K.Export = {};

  K.Export.importJson = function (event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('現在のデータをインポート内容で置き換えます。続行しますか？')) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!K.Storage.validateImport(data)) throw new Error('invalid format');
        K.state.campaigns = data.map(K.Storage.normalizeCampaign);
        K.state.selectedId = K.state.campaigns[0]?.id || null;
        K.Storage.saveCampaigns(K.state.campaigns);
        K.UI.render();
        K.toast('JSONをインポートしました');
      } catch (error) {
        alert('JSON形式が正しくありません。キャンペーン配列を指定してください。');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  K.Export.exportJson = function () {
    K.Export.download(`kensho-campaigns-${K.todayString()}.json`, JSON.stringify(K.state.campaigns, null, 2), 'application/json');
  };

  K.Export.exportCsv = function () {
    const headers = ['追加日', '締切', '主催者', 'キャンペーン名', 'SNS種別', '賞品', '当選人数', 'URL', '応募条件', 'タグ', '締切リマインダー有効', '締切リマインダー日数', '応募後フォローリマインダー有効', '応募日', '結果ステータス', '当選・落選連絡日', '発送日', '受取日', '確認予定日', '応募後メモ', '応募操作メモ', 'リスク判定', 'リスク理由', '応募優先度スコア', 'ステータス', 'コメント案', 'メモ'];
    const rows = K.state.campaigns.map(c => [
      c.createdAt,
      c.deadline,
      c.organizer,
      c.title,
      c.snsType,
      c.prize,
      c.winners,
      c.url,
      c.conditions.join(' / '),
      (c.tags || []).join(' / '),
      c.reminderEnabled ? '有効' : '無効',
      c.reminderDaysBefore,
      c.followUpReminderEnabled ? '有効' : '無効',
      c.appliedAt,
      c.resultStatus,
      c.resultNotifiedAt,
      c.prizeShippedAt,
      c.prizeReceivedAt,
      c.followUpDate,
      c.applicationMemo,
      c.applicationMethodMemo,
      c.risk.level,
      c.risk.reasons.join(' / '),
      c.score,
      K.effectiveStatus(c),
      c.comments.join(' / '),
      c.notes
    ]);
    const csv = '\ufeff' + [headers, ...rows].map(row => row.map(K.Export.csvCell).join(',')).join('\r\n');
    K.Export.download(`kensho-campaigns-${K.todayString()}.csv`, csv, 'text/csv;charset=utf-8');
  };

  K.Export.csvCell = function (value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  K.Export.download = function (filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
})();
