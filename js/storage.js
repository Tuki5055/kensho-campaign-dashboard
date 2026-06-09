(function () {
  'use strict';

  const K = window.Kensho;

  K.Storage = {};

  K.Storage.defaultCampaign = function () {
    return {
      id: K.createId(),
      createdAt: new Date().toISOString(),
      title: '',
      organizer: '',
      snsType: 'X',
      url: '',
      body: '',
      prize: '',
      winners: '',
      deadline: '',
      conditions: [],
      contactMethod: '',
      notes: '',
      cautions: '',
      status: '未確認',
      ...K.History.defaultFields(),
      checklist: {},
      risk: { level: '要確認', reasons: ['未判定'] },
      score: 0,
      comments: [],
      tags: []
    };
  };

  K.Storage.normalizeCampaign = function (raw) {
    if (!raw || typeof raw !== 'object') return K.Storage.defaultCampaign();
    const merged = { ...K.Storage.defaultCampaign(), ...raw };
    merged.id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : K.createId();
    merged.createdAt = K.isValidIsoDate(raw.createdAt) ? raw.createdAt : new Date().toISOString();
    merged.title = K.safeText(raw.title);
    merged.organizer = K.safeText(raw.organizer);
    merged.snsType = K.SNS_OPTIONS.includes(raw.snsType) ? raw.snsType : 'その他';
    merged.url = K.normalizeUrl(raw.url);
    merged.body = K.safeText(raw.body);
    merged.prize = K.safeText(raw.prize);
    merged.winners = K.safeText(raw.winners);
    merged.deadline = K.isValidDateInput(raw.deadline) ? raw.deadline : '';
    merged.contactMethod = K.safeText(raw.contactMethod);
    merged.notes = K.safeText(raw.notes);
    merged.cautions = K.safeText(raw.cautions);
    merged.tags = K.Tags.normalizeTags(raw.tags);
    Object.assign(merged, K.History.normalizeHistoryFields(raw));
    merged.status = K.STATUS_OPTIONS.includes(raw.status) ? raw.status : '未確認';
    merged.conditions = Array.isArray(raw.conditions) ? raw.conditions.filter(v => K.CONDITION_OPTIONS.includes(v)) : [];
    merged.checklist = raw.checklist && typeof raw.checklist === 'object' && !Array.isArray(raw.checklist) ? raw.checklist : {};
    merged.risk = K.Risk.evaluateRisk(merged);
    merged.score = K.Score.calculateScore(merged, merged.risk);
    merged.comments = K.Comments.generateComments(merged);
    return merged;
  };

  K.Storage.loadCampaigns = function () {
    try {
      const raw = localStorage.getItem(K.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Stored data is not an array');
      return parsed.map(K.Storage.normalizeCampaign);
    } catch (error) {
      console.warn('localStorageの保存データが破損していたため復旧しました。');
      localStorage.removeItem(K.STORAGE_KEY);
      return [];
    }
  };

  K.Storage.saveCampaigns = function (campaigns) {
    try {
      localStorage.setItem(K.STORAGE_KEY, JSON.stringify(campaigns.map(K.Storage.normalizeCampaign)));
    } catch (error) {
      console.error(error);
      alert('保存に失敗しました。ブラウザの保存容量やプライベートモード設定を確認してください。');
    }
  };

  K.Storage.validateImport = function (data) {
    if (!Array.isArray(data) || data.length > 2000) return false;
    return data.every(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      if (typeof item.title !== 'string' || item.title.length > 200) return false;
      if (item.url && (typeof item.url !== 'string' || !K.isSafeUrl(item.url))) return false;
      if (item.deadline && !K.isValidDateInput(item.deadline)) return false;
      if (item.tags && !(Array.isArray(item.tags) || typeof item.tags === 'string')) return false;
      if (item.conditions && (!Array.isArray(item.conditions) || item.conditions.some(v => !K.CONDITION_OPTIONS.includes(v)))) return false;
      if (item.status && !K.STATUS_OPTIONS.includes(item.status)) return false;
      if (item.snsType && !K.SNS_OPTIONS.includes(item.snsType)) return false;
      return true;
    });
  };
})();
