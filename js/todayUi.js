(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderToday = function () {
    const actionable = K.state.campaigns.filter(c => !K.isExpired(c) && !['応募済み', '見送り', '当選', '落選'].includes(K.effectiveStatus(c)));
    const todayDue = actionable.filter(c => K.daysUntil(c.deadline) === 0);
    const tomorrowDue = actionable.filter(c => K.daysUntil(c.deadline) === 1);
    const withinThree = actionable.filter(c => {
      const days = K.daysUntil(c.deadline);
      return days !== null && days >= 0 && days <= 3;
    });
    const highScore = actionable
      .filter(c => ['低リスク', '要確認'].includes(c.risk.level) && c.score >= 65)
      .sort((x, y) => y.score - x.score || (K.daysUntil(x.deadline) ?? 999) - (K.daysUntil(y.deadline) ?? 999))
      .slice(0, 6);
    const review = actionable.filter(c => c.risk.level === '要確認');
    const avoid = K.state.campaigns.filter(c => c.risk.level === '応募非推奨' && !K.isExpired(c));
    const doneCount = K.state.campaigns.filter(c => c.status === '応募済み').length;
    const skippedCount = K.state.campaigns.filter(c => c.status === '見送り').length;
    const priority = K.Filter.sortCampaigns([...new Map([...todayDue, ...tomorrowDue, ...withinThree, ...highScore].map(c => [c.id, c])).values()], 'priority').slice(0, 8);
    const withinSeven = actionable.filter(c => {
      const days = K.daysUntil(c.deadline);
      return days !== null && days >= 0 && days <= 7;
    });
    const allReminders = K.Reminders.getAllReminders(K.state.campaigns);
    const followUpToday = allReminders.filter(item => item.type === 'followUp' && item.daysUntil <= 0);
    const followUpThree = allReminders.filter(item => item.type === 'followUp' && item.daysUntil > 0 && item.daysUntil <= 3);
    const waiting = allReminders.filter(item => item.type === 'waiting');
    const shipping = allReminders.filter(item => item.type === 'shipping');
    const receiving = allReminders.filter(item => item.type === 'receiving');

    document.getElementById('view-today').innerHTML = `
      <div class="stat-grid">
        ${K.UI.stat('今日締切', todayDue.length)}
        ${K.UI.stat('明日締切', tomorrowDue.length)}
        ${K.UI.stat('3日以内', withinThree.length)}
        ${K.UI.stat('7日以内', withinSeven.length)}
        ${K.UI.stat('要確認', review.length)}
        ${K.UI.stat('応募非推奨', avoid.length)}
        ${K.UI.stat('応募済み', doneCount)}
        ${K.UI.stat('見送り', skippedCount)}
      </div>
      <div class="grid two" style="margin-top:14px">
        <section class="panel">
          <div class="section-title"><h2>今日やるべき順</h2><span class="badge blue">手動応募リスト</span></div>
          ${K.UI.campaignCards(priority, '今日すぐ見るべき未応募キャンペーンはありません。')}
          <div style="margin-top:14px">
            <div class="section-title"><h2>応募後フォロー</h2><span class="badge mid">手動確認</span></div>
            ${K.UI.reminderCards([...followUpToday, ...followUpThree].slice(0, 6), '今日確認する応募後フォローはありません。')}
          </div>
        </section>
        <section class="grid">
          <div class="panel"><h2>今日締切</h2>${K.UI.reminderCards(K.Reminders.getDeadlineReminders(todayDue).slice(0, 4), '今日締切の未応募キャンペーンはありません。')}</div>
          <div class="panel"><h2>明日締切</h2>${K.UI.reminderCards(K.Reminders.getDeadlineReminders(tomorrowDue).slice(0, 4), '明日締切の未応募キャンペーンはありません。')}</div>
          <div class="panel"><h2>3日以内締切</h2>${K.UI.reminderCards(K.Reminders.getDeadlineReminders(withinThree).slice(0, 4), '3日以内の未応募キャンペーンはありません。')}</div>
          <div class="panel"><h2>7日以内締切</h2>${K.UI.reminderCards(K.Reminders.getDeadlineReminders(withinSeven).slice(0, 4), '7日以内の未応募キャンペーンはありません。')}</div>
          <div class="panel"><h2>確認予定日が今日以前</h2>${K.UI.reminderCards(followUpToday.slice(0, 4), '今日以前の確認予定はありません。')}</div>
          <div class="panel"><h2>確認予定日が3日以内</h2>${K.UI.reminderCards(followUpThree.slice(0, 4), '3日以内の確認予定はありません。')}</div>
          <div class="panel"><h2>当選後、受取未完了</h2>${K.UI.reminderCards(receiving.slice(0, 4), '受取未完了の当選案件はありません。')}</div>
          <div class="panel"><h2>発送待ち</h2>${K.UI.reminderCards(shipping.slice(0, 4), '発送待ちはありません。')}</div>
          <div class="panel"><h2>連絡待ち</h2>${K.UI.reminderCards(waiting.slice(0, 4), '連絡待ちはありません。')}</div>
          <div class="panel"><h2>スコアが高い未応募案件</h2>${K.UI.campaignCards(highScore.slice(0, 4), '高スコアの未応募案件はありません。')}</div>
          <div class="panel"><h2>要確認案件</h2>${K.UI.campaignCards(review.slice(0, 4), '要確認はありません。')}</div>
          <div class="panel"><h2>応募非推奨のキャンペーン</h2>${K.UI.campaignCards(avoid.slice(0, 3), '応募非推奨はありません。')}</div>
        </section>
      </div>`;
    K.UI.bindCampaignButtons();
  };

  K.UI.followUpCards = function (items) {
    return K.UI.reminderCards(items.map(c => K.Reminders.toReminder(c, {
      type: 'followUp',
      date: c.followUpDate,
      daysUntil: K.daysUntil(c.followUpDate) ?? 0,
      label: '応募後フォロー',
      action: K.History.taskLabel(c)
    })), '今日確認する応募後フォローはありません。');
  };
})();
