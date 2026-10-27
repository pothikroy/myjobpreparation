/* Read-only adapters: original module schemas remain the source of truth. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyProgress = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const values = x => x && typeof x === 'object' ? Object.values(x) : [];
  const num = x => typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : 0;
  const count = x => values(x).reduce((n,v) => n + (Array.isArray(v) ? v.length : v ? 1 : 0),0);
  const get = (x, path) => path ? path.split('.').reduce((v, k) => v && v[k], x) : x;
  const parse = x => { try { return typeof x === 'string' ? JSON.parse(x) : x || {}; } catch (_) { return {}; } };
  const configs = {
    'bangla-uttaran-system': { key:'bu_qstate_v1', rows:'', topicKey:'bu_topicstate_v1' },
    'bangla-uttaran-app': { rows:'progress' },
    'english-language': { key:'elsr_progress', rows:'' },
    'english-literature': { rows:'q' },
    'bangladesh-affairs': { rows:'progress' },
    'international-affairs': { rows:'progress' },
    geography: { rows:'q' }, math: { rows:'questions' }, ict: { rows:'perQuestion' },
    morality: { rows:'progress' }, 'science-quiz': { rows:'q' },
    'khairul-advanced-math': { rows:'' }, 'word-smart-vocabulary': { rows:'' },
    'bangla-bhasha-sahitya': { rows:'mcqStats', cards:'srs', read:'readProgress' },
    'bcs-english-command': { rows:'questions', statuses:'lectures' },
    'english-literature-master': { statuses:'qStatus', cards:'srs', history:'testHistory', score:true },
    'vocab-mastery-bcs': { statuses:'status', cards:'srs', history:'quizHistory', score:true },
    'budget-2026-27': { statuses:'topicStatus', totals:'stats' },
    'bangladesh-constitution-master': { statuses:'articleStatus', cards:'cards', read:'visitedPages', history:'quizHistory' },
    'bangladesh-affairs-study-app': { rows:'qState', cards:'fc', read:'contentRead' },
    'bangla-sahitya-study-app': { rows:'mcqAttempts', cards:'qaAttempts', statuses:'topicStatus', read:'completedPages' },
    'computer-ict-study-system': { rows:'mcqAttempts', cards:'qaAttempts', statuses:'topicStatus', read:'completedPages' },
    'international-affairs-study-app': { rows:'mcqAttempts', cards:'qaAttempts', statuses:'topicStatus', read:'completedPages' },
    'math-mental-ability-study-system': { rows:'mcqAttempts', cards:'flashSRS', statuses:'topicStatus', read:'completedPages' },
    'english-lang-lit-study-app': { mapStats:'mcqStats', cards:'flashcardRatings', read:'completedTopics' },
    'ethics-values-governance-46th-bcs': { rows:'mcqHistory', cards:'flashcards', read:'completedSections' },
    'general-science-46th-bcs': { rows:'mcqHistory', cards:'flashcards', read:'completedSections' },
    'geography-study-app': { totals:'mcqStats', cards:'srs' },
    'math-short-technique': { read:'learned', cards:'revision', totals:'', attemptsField:'totalQuizAttempts', correctField:'totalCorrect' },
    'lal-neel-dipaboli': { cards:'cardSRS', read:'chapterProgress', history:'quizHistory', score:true },
    'prelim-master-tracker': { rows:'questions', statuses:'topics' },
    'written-syllabus-intelligence': { statuses:'topics', practice:true },
    'tfp502-exam-tutor': { read:'mastered' },
    'tfp503-exam-prep-alt': { key:'tvx_progress', statuses:'' }
  };
  function summarize(mod, raw, now = Date.now()) {
    const out = { id:mod.id, attempted:0, correct:0, mastered:0, studied:0, due:0, bookmarks:0, notes:0, hasData:false };
    const cfg = configs[mod.id] || {};
    const primary = cfg.key || (mod.storage && mod.storage.keys && mod.storage.keys[0]);
    const data = parse(raw[primary]);
    const scheduled = new Set();
    function due(row, id) {
      if (!row || typeof row !== 'object') return;
      const at = row.overrideNext || row.nextRevision || row.nextReview || row.dueAt || row.revisionDue || row.due || (row.srs && row.srs.due);
      if (at !== null && at !== undefined && at !== '' && new Date(at).getTime() <= now) scheduled.add(id);
    }
    function status(v) { return typeof v === 'string' ? v.toLowerCase() : String(v && (v.status || v.studyStatus) || '').toLowerCase(); }
    function known(v) { return ['mastered','examready','completed','understood','knew','known'].includes(status(v)); }
    function active(v) {
      if (typeof v === 'string') return !['','new','not_started','not-started','not started','not_reviewed','unanswered'].includes(status(v));
      return v && (active(status(v)) || num(v.attempts) || values(v.attempts).length || num(v.correct) || num(v.correctCount) || num(v.reviewCount) || v.lastReviewed || v.lastStudied || v.lastAt || v.lastSeen);
    }
    if (Object.hasOwn(cfg, 'rows')) {
      for (const [id, row] of Object.entries(get(data, cfg.rows) || {})) {
        if (!row || typeof row !== 'object') continue;
        let correct = 0, attempted = 0;
        if (Array.isArray(row.attempts)) {
          const scored = row.attempts.filter(a => typeof a.correct === 'boolean' || typeof a.isCorrect === 'boolean');
          attempted = scored.length; correct = scored.filter(a => a.correct === true || a.isCorrect === true).length;
        } else if ((typeof row.selfCorrect === 'boolean' || typeof row.correct === 'boolean' || ['correct','wrong'].includes(row.status)) && typeof row.correctCount !== 'number' && typeof row.correctAttempts !== 'number' && typeof row.correct !== 'number') {
          attempted = 1;
          correct = (row.selfCorrect ?? row.correct ?? (row.status === 'correct')) ? 1 : 0;
        } else {
          // Counters take precedence over boolean latest-answer fields.
          correct = num(row.correctAttempts ?? row.correctCount ?? row.correct);
          const wrong = num(row.wrongAttempts ?? row.wrongCount ?? row.incorrect ?? row.wrong);
          if (typeof row.attempts === 'number') attempted = row.attempts;
          else if (correct + wrong > 0) attempted = correct + wrong;
          else {
            const result = row.selfCorrect ?? (typeof row.correct === 'boolean' ? row.correct : undefined);
            if (typeof result === 'boolean') { attempted = 1; correct = result ? 1 : 0; }
            else if (['correct','wrong'].includes(row.status)) { attempted = 1; correct = row.status === 'correct' ? 1 : 0; }
          }
          // A boolean is only the latest answer when cumulative attempts are stored separately.
          if (typeof row.correct === 'boolean' && num(row.attempts)) { attempted = 1; correct = row.correct ? 1 : 0; }
        }
        out.attempted += num(attempted); out.correct += Math.min(num(correct), num(attempted));
        if (known(row)) out.mastered++;
        if (active(row) || attempted) out.studied++;
        if (row.bookmarked || row.favorite) out.bookmarks++;
        if (row.note || row.notes) out.notes++;
        due(row, 'row:' + id);
      }
    }
    if (Object.hasOwn(cfg, 'statuses')) for (const [id, row] of Object.entries(get(data, cfg.statuses) || {})) {
      if (known(row)) out.mastered++;
      if (active(row)) out.studied++;
      due(row, 'status:' + id);
      if (cfg.practice) { out.correct += num(row.practiceCorrect); out.attempted += num(row.practiceCorrect) + num(row.practiceWrong); }
    }
    for (const [id, card] of Object.entries(get(data, cfg.cards || '__none') || {})) due(card, 'card:' + id);
    if (cfg.read) out.studied += values(get(data, cfg.read)).filter(v => v && (typeof v !== 'object' || v.read || v.percentDone > 0)).length;
    if (Object.hasOwn(cfg, 'totals')) {
      const stats = get(data, cfg.totals) || {};
      out.correct = num(stats[cfg.correctField || 'totalCorrect'] ?? stats.correct);
      out.attempted = num(stats[cfg.attemptsField || 'totalAnswered']) || out.correct + num(stats.wrong);
    }
    if (cfg.mapStats) {
      const stats = get(data, cfg.mapStats) || {};
      out.attempted = count(stats.attempted);
      out.correct = count(stats.correct);
    }
    if (cfg.history) for (const test of values(data[cfg.history])) {
      // Score is used only by modules where it is a count of correct answers.
      const right = num(test.correct ?? (cfg.score ? test.score : 0));
      const attempted = typeof test.wrong === 'number' ? right + num(test.wrong) : Math.max(0, num(test.total) - num(test.unanswered));
      out.attempted += attempted; out.correct += Math.min(right, attempted);
    }
    if (mod.id === 'exam-simulator') {
      for (const test of raw.attempts || []) { out.correct += num(test.correct); out.attempted += num(test.correct) + num(test.wrong); }
      out.studied = values(raw.qhistory).filter(q => values(q.attempts).length).length;
      out.bookmarks = values(raw.bookmarks).length;
      out.hasData = out.attempted > 0 || out.bookmarks > 0 || values(raw.examProgress).length > 0;
    } else {
      out.bookmarks += count(data.bookmarks || data.favorites);
      out.notes += count(data.notes);
    }
    out.due = scheduled.size;
    out.correct = Math.min(out.correct, out.attempted);
    out.hasData = out.hasData || !!(out.attempted || out.mastered || out.studied || out.due || out.bookmarks || out.notes);
    return out;
  }
  return { summarize, configs };
});
