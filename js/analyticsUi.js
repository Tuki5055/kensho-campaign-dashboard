(function () {
  'use strict';

  const K = window.Kensho;

  K.UI = K.UI || {};

  K.UI.renderAnalytics = function () {
    const counts = Object.fromEntries(K.STATUS_OPTIONS.map(s => [s, K.state.campaigns.filter(c => c.status === s).length]));
    const bySns = K.UI.groupCount(K.state.campaigns, 'snsType');
    const byRisk = K.state.campaigns.reduce((acc, c) => (acc[c.risk.level] = (acc[c.risk.level] || 0) + 1, acc), {});
    const avgScore = K.state.campaigns.length ? Math.round(K.state.campaigns.reduce((sum, c) => sum + c.score, 0) / K.state.campaigns.length) : 0;
    const appStats = K.Stats.calculateApplicationStats(K.state.campaigns);
    document.getElementById('view-analytics').innerHTML = `
      <section class="panel">
        <h2>分析・集計</h2>
        <div class="stat-grid">
          ${K.UI.stat('登録件数', K.state.campaigns.length)}
          ${K.UI.stat('応募済み件数', counts['応募済み'])}
          ${K.UI.stat('見送り件数', counts['見送り'])}
          ${K.UI.stat('当選件数', counts['当選'])}
          ${K.UI.stat('落選件数', counts['落選'])}
          ${K.UI.stat('今月の応募件数', appStats.currentMonthApplications)}
          ${K.UI.stat('平均スコア', avgScore)}
          ${K.UI.stat('締切切れ件数', K.state.campaigns.filter(K.isExpired).length)}
          ${K.UI.stat('先月の応募件数', appStats.lastMonthApplications)}
          ${K.UI.stat('累計応募件数', appStats.totalApplications)}
          ${K.UI.stat('連絡待ち件数', appStats.waiting)}
          ${K.UI.stat('発送待ち件数', appStats.shippingWaiting)}
          ${K.UI.stat('受取済み件数', appStats.received)}
          ${K.UI.stat('当選率', `${Math.round(appStats.winRate * 1000) / 10}%`)}
        </div>
        <p class="small" style="margin-top:10px">当選率は「当選件数 / 累計応募件数」で計算しています。連絡待ちも分母に含む暫定値です。</p>
        <div class="grid two" style="margin-top:14px">
          <div class="panel"><h2>SNS別件数</h2>${K.UI.miniCounts(bySns)}</div>
          <div class="panel"><h2>リスク別件数</h2>${K.UI.miniCounts(byRisk)}</div>
          <div class="panel"><h2>月別応募件数</h2>${K.UI.miniCounts(appStats.monthlyApplications)}</div>
          <div class="panel"><h2>月別当選件数</h2>${K.UI.miniCounts(appStats.monthlyWins)}</div>
          <div class="panel"><h2>SNS別当選件数</h2>${K.UI.miniCounts(appStats.winsBySns)}</div>
          <div class="panel"><h2>タグ別当選件数</h2>${K.UI.miniCounts(appStats.winsByTag)}</div>
        </div>
      </section>`;
  };
})();
