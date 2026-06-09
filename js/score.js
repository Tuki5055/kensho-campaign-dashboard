(function () {
  'use strict';

  const K = window.Kensho;

  K.Score = {};

  K.Score.calculateScore = function (campaign, risk = K.Risk.evaluateRisk(campaign)) {
    if (K.isExpired(campaign)) return 0;

    let score = 40;
    if (risk.level === '低リスク') score += 25;
    if (risk.level === '要確認') score += 10;
    if (risk.level === '応募非推奨') score -= 30;

    const onlyEasy = campaign.conditions.length > 0 && campaign.conditions.every(v => ['フォロー', 'リポスト', 'いいね'].includes(v));
    if (onlyEasy && campaign.conditions.includes('フォロー') && campaign.conditions.includes('リポスト')) score += 20;
    if (campaign.conditions.includes('コメント')) score -= 5;
    if (campaign.conditions.includes('会員登録')) score -= 10;
    if (campaign.conditions.includes('個人情報入力')) score -= 20;
    if (K.REVIEW_PATTERN.test(`${campaign.body} ${campaign.url} ${campaign.cautions}`)) score -= 12;
    if (/(送料|手数料|先払い|前払い|登録料|銀行口座|クレジットカード)/.test(`${campaign.body} ${campaign.cautions}`)) score -= 35;
    if (campaign.conditions.length <= 3) score += 8;
    if (campaign.conditions.length >= 6) score -= 10;

    const days = K.daysUntil(campaign.deadline);
    if (days !== null && days >= 0 && days <= 3) score += 10;
    if (days !== null && days > 14) score -= 3;

    const winners = parseInt(String(campaign.winners).replace(/[^\d]/g, ''), 10);
    if (winners >= 100) score += 10;
    else if (winners >= 20) score += 6;
    else if (winners >= 5) score += 3;

    if (/(Amazonギフト券|QUOカード|PayPay|商品券|ギフト券|ポイント)/i.test(campaign.prize || campaign.body || '')) score += 10;
    if (/(公式|株式会社|合同会社|キャンペーン規約)/.test(`${campaign.organizer} ${campaign.body}`)) score += 8;

    const cap = risk.level === '応募非推奨' ? 30 : risk.level === '要確認' ? 70 : 100;
    return Math.max(0, Math.min(cap, Math.round(score)));
  };
})();
