(function () {
  'use strict';

  const K = window.Kensho;

  K.Tags = {};

  K.Tags.normalizeTags = function (value) {
    const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\n、]/) : [];
    return [...new Set(raw.map(tag => K.safeText(tag, 40)).filter(Boolean))].slice(0, 20);
  };

  K.Tags.tagsToInput = function (tags) {
    return K.Tags.normalizeTags(tags).join(', ');
  };

  K.Tags.suggestTags = function (campaign) {
    const text = `${campaign.title || ''} ${campaign.organizer || ''} ${campaign.prize || ''} ${campaign.body || ''} ${campaign.notes || ''}`;
    const tags = [];
    const addIf = (tag, pattern) => { if (pattern.test(text)) tags.push(tag); };

    addIf('Amazonギフト券', /Amazonギフト券|アマゾンギフト/i);
    addIf('QUOカード', /QUOカード|クオカード/i);
    addIf('PayPay', /PayPay|ペイペイ/i);
    addIf('美容', /化粧品|コスメ|美容|スキンケア|メイク|ヘアケア/);
    addIf('食品', /食品|グルメ|肉|米|スイーツ|お菓子|コーヒー|お茶|カフェ|ベーカリー|詰め合わせ/);
    addIf('日用品', /日用品|生活用品|洗剤|タオル|キッチン|収納/);
    addIf('家電', /家電|イヤホン|掃除機|空気清浄機|炊飯器|ドライヤー|ガジェット/);
    addIf('旅行', /旅行|宿泊|ホテル|旅館|航空券|チケット/);
    addIf('子ども向け', /子ども|こども|キッズ|親子|育児|おもちゃ/);
    addIf('高額', /100万円|10万円|高額|高級|iPhone|MacBook|現金/);
    if (campaign.conditions?.includes('コメント') || /コメント/.test(text)) tags.push('コメント必要');
    if (campaign.conditions?.includes('個人情報入力') || /個人情報|住所|電話番号|配送先/.test(text)) tags.push('個人情報あり');
    if (campaign.conditions?.length && campaign.conditions.every(v => ['フォロー', 'リポスト', 'いいね'].includes(v))) tags.push('手軽');
    if (campaign.risk?.level === '応募非推奨' || /クレジットカード|先払い|手数料|送料負担|必ず当たる|全員当選/.test(text)) tags.push('要注意');
    if (/公式|株式会社|合同会社|キャンペーン規約/.test(text)) tags.push('公式っぽい');

    return K.Tags.normalizeTags(tags);
  };

  K.Tags.getAllTags = function (campaigns) {
    return K.Tags.normalizeTags(campaigns.flatMap(campaign => campaign.tags || []));
  };

  K.Tags.addTag = function (campaign, tag) {
    campaign.tags = K.Tags.normalizeTags([...(campaign.tags || []), tag]);
    return campaign.tags;
  };

  K.Tags.removeTag = function (campaign, tag) {
    campaign.tags = K.Tags.normalizeTags(campaign.tags || []).filter(item => item !== tag);
    return campaign.tags;
  };
})();
