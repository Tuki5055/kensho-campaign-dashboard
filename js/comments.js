(function () {
  'use strict';

  const K = window.Kensho;

  K.Comments = {};

  K.Comments.generateComments = function (campaign) {
    if (!campaign.conditions.includes('コメント')) return [];
    const prize = (campaign.prize || '賞品').replace(/\s+/g, ' ').slice(0, 32);
    const organizer = (campaign.organizer || '').replace(/公式|株式会社|合同会社/g, '').trim().slice(0, 20);
    const text = `${prize} ${campaign.body || ''}`;
    const isFood = /(食品|お菓子|コーヒー|お茶|スイーツ|詰め合わせ|セット|ベーカリー|カフェ|味)/.test(text);
    const isFamily = /(家族|暮らし|日用品|キッチン|生活|文具|収納)/.test(text);
    const isExperience = /(チケット|旅行|体験|イベント|招待|参加)/.test(text);
    const isDigital = /(Amazon|QUO|PayPay|ポイント|ギフト券|商品券)/i.test(text);
    const prefix = organizer ? `${organizer}さんの` : '';

    if (isFood) return [
      `${prefix}${prize}、どんな味か気になって応募します。`,
      `週末のおやつ時間に${prize}を楽しめたら嬉しいです。`,
      `新作の内容に惹かれました。${prize}を試してみたいです。`
    ];
    if (isFamily) return [
      `${prefix}${prize}、使い心地が気になって応募します。`,
      `家族との普段使いに${prize}が活躍しそうです。`,
      `暮らしに取り入れやすそうな内容で、試してみたいです。`
    ];
    if (isExperience) return [
      `${prefix}${prize}、体験してみたくて応募します。`,
      `予定を合わせて${prize}を楽しめたら嬉しいです。`,
      `キャンペーン内容に惹かれました。参加のきっかけにしたいです。`
    ];
    if (isDigital) return [
      `${prefix}${prize}は使い道を考えるのも楽しそうで応募します。`,
      `日々の買い物に${prize}を活用できたら嬉しいです。`,
      `参加しやすいキャンペーンだったので応募します。`
    ];
    return [
      `${prefix}${prize}が気になって応募します。`,
      `実際に${prize}を使う場面を想像して楽しみになりました。`,
      `キャンペーン内容を見て興味を持ちました。参加します。`
    ];
  };

  K.Comments.copyText = async function (text) {
    if (!text) {
      K.toast('コピーできるコメント案がありません');
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      K.toast('コメント案をコピーしました');
    } catch (error) {
      prompt('コピーできなかったため、手動で選択してください。', text);
    }
  };

  K.Comments.copyFirstComment = function (id) {
    const campaign = K.state.campaigns.find(item => item.id === id);
    return K.Comments.copyText(campaign?.comments?.[0] || '');
  };
})();
