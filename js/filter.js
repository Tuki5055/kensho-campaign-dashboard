(function () {
  'use strict';

  const K = window.Kensho;

  K.Filter = {};

  K.Filter.defaultState = function () {
    return {
      keyword: '',
      statuses: new Set(),
      snsTypes: new Set(),
      risks: new Set(),
      conditions: new Set(),
      deadlines: new Set(),
      scores: new Set(),
      tags: new Set()
    };
  };

  K.Filter.applyFilters = function (campaigns, filterState = K.state.listFilters) {
    return campaigns.filter(campaign =>
      K.Filter.matchKeyword(campaign, filterState.keyword) &&
      K.Filter.matchSet(K.effectiveStatus(campaign), filterState.statuses) &&
      K.Filter.matchSet(campaign.snsType, filterState.snsTypes) &&
      K.Filter.matchSet(campaign.risk.level, filterState.risks) &&
      K.Filter.matchConditions(campaign, filterState.conditions) &&
      K.Filter.matchDeadline(campaign, filterState.deadlines) &&
      K.Filter.matchScore(campaign, filterState.scores) &&
      K.Filter.matchTags(campaign, filterState.tags)
    );
  };

  K.Filter.matchKeyword = function (campaign, keyword) {
    const q = K.safeText(keyword).toLowerCase();
    if (!q) return true;
    const haystack = [
      campaign.title,
      campaign.organizer,
      campaign.prize,
      campaign.url,
      campaign.body,
      campaign.notes,
      ...(campaign.tags || [])
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  };

  K.Filter.matchSet = function (value, selected) {
    return !selected?.size || selected.has(value);
  };

  K.Filter.matchConditions = function (campaign, selected) {
    if (!selected?.size) return true;
    return [...selected].some(condition => campaign.conditions.includes(condition));
  };

  K.Filter.matchDeadline = function (campaign, selected) {
    if (!selected?.size) return true;
    const days = K.daysUntil(campaign.deadline);
    return [...selected].some(filter => {
      if (filter === '今日締切') return days === 0;
      if (filter === '明日締切') return days === 1;
      if (filter === '3日以内') return days !== null && days >= 0 && days <= 3;
      if (filter === '7日以内') return days !== null && days >= 0 && days <= 7;
      if (filter === '締切切れ') return K.isExpired(campaign);
      if (filter === '締切不明') return !campaign.deadline;
      return false;
    });
  };

  K.Filter.matchScore = function (campaign, selected) {
    if (!selected?.size) return true;
    return [...selected].some(filter => {
      if (filter === '80点以上') return campaign.score >= 80;
      if (filter === '60点以上') return campaign.score >= 60;
      if (filter === '40点以上') return campaign.score >= 40;
      if (filter === '30点以下') return campaign.score <= 30;
      return false;
    });
  };

  K.Filter.matchTags = function (campaign, selected) {
    if (!selected?.size) return true;
    const tags = new Set(campaign.tags || []);
    return [...selected].some(tag => tags.has(tag));
  };

  K.Filter.sortCampaigns = function (items, mode) {
    const riskOrder = { '低リスク': 0, '要確認': 1, '応募非推奨': 2 };
    return [...items].sort((x, y) => {
      if (mode === 'scoreDesc') return y.score - x.score;
      if (mode === 'scoreAsc') return x.score - y.score;
      if (mode === 'deadline') return (K.daysUntil(x.deadline) ?? 9999) - (K.daysUntil(y.deadline) ?? 9999);
      if (mode === 'newest') return new Date(y.createdAt) - new Date(x.createdAt);
      if (mode === 'oldest') return new Date(x.createdAt) - new Date(y.createdAt);
      if (mode === 'riskLow') return riskOrder[x.risk.level] - riskOrder[y.risk.level] || y.score - x.score;
      if (mode === 'riskHigh') return riskOrder[y.risk.level] - riskOrder[x.risk.level] || x.score - y.score;
      if (mode === 'organizer') return String(x.organizer || '').localeCompare(String(y.organizer || ''), 'ja');
      if (mode === 'priority') {
        return riskOrder[x.risk.level] - riskOrder[y.risk.level] || (K.daysUntil(x.deadline) ?? 9999) - (K.daysUntil(y.deadline) ?? 9999) || y.score - x.score;
      }
      return (K.daysUntil(x.deadline) ?? 9999) - (K.daysUntil(y.deadline) ?? 9999);
    });
  };

  K.Filter.describeActiveFilters = function (filterState = K.state.listFilters) {
    const values = [];
    if (filterState.keyword) values.push(`検索: ${filterState.keyword}`);
    ['statuses', 'snsTypes', 'risks', 'conditions', 'deadlines', 'scores', 'tags'].forEach(key => {
      values.push(...(filterState[key] ? [...filterState[key]] : []));
    });
    return values;
  };
})();
