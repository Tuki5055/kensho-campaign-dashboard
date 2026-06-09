(function () {
  'use strict';

  const K = window.Kensho;

  K.History = {};

  K.History.DATE_FIELDS = ['appliedAt', 'resultNotifiedAt', 'prizeShippedAt', 'prizeReceivedAt', 'followUpDate'];
  K.History.MEMO_FIELDS = ['applicationMemo', 'applicationMethodMemo'];

  K.History.defaultFields = function () {
    return {
      appliedAt: '',
      resultStatus: '未確認',
      resultNotifiedAt: '',
      prizeShippedAt: '',
      prizeReceivedAt: '',
      followUpDate: '',
      applicationMemo: '',
      applicationMethodMemo: ''
    };
  };

  K.History.normalizeHistoryFields = function (raw = {}) {
    const history = K.History.defaultFields();
    K.History.DATE_FIELDS.forEach(field => {
      history[field] = K.isValidDateInput(raw[field]) ? raw[field] : '';
    });
    history.resultStatus = K.RESULT_STATUS_OPTIONS.includes(raw.resultStatus) ? raw.resultStatus : '未確認';
    K.History.MEMO_FIELDS.forEach(field => {
      history[field] = typeof raw[field] === 'string' ? K.safeText(raw[field]) : '';
    });
    return history;
  };

  K.History.markAsApplied = function (campaign, today = K.todayString()) {
    campaign.status = '応募済み';
    if (!campaign.appliedAt) campaign.appliedAt = today;
    if (!campaign.resultStatus || campaign.resultStatus === '未確認') campaign.resultStatus = '連絡待ち';
    return campaign;
  };

  K.History.defaultFilters = function () {
    return {
      resultStatuses: new Set(),
      hasFollowUpDate: false,
      overdueFollowUp: false
    };
  };

  K.History.getHistoryCampaigns = function (campaigns) {
    return campaigns.filter(campaign =>
      campaign.appliedAt ||
      ['応募済み', '当選', '落選'].includes(campaign.status) ||
      ['連絡待ち', '当選', '落選', '発送待ち', '受取済み'].includes(campaign.resultStatus)
    );
  };

  K.History.filterHistory = function (campaigns, filters = K.state.historyFilters) {
    return K.History.getHistoryCampaigns(campaigns).filter(campaign => {
      if (filters.resultStatuses?.size && !filters.resultStatuses.has(campaign.resultStatus)) return false;
      if (filters.hasFollowUpDate && !campaign.followUpDate) return false;
      if (filters.overdueFollowUp && !K.History.isFollowUpOverdue(campaign)) return false;
      return true;
    });
  };

  K.History.sortHistory = function (items, mode) {
    const resultOrder = { '連絡待ち': 0, '発送待ち': 1, '当選': 2, '受取済み': 3, '落選': 4, '未確認': 5 };
    return [...items].sort((a, b) => {
      if (mode === 'appliedAsc') return K.History.dateValue(a.appliedAt, 99999999) - K.History.dateValue(b.appliedAt, 99999999);
      if (mode === 'followUp') return K.History.dateValue(a.followUpDate, 99999999) - K.History.dateValue(b.followUpDate, 99999999);
      if (mode === 'resultStatus') return (resultOrder[a.resultStatus] ?? 9) - (resultOrder[b.resultStatus] ?? 9);
      if (mode === 'prize') return String(a.prize || '').localeCompare(String(b.prize || ''), 'ja');
      return K.History.dateValue(b.appliedAt, 0) - K.History.dateValue(a.appliedAt, 0);
    });
  };

  K.History.dateValue = function (date, fallback) {
    return K.isValidDateInput(date) ? Number(date.replaceAll('-', '')) : fallback;
  };

  K.History.isFollowUpOverdue = function (campaign, baseDate = new Date()) {
    const days = K.daysUntil(campaign.followUpDate, baseDate);
    return days !== null && days < 0;
  };

  K.History.getFollowUpTasks = function (campaigns, baseDate = new Date()) {
    return campaigns.filter(campaign => {
      const due = K.daysUntil(campaign.followUpDate, baseDate);
      const dueOrOverdue = due !== null && due <= 0;
      return (
        dueOrOverdue ||
        campaign.resultStatus === '連絡待ち' ||
        campaign.resultStatus === '発送待ち' ||
        (campaign.resultStatus === '当選' && !campaign.prizeReceivedAt)
      ) && K.History.getHistoryCampaigns([campaign]).length;
    });
  };

  K.History.taskLabel = function (campaign) {
    if (campaign.resultStatus === '発送待ち') return '発送状況確認';
    if (campaign.resultStatus === '当選' && !campaign.prizeReceivedAt) return '受取状況確認';
    if (campaign.resultStatus === '連絡待ち') return 'DM確認 / 当選連絡確認';
    return '当選連絡確認';
  };
})();
