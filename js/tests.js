(function () {
  'use strict';

  const K = window.Kensho;
  const STORAGE_KEY = K.STORAGE_KEY;
  const DISCOVERY_HISTORY_KEY = K.DISCOVERY_HISTORY_KEY;
  const originalStorage = localStorage.getItem(STORAGE_KEY);
  const originalDiscoveryHistory = localStorage.getItem(DISCOVERY_HISTORY_KEY);
  const results = [];

  window.AppTestUtils = {
    runAllTests,
    makeCampaign,
    restoreStorage
  };

  function makeCampaign(overrides = {}) {
    return K.Storage.normalizeCampaign({
      title: '公式プレゼントキャンペーン',
      organizer: '株式会社テスト商店 公式',
      snsType: 'X',
      url: 'https://example.com/campaign',
      body: '公式キャンペーン規約あり。フォロー＆リポストでAmazonギフト券を抽選で100名様にプレゼント。締切までに応募。当選者にはDMで連絡します。',
      prize: 'Amazonギフト券1,000円分',
      winners: '100',
      deadline: '2026-06-30',
      conditions: ['フォロー', 'リポスト'],
      contactMethod: '当選者にはDMで連絡',
      status: '応募候補',
      ...overrides
    });
  }

  function test(name, fn) {
    try {
      fn();
      results.push({ name, passed: true, detail: 'OK' });
    } catch (error) {
      results.push({
        name,
        passed: false,
        detail: error.message,
        expected: error.expected,
        actual: error.actual
      });
    }
  }

  function assertEqual(actual, expected, message) {
    if (!Object.is(actual, expected)) fail(message, expected, actual);
  }

  function assertTrue(value, message) {
    if (value !== true) fail(message, true, value);
  }

  function assertFalse(value, message) {
    if (value !== false) fail(message, false, value);
  }

  function assertIncludes(value, expectedSubstring, message) {
    const text = Array.isArray(value) ? value.join(' / ') : String(value ?? '');
    if (!text.includes(expectedSubstring)) fail(message, `includes ${expectedSubstring}`, text);
  }

  function assertLessOrEqual(actual, max, message) {
    if (!(actual <= max)) fail(message, `<= ${max}`, actual);
  }

  function assertGreaterOrEqual(actual, min, message) {
    if (!(actual >= min)) fail(message, `>= ${min}`, actual);
  }

  function assertNotEqual(actual, expected, message) {
    if (Object.is(actual, expected)) fail(message, `not ${expected}`, actual);
  }

  function fail(message, expected, actual) {
    const error = new Error(message);
    error.expected = expected;
    error.actual = actual;
    throw error;
  }

  function runAllTests() {
    results.length = 0;
    const before = localStorage.getItem(STORAGE_KEY);
    const beforeDiscovery = localStorage.getItem(DISCOVERY_HISTORY_KEY);
    try {
      runUrlTests();
      runDateTests();
      runRiskTests();
      runScoreTests();
      runParserTests();
      runCommentTests();
      runStorageTests();
      runTagAndFilterTests();
      runTagExportTests();
      runApplicationHistoryTests();
      runReminderTests();
      runPwaTests();
      runDiscoveryTests();
      runBrokenLocalStorageTests();
    } finally {
      restoreStorage(before);
      restoreDiscoveryHistory(beforeDiscovery);
    }
    renderResults();
    console.table(results.map(r => ({ name: r.name, passed: r.passed, detail: r.detail })));
    console.log('Kensho test results', results);
    return results;
  }

  function restoreStorage(value = originalStorage) {
    if (value === null || value === undefined) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  }

  function restoreDiscoveryHistory(value = originalDiscoveryHistory) {
    if (value === null || value === undefined) localStorage.removeItem(DISCOVERY_HISTORY_KEY);
    else localStorage.setItem(DISCOVERY_HISTORY_KEY, value);
  }

  function runUrlTests() {
    test('URL: https URL is accepted', () => assertTrue(K.isSafeUrl('https://example.com/campaign'), 'https URL should be safe'));
    test('URL: http URL is accepted', () => assertTrue(K.isSafeUrl('http://example.com/campaign'), 'http URL should be safe'));
    test('URL: javascript URL is rejected', () => assertFalse(K.isSafeUrl('javascript:alert(1)'), 'javascript URL should be rejected'));
    test('URL: ftp URL is rejected', () => assertFalse(K.isSafeUrl('ftp://example.com'), 'ftp URL should be rejected'));
    test('URL: data URL is rejected', () => assertFalse(K.isSafeUrl('data:text/html,abc'), 'data URL should be rejected'));
    test('URL: empty string is rejected', () => assertFalse(K.isSafeUrl(''), 'empty URL should be rejected'));
    test('URL: invalid text is rejected', () => assertFalse(K.isSafeUrl('not a url'), 'invalid text should be rejected'));
  }

  function runDateTests() {
    const base = new Date(2026, 5, 9);
    test('Date: valid date input', () => assertTrue(K.isValidDateInput('2026-06-09'), 'valid date should pass'));
    test('Date: today is 0 days', () => assertEqual(K.daysUntil('2026-06-09', base), 0, 'today should be zero'));
    test('Date: tomorrow is 1 day', () => assertEqual(K.daysUntil('2026-06-10', base), 1, 'tomorrow should be one'));
    test('Date: past date is negative', () => assertEqual(K.daysUntil('2026-06-08', base), -1, 'past date should be negative'));
    test('Date: invalid date is rejected', () => assertFalse(K.isValidDateInput('2026-02-31'), 'invalid date should fail'));
    test('Date: empty date returns null', () => assertEqual(K.daysUntil('', base), null, 'empty date should return null'));
    test('Date: expired campaign is detected', () => assertTrue(K.isExpired({ deadline: '2020-01-01' }), 'past campaign should be expired'));
  }

  function runRiskTests() {
    test('Risk: low risk official campaign', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign());
      assertEqual(risk.level, '低リスク', 'official easy campaign should be low risk');
    });
    test('Risk: personal info requires review', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ body: '配送先住所と電話番号、個人情報の入力が必要です。公式キャンペーン規約あり。', conditions: ['個人情報入力'] }));
      assertEqual(risk.level, '要確認', 'personal info should be review');
      assertIncludes(risk.reasons, '個人情報', 'reason should mention personal info');
    });
    test('Risk: external site requires review', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ body: '公式キャンペーンです。外部サイトの専用フォームから応募してください。' }));
      assertEqual(risk.level, '要確認', 'external site should be review');
      assertIncludes(risk.reasons, '外部サイト', 'reason should mention external site');
    });
    test('Risk: credit card is not recommended', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ body: '賞品発送のためクレジットカード番号を入力してください。' }));
      assertEqual(risk.level, '応募非推奨', 'credit card should be not recommended');
      assertIncludes(risk.reasons, 'クレジットカード', 'reason should mention credit card');
    });
    test('Risk: prepayment and fee are not recommended', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ body: '先払いの手数料と送料負担が必要です。' }));
      assertEqual(risk.level, '応募非推奨', 'prepayment and fee should be not recommended');
      assertIncludes(risk.reasons, '先払い', 'reason should mention prepayment');
      assertIncludes(risk.reasons, '手数料', 'reason should mention fee');
    });
    test('Risk: guaranteed high value prize is not recommended', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ organizer: '情報局', body: '必ず当たる、全員当選。現金100万円をプレゼント。' }));
      assertEqual(risk.level, '応募非推奨', 'guaranteed high value should be not recommended');
      assertIncludes(risk.reasons, '強い煽り', 'reason should mention hype');
      assertIncludes(risk.reasons, '高額', 'reason should mention high value');
    });
    test('Risk: missing deadline requires review', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ deadline: '' }));
      assertEqual(risk.level, '要確認', 'missing deadline should be review');
      assertIncludes(risk.reasons, '締切', 'reason should mention deadline');
    });
    test('Risk: missing organizer requires review', () => {
      const risk = K.Risk.evaluateRisk(makeCampaign({ organizer: '' }));
      assertEqual(risk.level, '要確認', 'missing organizer should be review');
      assertIncludes(risk.reasons, '主催者', 'reason should mention organizer');
    });
  }

  function runScoreTests() {
    test('Score: low risk campaign is high score', () => assertGreaterOrEqual(makeCampaign().score, 80, 'low risk score should be high'));
    test('Score: review campaign is capped at 70', () => assertLessOrEqual(makeCampaign({ body: '外部サイトの専用フォームから応募してください。' }).score, 70, 'review score should be capped'));
    test('Score: not recommended campaign is capped at 30', () => assertLessOrEqual(makeCampaign({ body: 'クレジットカード番号が必要です。' }).score, 30, 'not recommended score should be capped'));
    test('Score: expired campaign is zero', () => assertEqual(makeCampaign({ deadline: '2020-01-01' }).score, 0, 'expired score should be zero'));
    test('Score: personal info is lower than base', () => assertTrue(makeCampaign({ body: '住所と電話番号が必要です。', conditions: ['個人情報入力'] }).score < makeCampaign().score, 'personal info should reduce score'));
    test('Score: external site is lower than base', () => assertTrue(makeCampaign({ body: '外部サイトの専用フォームから応募してください。' }).score < makeCampaign().score, 'external site should reduce score'));
    test('Score: follow plus repost easy entry gets bonus', () => assertGreaterOrEqual(makeCampaign({ conditions: ['フォロー', 'リポスト'] }).score, 90, 'easy entry should score high'));
    test('Score: many winners score higher than few winners', () => {
      const common = { prize: '限定ステッカー', conditions: ['コメント'], body: '公式キャンペーン規約あり。コメントで応募してください。' };
      assertTrue(makeCampaign({ ...common, winners: '100' }).score > makeCampaign({ ...common, winners: '1' }).score, 'many winners should add score');
    });
    test('Score: versatile prize score higher than niche prize', () => {
      const common = { winners: '1', conditions: ['コメント'], body: '公式キャンペーン規約あり。コメントで応募してください。' };
      assertTrue(makeCampaign({ ...common, prize: 'Amazonギフト券1,000円分' }).score > makeCampaign({ ...common, prize: '限定ステッカー' }).score, 'versatile prize should add score');
    });
  }

  function runParserTests() {
    const text1 = '抽選で10名様にAmazonギフト券1,000円分をプレゼント。応募方法はフォロー＆リポスト。締切は2026年6月30日。 当選者にはDMでご連絡します。';
    const parsed1 = K.Parser.parseCampaignText(text1);
    test('Parser: prize includes Amazon gift card', () => assertIncludes(parsed1.prize, 'Amazonギフト券', 'prize should include Amazon gift card'));
    test('Parser: winners is 10', () => assertEqual(parsed1.winners, '10', 'winners should be 10'));
    test('Parser: follow and repost detected', () => {
      assertTrue(parsed1.conditions.includes('フォロー'), 'follow should be detected');
      assertTrue(parsed1.conditions.includes('リポスト'), 'repost should be detected');
    });
    test('Parser: deadline is extracted', () => assertEqual(parsed1.deadline, '2026-06-30', 'deadline should be extracted'));
    test('Parser: contact method includes DM', () => assertIncludes(parsed1.contactMethod, 'DM', 'contact should include DM'));

    const parsed2 = K.Parser.parseCampaignText('コメントで応募。指定ハッシュタグをつけて投稿してください。');
    test('Parser: comment condition detected', () => assertTrue(parsed2.conditions.includes('コメント'), 'comment should be detected'));
    test('Parser: hashtag condition detected', () => assertTrue(parsed2.conditions.includes('ハッシュタグ'), 'hashtag should be detected'));
  }

  function runCommentTests() {
    const campaign = makeCampaign({ prize: '新作スイーツセット', organizer: 'そよ風カフェ公式', conditions: ['コメント'], body: '新作スイーツの感想をコメントしてください。' });
    test('Comments: generates 3 comments', () => assertEqual(campaign.comments.length, 3, 'should generate 3 comments'));
    test('Comments: prize is included naturally', () => assertTrue(campaign.comments.some(text => text.includes('新作スイーツセット')), 'at least one comment should include prize'));
    test('Comments: empty prize does not throw', () => assertEqual(makeCampaign({ prize: '', conditions: ['コメント'] }).comments.length, 3, 'empty prize should still generate'));
    test('Comments: comments are not too long', () => assertTrue(campaign.comments.every(text => text.length <= 70), 'comments should be short'));
    test('Comments: 3 comments are not identical', () => {
      assertNotEqual(campaign.comments[0], campaign.comments[1], 'comment 1 and 2 should differ');
      assertNotEqual(campaign.comments[1], campaign.comments[2], 'comment 2 and 3 should differ');
    });
  }

  function runStorageTests() {
    test('Storage: missing fields are filled with defaults', () => {
      const normalized = K.Storage.normalizeCampaign({ title: '最小データ' });
      assertEqual(normalized.title, '最小データ', 'title should remain');
      assertTrue(!!normalized.id, 'id should be filled');
      assertEqual(normalized.snsType, 'その他', 'invalid/missing sns should normalize');
    });
    test('Storage: invalid status is corrected', () => assertEqual(K.Storage.normalizeCampaign({ title: 'x', status: '謎' }).status, '未確認', 'invalid status should be corrected'));
    test('Storage: invalid URL is blanked', () => assertEqual(K.Storage.normalizeCampaign({ title: 'x', url: 'javascript:alert(1)' }).url, '', 'invalid URL should be blank'));
    test('Storage: invalid date is blanked', () => assertEqual(K.Storage.normalizeCampaign({ title: 'x', deadline: '2026-02-31' }).deadline, '', 'invalid date should be blank'));
    test('Storage: missing tags become empty array', () => assertEqual(K.Storage.normalizeCampaign({ title: 'x' }).tags.length, 0, 'missing tags should become []'));
    test('Storage: string tags become safe array', () => {
      const tags = K.Storage.normalizeCampaign({ title: 'x', tags: 'Amazonギフト券, PayPay、食品' }).tags;
      assertEqual(tags.length, 3, 'string tags should split into array');
      assertTrue(tags.includes('Amazonギフト券'), 'Amazon tag should exist');
    });
    test('Import: non-array is rejected', () => assertFalse(K.Storage.validateImport({ title: 'x' }), 'non-array should reject'));
    test('Import: non-campaign structure is rejected', () => assertFalse(K.Storage.validateImport([{ foo: 'bar' }]), 'non-campaign should reject'));
    test('Import: invalid tags type is rejected', () => assertFalse(K.Storage.validateImport([{ title: 'x', tags: { bad: true } }]), 'invalid tags should reject'));
  }

  function runTagAndFilterTests() {
    const campaigns = [
      makeCampaign({ title: 'Amazon案件', organizer: '青空商店', prize: 'Amazonギフト券', notes: 'メモ検索', tags: ['Amazonギフト券', '手軽'], status: '応募候補', snsType: 'X' }),
      makeCampaign({ title: '美容案件', organizer: '美容公式', prize: 'コスメセット', body: '化粧品をプレゼント。住所入力あり。', tags: ['美容', '個人情報あり'], status: '未確認', snsType: 'Instagram', conditions: ['コメント', '個人情報入力'] }),
      makeCampaign({ title: 'PayPay案件', organizer: '決済公式', prize: 'PayPayポイント', tags: ['PayPay'], status: '見送り', snsType: '公式サイト' })
    ];
    const base = K.Filter.defaultState();

    test('Filter: keyword matches title organizer prize notes and tags', () => {
      assertEqual(K.Filter.applyFilters(campaigns, { ...K.Filter.defaultState(), keyword: 'Amazon案件' }).length, 1, 'title should match');
      assertEqual(K.Filter.applyFilters(campaigns, { ...K.Filter.defaultState(), keyword: '美容公式' }).length, 1, 'organizer should match');
      assertEqual(K.Filter.applyFilters(campaigns, { ...K.Filter.defaultState(), keyword: 'PayPay' }).length, 1, 'prize/tag should match');
      assertEqual(K.Filter.applyFilters(campaigns, { ...K.Filter.defaultState(), keyword: 'メモ検索' }).length, 1, 'memo should match');
      assertEqual(K.Filter.applyFilters(campaigns, { ...K.Filter.defaultState(), keyword: '手軽' }).length, 1, 'tag should match');
    });
    test('Filter: status filter works', () => {
      const fs = K.Filter.defaultState(); fs.statuses.add('見送り');
      assertEqual(K.Filter.applyFilters(campaigns, fs).length, 1, 'status filter should match');
    });
    test('Filter: risk filter works', () => {
      const fs = K.Filter.defaultState(); fs.risks.add('要確認');
      assertTrue(K.Filter.applyFilters(campaigns, fs).length >= 1, 'risk filter should match');
    });
    test('Filter: sns filter works', () => {
      const fs = K.Filter.defaultState(); fs.snsTypes.add('Instagram');
      assertEqual(K.Filter.applyFilters(campaigns, fs).length, 1, 'sns filter should match');
    });
    test('Filter: tag filter works', () => {
      const fs = K.Filter.defaultState(); fs.tags.add('美容');
      assertEqual(K.Filter.applyFilters(campaigns, fs).length, 1, 'tag filter should match');
    });
    test('Filter: multiple filters use AND', () => {
      const fs = K.Filter.defaultState(); fs.tags.add('美容'); fs.snsTypes.add('Instagram'); fs.statuses.add('未確認');
      assertEqual(K.Filter.applyFilters(campaigns, fs).length, 1, 'AND filters should match one');
      fs.statuses.clear(); fs.statuses.add('見送り');
      assertEqual(K.Filter.applyFilters(campaigns, fs).length, 0, 'AND filters should exclude mismatch');
    });
    test('Tags: auto suggestions detect prize and risk categories', () => {
      const suggestions = K.Tags.suggestTags(makeCampaign({
        prize: 'Amazonギフト券 QUOカード PayPayポイント',
        body: '化粧品、食品、家電、旅行が当たる。住所と電話番号が必要です。クレジットカードと手数料が必要です。',
        conditions: ['個人情報入力'],
        risk: { level: '応募非推奨', reasons: [] }
      }));
      ['Amazonギフト券', 'QUOカード', 'PayPay', '美容', '食品', '家電', '旅行', '個人情報あり', '要注意'].forEach(tag => {
        assertTrue(suggestions.includes(tag), `${tag} should be suggested`);
      });
    });
  }

  function runTagExportTests() {
    test('Export: CSV includes tag column', () => {
      let captured = '';
      const originalDownload = K.Export.download;
      K.state.campaigns = [makeCampaign({ tags: ['Amazonギフト券', '手軽'] })];
      K.Export.download = (filename, content) => { captured = content; };
      try {
        K.Export.exportCsv();
      } finally {
        K.Export.download = originalDownload;
      }
      assertIncludes(captured, 'タグ', 'CSV should include tag header');
      assertIncludes(captured, 'Amazonギフト券 / 手軽', 'CSV should include tag values');
    });
  }

  function runApplicationHistoryTests() {
    test('History: missing history fields are filled', () => {
      const c = K.Storage.normalizeCampaign({ title: '履歴なし' });
      assertEqual(c.appliedAt, '', 'appliedAt should default empty');
      assertEqual(c.resultStatus, '未確認', 'resultStatus should default');
      assertEqual(c.applicationMemo, '', 'application memo should default empty');
    });
    test('History: mark as applied sets today', () => {
      const c = makeCampaign({ appliedAt: '', resultStatus: '未確認' });
      K.History.markAsApplied(c, '2026-06-09');
      assertEqual(c.status, '応募済み', 'status should be applied');
      assertEqual(c.appliedAt, '2026-06-09', 'appliedAt should be today');
      assertEqual(c.resultStatus, '連絡待ち', 'result should be waiting');
    });
    test('History: existing appliedAt is not overwritten', () => {
      const c = makeCampaign({ appliedAt: '2026-05-01', resultStatus: '連絡待ち' });
      K.History.markAsApplied(c, '2026-06-09');
      assertEqual(c.appliedAt, '2026-05-01', 'existing appliedAt should remain');
    });
    test('History: invalid resultStatus is normalized', () => {
      assertEqual(K.Storage.normalizeCampaign({ title: 'x', resultStatus: '謎' }).resultStatus, '未確認', 'invalid result status should normalize');
    });
    test('History: invalid history dates are blanked', () => {
      const c = K.Storage.normalizeCampaign({ title: 'x', appliedAt: '2026-02-31', followUpDate: 'bad' });
      assertEqual(c.appliedAt, '', 'invalid appliedAt should blank');
      assertEqual(c.followUpDate, '', 'invalid followUpDate should blank');
    });
    test('History: filter detects waiting', () => {
      const fs = K.History.defaultFilters();
      fs.resultStatuses.add('連絡待ち');
      const items = [makeCampaign({ appliedAt: '2026-06-01', status: '応募済み', resultStatus: '連絡待ち' })];
      assertEqual(K.History.filterHistory(items, fs).length, 1, 'waiting item should match');
    });
    test('History: filter detects win', () => {
      const fs = K.History.defaultFilters();
      fs.resultStatuses.add('当選');
      const items = [makeCampaign({ appliedAt: '2026-06-01', status: '当選', resultStatus: '当選' })];
      assertEqual(K.History.filterHistory(items, fs).length, 1, 'winning item should match');
    });
    test('History: overdue follow-up is detected', () => {
      const c = makeCampaign({ appliedAt: '2026-06-01', status: '応募済み', resultStatus: '連絡待ち', followUpDate: '2026-06-08' });
      assertTrue(K.History.isFollowUpOverdue(c, new Date(2026, 5, 9)), 'follow-up should be overdue');
    });
    test('Stats: applications wins and win rate are calculated', () => {
      const stats = K.Stats.calculateApplicationStats([
        makeCampaign({ appliedAt: '2026-06-01', status: '応募済み', resultStatus: '連絡待ち' }),
        makeCampaign({ appliedAt: '2026-06-02', status: '当選', resultStatus: '当選' })
      ], new Date(2026, 5, 9));
      assertEqual(stats.totalApplications, 2, 'total applications should be 2');
      assertEqual(stats.wins, 1, 'wins should be 1');
      assertEqual(stats.winRate, 0.5, 'win rate should be 0.5');
    });
    test('Export: CSV includes application history columns', () => {
      let captured = '';
      const originalDownload = K.Export.download;
      K.state.campaigns = [makeCampaign({ appliedAt: '2026-06-01', resultStatus: '連絡待ち', applicationMemo: '確認する', applicationMethodMemo: '手動で応募' })];
      K.Export.download = (filename, content) => { captured = content; };
      try {
        K.Export.exportCsv();
      } finally {
        K.Export.download = originalDownload;
      }
      ['応募日', '結果ステータス', '当選・落選連絡日', '発送日', '受取日', '確認予定日', '応募後メモ', '応募操作メモ'].forEach(header => {
        assertIncludes(captured, header, `${header} should be in CSV`);
      });
    });
  }

  function runReminderTests() {
    const baseDate = new Date(2026, 5, 9);
    test('Reminder: missing fields are filled', () => {
      const c = K.Storage.normalizeCampaign({ title: 'リマインダーなし' });
      assertEqual(c.reminderEnabled, true, 'reminderEnabled should default true');
      assertEqual(c.reminderDaysBefore, 3, 'reminderDaysBefore should default 3');
      assertEqual(c.followUpReminderEnabled, true, 'followUpReminderEnabled should default true');
    });
    test('Reminder: invalid reminderEnabled becomes true', () => {
      assertEqual(K.Storage.normalizeCampaign({ title: 'x', reminderEnabled: 'yes' }).reminderEnabled, true, 'invalid reminderEnabled should normalize');
    });
    test('Reminder: invalid reminderDaysBefore becomes 3', () => {
      assertEqual(K.Storage.normalizeCampaign({ title: 'x', reminderDaysBefore: 2 }).reminderDaysBefore, 3, 'invalid days should normalize');
    });
    test('Reminder: allowed reminderDaysBefore values are kept', () => {
      [1, 3, 7, 14].forEach(days => {
        assertEqual(K.Storage.normalizeCampaign({ title: 'x', reminderDaysBefore: days }).reminderDaysBefore, days, `${days} should remain`);
      });
    });
    test('Reminder: invalid followUpReminderEnabled becomes true', () => {
      assertEqual(K.Storage.normalizeCampaign({ title: 'x', followUpReminderEnabled: 'no' }).followUpReminderEnabled, true, 'invalid follow-up flag should normalize');
    });
    test('Reminder: today deadline is included', () => {
      const reminders = K.Reminders.getDeadlineReminders([makeCampaign({ deadline: '2026-06-09', reminderDaysBefore: 3 })], baseDate);
      assertEqual(reminders.length, 1, 'today deadline should be reminder');
      assertEqual(reminders[0].label, '今日締切', 'label should be today deadline');
    });
    test('Reminder: within 3 days deadline is included', () => {
      const reminders = K.Reminders.getDeadlineReminders([makeCampaign({ deadline: '2026-06-12', reminderDaysBefore: 3 })], baseDate);
      assertEqual(reminders.length, 1, '3 days deadline should be reminder');
    });
    test('Reminder: disabled deadline reminder is excluded', () => {
      const reminders = K.Reminders.getDeadlineReminders([makeCampaign({ deadline: '2026-06-09', reminderEnabled: false })], baseDate);
      assertEqual(reminders.length, 0, 'disabled deadline reminder should be excluded');
    });
    test('Reminder: followUpDate today or past is included', () => {
      const reminders = K.Reminders.getFollowUpReminders([makeCampaign({ appliedAt: '2026-06-01', status: '応募済み', resultStatus: '連絡待ち', followUpDate: '2026-06-08' })], baseDate);
      assertTrue(reminders.some(item => item.type === 'followUp'), 'past follow-up should be included');
    });
    test('Reminder: disabled follow-up reminder is excluded', () => {
      const reminders = K.Reminders.getFollowUpReminders([makeCampaign({ appliedAt: '2026-06-01', status: '応募済み', resultStatus: '連絡待ち', followUpDate: '2026-06-08', followUpReminderEnabled: false })], baseDate);
      assertEqual(reminders.length, 0, 'disabled follow-up reminder should be excluded');
    });
    test('ICS: calendar includes BEGIN:VCALENDAR', () => {
      const ics = K.Ics.buildIcsCalendar([makeCampaign({ title: 'ICSテスト', deadline: '2026-06-30' })]);
      assertIncludes(ics, 'BEGIN:VCALENDAR', 'ICS should include calendar header');
    });
    test('ICS: calendar includes campaign title', () => {
      const ics = K.Ics.buildIcsCalendar([makeCampaign({ title: 'ICSテスト', deadline: '2026-06-30' })]);
      assertIncludes(ics, 'ICSテスト', 'ICS should include title');
    });
    test('Export: CSV includes reminder columns', () => {
      let captured = '';
      const originalDownload = K.Export.download;
      K.state.campaigns = [makeCampaign({ reminderEnabled: true, reminderDaysBefore: 7, followUpReminderEnabled: false })];
      K.Export.download = (filename, content) => { captured = content; };
      try {
        K.Export.exportCsv();
      } finally {
        K.Export.download = originalDownload;
      }
      ['締切リマインダー有効', '締切リマインダー日数', '応募後フォローリマインダー有効'].forEach(header => {
        assertIncludes(captured, header, `${header} should be in CSV`);
      });
    });
  }

  function runPwaTests() {
    test('PWA: index references manifest', () => {
      const html = readText('index.html');
      assertIncludes(html, 'rel="manifest"', 'index should reference manifest');
      assertIncludes(html, 'manifest.json', 'index should include manifest path');
    });
    test('PWA: index registers service worker', () => {
      const html = readText('index.html');
      assertIncludes(html, 'serviceWorker', 'index should include service worker registration');
      assertIncludes(html, './sw.js', 'index should register sw.js');
    });
    test('PWA: manifest has app name', () => {
      const manifest = JSON.parse(readText('manifest.json'));
      assertEqual(manifest.short_name, '懸賞管理', 'manifest short_name should match');
      assertEqual(manifest.display, 'standalone', 'manifest display should be standalone');
    });
    test('PWA: service worker has cache name', () => {
      const sw = readText('sw.js');
      assertIncludes(sw, 'kensho-dashboard-v1.0.0', 'service worker should have versioned cache');
      assertIncludes(sw, 'cache.addAll', 'service worker should precache assets');
    });
    test('PWA: icon files are reachable', () => {
      ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'].forEach(path => {
        assertTrue(resourceExists(path), `${path} should be reachable`);
      });
    });
  }

  function runDiscoveryTests() {
    test('Discovery: keywords are generated', () => {
      const keywords = K.Discovery.buildDiscoveryKeywords(K.Discovery.defaultCriteria());
      assertTrue(keywords.length > 0, 'keywords should be generated');
    });
    test('Discovery: Amazon gift card criteria appears in keywords', () => {
      const keywords = K.Discovery.buildDiscoveryKeywords({ genres: ['Amazonギフト券'], targets: ['X'], conditions: ['フォロー', 'リポスト'], excludes: [] });
      assertTrue(keywords.some(keyword => keyword.includes('Amazonギフト券')), 'keywords should include Amazon gift card');
    });
    test('Discovery: X search URL is generated', () => {
      const url = K.Discovery.buildXSearchUrl('Amazonギフト券 プレゼント');
      assertIncludes(url, 'https://x.com/search?q=', 'X search URL should be generated');
      assertIncludes(url, 'f=live', 'X search URL should use live filter');
    });
    test('Discovery: Google search URL is generated', () => {
      const url = K.Discovery.buildGoogleSearchUrl('QUOカード キャンペーン');
      assertIncludes(url, 'https://www.google.com/search?q=', 'Google search URL should be generated');
    });
    test('Discovery: unsafe import URL is rejected by normalization', () => {
      const candidate = K.Discovery.createCampaignCandidate({ url: 'javascript:alert(1)', body: 'Amazonギフト券をプレゼント。' });
      assertEqual(candidate.url, '', 'unsafe URL should be blank');
    });
    test('Discovery: exact URL duplicate is detected', () => {
      const existing = makeCampaign({ url: 'https://example.com/same-campaign' });
      const candidate = makeCampaign({ url: 'https://example.com/same-campaign', title: '別タイトル' });
      const duplicates = K.Discovery.detectDuplicateCampaign(candidate, [existing]);
      assertTrue(duplicates.some(item => item.type === 'url'), 'exact URL duplicate should be detected');
    });
    test('Discovery: organizer prize deadline near duplicate is detected', () => {
      const existing = makeCampaign({ organizer: '青空商店', prize: 'QUOカード', deadline: '2026-06-30', url: 'https://example.com/a' });
      const candidate = makeCampaign({ organizer: '青空商店', prize: 'QUOカード', deadline: '2026-06-30', url: 'https://example.com/b' });
      const duplicates = K.Discovery.detectDuplicateCampaign(candidate, [existing]);
      assertTrue(duplicates.some(item => item.type === 'near'), 'near duplicate should be detected');
    });
    test('Discovery: history saves and loads', () => {
      restoreDiscoveryHistory(null);
      K.Discovery.saveDiscoveryHistory([{ keyword: 'PayPay プレゼント', targets: ['Google検索'], openedLinks: ['https://www.google.com/search?q=PayPay'], registeredCount: 1, notes: 'test' }]);
      const history = K.Discovery.loadDiscoveryHistory();
      assertEqual(history.length, 1, 'history should load one item');
      assertEqual(history[0].keyword, 'PayPay プレゼント', 'keyword should be preserved');
    });
    test('Discovery: history export includes required fields', () => {
      const item = K.Discovery.normalizeHistoryItem({ keyword: '食品 プレゼント', targets: ['X'], openedLinks: ['https://x.com/search?q=test'], registeredCount: 2, notes: 'memo' });
      assertTrue(Object.prototype.hasOwnProperty.call(item, 'createdAt'), 'createdAt should exist');
      assertTrue(Object.prototype.hasOwnProperty.call(item, 'keyword'), 'keyword should exist');
      assertTrue(Object.prototype.hasOwnProperty.call(item, 'registeredCount'), 'registeredCount should exist');
    });
    test('Discovery: candidate preview data has risk and score', () => {
      const candidate = K.Discovery.createCampaignCandidate({
        url: 'https://example.com/candidate',
        organizer: '公式テスト商店',
        body: '抽選で10名様にAmazonギフト券をプレゼント。フォロー＆リポストで応募。締切は2026年6月30日。当選者にはDMで連絡します。キャンペーン規約あり。'
      });
      assertTrue(!!candidate.risk.level, 'risk should be calculated');
      assertTrue(candidate.score > 0, 'score should be calculated');
      assertTrue(candidate.tags.includes('Amazonギフト券'), 'tag suggestions should be included');
    });
  }

  function runBrokenLocalStorageTests() {
    test('Storage: broken localStorage recovers to empty array', () => {
      localStorage.setItem(STORAGE_KEY, '{broken json');
      const loaded = K.Storage.loadCampaigns();
      assertEqual(Array.isArray(loaded), true, 'loaded should be array');
      assertEqual(loaded.length, 0, 'broken storage should load as empty');
      assertEqual(localStorage.getItem(STORAGE_KEY), null, 'broken storage should be cleared');
    });
  }

  function renderResults() {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('passCount').textContent = passed;
    document.getElementById('failCount').textContent = failed;
    document.getElementById('statusText').textContent = failed ? '失敗あり' : '成功';
    document.getElementById('failedNames').innerHTML = failed
      ? `<div class="badge high">失敗したテスト</div><p class="small">${results.filter(r => !r.passed).map(r => K.escapeHtml(r.name)).join('<br>')}</p>`
      : '<div class="badge low">すべて成功しました</div>';
    document.getElementById('testResults').innerHTML = results.map(result => `
      <article class="test-card ${result.passed ? 'pass' : 'fail'}">
        <h3>${result.passed ? 'PASS' : 'FAIL'}: ${K.escapeHtml(result.name)}</h3>
        <p class="small">${K.escapeHtml(result.detail)}</p>
        ${result.passed ? '' : `<pre>期待値: ${K.escapeHtml(formatValue(result.expected))}\n実際の値: ${K.escapeHtml(formatValue(result.actual))}</pre>`}
      </article>
    `).join('');
  }

  function formatValue(value) {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  }

  function readText(path) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, false);
    xhr.send(null);
    if (xhr.status < 200 || xhr.status >= 300) fail(`${path} should be readable`, '2xx', xhr.status);
    return xhr.responseText;
  }

  function resourceExists(path) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, false);
    xhr.send(null);
    return xhr.status >= 200 && xhr.status < 300;
  }

  document.getElementById('runTests').addEventListener('click', runAllTests);
})();
