# Requisitos

## Funcionais

### RF01 — Autenticação
- Login por e-mail + senha (Supabase Auth). Sem cadastro público: **signup desabilitado**.
- Recuperação de senha por e-mail.
- Sessão persistente no celular do operador.

### RF02 — Usuários (admin)
- Admin cria operador (nome, e-mail, senha provisória ou convite por e-mail).
- Admin ativa/desativa operador e troca o perfil (operador ↔ admin).
- Admin vincula operadores a campeonatos.

### RF03 — Campeonatos (admin)
- CRUD de campeonato: nome, temporada/ano, modalidade (campo, society, futsal), local padrão, status, público/privado.
- Regras configuráveis: pontos por vitória/empate/derrota, nº de tempos, minutos por tempo, critérios de desempate.

### RF04 — Times (admin)
- CRUD de times por campeonato: nome, sigla (3 letras), cor, escudo (URL no MVP, upload depois), responsável/contato.

### RF05 — Jogadores (admin)
- CRUD de jogadores por time: nome, apelido, número da camisa (único no time), posição (opcional), ativo.

### RF06 — Partidas (admin)
- Criar partidas manualmente ou gerar tabela de pontos corridos automaticamente (turno ou turno e returno).
- Campos: rodada, mandante, visitante, data/hora, local, operador responsável.
- Status: `agendada`, `em_andamento`, `intervalo`, `encerrada`, `adiada`, `cancelada`, `wo`.

### RF07 — Modo placar ao vivo (operador/admin)
- Tela única, mobile, com: placar grande, cronômetro, botões Iniciar/Pausar/Fim do tempo/Encerrar.
- Lançar **gol** (time → jogador, opção gol contra), **cartão amarelo**, **cartão vermelho**, **substituição** (fase 2).
- Minuto do evento preenchido automaticamente pelo cronômetro, editável.
- Desfazer / anular evento.
- Observações da súmula (texto livre).

### RF08 — Área pública (visitante)
- Lista de campeonatos públicos.
- Página do campeonato: jogos (por rodada), classificação, artilharia, cartões, times.
- Página da partida: placar e cronômetro **ao vivo** + linha do tempo de eventos.
- Página do time: elenco e jogos.

### RF09 — Estatísticas derivadas
- Classificação: P, J, V, E, D, GP, GC, SG, % aproveitamento, últimos 5.
- Artilharia, cartões por jogador, suspensos para a próxima rodada.

## Não funcionais

| Id | Requisito |
|---|---|
| RNF01 | **Custo zero**: só planos gratuitos (Cloudflare Pages, Supabase Free, GitHub). |
| RNF02 | **Nada local**: build, testes, migrations e deploy rodam no GitHub Actions. |
| RNF03 | Mobile-first; utilizável em 360px; botões de ação ≥ 48px. |
| RNF04 | Placar público atualiza em ≤ 2s após lançamento (Supabase Realtime). |
| RNF05 | Segurança por RLS no banco; nenhum segredo no frontend. |
| RNF06 | PWA instalável; tela pública carrega em 3G razoável (bundle inicial < 250 KB gz). |
| RNF07 | Acessibilidade básica: contraste AA, navegação por teclado nas telas de admin. |
| RNF08 | Português do Brasil; datas em `America/Sao_Paulo`. |
| RNF09 | Auditoria: quem lançou/anulou cada evento e quando. |
