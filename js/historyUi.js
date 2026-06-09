(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderHistory = function () {
    if (!K.state.historyFilters) K.state.historyFilters = K.History.defaultFilters();
    const filtered = K.History.filterHistory(K.state.campaigns, K.state.historyFilters);
    const list = K.History.sortHistory(filtered, K.state.historySortMode);
    document.getElementById('view-history').innerHTML = `
      <section class="panel">
        <h2>応募履歴</h2>
        <div class="toolbar">
          <select id="historySortMode">
            <option value="appliedDesc">応募日新しい順</option>
            <option value="appliedAsc">応募日古い順</option>
            <option value="followUp">確認予定日近い順</option>
            <option value="resultStatus">結果ステータス別</option>
            <option value="prize">賞品名順</option>
          </select>
          <button class="secondary" id="clearHistoryFilters">履歴フィルター解除</button>
        </div>
        <div class="small">履歴対象 ${K.History.getHistoryCampaigns(K.state.campaigns).length}件中 ${list.length}件を表示</div>
        <div class="checks" style="margin:10px 0 12px">
          ${['連絡待ち', '当選', '落選', '発送待ち', '受取済み'].map(v => `<label class="check-pill"><input type="checkbox" data-history-status="${a(v)}" ${K.state.historyFilters.resultStatuses.has(v) ? 'checked' : ''}>${e(v)}</label>`).join('')}
          <label class="check-pill"><input type="checkbox" id="hasFollowUpDate" ${K.state.historyFilters.hasFollowUpDate ? 'checked' : ''}>確認予定日あり</label>
          <label class="check-pill"><input type="checkbox" id="overdueFollowUp" ${K.state.historyFilters.overdueFollowUp ? 'checked' : ''}>確認予定日超過</label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>応募日</th><th>主催者</th><th>キャンペーン名</th><th>賞品</th><th>結果</th><th>確認予定日</th><th>連絡日</th><th>発送日</th><th>受取日</th><th>応募後メモ</th><th>操作</th></tr></thead>
            <tbody>
              ${list.map(c => `
                <tr>
                  <td>${e(c.appliedAt || '')}</td>
                  <td>${e(c.organizer)}</td>
                  <td>${e(c.title)}</td>
                  <td>${e(c.prize)}</td>
                  <td><span class="badge blue">${e(c.resultStatus)}</span></td>
                  <td>${e(c.followUpDate || '')}${K.History.isFollowUpOverdue(c) ? '<div class="badge high">超過</div>' : ''}</td>
                  <td>${e(c.resultNotifiedAt || '')}</td>
                  <td>${e(c.prizeShippedAt || '')}</td>
                  <td>${e(c.prizeReceivedAt || '')}</td>
                  <td>${e(c.applicationMemo || '')}</td>
                  <td><button class="secondary tiny" data-edit="${a(c.id)}">詳細を見る</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${list.length ? '' : '<div class="empty" style="margin-top:12px">条件に合う応募履歴はありません。</div>'}
      </section>`;
    const sort = document.getElementById('historySortMode');
    sort.value = K.state.historySortMode;
    sort.addEventListener('change', event => { K.state.historySortMode = event.target.value; K.UI.render(); });
    document.getElementById('clearHistoryFilters').addEventListener('click', () => { K.state.historyFilters = K.History.defaultFilters(); K.UI.render(); });
    document.querySelectorAll('[data-history-status]').forEach(input => input.addEventListener('change', () => {
      const set = K.state.historyFilters.resultStatuses;
      input.checked ? set.add(input.dataset.historyStatus) : set.delete(input.dataset.historyStatus);
      K.UI.render();
    }));
    document.getElementById('hasFollowUpDate').addEventListener('change', event => { K.state.historyFilters.hasFollowUpDate = event.target.checked; K.UI.render(); });
    document.getElementById('overdueFollowUp').addEventListener('change', event => { K.state.historyFilters.overdueFollowUp = event.target.checked; K.UI.render(); });
    K.UI.bindCampaignButtons();
  };
})();
