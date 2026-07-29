// ============================================================
//  JMR — Serviço de Gamificação
//  XP, níveis, streak diário, conquistas e ranking.
//
//  Estratégia: tenta persistir no Supabase (tabela user_gamification,
//  user_badges); se as tabelas ainda não existirem ou o usuário não
//  estiver logado, cai para localStorage — assim a demonstração
//  funciona de imediato e "liga" no banco assim que o SQL for aplicado.
// ============================================================

import { supabase } from '../config/supabase.js';

const LS_KEY = 'jmr_gamification_v1';

// ---- Curva de XP / níveis ---------------------------------
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(60 * (level - 1) * level); // 120, 300, 540, 840...
}
export function levelFromXp(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - base;
  const span = next - base;
  return { level, into, span, toNext: Math.max(0, next - xp), pct: span ? Math.round((into / span) * 100) : 100 };
}

export const RANKS = [
  { min: 1, label: 'Aprendiz', color: '#9CA3AF' },
  { min: 4, label: 'Analista', color: '#60A5FA' },
  { min: 7, label: 'Defensor', color: '#00FF41' },
  { min: 11, label: 'Guardião', color: '#C084FC' },
  { min: 16, label: 'Sentinela', color: '#FBBF24' },
];
export function rankForLevel(level) {
  return [...RANKS].reverse().find((r) => level >= r.min) || RANKS[0];
}

// ---- Conquistas -------------------------------------------
export const BADGES = [
  { id: 'first_quiz',   nome: 'Primeiro Passo',  desc: 'Concluiu sua primeira avaliação.',  icon: '🎯', check: (s) => s.quizzesCompleted >= 1 },
  { id: 'flawless',     nome: 'Gabaritou',        desc: 'Acertou 100% em uma avaliação.',    icon: '🏆', check: (s) => s.hasPerfect },
  { id: 'approved',     nome: 'Aprovado',         desc: 'Passou em uma avaliação.',          icon: '✅', check: (s) => s.approvals >= 1 },
  { id: 'streak_3',     nome: 'Em Ritmo',         desc: 'Sequência de 3 dias.',              icon: '🔥', check: (s) => s.streak >= 3 },
  { id: 'streak_7',     nome: 'Constância',       desc: 'Sequência de 7 dias.',              icon: '⚡', check: (s) => s.streak >= 7 },
  { id: 'level_5',      nome: 'Em Ascensão',      desc: 'Alcançou o nível 5.',               icon: '📈', check: (s) => s.level >= 5 },
  { id: 'sharpshooter', nome: 'Franco-Atirador',  desc: 'Concluiu 5 avaliações.',            icon: '🛡️', check: (s) => s.quizzesCompleted >= 5 },
];

// ---- Estado local -----------------------------------------
function today() { return new Date().toISOString().slice(0, 10); }

function emptyState() {
  return { xp: 0, quizzesCompleted: 0, approvals: 0, hasPerfect: false, streak: 0, longest: 0, lastActive: null, badges: [] };
}
function loadLocal() {
  try { const r = localStorage.getItem(LS_KEY); return r ? { ...emptyState(), ...JSON.parse(r) } : emptyState(); }
  catch { return emptyState(); }
}
function saveLocal(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); return s; }

function summarize(s) {
  const { level, pct, toNext } = levelFromXp(s.xp);
  return { ...s, level, levelPct: pct, toNext, rank: rankForLevel(level) };
}

function bumpStreak(s) {
  const d = today();
  if (s.lastActive === d) return s;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  s.streak = s.lastActive === yesterday ? (s.streak || 0) + 1 : 1;
  s.longest = Math.max(s.longest || 0, s.streak);
  s.lastActive = d;
  return s;
}

function evaluateBadges(s) {
  const summary = summarize(s);
  const have = new Set(s.badges || []);
  const newly = [];
  for (const b of BADGES) if (!have.has(b.id) && b.check(summary)) { have.add(b.id); newly.push(b); }
  s.badges = [...have];
  return newly;
}

// ---- API pública ------------------------------------------
export function getState() {
  return summarize(loadLocal());
}

/**
 * Registra a conclusão de uma avaliação e concede XP.
 * @returns {{ summary, gainedXp, leveledUp, newBadges }}
 */
export function registerQuizResult({ gainedXp, perfect, approved }) {
  const s = loadLocal();
  const before = levelFromXp(s.xp).level;

  s.xp += gainedXp;
  s.quizzesCompleted = (s.quizzesCompleted || 0) + 1;
  if (approved) s.approvals = (s.approvals || 0) + 1;
  if (perfect) s.hasPerfect = true;
  bumpStreak(s);
  const newBadges = evaluateBadges(s);
  saveLocal(s);

  // Espelha no Supabase em background (silencioso se ainda não houver tabela).
  syncToSupabase(s).catch(() => {});

  const after = levelFromXp(s.xp).level;
  return { summary: summarize(s), gainedXp, leveledUp: after > before, newBadges };
}

export function resetLocal() { return summarize(saveLocal(emptyState())); }

// ---- Sincronização opcional com Supabase ------------------
async function syncToSupabase(s) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.email?.split('@')[0] || 'Colaborador';
  await supabase.from('user_gamification').upsert({
    user_id: user.id, nome, xp: s.xp, streak: s.streak, longest_streak: s.longest,
    last_active: s.lastActive, quizzes_completed: s.quizzesCompleted, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  if (s.badges?.length) {
    await supabase.from('user_badges').upsert(
      s.badges.map((badge_id) => ({ user_id: user.id, badge_id })), { onConflict: 'user_id,badge_id' }
    );
  }
}

// ---- Ranking ----------------------------------------------
const DEMO_PEERS = [
  { nome: 'Ana Paula', xp: 1180 }, { nome: 'Carlos Eduardo', xp: 940 },
  { nome: 'Roberto Lima', xp: 760 }, { nome: 'Mariana Souza', xp: 610 },
  { nome: 'Bruno Rocha', xp: 480 }, { nome: 'Julia Mendes', xp: 320 },
  { nome: 'Ricardo Alves', xp: 190 },
];

export async function getRanking(meName = 'Você') {
  // Tenta o ranking real da empresa (view `ranking_gamificacao`).
  try {
    const { data } = await supabase.from('ranking_gamificacao').select('nome, xp').order('xp', { ascending: false }).limit(20);
    if (data && data.length) {
      return data.map((r, i) => ({ ...r, pos: i + 1, level: levelFromXp(r.xp).level, rank: rankForLevel(levelFromXp(r.xp).level) }));
    }
  } catch { /* fallback abaixo */ }

  const me = getState();
  const rows = [...DEMO_PEERS, { nome: meName, xp: me.xp, isMe: true }].sort((a, b) => b.xp - a.xp);
  return rows.map((r, i) => ({ ...r, pos: i + 1, level: levelFromXp(r.xp).level, rank: rankForLevel(levelFromXp(r.xp).level) }));
}
