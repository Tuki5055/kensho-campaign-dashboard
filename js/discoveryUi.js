(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderDiscovery = function () {
    const criteria = K.state.discoveryCriteria || K.Discovery.defaultCriteria();
    const keywords = K.Discovery.buildDiscoveryKeywords(criteria);
    const candidate = K.state.discoveryCandidate || null;
    const duplicates = candidate ? K.Discovery.detectDuplicateCampaign(candidate, K.state.campaigns) : [];
    const history = K.Discovery.loadDiscoveryHistory().slice(0, 10);
    document.getElementById('view-discovery').innerHTML = `
      <section class="panel discovery-hero">
        <div>
          <p class="small">キャンペーンを探す</p>
          <h2>プリセットを選んで、検索リンクを開くだけ</h2>
          <p class="small">見つけた投稿は下の貼り付け欄で登録候補にできます。SNS操作や応募操作は自動化しません。</p>
        </div>
        <div class="discovery-steps">
          <div><b>1</b><span>探し方を選ぶ</span></div>
          <div><b>2</b><span>検索を開く</span></div>
          <div><b>3</b><span>投稿を貼る</span></div>
        </div>
      </section>
      <section class="panel grid">
        <h2>よく使う探し方</h2>
        ${K.UI.discoveryPresetHtml()}
        <details class="filter-panel discovery-advanced">
          <summary>こだわって条件を変える</summary>
          <form id="discoveryCriteriaForm">
            <div class="filter-grid">
              ${K.UI.discoveryCheckGroup('賞品ジャンル', 'genres', K.Discovery.GENRES, criteria.genres)}
              ${K.UI.discoveryCheckGroup('検索する場所', 'targets', K.Discovery.TARGETS, criteria.targets)}
              ${K.UI.discoveryCheckGroup('応募条件', 'conditions', K.Discovery.CONDITIONS, criteria.conditions)}
              ${K.UI.discoveryCheckGroup('避けたい条件', 'excludes', K.Discovery.EXCLUDES, criteria.excludes)}
            </div>
            <div class="split-actions">
              <button type="submit">この条件で探す</button>
              <button type="button" class="secondary" id="clearDiscoveryCriteria">リセット</button>
            </div>
          </form>
        </details>
      </section>
      <section class="panel">
        <div class="section-title">
          <div>
            <h2>おすすめ検索</h2>
            <p class="small">押すと検索ページを新しいタブで開きます。Instagramはコピーして手動検索してください。</p>
          </div>
        </div>
        ${K.UI.discoveryKeywordsHtml(keywords, criteria)}
      </section>
      <section class="panel">
        <h2>見つけた投稿を貼り付ける</h2>
        <p class="small">URLと本文だけでもOKです。登録前にリスク・スコア・タグを確認できます。</p>
        ${K.UI.discoveryImportFormHtml()}
        <div id="candidatePreview">${candidate ? K.UI.discoveryCandidatePreviewHtml(candidate, duplicates) : '<div class="empty">まだ登録候補はありません。見つけた投稿を貼って「プレビューする」を押してください。</div>'}</div>
      </section>
      <section class="panel">
        <div class="section-title">
          <h2>探索履歴</h2>
          <div class="split-actions">
            <button class="secondary tiny" id="exportDiscoveryJson">履歴JSONエクスポート</button>
            <label class="check-pill">履歴JSONインポート<input type="file" id="importDiscoveryJson" accept="application/json,.json"></label>
            <button class="secondary tiny" id="exportDiscoveryCsv">履歴CSVエクスポート</button>
            <button class="danger tiny" id="clearDiscoveryHistory">履歴削除</button>
          </div>
        </div>
        ${K.UI.discoveryHistoryHtml(history)}
      </section>`;
    K.UI.bindDiscovery();
  };

  K.UI.discoveryPresetHtml = function () {
    const descriptions = {
      easy: 'ギフト券やPayPay中心。まず迷ったらこれ。',
      daily: '食品・日用品の公式っぽい案件を探す。',
      safe: 'LINE登録、送料、手数料などを避けたい時。',
      comment: 'コメント応募やハッシュタグ投稿向け。'
    };
    return `
      <div class="discovery-preset-grid">
        ${Object.entries(K.Discovery.PRESETS).map(([key, preset]) => `
          <button type="button" class="discovery-preset" data-discovery-preset="${a(key)}">
            <span>${e(preset.label)}</span>
            <small>${e(descriptions[key] || '')}</small>
          </button>`).join('')}
      </div>`;
  };

  K.UI.discoveryCheckGroup = function (title, name, options, selected) {
    const chosen = new Set(selected || []);
    return `
      <div class="filter-group">
        <h3>${e(title)}</h3>
        <div class="checks">
          ${options.map(option => `<label class="check-pill"><input type="checkbox" name="${a(name)}" value="${a(option)}" ${chosen.has(option) ? 'checked' : ''}>${e(option)}</label>`).join('')}
        </div>
      </div>`;
  };

  K.UI.discoveryKeywordsHtml = function (keywords, criteria) {
    if (!keywords.length) return '<div class="empty">条件を選ぶとキーワード候補が表示されます。</div>';
    const primary = keywords.slice(0, 5);
    const rest = keywords.slice(5);
    return `
      <div class="campaign-list">
        ${primary.map(keyword => K.UI.discoveryKeywordCard(keyword, criteria)).join('')}
      </div>
      ${rest.length ? `
        <details class="discovery-more">
          <summary>ほかの候補も見る（${rest.length}件）</summary>
          <div class="campaign-list">
            ${rest.map(keyword => K.UI.discoveryKeywordCard(keyword, criteria)).join('')}
          </div>
        </details>` : ''}`;
  };

  K.UI.discoveryKeywordCard = function (keyword, criteria) {
    const xUrl = K.Discovery.buildXSearchUrl(keyword);
    const googleUrl = K.Discovery.buildGoogleSearchUrl(keyword);
    const canGoogle = criteria.targets.includes('Google検索') || criteria.targets.includes('公式サイト') || criteria.targets.includes('キャンペーンまとめサイト');
    return `
      <article class="campaign discovery-keyword">
        <div>
          <h3>${e(keyword)}</h3>
          <div class="action-grid discovery-actions">
            ${criteria.targets.includes('X') ? `<a href="${a(xUrl)}" target="_blank" rel="noopener noreferrer" data-discovery-open="${a(keyword)}" data-discovery-url="${a(xUrl)}">Xで探す</a>` : ''}
            ${canGoogle ? `<a href="${a(googleUrl)}" target="_blank" rel="noopener noreferrer" data-discovery-open="${a(keyword)}" data-discovery-url="${a(googleUrl)}">Googleで探す</a>` : ''}
            <button type="button" class="secondary tiny" data-copy-keyword="${a(keyword)}">コピー</button>
          </div>
        </div>
      </article>`;
  };

  K.UI.discoveryImportFormHtml = function () {
    const draft = K.state.discoveryDraft || {};
    return `
      <form id="discoveryImportForm" class="grid">
        <div class="form-grid">
          ${K.UI.field('投稿URL', 'url', draft.url || '', 'url')}
          <div class="field"><label>SNS種別</label><select name="snsType">${K.SNS_OPTIONS.map(v => `<option ${((draft.snsType || 'X') === v) ? 'selected' : ''}>${e(v)}</option>`).join('')}</select></div>
          <div class="field full"><label>投稿本文・キャンペーン説明</label><textarea name="body" placeholder="ここに投稿本文を貼り付けます">${e(draft.body || '')}</textarea></div>
          ${K.UI.field('主催者名（分かれば）', 'organizer', draft.organizer || '')}
          <div class="field full"><label>メモ</label><textarea name="notes" placeholder="検索元や確認したい点をメモできます">${e(draft.notes || '')}</textarea></div>
        </div>
        <div class="split-actions">
          <button type="submit">プレビューする</button>
          <button type="button" class="secondary" id="parseDiscoveryBody">解析だけする</button>
          <span class="small">登録ボタンを押すまでlocalStorageには保存しません。</span>
        </div>
      </form>`;
  };

  K.UI.discoveryCandidatePreviewHtml = function (candidate, duplicates) {
    return `
      <div class="candidate-preview">
        ${duplicates.length ? K.UI.discoveryDuplicateHtml(duplicates) : ''}
        <article class="campaign risk-${K.UI.riskClass(candidate.risk.level)}">
          <div>
            <h3>${e(candidate.title || '無題の候補')}</h3>
            <div class="meta">
              <span class="badge ${K.UI.riskClass(candidate.risk.level)}">${e(candidate.risk.level)}</span>
              <span class="badge blue">${e(candidate.score)}点</span>
              <span class="badge gray">${e(candidate.snsType)}</span>
              <span class="badge ${K.UI.deadlineClass(candidate)}">${e(K.formatDeadline(candidate))}</span>
            </div>
            <div class="preview-grid">
              <p><b>主催者:</b> ${e(candidate.organizer || '未入力')}</p>
              <p><b>投稿URL:</b> ${candidate.url ? `<a href="${a(candidate.url)}" target="_blank" rel="noopener noreferrer">${e(candidate.url)}</a>` : '未入力または不正URL'}</p>
              <p><b>賞品:</b> ${e(candidate.prize || '未推定')}</p>
              <p><b>当選人数:</b> ${e(candidate.winners || '未推定')}</p>
              <p><b>締切:</b> ${e(candidate.deadline || '未推定')}</p>
              <p><b>応募条件:</b> ${e(candidate.conditions.join('、') || '未推定')}</p>
              <p><b>リスク理由:</b> ${e(candidate.risk.reasons.join(' / '))}</p>
              <p><b>コメント案:</b> ${e(candidate.comments.join(' / '))}</p>
            </div>
            ${K.UI.tagChips(candidate.tags || [])}
            <div class="action-grid">
              <button type="button" data-register-candidate>この内容で登録</button>
              ${duplicates[0] ? `<button type="button" class="secondary tiny" data-view-duplicate="${a(duplicates[0].campaign.id)}">既存キャンペーンを見る</button>` : ''}
            </div>
          </div>
          <div class="score">${candidate.score}<div class="small">score</div></div>
        </article>
      </div>`;
  };

  K.UI.discoveryDuplicateHtml = function (duplicates) {
    return `
      <div class="filter-panel duplicate-warning">
        <h3>既存登録済みの可能性があります</h3>
        <div class="campaign-list">
          ${duplicates.map(item => `
            <div class="comment-card">
              <b>${e(item.reason)}</b>
              <p class="small">${e(item.campaign.title)} / ${e(item.campaign.organizer || '主催者未入力')} / ${e(item.campaign.prize || '賞品未入力')}</p>
            </div>`).join('')}
        </div>
        <p class="small">完全一致URLがある場合は、登録前に既存データを確認してください。「登録する」を押すと確認後に保存できます。</p>
      </div>`;
  };

  K.UI.discoveryHistoryHtml = function (history) {
    if (!history.length) return '<div class="empty">探索履歴はまだありません。</div>';
    return `
      <div class="campaign-list">
        ${history.map(item => `
          <article class="campaign">
            <div>
              <h3>${e(item.keyword || 'キーワード未記録')}</h3>
              <div class="meta">
                <span class="badge blue">${e(new Date(item.createdAt).toLocaleString('ja-JP'))}</span>
                <span class="badge gray">${e(item.targets.join('、') || '対象未記録')}</span>
                <span class="badge low">登録 ${e(item.registeredCount)}件</span>
              </div>
              <p class="small">${e(item.notes || 'メモなし')}</p>
              <p class="small">${e(item.openedLinks.join(' / '))}</p>
            </div>
          </article>`).join('')}
      </div>`;
  };

  K.UI.bindDiscovery = function () {
    const criteriaForm = document.getElementById('discoveryCriteriaForm');
    criteriaForm.addEventListener('submit', event => {
      event.preventDefault();
      K.state.discoveryCriteria = K.UI.discoveryCriteriaFromForm(criteriaForm);
      K.UI.render();
      K.toast('キーワードを生成しました');
    });
    document.getElementById('clearDiscoveryCriteria').addEventListener('click', () => {
      K.state.discoveryCriteria = K.Discovery.defaultCriteria();
      K.UI.render();
    });
    document.querySelectorAll('[data-discovery-preset]').forEach(btn => btn.addEventListener('click', () => {
      const preset = K.Discovery.PRESETS[btn.dataset.discoveryPreset];
      K.state.discoveryCriteria = K.Discovery.normalizeCriteria(preset || K.Discovery.defaultCriteria());
      K.UI.render();
    }));
    document.querySelectorAll('[data-copy-keyword]').forEach(btn => btn.addEventListener('click', () => K.UI.copyText(btn.dataset.copyKeyword, 'キーワードをコピーしました')));
    document.querySelectorAll('[data-discovery-open]').forEach(link => link.addEventListener('click', () => {
      K.Discovery.addDiscoveryHistory({
        keyword: link.dataset.discoveryOpen,
        targets: K.state.discoveryCriteria?.targets || [],
        openedLinks: [link.dataset.discoveryUrl],
        registeredCount: 0,
        notes: '検索リンクを開きました'
      });
    }));

    const importForm = document.getElementById('discoveryImportForm');
    importForm.addEventListener('submit', event => {
      event.preventDefault();
      K.UI.createDiscoveryCandidate(importForm);
    });
    document.getElementById('parseDiscoveryBody').addEventListener('click', () => K.UI.createDiscoveryCandidate(importForm));
    document.querySelector('[data-register-candidate]')?.addEventListener('click', K.UI.registerDiscoveryCandidate);
    document.querySelector('[data-view-duplicate]')?.addEventListener('click', event => {
      K.state.selectedId = event.target.dataset.viewDuplicate;
      K.UI.switchTab('detail');
    });
    document.getElementById('exportDiscoveryJson').addEventListener('click', K.Discovery.exportDiscoveryHistoryJson);
    document.getElementById('exportDiscoveryCsv').addEventListener('click', K.Discovery.exportDiscoveryHistoryCsv);
    document.getElementById('importDiscoveryJson').addEventListener('change', K.Discovery.importDiscoveryHistoryJson);
    document.getElementById('clearDiscoveryHistory').addEventListener('click', () => {
      if (confirm('探索履歴を削除しますか？')) {
        K.Discovery.saveDiscoveryHistory([]);
        K.UI.render();
        K.toast('探索履歴を削除しました');
      }
    });
  };

  K.UI.discoveryCriteriaFromForm = function (form) {
    const fd = new FormData(form);
    return K.Discovery.normalizeCriteria({
      genres: fd.getAll('genres'),
      targets: fd.getAll('targets'),
      conditions: fd.getAll('conditions'),
      excludes: fd.getAll('excludes')
    });
  };

  K.UI.createDiscoveryCandidate = function (form) {
    const fd = new FormData(form);
    const rawUrl = String(fd.get('url') || '').trim();
    if (rawUrl && !K.isSafeUrl(rawUrl)) {
      alert('投稿URLは http:// または https:// のURLだけ取り込めます。');
      return;
    }
    K.state.discoveryCandidate = K.Discovery.createCampaignCandidate({
      url: rawUrl,
      snsType: String(fd.get('snsType') || 'X'),
      organizer: String(fd.get('organizer') || ''),
      body: String(fd.get('body') || ''),
      notes: String(fd.get('notes') || '')
    });
    K.state.discoveryDraft = {
      url: rawUrl,
      snsType: String(fd.get('snsType') || 'X'),
      organizer: String(fd.get('organizer') || ''),
      body: String(fd.get('body') || ''),
      notes: String(fd.get('notes') || '')
    };
    K.UI.render();
    K.toast('登録候補を作成しました');
  };

  K.UI.registerDiscoveryCandidate = function () {
    const candidate = K.state.discoveryCandidate;
    if (!candidate) return;
    const duplicates = K.Discovery.detectDuplicateCampaign(candidate, K.state.campaigns);
    if (duplicates.length && !confirm('既存登録済みの可能性があります。それでも登録しますか？')) return;
    K.state.campaigns.unshift(K.Storage.normalizeCampaign(candidate));
    K.state.selectedId = candidate.id;
    K.Storage.saveCampaigns(K.state.campaigns);
    K.Discovery.addDiscoveryHistory({
      keyword: K.Discovery.buildDiscoveryKeywords(K.state.discoveryCriteria || K.Discovery.defaultCriteria())[0] || '',
      targets: K.state.discoveryCriteria?.targets || [],
      openedLinks: candidate.url ? [candidate.url] : [],
      registeredCount: 1,
      notes: '探索候補からキャンペーン登録'
    });
    K.state.discoveryCandidate = null;
    K.state.discoveryDraft = null;
    K.UI.render();
    K.toast('探索候補を登録しました');
  };

  K.UI.copyText = function (text, message) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => K.toast(message)).catch(() => K.toast('コピーできませんでした'));
    } else {
      K.toast('コピー機能に対応していないブラウザです');
    }
  };
})();
