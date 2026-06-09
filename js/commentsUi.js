(function () {
  'use strict';

  const K = window.Kensho;
  const e = K.escapeHtml;
  const a = K.escapeAttr;

  K.UI = K.UI || {};

  K.UI.renderComments = function () {
    const commentCampaigns = K.state.campaigns.filter(c => c.conditions.includes('コメント'));
    document.getElementById('view-comments').innerHTML = `
      <section class="panel">
        <h2>コメント案</h2>
        <p class="small" style="margin-bottom:12px">コメントが必要なキャンペーンだけ表示します。同じ文面の大量使い回しを前提にせず、投稿内容に合わせて手で調整してください。</p>
        <div class="grid">
          ${commentCampaigns.length ? commentCampaigns.map(c => `
            <div class="comment-card">
              <h3>${e(c.title || '無題')}</h3>
              <div class="meta"><span class="badge gray">${e(c.prize || '賞品未入力')}</span><span class="badge ${K.UI.riskClass(c.risk.level)}">${e(c.risk.level)}</span></div>
              ${c.comments.map(text => `<p>・${e(text)} <button class="ghost" data-copy-text="${a(text)}">コピー</button></p>`).join('')}
              <button class="ghost" data-edit="${a(c.id)}">詳細を開く</button>
            </div>`).join('') : '<div class="empty">コメント必須のキャンペーンはありません。</div>'}
        </div>
      </section>`;
    K.UI.bindCampaignButtons();
    document.querySelectorAll('[data-copy-text]').forEach(btn => btn.addEventListener('click', () => K.Comments.copyText(btn.dataset.copyText)));
  };
})();
