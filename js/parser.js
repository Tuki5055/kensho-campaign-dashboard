(function () {
  'use strict';

  const K = window.Kensho;

  K.Parser = {};

  K.Parser.parseCampaignText = function (text) {
    const t = text || '';
    const lines = t.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const firstTitle = lines.find(line => /(キャンペーン|プレゼント|懸賞|応募|抽選)/.test(line)) || lines[0] || '';
    const conditions = [];
    if (/(フォロー|follow)/i.test(t)) conditions.push('フォロー');
    if (/(リポスト|RT|リツイート|retweet)/i.test(t)) conditions.push('リポスト');
    if (/(いいね|like)/i.test(t)) conditions.push('いいね');
    if (/(コメント|感想|返信)/.test(t)) conditions.push('コメント');
    if (/(#|ハッシュタグ)/.test(t)) conditions.push('ハッシュタグ');
    if (/(引用|引用投稿)/.test(t)) conditions.push('引用投稿');
    if (/(会員登録|登録が必要|ログイン)/.test(t)) conditions.push('会員登録');
    if (/(アンケート|回答)/.test(t)) conditions.push('アンケート回答');
    if (/(住所|氏名|電話番号|個人情報|配送先)/.test(t)) conditions.push('個人情報入力');

    const winnersMatch = t.match(/(\d{1,5})\s*(名様|名|人)/);
    const prizeMatch = t.match(/((?:Amazonギフト券|QUOカード|PayPay|ギフト券|商品券|クーポン|セット|詰め合わせ|チケット|ポイント|円分)[^\n、。]*)/i);
    const contact = /(DM|ダイレクトメッセージ)/i.test(t) ? '当選者にはDMで連絡' : /(メール|E-mail)/i.test(t) ? 'メールで連絡' : /(発送|賞品の発送)/.test(t) ? '賞品発送をもって連絡' : '';

    return {
      title: firstTitle.slice(0, 80),
      prize: prizeMatch ? prizeMatch[1].trim() : '',
      winners: winnersMatch ? winnersMatch[1] : '',
      deadline: K.Parser.extractDeadline(t),
      conditions: [...new Set(conditions)],
      contactMethod: contact,
      cautions: K.Parser.detectCautions(t)
    };
  };

  K.Parser.extractDeadline = function (text) {
    const currentYear = new Date().getFullYear();
    const ymd = text.match(/(20\d{2})[\/年.-]\s*(\d{1,2})[\/月.-]\s*(\d{1,2})日?/);
    if (ymd) return K.toDateInput(ymd[1], ymd[2], ymd[3]);
    const md = text.match(/(\d{1,2})[\/月]\s*(\d{1,2})日?\s*(?:まで|締切|〆切)?/);
    if (md) return K.toDateInput(currentYear, md[1], md[2]);
    return '';
  };

  K.Parser.detectCautions = function (text) {
    const cautions = [];
    K.Risk.DANGER_PATTERNS.forEach(([reason, pattern]) => {
      if (pattern.test(text)) cautions.push(reason);
    });
    if (/(100万円|現金10万円|高級車|海外旅行|iPhone|MacBook)/.test(text)) cautions.push('高額すぎる賞品の可能性');
    return cautions.join(' / ');
  };
})();
