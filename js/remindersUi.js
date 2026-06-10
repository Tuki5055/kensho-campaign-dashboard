(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderReminders = function () {
    const all = K.Reminders.getAllReminders(K.state.campaigns);
    const filtered = K.Reminders.filterReminders(all, K.state.reminderFilter);
    const list = K.Reminders.sortReminders(filtered, K.state.reminderSortMode);
    const deadlineCount = all.filter(item => item.type === 'deadline').length;
    const followUpCount = all.filter(item => ['followUp', 'waiting'].includes(item.type)).length;
    const overdueCount = all.filter(item => item.daysUntil < 0).length;
    const todayCount = all.filter(item => item.daysUntil === 0).length;
    const threeCount = all.filter(item => item.daysUntil >= 0 && item.daysUntil <= 3).length;
    const sevenCount = all.filter(item => item.daysUntil >= 0 && item.daysUntil <= 7).length;

    document.getElementById('view-reminders').innerHTML = `
      <section class="panel">
        <div class="section-title">
          <h2>リマインダー</h2>
          <span class="badge blue">画面内通知・カレンダー出力</span>
        </div>
        <div class="stat-grid">
          ${K.UI.stat('締切リマインダー対象', deadlineCount)}
          ${K.UI.stat('応募後フォロー対象', followUpCount)}
          ${K.UI.stat('期限超過', overdueCount)}
          ${K.UI.stat('今日対応', todayCount)}
          ${K.UI.stat('3日以内', threeCount)}
          ${K.UI.stat('7日以内', sevenCount)}
        </div>
        ${K.UI.renderReminderControls()}
        <div style="margin-top:14px">
          ${K.UI.reminderCards(list, '対象のリマインダーはありません。')}
        </div>
      </section>`;

    document.getElementById('reminderFilter').addEventListener('change', event => { K.state.reminderFilter = event.target.value; K.UI.render(); });
    document.getElementById('reminderSortMode').addEventListener('change', event => { K.state.reminderSortMode = event.target.value; K.UI.render(); });
    document.getElementById('reminderFilter').value = K.state.reminderFilter;
    document.getElementById('reminderSortMode').value = K.state.reminderSortMode;
    document.getElementById('exportAllIcs').addEventListener('click', () => K.Ics.downloadIcs(K.state.campaigns));
    document.getElementById('requestNotifications').addEventListener('click', K.UI.requestReminderNotifications);
    document.querySelectorAll('[data-ics]').forEach(btn => btn.addEventListener('click', () => {
      const campaign = K.state.campaigns.find(item => item.id === btn.dataset.ics);
      if (campaign) K.Ics.downloadIcs([campaign], `kensho-reminder-${campaign.id}.ics`);
    }));
    K.UI.bindCampaignButtons();
  };

  K.UI.renderReminderControls = function () {
    const notificationStatus = !('Notification' in window)
      ? 'このブラウザでは通知を利用できません。画面内リマインダーを使ってください。'
      : `通知状態: ${Notification.permission}`;
    return `
      <div class="toolbar" style="margin-top:14px">
        <select id="reminderFilter">
          <option value="all">全て</option>
          <option value="today">今日</option>
          <option value="overdue">期限超過</option>
          <option value="deadline">締切系</option>
          <option value="followUp">応募後フォロー</option>
          <option value="winning">当選後対応</option>
          <option value="shipping">発送待ち</option>
          <option value="receiving">受取待ち</option>
        </select>
        <select id="reminderSortMode">
          <option value="date">対応日が近い順</option>
          <option value="deadline">締切が近い順</option>
          <option value="followUp">確認予定日が近い順</option>
          <option value="riskHigh">リスクが高い順</option>
          <option value="scoreHigh">スコアが高い順</option>
        </select>
        <button class="secondary" id="exportAllIcs">全リマインダーをICS出力</button>
        <button class="secondary" id="requestNotifications">通知を許可</button>
      </div>
      <p class="small">${e(notificationStatus)} 通知は任意です。SNS操作や応募操作は行いません。</p>`;
  };

  K.UI.reminderCards = function (items, emptyText) {
    if (!items.length) return `<div class="empty">${e(emptyText)}</div>`;
    return `<div class="campaign-list">${items.map(K.UI.renderReminderCard).join('')}</div>`;
  };

  K.UI.renderReminderCard = function (item) {
    const c = item.campaign;
    const statusClass = item.status === 'overdue' ? 'high' : item.status === 'today' ? 'deadline-today' : item.status === 'soon' ? 'deadline-soon' : 'gray';
    const urlAction = K.isSafeUrl(c.url)
      ? `<a href="${a(c.url)}" target="_blank" rel="noopener noreferrer">投稿を開く</a>`
      : '<span class="muted-link">投稿URLなし</span>';
    return `
      <article class="campaign risk-${K.UI.riskClass(c.risk.level)} ${item.status === 'today' ? 'due-today' : ''}">
        <div>
          <h3>${e(c.title || '無題のキャンペーン')}</h3>
          <div class="meta">
            <span class="badge ${statusClass}">${e(item.label)}</span>
            <span class="badge ${K.UI.riskClass(c.risk.level)}">${e(c.risk.level)}</span>
            <span class="badge blue">${e(item.action)}</span>
            <span class="badge gray">結果: ${e(c.resultStatus || '未確認')}</span>
          </div>
          <p class="small">${e(c.organizer || '主催者未入力')} / ${e(c.prize || '賞品未入力')}</p>
          <p class="small">締切: ${e(c.deadline || '未設定')} / 確認予定: ${e(c.followUpDate || '未設定')}</p>
          <div class="action-grid">
            ${urlAction}
            <button class="secondary tiny" data-edit="${a(c.id)}">詳細を見る</button>
            <button class="secondary tiny" data-ics="${a(c.id)}">選択中のキャンペーンだけICS出力</button>
          </div>
        </div>
        <div class="score">${c.score}<div class="small">score</div></div>
      </article>`;
  };

  K.UI.requestReminderNotifications = function () {
    if (!('Notification' in window)) {
      K.toast('このブラウザでは通知を利用できません');
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        const count = K.Reminders.getAllReminders(K.state.campaigns).length;
        if (count) new Notification('懸賞リマインダー', { body: `確認が必要なキャンペーンが${count}件あります。` });
        K.toast('通知が許可されました');
      } else {
        K.toast('通知は許可されませんでした。画面内リマインダーは利用できます');
      }
    });
  };
})();
