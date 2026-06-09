(function () {
  'use strict';

  const K = window.Kensho;

  K.Stats = {};

  K.Stats.calculateApplicationStats = function (campaigns, baseDate = new Date()) {
    const applied = K.History.getHistoryCampaigns(campaigns).filter(c => c.appliedAt || ['応募済み', '当選', '落選'].includes(c.status));
    const currentMonth = K.localDateString(baseDate).slice(0, 7);
    const lastMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    const lastMonth = K.localDateString(lastMonthDate).slice(0, 7);
    const wins = campaigns.filter(c => c.resultStatus === '当選' || c.status === '当選');
    const totalApplied = applied.length;

    return {
      currentMonthApplications: applied.filter(c => c.appliedAt?.slice(0, 7) === currentMonth).length,
      lastMonthApplications: applied.filter(c => c.appliedAt?.slice(0, 7) === lastMonth).length,
      totalApplications: totalApplied,
      wins: wins.length,
      losses: campaigns.filter(c => c.resultStatus === '落選' || c.status === '落選').length,
      waiting: campaigns.filter(c => c.resultStatus === '連絡待ち').length,
      shippingWaiting: campaigns.filter(c => c.resultStatus === '発送待ち').length,
      received: campaigns.filter(c => c.resultStatus === '受取済み').length,
      winRate: totalApplied ? wins.length / totalApplied : 0,
      monthlyApplications: K.Stats.countMonthlyApplications(applied),
      monthlyWins: K.Stats.countMonthlyWins(wins),
      winsBySns: K.Stats.countWinsBySns(wins),
      winsByTag: K.Stats.countWinsByTag(wins)
    };
  };

  K.Stats.countMonthlyApplications = function (campaigns) {
    return K.Stats.countBy(campaigns.filter(c => c.appliedAt), c => c.appliedAt.slice(0, 7));
  };

  K.Stats.countMonthlyWins = function (campaigns) {
    return K.Stats.countBy(campaigns, c => (c.resultNotifiedAt || c.appliedAt || c.createdAt || '').slice(0, 7) || '未設定');
  };

  K.Stats.countWinsBySns = function (campaigns) {
    return K.Stats.countBy(campaigns, c => c.snsType || 'その他');
  };

  K.Stats.countWinsByTag = function (campaigns) {
    return campaigns.reduce((acc, campaign) => {
      (campaign.tags?.length ? campaign.tags : ['タグなし']).forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});
  };

  K.Stats.countBy = function (items, getKey) {
    return items.reduce((acc, item) => {
      const key = getKey(item) || '未設定';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  };
})();
