// ============================================================
//  JMR — Banco de questões (fallback embutido)
//  Usado quando o Supabase ainda não tem as questões cadastradas.
//  Assim que as tabelas `quizzes`/`quiz_questions` forem populadas,
//  o serviço quiz.js passa a priorizar o banco de dados automaticamente.
//
//  Formato de cada questão:
//    { id, titulo, enunciado:[paragrafos], pergunta, opcoes:[...],
//      correta:<indice>, explicacao, xp }
// ============================================================

export const QUIZ_BANK = {
  lgpd: {
    slug: 'lgpd',
    titulo: 'Avaliação Final — LGPD e Segurança da Informação',
    modulo: 'Segurança da Informação e LGPD',
    aprovacao: 70, // % mínimo para aprovação
    questions: [
      {
        id: 'q1',
        titulo: 'Lei Geral de Proteção de Dados (LGPD)',
        enunciado: [
          'A Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) estabelece regras sobre a coleta, armazenamento, tratamento e compartilhamento de dados pessoais no Brasil.',
          'Uma empresa de segurança privada coleta dados biométricos de seus colaboradores para controle de acesso. Houve um vazamento que expôs dados sensíveis de mais de 500 funcionários, e a empresa demorou 15 dias para notificar a ANPD sobre o incidente.'
        ],
        pergunta: 'Qual é a principal infração cometida pela empresa neste caso?',
        opcoes: [
          'A coleta de dados biométricos é proibida pela LGPD em qualquer circunstância.',
          'O atraso na notificação à ANPD, pois o prazo é em tempo razoável — referência de até 2 dias úteis após o conhecimento do incidente.',
          'A ausência de consentimento expresso individual de cada colaborador para a coleta.',
          'A falta de anonimização dos dados antes do armazenamento.',
          'O número insuficiente de afetados, pois a LGPD só exige notificação acima de 1.000 pessoas.'
        ],
        correta: 1,
        explicacao: 'A LGPD (art. 48) exige comunicação do incidente à ANPD e aos titulares em prazo razoável. A ANPD referenciou até 2 dias úteis após o conhecimento. Um atraso de 15 dias configura infração sujeita a sanções administrativas (advertência e multa de até 2% do faturamento, limitada a R$ 50 milhões por infração).',
        xp: 25
      },
      {
        id: 'q2',
        titulo: 'Dados pessoais sensíveis',
        enunciado: [
          'A LGPD distingue "dados pessoais" de "dados pessoais sensíveis", conferindo proteção reforçada a estes últimos.'
        ],
        pergunta: 'Qual das alternativas contém APENAS dados considerados sensíveis pela LGPD?',
        opcoes: [
          'Nome completo, e-mail corporativo e cargo.',
          'CPF, endereço e número de telefone.',
          'Dado biométrico, dado de saúde e convicção religiosa.',
          'Matrícula do funcionário e data de admissão.',
          'Login de acesso e histórico de navegação interno.'
        ],
        correta: 2,
        explicacao: 'Dados sensíveis (art. 5º, II) incluem origem racial/étnica, convicção religiosa, opinião política, saúde, vida sexual, dado genético e biométrico. Nome, CPF e e-mail são dados pessoais comuns — não sensíveis.',
        xp: 20
      },
      {
        id: 'q3',
        titulo: 'Princípio do menor privilégio',
        enunciado: [
          'Você recebe por e-mail uma planilha marcada como "Confidencial" com a folha de pagamento de um setor que não é o seu.'
        ],
        pergunta: 'Qual é a conduta mais adequada?',
        opcoes: [
          'Encaminhar para toda a equipe, por garantia de transparência.',
          'Salvar uma cópia no seu drive pessoal para consulta futura.',
          'Avisar o remetente do envio indevido e não repassar o arquivo.',
          'Imprimir e arquivar na sua mesa.',
          'Ignorar — não é problema seu.'
        ],
        correta: 2,
        explicacao: 'Pelo princípio do menor privilégio, você só deve acessar o que é necessário à sua função. O certo é reportar o envio indevido ao remetente/segurança e não propagar o dado, reduzindo a superfície de exposição.',
        xp: 20
      },
      {
        id: 'q4',
        titulo: 'Reconhecendo phishing',
        enunciado: [
          'Um e-mail com o logo do banco avisa: "Sua conta será BLOQUEADA em 2 horas. Clique para validar seus dados." Ao passar o mouse, o link exibido como "banco.com.br" aponta para "secure-bank-verify.top".'
        ],
        pergunta: 'Qual é o sinal mais determinante de que se trata de um golpe?',
        opcoes: [
          'O e-mail tem o logo do banco.',
          'A mensagem está escrita em português.',
          'O destino real do link diverge do texto exibido.',
          'O e-mail chegou fora do horário comercial.',
          'O assunto é curto.'
        ],
        correta: 2,
        explicacao: 'O que vale é o destino REAL do link, não o texto exibido. Divergência entre o texto e a URL de destino, somada à urgência artificial, é a assinatura clássica do phishing. Nunca clique — acesse o site oficial digitando o endereço você mesmo.',
        xp: 25
      },
      {
        id: 'q5',
        titulo: 'Resposta a incidente',
        enunciado: [
          'Você percebeu que digitou sua senha corporativa em uma página falsa após clicar em um link suspeito.'
        ],
        pergunta: 'Qual deve ser a primeira atitude?',
        opcoes: [
          'Não contar a ninguém para evitar constrangimento.',
          'Desligar o computador e esperar para ver o que acontece.',
          'Trocar a senha imediatamente e comunicar a TI/segurança.',
          'Formatar a máquina por conta própria.',
          'Responder ao e-mail pedindo para desconsiderarem.'
        ],
        correta: 2,
        explicacao: 'Velocidade de resposta reduz o dano. Trocar a senha comprometida e reportar imediatamente à equipe de segurança permite conter o incidente (revogar sessões, monitorar acessos) antes que escale.',
        xp: 20
      }
    ]
  },

  phishing: {
    slug: 'phishing',
    titulo: 'Avaliação — Phishing e Engenharia Social',
    modulo: 'Phishing e Engenharia Social',
    aprovacao: 70,
    questions: [
      {
        id: 'q1',
        titulo: 'Engenharia social',
        enunciado: ['Você recebe um WhatsApp: "Aqui é o diretor, preciso que compre cartões-presente com urgência e me envie os códigos."'],
        pergunta: 'Qual é a resposta correta?',
        opcoes: [
          'Comprar imediatamente — é uma ordem do diretor.',
          'Validar o pedido pessoalmente ou por um canal oficial antes de qualquer ação.',
          'Enviar um PIX no lugar dos cartões.',
          'Encaminhar a mensagem para os colegas.'
        ],
        correta: 1,
        explicacao: 'É o golpe do falso chefe (BEC). Pedidos financeiros incomuns e urgentes devem SEMPRE ser validados por um canal independente e oficial antes de qualquer execução.',
        xp: 25
      },
      {
        id: 'q2',
        titulo: 'Senhas fortes',
        enunciado: ['Sobre a segurança de senhas na prática corporativa.'],
        pergunta: 'Qual abordagem oferece MAIOR segurança real?',
        opcoes: [
          'Uma senha forte reutilizada em todos os serviços.',
          'Uma frase longa e única por serviço, guardada em gerenciador de senhas.',
          'Senha curta trocada toda semana.',
          'Nome da empresa + ano atual.'
        ],
        correta: 1,
        explicacao: 'Comprimento + unicidade vencem complexidade decorada. Uma senha única por serviço, gerida por um gerenciador, contém o estrago de vazamentos (evita credential stuffing).',
        xp: 20
      },
      {
        id: 'q3',
        titulo: 'Autenticação multifator',
        enunciado: ['Sua conta oferece várias opções de segundo fator (MFA).'],
        pergunta: 'Qual segundo fator é o mais resistente a ataques?',
        opcoes: ['Código por SMS', 'Pergunta secreta', 'App autenticador ou chave física', 'Código por e-mail'],
        correta: 2,
        explicacao: 'App autenticador e chaves físicas (FIDO2) resistem a interceptação e a troca de chip (SIM swap), ao contrário do SMS e do e-mail.',
        xp: 20
      },
      {
        id: 'q4',
        titulo: 'Dado suspeito no navegador',
        enunciado: ['Um site pede que você instale uma "extensão de segurança" para "continuar o acesso ao portal da empresa".'],
        pergunta: 'O que fazer?',
        opcoes: [
          'Instalar — o site pediu, deve ser necessário.',
          'Não instalar e reportar à TI; extensões não solicitadas são vetor comum de ataque.',
          'Instalar apenas se for gratuita.',
          'Compartilhar o link com a equipe para testarem.'
        ],
        correta: 1,
        explicacao: 'Software/extensões não solicitados são um vetor clássico de comprometimento. Nunca instale por indicação de um site; valide com a TI antes.',
        xp: 25
      }
    ]
  }
};

export function getQuizFromBank(slug) {
  return QUIZ_BANK[slug] || QUIZ_BANK.lgpd;
}
