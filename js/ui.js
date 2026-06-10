(function () {
  'use strict';

  const K = window.Kensho;

  K.UI = K.UI || {};

  K.UI.render = function () {
    K.state.campaigns = K.state.campaigns.map(K.Storage.normalizeCampaign);
    K.UI.renderTabs();
    K.UI.renderToday();
    K.UI.renderList();
    K.UI.renderDiscovery();
    K.UI.renderNew();
    K.UI.renderDetail();
    K.UI.renderHistory();
    K.UI.renderReminders();
    K.UI.renderComments();
    K.UI.renderAnalytics();
    K.UI.renderBackup();
  };
})();
