(function () {
  'use strict';

  const K = window.Kensho;

  K.Risk = {};
  K.Risk.DANGER_PATTERNS = [
    { reason: 'クレジットカード情報を求めている', pattern: /クレジットカード|カード番号|セキュリティコード|決済情報/, severity: 'danger' },
    { reason: '銀行口座情報を求めている', pattern: /銀行口座|口座番号|振込先|キャッシュカード/, severity: 'danger' },
    { reason: '先払いを求めている', pattern: /先払い|前払い|事前入金|入金確認/, severity: 'danger' },
    { reason: '手数料を求めている', pattern: /手数料|登録料|参加費/, severity: 'danger' },
    { reason: '送料負担を求めている', pattern: /送料負担|送料(?!\s*(?:は|が|も)?無料|無料)|配送料(?!\s*(?:は|が|も)?無料|無料)/, severity: 'danger' },
    { reason: 'LINE登録への誘導あり', pattern: /LINE登録|LINE追加|line\.me|lin\.ee/i, severity: 'review' },
    { reason: '外部サイトへの誘導あり', pattern: /外部サイト|外部URL|別サイト|専用フォーム|応募フォーム|無料登録/, severity: 'review' },
    { reason: '短縮URLあり', pattern: /短縮URL|bit\.ly|tinyurl|t\.co|x\.gd|is\.gd/i, severity: 'review' },
    { reason: '強い煽り表現あり', pattern: /急いで|本日限定|今すぐ|必ず当たる|全員当選|絶対|限定公開/, severity: 'danger' },
    { reason: '個人情報入力が必要', pattern: /個人情報|住所|電話番号|氏名|配送先|本人確認|身分証/, severity: 'review' }
  ];

  K.Risk.evaluateRisk = function (campaign) {
    const reasons = [];
    let points = 0;
    let clearDanger = false;
    let needsReview = false;
    const body = `${campaign.body || ''} ${campaign.notes || ''} ${campaign.cautions || ''} ${campaign.contactMethod || ''} ${campaign.url || ''}`;
    const conditionCount = campaign.conditions.length;

    if (!campaign.organizer || campaign.organizer.length < 2) {
      points += 18; needsReview = true; reasons.push('主催者が不明瞭');
    }
    if (!campaign.deadline) {
      points += 14; needsReview = true; reasons.push('締切が不明');
    }
    if (campaign.url && !K.isSafeUrl(campaign.url)) {
      points += 30; clearDanger = true; reasons.push('URLがhttp/https以外、または形式が不自然');
    }

    K.Risk.DANGER_PATTERNS.forEach(({ reason, pattern, severity }) => {
      if (!pattern.test(body)) return;
      reasons.push(reason);
      if (severity === 'danger') {
        clearDanger = true;
        points += 35;
      } else {
        needsReview = true;
        points += 18;
      }
    });

    if (campaign.conditions.includes('個人情報入力')) {
      points += 20; needsReview = true; reasons.push('応募条件に個人情報入力あり');
    }
    if (/DM/i.test(campaign.contactMethod || body) && !/(メール|発送|公式サイト)/.test(campaign.contactMethod || '')) {
      points += 8; reasons.push('当選連絡がDM中心');
    }
    if (conditionCount >= 6) {
      points += 12; reasons.push('応募条件が多い');
    }
    if (/(100万円|10万円|高級車|海外旅行|iPhone|MacBook|現金)/.test(body)) {
      reasons.push('高額すぎる賞品の可能性');
      if (/(公式|認証|キャンペーン規約)/.test(body)) {
        points += 10;
        needsReview = true;
      } else {
        points += 20;
        clearDanger = true;
      }
    }
    if (/(こんにちわ|当選した方だけ連絡しますです|応募するだけで現金)/.test(body)) {
      points += 10; reasons.push('日本語が不自然な可能性');
    }
    if (!/(公式|認証|キャンペーン規約|利用規約|主催|株式会社|合同会社)/.test(body + campaign.organizer)) {
      points += 10; needsReview = true; reasons.push('公式風だが確証がないため確認が必要');
    }
    if (K.REVIEW_PATTERN.test(body)) needsReview = true;

    if (!reasons.length) reasons.push('大きな懸念は検出されませんでした');
    const level = clearDanger || points >= 55 ? '応募非推奨' : needsReview || points >= 18 ? '要確認' : '低リスク';
    return { level, reasons: [...new Set(reasons)] };
  };
})();
