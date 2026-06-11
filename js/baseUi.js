(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderTabs = function () {
    document.getElementById('tabs').innerHTML = K.TABS.map(([id, label]) =>
      `<button class="tab ${K.state.activeTab === id ? 'active' : ''}" data-tab="${a(id)}">${e(label)}</button>`
    ).join('');
    document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => K.UI.switchTab(btn.dataset.tab)));
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${K.state.activeTab}`));
  };

  K.UI.switchTab = function (tab) {
    K.state.activeTab = tab;
    K.UI.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  K.UI.stat = function (label, value) {
    return `<div class="stat"><b>${e(value)}</b><span>${e(label)}</span></div>`;
  };

  K.UI.riskClass = function (level) {
    return level === '低リスク' ? 'low' : level === '応募非推奨' ? 'high' : 'mid';
  };

  K.UI.deadlineClass = function (campaign) {
    const days = K.daysUntil(campaign.deadline);
    if (days === 0) return 'deadline-today';
    if (days !== null && days > 0 && days <= 3) return 'deadline-soon';
    return 'gray';
  };

  K.UI.tagChips = function (tags) {
    const normalized = K.Tags.normalizeTags(tags);
    if (!normalized.length) return '';
    return `<div class="tag-list">${normalized.map(tag => `<button class="tag-chip" data-tag-filter="${a(tag)}">${e(tag)}</button>`).join('')}</div>`;
  };

  K.UI.campaignActions = function (campaign) {
    const id = a(campaign.id);
    const urlAction = K.isSafeUrl(campaign.url)
      ? `<a href="${a(campaign.url)}" target="_blank" rel="noopener noreferrer">投稿を開く</a>`
      : '<span class="muted-link">投稿URLなし</span>';
    const commentButton = campaign.comments.length
      ? `<button class="secondary tiny" data-copy-comment="${id}">コメント案をコピー</button>`
      : '<button class="secondary tiny" disabled>コメント案なし</button>';
    return `
      <div class="action-grid">
        ${urlAction}
        ${commentButton}
        <button class="secondary tiny" data-status="${id}" data-value="応募済み">応募済みにする</button>
        <button class="secondary tiny" data-status="${id}" data-value="見送り">見送りにする</button>
        <button class="secondary tiny" data-edit="${id}">詳細を見る</button>
      </div>`;
  };

  K.UI.campaignCards = function (items, emptyText) {
    if (!items.length) return `<div class="empty">${e(emptyText)}</div>`;
    return `<div class="campaign-list">${items.map(c => `
      <article class="campaign risk-${K.UI.riskClass(c.risk.level)} ${K.daysUntil(c.deadline) === 0 ? 'due-today' : ''} ${K.effectiveStatus(c) === '応募済み' ? 'done' : ''} ${K.effectiveStatus(c) === '見送り' ? 'skipped' : ''}">
        <div>
          <h3>${e(c.title || '無題のキャンペーン')}</h3>
          <div class="meta">
            <span class="badge blue">${e(K.effectiveStatus(c))}</span>
            <span class="badge ${K.UI.riskClass(c.risk.level)}">${e(c.risk.level)}</span>
            <span class="badge gray">${e(c.snsType)}</span>
            <span class="badge ${K.UI.deadlineClass(c)}">${e(K.formatDeadline(c))}</span>
          </div>
          <p class="small">${e(c.organizer || '主催者未入力')} / ${e(c.prize || '賞品未入力')}</p>
          <p class="small">${e(c.conditions.join('、') || '条件未入力')}</p>
          ${K.UI.tagChips(c.tags || [])}
          ${K.UI.campaignActions(c)}
        </div>
        <div class="score">${c.score}<div class="small">score</div></div>
      </article>`).join('')}</div>`;
  };

  K.UI.field = function (labelText, name, value, type = 'text') {
    return `<div class="field"><label>${e(labelText)}</label><input type="${a(type)}" name="${a(name)}" value="${a(value || '')}"></div>`;
  };

  K.UI.groupCount = function (items, key) {
    return items.reduce((acc, item) => (acc[item[key]] = (acc[item[key]] || 0) + 1, acc), {});
  };

  K.UI.miniCounts = function (obj) {
    const entries = Object.entries(obj);
    if (!entries.length) return '<div class="empty">データがありません。</div>';
    return entries.map(([key, value]) => `<div class="meta" style="justify-content:space-between"><span>${e(key)}</span><b>${value}</b></div>`).join('');
  };

  K.UI.bindCampaignButtons = function (root = document) {
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
      K.state.selectedId = btn.dataset.edit;
      K.UI.switchTab('detail');
    }));
    root.querySelectorAll('[data-status]').forEach(btn => btn.addEventListener('click', () => K.updateStatus(btn.dataset.status, btn.dataset.value)));
    root.querySelectorAll('[data-copy-comment]').forEach(btn => btn.addEventListener('click', () => K.Comments.copyFirstComment(btn.dataset.copyComment)));
  };
})();
