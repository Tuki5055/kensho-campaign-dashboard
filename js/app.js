(function () {
  'use strict';

  const K = window.Kensho = window.Kensho || {};

  K.STORAGE_KEY = 'kensho_campaign_dashboard_v1';
  K.CONDITION_OPTIONS = ['フォロー', 'リポスト', 'いいね', 'コメント', 'ハッシュタグ', '引用投稿', '会員登録', 'アンケート回答', '個人情報入力'];
  K.STATUS_OPTIONS = ['未確認', '応募候補', '応募済み', '見送り', '当選', '落選', '締切切れ'];
  K.RESULT_STATUS_OPTIONS = ['未確認', '連絡待ち', '当選', '落選', '発送待ち', '受取済み'];
  K.SNS_OPTIONS = ['X', 'Instagram', 'TikTok', '公式サイト', 'その他'];
  K.CHECKLIST_ITEMS = ['主催者を確認した', '応募条件を確認した', '締切を確認した', '個人情報入力の有無を確認した', 'リスク判定を確認した', 'フォローした', 'リポストした', 'いいねした', 'コメントした', '応募完了'];
  K.TABS = [
    ['today', '今日やること'],
    ['list', 'キャンペーン一覧'],
    ['new', '新規登録'],
    ['detail', '詳細・編集'],
    ['history', '応募履歴'],
    ['reminders', 'リマインダー'],
    ['comments', 'コメント案'],
    ['analytics', '分析・集計'],
    ['backup', 'バックアップ']
  ];
  K.SAFE_URL_PATTERN = /^https?:\/\/[^\s<>"']+\.[^\s<>"']+$/i;
  K.REVIEW_PATTERN = /個人情報|住所|電話番号|LINE登録|LINE追加|line\.me|lin\.ee|外部サイト|外部URL|短縮URL|bit\.ly|無料登録|専用フォーム/i;

  K.state = {
    campaigns: [],
    activeTab: 'today',
    selectedId: null,
    listFilters: null,
    historyFilters: null,
    reminderFilter: 'all',
    reminderSortMode: 'date',
    historySortMode: 'appliedDesc',
    sortMode: 'deadline'
  };

  K.createId = function () {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `campaign-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  K.safeText = function (value, maxLength = 5000) {
    return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, maxLength);
  };

  K.escapeHtml = function (value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  };

  K.escapeAttr = function (value) {
    return K.escapeHtml(value).replace(/`/g, '&#96;');
  };

  K.isValidDateInput = function (value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  K.isValidIsoDate = function (value) {
    return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
  };

  K.toDateInput = function (year, month, day) {
    const value = [String(year), String(month).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
    return K.isValidDateInput(value) ? value : '';
  };

  K.daysUntil = function (dateString, baseDate = new Date()) {
    if (!K.isValidDateInput(dateString)) return null;
    const today = new Date(baseDate);
    if (Number.isNaN(today.getTime())) return null;
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateString.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    return Math.ceil((target - today) / 86400000);
  };

  K.isExpired = function (campaign) {
    const days = K.daysUntil(campaign.deadline);
    return days !== null && days < 0;
  };

  K.effectiveStatus = function (campaign) {
    return K.isExpired(campaign) && !['応募済み', '当選', '落選'].includes(campaign.status) ? '締切切れ' : campaign.status;
  };

  K.formatDeadline = function (campaign) {
    if (!campaign.deadline) return '未設定';
    const days = K.daysUntil(campaign.deadline);
    if (days === null) return campaign.deadline;
    if (days < 0) return `${campaign.deadline}（締切切れ）`;
    if (days === 0) return `${campaign.deadline}（今日）`;
    return `${campaign.deadline}（あと${days}日）`;
  };

  K.localDateString = function (date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };

  K.todayString = function () {
    return K.localDateString(new Date());
  };

  K.isSafeUrl = function (url) {
    return typeof url === 'string' && K.SAFE_URL_PATTERN.test(url) && !/^javascript:/i.test(url);
  };

  K.normalizeUrl = function (value) {
    const url = K.safeText(value, 1000);
    return K.isSafeUrl(url) ? url : '';
  };

  K.toast = function (message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(K.toast.timer);
    K.toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
  };

  K.upsertCampaign = function (data) {
    const normalized = K.Storage.normalizeCampaign(data);
    const index = K.state.campaigns.findIndex(item => item.id === normalized.id);
    if (index >= 0) K.state.campaigns[index] = normalized;
    else K.state.campaigns.unshift(normalized);
    K.state.selectedId = normalized.id;
    K.Storage.saveCampaigns(K.state.campaigns);
    K.UI.render();
    K.toast('保存しました');
  };

  K.deleteCampaign = function (id) {
    K.state.campaigns = K.state.campaigns.filter(item => item.id !== id);
    K.state.selectedId = K.state.campaigns[0]?.id || null;
    K.Storage.saveCampaigns(K.state.campaigns);
    K.UI.render();
    K.toast('削除しました');
  };

  K.updateStatus = function (id, status) {
    const campaign = K.state.campaigns.find(item => item.id === id);
    if (!campaign || !K.STATUS_OPTIONS.includes(status)) return;
    if (status === '応募済み') K.History.markAsApplied(campaign);
    else campaign.status = status;
    K.Storage.saveCampaigns(K.state.campaigns);
    K.UI.render();
    K.toast('ステータスを更新しました');
  };

  K.init = function () {
    K.state.listFilters = K.Filter.defaultState();
    K.state.historyFilters = K.History.defaultFilters();
    K.state.campaigns = K.Storage.loadCampaigns();
    K.state.selectedId = K.state.campaigns[0]?.id || null;
    K.UI.render();
  };
})();
