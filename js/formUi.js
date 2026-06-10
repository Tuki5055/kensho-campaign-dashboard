(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderNew = function () {
    document.getElementById('view-new').innerHTML = `<section class="panel"><h2>新規登録</h2>${K.UI.formHtml(K.Storage.defaultCampaign(), 'create')}</section>`;
    K.UI.bindForm('create');
  };

  K.UI.formHtml = function (campaign, mode) {
    return `
      <form id="form-${mode}" class="grid">
        <input type="hidden" name="id" value="${a(campaign.id)}">
        <input type="hidden" name="createdAt" value="${a(campaign.createdAt)}">
        <div class="form-grid">
          ${K.UI.field('キャンペーン名', 'title', campaign.title)}
          ${K.UI.field('主催者名', 'organizer', campaign.organizer)}
          <div class="field"><label>SNS種別</label><select name="snsType">${K.SNS_OPTIONS.map(v => `<option ${campaign.snsType === v ? 'selected' : ''}>${e(v)}</option>`).join('')}</select></div>
          ${K.UI.field('投稿URL', 'url', campaign.url, 'url')}
          <div class="field full"><label>キャンペーン本文</label><textarea name="body" id="body-${mode}">${e(campaign.body)}</textarea></div>
          <div class="full split-actions">
            <button type="button" class="secondary" id="parse-${mode}">本文から推定入力</button>
            <span class="small">正規表現とキーワード検出による補助です。応募前に必ず手動確認してください。</span>
          </div>
          ${K.UI.field('賞品', 'prize', campaign.prize)}
          ${K.UI.field('当選人数', 'winners', campaign.winners)}
          ${K.UI.field('応募締切', 'deadline', campaign.deadline, 'date')}
          ${K.UI.field('当選連絡方法', 'contactMethod', campaign.contactMethod)}
          <div class="field full">
            <label>タグ（カンマ区切り）</label>
            <input type="text" name="tags" value="${a(K.Tags.tagsToInput(campaign.tags || []))}" placeholder="Amazonギフト券, 手軽, コメント必要">
            ${K.UI.currentTagsHtml(campaign.tags || [])}
            ${K.UI.suggestedTagsHtml(campaign)}
          </div>
          <div class="field full"><label>応募条件</label><div class="checks">${K.CONDITION_OPTIONS.map(v => `<label class="check-pill"><input type="checkbox" name="conditions" value="${e(v)}" ${campaign.conditions.includes(v) ? 'checked' : ''}>${e(v)}</label>`).join('')}</div></div>
          <div class="field full"><label>注意点</label><textarea name="cautions">${e(campaign.cautions || '')}</textarea></div>
          <div class="field full"><label>メモ</label><textarea name="notes">${e(campaign.notes)}</textarea></div>
          <div class="field"><label>ステータス</label><select name="status">${K.STATUS_OPTIONS.map(v => `<option ${campaign.status === v ? 'selected' : ''}>${e(v)}</option>`).join('')}</select></div>
          <div class="field full"><h2>リマインダー設定</h2></div>
          <div class="field full"><label class="check-row"><input type="checkbox" name="reminderEnabled" ${campaign.reminderEnabled ? 'checked' : ''}>締切リマインダーを有効にする</label></div>
          <div class="field"><label>締切何日前から表示するか</label><select name="reminderDaysBefore">${K.Reminders.ALLOWED_DAYS_BEFORE.map(v => `<option value="${v}" ${campaign.reminderDaysBefore === v ? 'selected' : ''}>${v}日前</option>`).join('')}</select></div>
          <div class="field full"><label class="check-row"><input type="checkbox" name="followUpReminderEnabled" ${campaign.followUpReminderEnabled ? 'checked' : ''}>応募後フォローリマインダーを有効にする</label></div>
          <div class="field full"><h2>応募履歴</h2></div>
          ${K.UI.field('応募日', 'appliedAt', campaign.appliedAt, 'date')}
          <div class="field"><label>結果ステータス</label><select name="resultStatus">${K.RESULT_STATUS_OPTIONS.map(v => `<option ${campaign.resultStatus === v ? 'selected' : ''}>${e(v)}</option>`).join('')}</select></div>
          ${K.UI.field('当選・落選連絡日', 'resultNotifiedAt', campaign.resultNotifiedAt, 'date')}
          ${K.UI.field('発送日', 'prizeShippedAt', campaign.prizeShippedAt, 'date')}
          ${K.UI.field('受取日', 'prizeReceivedAt', campaign.prizeReceivedAt, 'date')}
          ${K.UI.field('確認予定日', 'followUpDate', campaign.followUpDate, 'date')}
          <div class="field full"><label>応募後メモ</label><textarea name="applicationMemo">${e(campaign.applicationMemo || '')}</textarea></div>
          <div class="field full"><label>実際に行った応募操作メモ</label><textarea name="applicationMethodMemo">${e(campaign.applicationMethodMemo || '')}</textarea></div>
        </div>
        <div class="split-actions">
          <button type="submit">${mode === 'create' ? '登録する' : '更新する'}</button>
          ${mode === 'edit' ? `<button type="button" class="danger" id="delete-${mode}">削除</button>` : ''}
        </div>
      </form>`;
  };

  K.UI.suggestedTagsHtml = function (campaign) {
    const current = new Set(K.Tags.normalizeTags(campaign.tags || []));
    const suggestions = K.Tags.suggestTags(campaign).filter(tag => !current.has(tag));
    if (!suggestions.length) return '<div class="small suggested-tags">候補タグはありません。</div>';
    return `
      <div class="suggested-tags">
        <div class="small">自動タグ候補（クリックで追加）</div>
        <div class="tag-list">
          ${suggestions.map(tag => `<button type="button" class="tag-chip" data-add-tag="${a(tag)}">${e(tag)}</button>`).join('')}
        </div>
      </div>`;
  };

  K.UI.currentTagsHtml = function (tags) {
    const current = K.Tags.normalizeTags(tags);
    if (!current.length) return '<div class="small">現在のタグはありません。</div>';
    return `
      <div class="suggested-tags">
        <div class="small">現在のタグ（クリックで削除）</div>
        <div class="tag-list">
          ${current.map(tag => `<button type="button" class="tag-chip active" data-remove-tag="${a(tag)}">${e(tag)} ×</button>`).join('')}
        </div>
      </div>`;
  };

  K.UI.addTagToForm = function (form, tag) {
    const input = form.elements.tags;
    const tags = K.Tags.normalizeTags(`${input.value},${tag}`);
    input.value = K.Tags.tagsToInput(tags);
    K.toast(`タグ「${tag}」を追加しました`);
  };

  K.UI.removeTagFromForm = function (form, tag) {
    const input = form.elements.tags;
    const tags = K.Tags.normalizeTags(input.value).filter(item => item !== tag);
    input.value = K.Tags.tagsToInput(tags);
    K.toast(`タグ「${tag}」を削除しました`);
  };

  K.UI.bindForm = function (mode, id = null) {
    const form = document.getElementById(`form-${mode}`);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const campaign = K.UI.formToCampaign(form, id);
      const errors = K.UI.validateCampaignForm(form, campaign);
      if (errors.length) {
        alert(errors.join('\n'));
        return;
      }
      K.upsertCampaign(campaign);
      if (mode === 'create') K.UI.switchTab('detail');
    });
    document.getElementById(`parse-${mode}`).addEventListener('click', () => {
      const parsed = K.Parser.parseCampaignText(form.elements.body.value);
      Object.entries(parsed).forEach(([key, value]) => {
        if (key === 'conditions') {
          form.querySelectorAll('input[name="conditions"]').forEach(input => input.checked = value.includes(input.value));
        } else if (form.elements[key] && value) {
          form.elements[key].value = value;
        }
      });
      K.toast('本文から推定しました');
    });
    const del = document.getElementById(`delete-${mode}`);
    if (del) del.addEventListener('click', () => {
      if (confirm('このキャンペーンを削除しますか？')) K.deleteCampaign(id);
    });
    form.querySelectorAll('[data-add-tag]').forEach(btn => btn.addEventListener('click', () => K.UI.addTagToForm(form, btn.dataset.addTag)));
    form.querySelectorAll('[data-remove-tag]').forEach(btn => btn.addEventListener('click', () => K.UI.removeTagFromForm(form, btn.dataset.removeTag)));
  };

  K.UI.formToCampaign = function (form, id) {
    const fd = new FormData(form);
    const base = id ? K.state.campaigns.find(c => c.id === id) : {};
    const rawUrl = String(fd.get('url') || '').trim();
    return {
      ...K.Storage.defaultCampaign(),
      ...base,
      id: String(fd.get('id') || K.createId()),
      createdAt: fd.get('createdAt') || new Date().toISOString(),
      title: String(fd.get('title') || '').trim(),
      organizer: String(fd.get('organizer') || '').trim(),
      snsType: K.SNS_OPTIONS.includes(String(fd.get('snsType'))) ? String(fd.get('snsType')) : 'その他',
      url: K.normalizeUrl(rawUrl),
      body: String(fd.get('body') || '').trim(),
      prize: String(fd.get('prize') || '').trim(),
      winners: String(fd.get('winners') || '').trim(),
      deadline: K.isValidDateInput(String(fd.get('deadline') || '')) ? String(fd.get('deadline')) : '',
      conditions: fd.getAll('conditions'),
      contactMethod: String(fd.get('contactMethod') || '').trim(),
      notes: String(fd.get('notes') || '').trim(),
      cautions: String(fd.get('cautions') || '').trim(),
      tags: K.Tags.normalizeTags(String(fd.get('tags') || '')),
      status: K.STATUS_OPTIONS.includes(String(fd.get('status'))) ? String(fd.get('status')) : '未確認',
      reminderEnabled: fd.has('reminderEnabled'),
      reminderDaysBefore: K.Reminders.ALLOWED_DAYS_BEFORE.includes(Number(fd.get('reminderDaysBefore'))) ? Number(fd.get('reminderDaysBefore')) : 3,
      followUpReminderEnabled: fd.has('followUpReminderEnabled'),
      appliedAt: K.isValidDateInput(String(fd.get('appliedAt') || '')) ? String(fd.get('appliedAt')) : '',
      resultStatus: K.RESULT_STATUS_OPTIONS.includes(String(fd.get('resultStatus'))) ? String(fd.get('resultStatus')) : '未確認',
      resultNotifiedAt: K.isValidDateInput(String(fd.get('resultNotifiedAt') || '')) ? String(fd.get('resultNotifiedAt')) : '',
      prizeShippedAt: K.isValidDateInput(String(fd.get('prizeShippedAt') || '')) ? String(fd.get('prizeShippedAt')) : '',
      prizeReceivedAt: K.isValidDateInput(String(fd.get('prizeReceivedAt') || '')) ? String(fd.get('prizeReceivedAt')) : '',
      followUpDate: K.isValidDateInput(String(fd.get('followUpDate') || '')) ? String(fd.get('followUpDate')) : '',
      applicationMemo: String(fd.get('applicationMemo') || '').trim(),
      applicationMethodMemo: String(fd.get('applicationMethodMemo') || '').trim()
    };
  };

  K.UI.validateCampaignForm = function (form, campaign) {
    const errors = [];
    const rawUrl = form.elements.url?.value.trim() || '';
    if (!campaign.title) errors.push('キャンペーン名を入力してください。');
    if (campaign.deadline && !K.isValidDateInput(campaign.deadline)) errors.push('応募締切の日付が不正です。');
    if (rawUrl && !K.isSafeUrl(rawUrl)) errors.push('投稿URLは http:// または https:// のURLだけ登録できます。');
    return errors;
  };
})();
