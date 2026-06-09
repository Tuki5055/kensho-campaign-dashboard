(function () {
  'use strict';

  const K = window.Kensho;

  K.SampleData = {};

  K.SampleData.create = function () {
    const date = offset => {
      const today = new Date();
      return K.localDateString(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
    };
    return [
      {
        ...K.Storage.defaultCampaign(),
        title: 'みどり堂 公式春のギフトキャンペーン',
        organizer: '株式会社みどり堂 公式',
        snsType: 'X',
        url: 'https://example.com/midori-campaign',
        body: '公式キャンペーン規約あり。フォロー＆リポストでAmazonギフト券を抽選で100名様にプレゼント。締切までに応募。当選者にはDMで連絡します。',
        prize: 'Amazonギフト券1,000円分',
        winners: '100',
        deadline: date(7),
        conditions: ['フォロー', 'リポスト'],
        tags: ['Amazonギフト券', '手軽', '公式っぽい'],
        contactMethod: '当選者にはDMで連絡',
        status: '応募候補',
        notes: '低リスクの企業公式キャンペーン'
      },
      {
        ...K.Storage.defaultCampaign(),
        title: 'そよ風カフェ 新作スイーツ感想キャンペーン',
        organizer: 'そよ風カフェ公式',
        snsType: 'Instagram',
        url: 'https://example.com/soyokaze-sweets',
        body: '新作スイーツセットを抽選で20名様にプレゼント。アカウントをフォローし、投稿にいいね、食べてみたい理由をコメントしてください。6月30日まで。当選者にはDMで連絡します。',
        prize: '新作スイーツセット',
        winners: '20',
        deadline: date(10),
        conditions: ['フォロー', 'いいね', 'コメント'],
        tags: ['食品', 'コメント必要', '公式っぽい'],
        contactMethod: '当選者にはDMで連絡',
        status: '未確認',
        notes: 'コメント必須のキャンペーン'
      },
      {
        ...K.Storage.defaultCampaign(),
        title: '青空マーケット 会員限定プレゼント',
        organizer: '青空マーケット運営事務局',
        snsType: '公式サイト',
        url: 'https://example.com/aozora-entry',
        body: 'アンケート回答と会員登録でQUOカードを30名様にプレゼント。配送先住所と電話番号の入力が必要です。応募締切 2026/07/15。当選者にはメールで連絡します。キャンペーン規約をご確認ください。',
        prize: 'QUOカード2,000円分',
        winners: '30',
        deadline: date(20),
        conditions: ['会員登録', 'アンケート回答', '個人情報入力'],
        tags: ['QUOカード', '個人情報あり', '公式っぽい'],
        contactMethod: 'メールで連絡',
        status: '未確認',
        notes: '個人情報入力が必要な要確認キャンペーン'
      },
      {
        ...K.Storage.defaultCampaign(),
        title: '超高額ギフト即日当選キャンペーン',
        organizer: 'プレゼント情報局',
        snsType: 'その他',
        url: 'https://bit.ly/gift-claim-now',
        body: '今すぐ登録で現金10万円が必ず当たる！短縮URLから外部サイトでカード番号を入力、送料手数料の先払いが必要です。DMのみで連絡。',
        prize: '現金10万円',
        winners: '不明',
        deadline: '',
        conditions: ['フォロー', 'リポスト', 'いいね', 'コメント', '会員登録', '個人情報入力'],
        tags: ['高額', '要注意', '個人情報あり'],
        contactMethod: 'DMのみ',
        status: '見送り',
        notes: '外部URL誘導が強い応募非推奨キャンペーン'
      },
      {
        ...K.Storage.defaultCampaign(),
        title: 'しろいろ文具 週末プレゼント',
        organizer: 'しろいろ文具 公式',
        snsType: 'X',
        url: 'https://example.com/shiroiro-weekend',
        body: 'フォロー＆リポストで文具セットを抽選で50名様にプレゼント。締切は6月12日まで。当選者にはDMで連絡。公式キャンペーンです。',
        prize: '文具セット',
        winners: '50',
        deadline: date(2),
        conditions: ['フォロー', 'リポスト'],
        tags: ['日用品', '手軽', '公式っぽい'],
        contactMethod: '当選者にはDMで連絡',
        status: '応募済み',
        appliedAt: date(-2),
        resultStatus: '連絡待ち',
        followUpDate: date(0),
        applicationMethodMemo: 'フォローとリポストを手動で実施',
        applicationMemo: '今日DMを確認する',
        notes: '締切が近いキャンペーン'
      }
    ];
  };

  K.SampleData.install = function () {
    K.state.campaigns = K.SampleData.create().map(K.Storage.normalizeCampaign);
    K.state.selectedId = K.state.campaigns[0]?.id || null;
    K.Storage.saveCampaigns(K.state.campaigns);
    K.UI.render();
    K.toast('サンプルデータを投入しました');
  };
})();
