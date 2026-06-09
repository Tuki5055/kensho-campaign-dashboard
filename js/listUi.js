(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderList = function () {
    if (!K.state.listFilters) K.state.listFilters = K.Filter.defaultState();
    const filtered = K.Filter.applyFilters(K.state.campaigns, K.state.listFilters);
    const list = K.Filter.sortCampaigns(filtered, K.state.sortMode);
    const allTags = K.Tags.getAllTags(K.state.campaigns);
    const activeFilters = K.Filter.describeActiveFilters(K.state.listFilters);
    document.getElementById('view-list').innerHTML = `
      <section class="panel">
        <h2>キャンペーン一覧</h2>
        <div class="toolbar">
          <input id="keywordSearch" type="search" placeholder="キーワード検索（名前・主催者・賞品・本文・メモ・タグ）" value="${a(K.state.listFilters.keyword)}">
          <select id="sortMode">
            <option value="scoreDesc">スコア高い順</option>
            <option value="scoreAsc">スコア低い順</option>
            <option value="deadline">締切近い順</option>
            <option value="newest">追加日新しい順</option>
            <option value="oldest">追加日古い順</option>
            <option value="riskLow">リスク低い順</option>
            <option value="riskHigh">リスク高い順</option>
            <option value="organizer">主催者名順</option>
          </select>
          <button class="secondary" id="clearFilters">フィルター解除</button>
        </div>
        <div class="small">全${K.state.campaigns.length}件中 ${list.length}件を表示</div>
        <div class="active-filters">
          ${activeFilters.length ? activeFilters.map(v => `<span class="badge blue">${e(v)}</span>`).join('') : '<span class="badge gray">フィルターなし</span>'}
        </div>
        ${K.UI.filterPanel(allTags)}
        <div class="table-wrap">
          <table>
            <thead><tr><th>ステータス</th><th>締切</th><th>主催者</th><th>キャンペーン名</th><th>SNS</th><th>賞品</th><th>条件</th><th>タグ</th><th>リスク</th><th>スコア</th><th>URL</th><th>メモ</th><th>操作</th></tr></thead>
            <tbody>
              ${list.map(c => `
                <tr class="${['応募済み', '見送り'].includes(K.effectiveStatus(c)) ? 'muted-row' : ''}">
                  <td><select class="status-select" data-status-select="${a(c.id)}">${K.STATUS_OPTIONS.map(s => `<option ${c.status === s ? 'selected' : ''}>${e(s)}</option>`).join('')}</select><div class="small">表示: ${e(K.effectiveStatus(c))}</div></td>
                  <td>${e(K.formatDeadline(c))}</td>
                  <td>${e(c.organizer)}</td>
                  <td>${e(c.title)}</td>
                  <td>${e(c.snsType)}</td>
                  <td>${e(c.prize)}</td>
                  <td>${e(c.conditions.join('、'))}</td>
                  <td>${K.UI.tagChips(c.tags || [])}</td>
                  <td><span class="badge ${K.UI.riskClass(c.risk.level)}">${e(c.risk.level)}</span><div class="small">${e(c.risk.reasons.join(' / '))}</div></td>
                  <td><b>${c.score}</b></td>
                  <td>${K.isSafeUrl(c.url) ? `<a href="${a(c.url)}" target="_blank" rel="noopener noreferrer">開く</a>` : '<span class="small">未設定</span>'}</td>
                  <td>${e(c.notes)}</td>
                  <td>${K.UI.campaignActions(c)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${list.length ? '' : '<div class="empty" style="margin-top:12px">条件に合うキャンペーンがありません。</div>'}
      </section>`;
    const sort = document.getElementById('sortMode');
    sort.value = K.state.sortMode;
    sort.addEventListener('change', event => { K.state.sortMode = event.target.value; K.UI.render(); });
    document.getElementById('keywordSearch').addEventListener('input', event => { K.state.listFilters.keyword = event.target.value; K.UI.render(); });
    document.getElementById('clearFilters').addEventListener('click', () => { K.state.listFilters = K.Filter.defaultState(); K.UI.render(); });
    document.querySelectorAll('[data-filter-group]').forEach(input => input.addEventListener('change', () => K.UI.updateFilterSet(input)));
    document.querySelectorAll('[data-tag-filter]').forEach(btn => btn.addEventListener('click', () => K.UI.toggleTagFilter(btn.dataset.tagFilter)));
    document.querySelectorAll('[data-status-select]').forEach(select => select.addEventListener('change', () => K.updateStatus(select.dataset.statusSelect, select.value)));
    K.UI.bindCampaignButtons();
  };

  K.UI.filterPanel = function (allTags) {
    const fs = K.state.listFilters;
    const conditionLabels = {
      'フォロー': 'フォローあり',
      'リポスト': 'リポストあり',
      'いいね': 'いいねあり',
      'コメント': 'コメントあり',
      'ハッシュタグ': 'ハッシュタグあり',
      '引用投稿': '引用投稿あり',
      '会員登録': '会員登録あり',
      '個人情報入力': '個人情報入力あり'
    };
    const isDesktop = window.matchMedia('(min-width: 861px)').matches;
    const group = (title, key, values, labels = {}) => `
      <div class="filter-group">
        <h3>${e(title)}</h3>
        <div class="checks">
          ${values.map(v => `<label class="check-pill"><input type="checkbox" data-filter-group="${a(key)}" value="${a(v)}" ${fs[key].has(v) ? 'checked' : ''}>${e(labels[v] || v)}</label>`).join('')}
        </div>
      </div>`;
    return `
      <details class="filter-panel" ${isDesktop ? 'open' : ''}>
        <summary>詳細フィルター・タグ</summary>
        <div class="filter-grid" style="margin-top:10px">
          ${group('ステータス', 'statuses', ['未確認', '応募候補', '応募済み', '見送り', '当選', '落選', '締切切れ'])}
          ${group('SNS種別', 'snsTypes', K.SNS_OPTIONS)}
          ${group('リスク', 'risks', ['低リスク', '要確認', '応募非推奨'])}
          ${group('応募条件', 'conditions', ['フォロー', 'リポスト', 'いいね', 'コメント', 'ハッシュタグ', '引用投稿', '会員登録', '個人情報入力'], conditionLabels)}
          ${group('締切', 'deadlines', ['今日締切', '明日締切', '3日以内', '7日以内', '締切切れ', '締切不明'])}
          ${group('スコア', 'scores', ['80点以上', '60点以上', '40点以上', '30点以下'])}
        </div>
        <div class="filter-group" style="margin-top:12px">
          <h3>タグ</h3>
          <div class="tag-list">
            ${allTags.length ? allTags.map(tag => `<button class="tag-chip ${fs.tags.has(tag) ? 'active' : ''}" data-tag-filter="${a(tag)}">${e(tag)}</button>`).join('') : '<span class="small">登録済みタグはまだありません。</span>'}
          </div>
        </div>
      </details>`;
  };

  K.UI.updateFilterSet = function (input) {
    const target = K.state.listFilters[input.dataset.filterGroup];
    if (!target) return;
    input.checked ? target.add(input.value) : target.delete(input.value);
    K.UI.render();
  };

  K.UI.toggleTagFilter = function (tag) {
    const tags = K.state.listFilters.tags;
    tags.has(tag) ? tags.delete(tag) : tags.add(tag);
    K.state.activeTab = 'list';
    K.UI.render();
  };
})();
