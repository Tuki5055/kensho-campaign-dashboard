(function () {
  'use strict';

  const K = window.Kensho;

  K.Ics = {};

  K.Ics.buildIcsCalendar = function (campaigns) {
    const events = campaigns.flatMap(campaign => {
      const items = [];
      if (K.isValidDateInput(campaign.deadline)) {
        items.push(K.Ics.buildIcsEvent(campaign, 'deadline', campaign.deadline));
      }
      if (K.isValidDateInput(campaign.followUpDate)) {
        items.push(K.Ics.buildIcsEvent(campaign, 'followUp', campaign.followUpDate));
      }
      return items;
    });
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kensho Campaign Dashboard//Reminder Export//JA',
      'CALSCALE:GREGORIAN',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');
  };

  K.Ics.buildIcsEvent = function (campaign, type, date) {
    const titlePrefix = type === 'deadline' ? '【懸賞締切】' : '【懸賞確認】';
    const description = [
      `主催者: ${campaign.organizer || '未入力'}`,
      `賞品: ${campaign.prize || '未入力'}`,
      `URL: ${campaign.url || '未入力'}`,
      `ステータス: ${K.effectiveStatus(campaign)}`,
      `リスク: ${campaign.risk?.level || '未判定'}`,
      `メモ: ${campaign.notes || ''}`
    ].join('\\n');
    const start = date.replaceAll('-', '');
    const end = K.Ics.nextDate(date);
    return [
      'BEGIN:VEVENT',
      `UID:${K.Ics.escapeIcsText(`${campaign.id}-${type}-${date}`)}@kensho-campaign-dashboard`,
      `DTSTAMP:${K.Ics.timestamp()}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${K.Ics.escapeIcsText(`${titlePrefix}${campaign.title || '無題のキャンペーン'}`)}`,
      `DESCRIPTION:${K.Ics.escapeIcsText(description)}`,
      'END:VEVENT'
    ].join('\r\n');
  };

  K.Ics.downloadIcs = function (campaigns, filename = `kensho-reminders-${K.todayString()}.ics`) {
    K.Export.download(filename, K.Ics.buildIcsCalendar(campaigns), 'text/calendar;charset=utf-8');
  };

  K.Ics.escapeIcsText = function (value) {
    return String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  };

  K.Ics.timestamp = function () {
    return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  };

  K.Ics.nextDate = function (date) {
    const [year, month, day] = date.split('-').map(Number);
    const next = new Date(year, month - 1, day + 1);
    return [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('');
  };
})();
