(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderDetail = function () {
    const campaign = K.state.campaigns.find(item => item.id === K.state.selectedId) || K.state.campaigns[0];
    if (!campaign) {
      document.getElementById('view-detail').innerHTML = '<div class="empty">編集するキャンペーンがありません。新規登録またはサンプルデータを投入してください。</div>';
      return;
    }
    document.getElementById('view-detail').innerHTML = `
      <div class="detail-layout">
        <section class="panel">
          <h2>詳細・編集</h2>
          ${K.UI.formHtml(campaign, 'edit')}
        </section>
        <aside class="grid">
          <div class="panel">
            <h2>判定</h2>
            <div class="meta"><span class="badge ${K.UI.riskClass(campaign.risk.level)}">${e(campaign.risk.level)}</span><span class="badge blue">スコア ${campaign.score}</span><span class="badge gray">${e(K.effectiveStatus(campaign))}</span></div>
            <p class="small">${e(campaign.risk.reasons.join(' / '))}</p>
            ${campaign.cautions ? `<p class="small" style="margin-top:8px"><b>注意点:</b> ${e(campaign.cautions)}</p>` : ''}
          </div>
          <div class="panel">
            <h2>手動応募チェックリスト</h2>
            <div class="checklist">
              ${K.CHECKLIST_ITEMS.map(item => `<label class="check-row"><input type="checkbox" data-check="${a(item)}" ${campaign.checklist[item] ? 'checked' : ''}>${e(item)}</label>`).join('')}
            </div>
          </div>
        </aside>
      </div>`;
    K.UI.bindForm('edit', campaign.id);
    document.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', () => {
      const target = K.state.campaigns.find(item => item.id === campaign.id);
      if (!target) return;
      target.checklist[input.dataset.check] = input.checked;
      K.Storage.saveCampaigns(K.state.campaigns);
      K.toast('チェックを保存しました');
    }));
  };
})();
