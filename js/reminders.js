(function () {
  'use strict';

  const K = window.Kensho;

  K.Reminders = {};

  K.Reminders.ALLOWED_DAYS_BEFORE = [1, 3, 7, 14];

  K.Reminders.defaultFields = function () {
    return {
      reminderEnabled: true,
      reminderDaysBefore: 3,
      followUpReminderEnabled: true
    };
  };

  K.Reminders.normalizeReminderFields = function (raw = {}) {
    return {
      reminderEnabled: typeof raw.reminderEnabled === 'boolean' ? raw.reminderEnabled : true,
      reminderDaysBefore: K.Reminders.ALLOWED_DAYS_BEFORE.includes(Number(raw.reminderDaysBefore)) ? Number(raw.reminderDaysBefore) : 3,
      followUpReminderEnabled: typeof raw.followUpReminderEnabled === 'boolean' ? raw.followUpReminderEnabled : true
    };
  };

  K.Reminders.isUnapplied = function (campaign) {
    return !['応募済み', '見送り', '当選', '落選', '締切切れ'].includes(K.effectiveStatus(campaign));
  };

  K.Reminders.getDeadlineReminders = function (campaigns, baseDate = new Date()) {
    return campaigns
      .filter(campaign => campaign.reminderEnabled !== false && !['応募済み', '見送り', '当選', '落選'].includes(campaign.status))
      .map(campaign => {
        const days = K.daysUntil(campaign.deadline, baseDate);
        if (days === null || days < 0 || days > campaign.reminderDaysBefore) return null;
        return K.Reminders.toReminder(campaign, {
          type: 'deadline',
          date: campaign.deadline,
          daysUntil: days,
          label: K.Reminders.deadlineLabel(days),
          action: '応募する'
        });
      })
      .filter(Boolean);
  };

  K.Reminders.getFollowUpReminders = function (campaigns, baseDate = new Date()) {
    return campaigns
      .filter(campaign => campaign.followUpReminderEnabled !== false)
      .flatMap(campaign => {
        const reminders = [];
        const followUpDays = K.daysUntil(campaign.followUpDate, baseDate);
        if (followUpDays !== null && followUpDays <= 3) {
          reminders.push(K.Reminders.toReminder(campaign, {
            type: 'followUp',
            date: campaign.followUpDate,
            daysUntil: followUpDays,
            label: followUpDays < 0 ? '確認予定日超過' : followUpDays === 0 ? '今日確認' : `${followUpDays}日以内に確認`,
            action: K.History.taskLabel(campaign)
          }));
        }
        if (campaign.resultStatus === '連絡待ち') {
          reminders.push(K.Reminders.toReminder(campaign, {
            type: 'waiting',
            date: campaign.followUpDate || campaign.appliedAt || campaign.deadline,
            daysUntil: K.Reminders.reminderDateDistance(campaign.followUpDate || campaign.appliedAt || campaign.deadline, baseDate),
            label: '連絡待ち',
            action: 'DMを確認する / 当選連絡を確認する'
          }));
        }
        if (campaign.resultStatus === '発送待ち') {
          reminders.push(K.Reminders.toReminder(campaign, {
            type: 'shipping',
            date: campaign.followUpDate || campaign.resultNotifiedAt || campaign.deadline,
            daysUntil: K.Reminders.reminderDateDistance(campaign.followUpDate || campaign.resultNotifiedAt || campaign.deadline, baseDate),
            label: '発送待ち',
            action: '発送状況を確認する'
          }));
        }
        if (campaign.resultStatus === '当選' && !campaign.prizeReceivedAt) {
          reminders.push(K.Reminders.toReminder(campaign, {
            type: 'receiving',
            date: campaign.followUpDate || campaign.resultNotifiedAt || campaign.deadline,
            daysUntil: K.Reminders.reminderDateDistance(campaign.followUpDate || campaign.resultNotifiedAt || campaign.deadline, baseDate),
            label: '当選後・受取未完了',
            action: '受取状況を確認する'
          }));
        }
        return reminders;
      });
  };

  K.Reminders.getAllReminders = function (campaigns, baseDate = new Date()) {
    const unique = new Map();
    [...K.Reminders.getDeadlineReminders(campaigns, baseDate), ...K.Reminders.getFollowUpReminders(campaigns, baseDate)].forEach(reminder => {
      unique.set(`${reminder.type}:${reminder.campaign.id}`, reminder);
    });
    return [...unique.values()];
  };

  K.Reminders.filterReminders = function (items, filter = 'all', baseDate = new Date()) {
    return items.filter(item => {
      if (filter === 'today') return item.daysUntil === 0;
      if (filter === 'overdue') return item.daysUntil !== null && item.daysUntil < 0;
      if (filter === 'deadline') return item.type === 'deadline';
      if (filter === 'followUp') return ['followUp', 'waiting'].includes(item.type);
      if (filter === 'winning') return ['receiving'].includes(item.type);
      if (filter === 'shipping') return item.type === 'shipping';
      if (filter === 'receiving') return item.type === 'receiving';
      return true;
    });
  };

  K.Reminders.sortReminders = function (items, mode) {
    const riskOrder = { '応募非推奨': 0, '要確認': 1, '低リスク': 2 };
    return [...items].sort((a, b) => {
      if (mode === 'deadline') return K.History.dateValue(a.campaign.deadline, 99999999) - K.History.dateValue(b.campaign.deadline, 99999999);
      if (mode === 'followUp') return K.History.dateValue(a.campaign.followUpDate, 99999999) - K.History.dateValue(b.campaign.followUpDate, 99999999);
      if (mode === 'riskHigh') return (riskOrder[a.campaign.risk.level] ?? 9) - (riskOrder[b.campaign.risk.level] ?? 9);
      if (mode === 'scoreHigh') return b.campaign.score - a.campaign.score;
      return K.Reminders.dateValue(a.date, a.daysUntil) - K.Reminders.dateValue(b.date, b.daysUntil);
    });
  };

  K.Reminders.isReminderDue = function (campaign, baseDate = new Date()) {
    return K.Reminders.getAllReminders([campaign], baseDate).length > 0;
  };

  K.Reminders.toReminder = function (campaign, data) {
    return {
      ...data,
      campaign,
      status: data.daysUntil < 0 ? 'overdue' : data.daysUntil === 0 ? 'today' : data.daysUntil <= 3 ? 'soon' : 'upcoming'
    };
  };

  K.Reminders.deadlineLabel = function (days) {
    if (days === 0) return '今日締切';
    if (days === 1) return '明日締切';
    return `${days}日以内に締切`;
  };

  K.Reminders.reminderDateDistance = function (date, baseDate) {
    return K.isValidDateInput(date) ? K.daysUntil(date, baseDate) : 9999;
  };

  K.Reminders.dateValue = function (date, daysUntil) {
    if (K.isValidDateInput(date)) return Number(date.replaceAll('-', ''));
    if (Number.isFinite(daysUntil)) return 90000000 + daysUntil;
    return 99999999;
  };
})();
