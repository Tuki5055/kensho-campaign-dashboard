(function () {
  'use strict';

  const K = window.Kensho;

  K.Discovery = {};

  K.Discovery.GENRES = ['Amazonギフト券', 'QUOカード', 'PayPay', '食品', '日用品', '美容', '家電', '旅行', '子ども向け', 'コンビニ', 'カフェ', '生活用品', '高額賞品', '手軽応募'];
  K.Discovery.TARGETS = ['X', 'Instagram', 'Google検索', '公式サイト', 'キャンペーンまとめサイト'];
  K.Discovery.CONDITIONS = ['フォロー', 'リポスト', 'いいね', 'コメント', 'ハッシュタグ', 'フォーム応募', '会員登録なし', '個人情報少なめ'];
  K.Discovery.EXCLUDES = ['個人情報入力あり', 'LINE登録あり', 'クレジットカード入力あり', '送料負担あり', '手数料あり', '外部サイト誘導が強い', '高リスク', '締切不明'];
  K.Discovery.PRESETS = {
    easy: {
      label: '手軽応募',
      genres: ['Amazonギフト券', 'QUOカード', 'PayPay'],
      targets: ['X', 'Google検索'],
      conditions: ['フォロー', 'リポスト', '会員登録なし', '個人情報少なめ'],
      excludes: []
    },
    daily: {
      label: '食品・日用品',
      genres: ['食品', '日用品'],
      targets: ['公式サイト', 'X'],
      conditions: ['フォロー', 'リポスト'],
      excludes: []
    },
    safe: {
      label: '高リスク除外',
      genres: [],
      targets: ['Google検索', '公式サイト'],
      conditions: ['会員登録なし', '個人情報少なめ'],
      excludes: ['個人情報入力あり', 'LINE登録あり', 'クレジットカード入力あり', '送料負担あり', '手数料あり', '締切不明']
    },
    comment: {
      label: 'コメント応募向け',
      genres: [],
      targets: ['X', 'Instagram'],
      conditions: ['コメント', 'ハッシュタグ'],
      excludes: []
    }
  };

  K.Discovery.normalizeSelection = function (values, allowed) {
    const raw = Array.isArray(values) ? values : typeof values === 'string' ? values.split(/[,\n、]/) : [];
    return [...new Set(raw.map(value => K.safeText(value, 60)).filter(value => allowed.includes(value)))];
  };

  K.Discovery.defaultCriteria = function () {
    return {
      genres: ['Amazonギフト券', 'QUOカード', 'PayPay'],
      targets: ['X', 'Google検索'],
      conditions: ['フォロー', 'リポスト'],
      excludes: []
    };
  };

  K.Discovery.normalizeCriteria = function (criteria = {}) {
    return {
      genres: K.Discovery.normalizeSelection(criteria.genres, K.Discovery.GENRES),
      targets: K.Discovery.normalizeSelection(criteria.targets, K.Discovery.TARGETS),
      conditions: K.Discovery.normalizeSelection(criteria.conditions, K.Discovery.CONDITIONS),
      excludes: K.Discovery.normalizeSelection(criteria.excludes, K.Discovery.EXCLUDES)
    };
  };

  K.Discovery.buildDiscoveryKeywords = function (criteria = {}) {
    const normalized = K.Discovery.normalizeCriteria(criteria);
    const genres = normalized.genres.length ? normalized.genres : ['プレゼント'];
    const easyTerms = normalized.conditions.filter(item => ['フォロー', 'リポスト', 'いいね', 'コメント', 'ハッシュタグ'].includes(item));
    const excludeMap = {
      '個人情報入力あり': '-個人情報 -住所 -電話番号',
      'LINE登録あり': '-LINE登録 -LINE追加',
      'クレジットカード入力あり': '-クレジットカード',
      '送料負担あり': '-送料負担',
      '手数料あり': '-手数料',
      '外部サイト誘導が強い': '-外部サイト -無料登録',
      '高リスク': '-必ず当たる -全員当選',
      '締切不明': '締切 まで'
    };
    const excludeTerms = normalized.excludes.map(item => excludeMap[item]).filter(Boolean).join(' ');
    const keywords = [];
    genres.slice(0, 6).forEach(genre => {
      keywords.push(`${genre} プレゼントキャンペーン ${easyTerms.join(' ')}`.trim());
      keywords.push(`${genre} 抽選 キャンペーン 応募`);
      keywords.push(`${genre} プレゼント 締切 まで`);
      if (normalized.targets.includes('公式サイト')) keywords.push(`${genre} プレゼントキャンペーン 公式`);
    });
    if (normalized.targets.includes('X')) keywords.push(`site:x.com プレゼントキャンペーン ${easyTerms.join(' ')}`.trim());
    if (normalized.targets.includes('Instagram')) keywords.push('site:instagram.com プレゼントキャンペーン ハッシュタグ');
    if (normalized.targets.includes('キャンペーンまとめサイト')) keywords.push('プレゼントキャンペーン まとめ 締切');
    keywords.push('抽選で 名様 プレゼント 締切');
    if (excludeTerms) keywords.push(`${genres[0]} プレゼントキャンペーン ${excludeTerms}`.trim());
    return [...new Set(keywords.map(item => item.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 12);
  };

  K.Discovery.buildXSearchUrl = function (keyword) {
    return `https://x.com/search?q=${encodeURIComponent(K.safeText(keyword, 300))}&src=typed_query&f=live`;
  };

  K.Discovery.buildGoogleSearchUrl = function (keyword) {
    return `https://www.google.com/search?q=${encodeURIComponent(K.safeText(keyword, 300))}`;
  };

  K.Discovery.buildInstagramSearchKeyword = function (keyword) {
    return K.safeText(keyword.replace(/^site:instagram\.com\s*/i, ''), 300);
  };

  K.Discovery.createCampaignCandidate = function (input = {}) {
    const body = K.safeText(input.body || input.text || '', 8000);
    const parsed = K.Parser.parseCampaignText(body);
    const rawUrl = K.safeText(input.url || '', 1000);
    const candidate = K.Storage.normalizeCampaign({
      ...K.Storage.defaultCampaign(),
      ...parsed,
      title: K.safeText(input.title || parsed.title || parsed.prize || '探索候補キャンペーン', 120),
      organizer: K.safeText(input.organizer || '', 120),
      snsType: K.SNS_OPTIONS.includes(input.snsType) ? input.snsType : 'X',
      url: K.normalizeUrl(rawUrl),
      body,
      notes: K.safeText(input.notes || '', 3000),
      status: '未確認'
    });
    candidate.tags = K.Tags.normalizeTags([...(candidate.tags || []), ...K.Tags.suggestTags(candidate)]);
    return candidate;
  };

  K.Discovery.detectDuplicateCampaign = function (candidate, campaigns = []) {
    const normalized = K.Storage.normalizeCampaign(candidate);
    const bodyTokens = K.Discovery.tokenize(normalized.body);
    const matches = [];
    campaigns.forEach(campaign => {
      const item = K.Storage.normalizeCampaign(campaign);
      if (normalized.url && item.url && normalized.url === item.url) {
        matches.push({ type: 'url', level: 'high', campaign: item, reason: '投稿URLが完全一致しています' });
        return;
      }
      if (normalized.organizer && normalized.prize && normalized.deadline &&
          item.organizer === normalized.organizer && item.prize === normalized.prize && item.deadline === normalized.deadline) {
        matches.push({ type: 'near', level: 'mid', campaign: item, reason: '主催者名・賞品・締切が一致しています' });
        return;
      }
      const itemTokens = K.Discovery.tokenize(item.body);
      if (bodyTokens.length >= 8 && K.Discovery.similarity(bodyTokens, itemTokens) >= 0.72) {
        matches.push({ type: 'body', level: 'mid', campaign: item, reason: 'キャンペーン本文がかなり似ています' });
      }
    });
    return matches.slice(0, 5);
  };

  K.Discovery.tokenize = function (text) {
    return K.safeText(text, 3000).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(token => token.length >= 2);
  };

  K.Discovery.similarity = function (aTokens, bTokens) {
    const aSet = new Set(aTokens);
    const bSet = new Set(bTokens);
    if (!aSet.size || !bSet.size) return 0;
    const overlap = [...aSet].filter(token => bSet.has(token)).length;
    return overlap / Math.max(aSet.size, bSet.size);
  };

  K.Discovery.normalizeHistoryItem = function (item = {}) {
    return {
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : K.createId(),
      createdAt: K.isValidIsoDate(item.createdAt) ? item.createdAt : new Date().toISOString(),
      keyword: K.safeText(item.keyword, 300),
      targets: K.Discovery.normalizeSelection(item.targets, K.Discovery.TARGETS),
      openedLinks: Array.isArray(item.openedLinks) ? item.openedLinks.map(K.normalizeUrl).filter(Boolean).slice(0, 10) : [],
      registeredCount: Number.isFinite(Number(item.registeredCount)) ? Math.max(0, Number(item.registeredCount)) : 0,
      notes: K.safeText(item.notes, 1000)
    };
  };

  K.Discovery.loadDiscoveryHistory = function () {
    try {
      const raw = localStorage.getItem(K.DISCOVERY_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Discovery history is not an array');
      return parsed.map(K.Discovery.normalizeHistoryItem).slice(0, 100);
    } catch (error) {
      console.warn('探索履歴が破損していたため復旧しました。');
      localStorage.removeItem(K.DISCOVERY_HISTORY_KEY);
      return [];
    }
  };

  K.Discovery.saveDiscoveryHistory = function (history) {
    localStorage.setItem(K.DISCOVERY_HISTORY_KEY, JSON.stringify((history || []).map(K.Discovery.normalizeHistoryItem).slice(0, 100)));
  };

  K.Discovery.addDiscoveryHistory = function (entry) {
    const history = [K.Discovery.normalizeHistoryItem(entry), ...K.Discovery.loadDiscoveryHistory()].slice(0, 100);
    K.Discovery.saveDiscoveryHistory(history);
    return history;
  };

  K.Discovery.validateHistoryImport = function (data) {
    return Array.isArray(data) && data.length <= 1000 && data.every(item => item && typeof item === 'object' && !Array.isArray(item));
  };

  K.Discovery.exportDiscoveryHistoryJson = function () {
    K.Export.download(`kensho-discovery-history-${K.todayString()}.json`, JSON.stringify(K.Discovery.loadDiscoveryHistory(), null, 2), 'application/json');
  };

  K.Discovery.importDiscoveryHistoryJson = function (event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('探索履歴をインポート内容で置き換えます。続行しますか？')) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!K.Discovery.validateHistoryImport(data)) throw new Error('invalid discovery history');
        K.Discovery.saveDiscoveryHistory(data);
        K.UI.render();
        K.toast('探索履歴JSONをインポートしました');
      } catch (error) {
        alert('探索履歴JSONの形式が正しくありません。');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  K.Discovery.exportDiscoveryHistoryCsv = function () {
    const headers = ['探索日時', '使用キーワード', '検索対象', '開いた検索リンク', '登録件数', 'メモ'];
    const rows = K.Discovery.loadDiscoveryHistory().map(item => [
      item.createdAt,
      item.keyword,
      item.targets.join(' / '),
      item.openedLinks.join(' / '),
      item.registeredCount,
      item.notes
    ]);
    const csv = '\ufeff' + [headers, ...rows].map(row => row.map(K.Export.csvCell).join(',')).join('\r\n');
    K.Export.download(`kensho-discovery-history-${K.todayString()}.csv`, csv, 'text/csv;charset=utf-8');
  };
})();
