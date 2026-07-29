// ============================================================
//  JMR — Serviço de Avaliações (Quiz)
//  Carrega questões do Supabase e cai para o banco embutido
//  (quiz-content.js) quando ainda não há dados cadastrados.
// ============================================================

import { supabase } from '../config/supabase.js';
import { getQuizFromBank } from '../data/quiz-content.js';

/**
 * Carrega um quiz pelo slug. Prioriza o Supabase; usa fallback embutido.
 * Estrutura de retorno: { slug, titulo, modulo, aprovacao, questions:[...] }
 */
export async function loadQuiz(slug = 'lgpd') {
  try {
    const { data: quiz } = await supabase
      .from('quizzes').select('*').eq('slug', slug).eq('active', true).single();

    if (quiz) {
      const { data: questions } = await supabase
        .from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('position', { ascending: true });

      if (questions && questions.length) {
        return {
          slug: quiz.slug, titulo: quiz.titulo, modulo: quiz.modulo,
          aprovacao: quiz.aprovacao ?? 70,
          questions: questions.map((q) => ({
            id: q.id,
            titulo: q.titulo,
            enunciado: Array.isArray(q.enunciado) ? q.enunciado : [q.enunciado].filter(Boolean),
            pergunta: q.pergunta,
            opcoes: q.opcoes,          // jsonb array
            correta: q.correta,        // índice
            explicacao: q.explicacao,
            xp: q.xp ?? 20,
          })),
        };
      }
    }
  } catch (_) { /* usa fallback */ }

  return getQuizFromBank(slug);
}

/**
 * Salva a tentativa no Supabase (silencioso se a tabela/usuário não existirem).
 */
export async function saveAttempt({ slug, acertos, total, pontuacao, aprovado }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { saved: false };
    const { error } = await supabase.from('quiz_attempts').insert({
      user_id: user.id, quiz_slug: slug, acertos, total, pontuacao, aprovado,
    });
    return { saved: !error };
  } catch (_) {
    return { saved: false };
  }
}

export function grade(questions, answers) {
  let acertos = 0;
  let gainedXp = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correta) { acertos++; gainedXp += (q.xp || 20); }
  });
  const total = questions.length;
  const pontuacao = total ? Math.round((acertos / total) * 100) : 0;
  return { acertos, total, pontuacao, gainedXp, perfect: acertos === total };
}
