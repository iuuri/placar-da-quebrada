# ⚽ Placar da Quebrada

Aplicação web para organizar **campeonatos de futebol de bairro**: cadastro de campeonatos, times e jogadores, placar ao vivo com cronômetro, gols, cartões, súmula da partida e tabela de classificação calculada automaticamente.

Inspirada em apps de "Scoreboard", mas com gestão completa do campeonato e visualização pública para a torcida.

## Quem usa

| Perfil | Login? | O que faz |
|---|---|---|
| **Admin** | Sim | Tudo: cria campeonatos, times, jogadores, partidas e usuários operadores |
| **Operador** | Sim | Alimenta os jogos: placar, cronômetro, gols, cartões, súmula |
| **Visitante** | Não | Só visualiza: jogos ao vivo, resultados, tabela, artilharia, cartões |

## Stack (100% nuvem e gratuita)

| Camada | Serviço | Plano |
|---|---|---|
| Frontend (React + Vite + TypeScript + Tailwind) | **Cloudflare Pages** | Free |
| Backend (Auth, API, Realtime, Edge Functions) | **Supabase** | Free |
| Banco de dados (PostgreSQL + RLS) | **Supabase** | Free |
| Código + CI/CD | **GitHub + GitHub Actions** | Free |

Nada roda em máquina local: o código vive no GitHub, o build e o deploy rodam no GitHub Actions, o site fica no Cloudflare e os dados no Supabase.

## Documentação

Comece por [docs/README.md](docs/README.md). Para conectar GitHub, Supabase e Cloudflare, veja [docs/connections.md](docs/connections.md). Instruções para o Claude Code estão em [CLAUDE.md](CLAUDE.md).

## Status

📝 Fase de planejamento — documentação e pipeline prontos, código ainda não iniciado. Veja o [roadmap](docs/roadmap.md).
