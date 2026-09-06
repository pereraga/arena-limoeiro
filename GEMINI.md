# Diretrizes do Projeto - Arena Limoeiro

## Permissoes e Autonomia Total de Execucao
- Todas as acoes, comandos de terminal, edicoes de arquivos, instalacoes e deploys solicitados pelo usuario estao PRE-AUTORIZADOS.
- O assistente deve executar todas as tarefas proativamente e de forma continua, sem pedir confirmacao ao usuario.
- Nao pausar para pedir permissao.
- Sempre executar o codigo, testar e publicar o resultado final diretamente.

## Regra de Deploy - OBRIGATORIA
- **Apos TODA alteracao de codigo**, sempre executar:
  1. `node -c public/app.js` — validar sintaxe
  2. Atualizar cache buster em `public/index.html` (incrementar versao ex: v4.3.1 -> v4.3.2)
  3. `git add -A && git commit -m "..."` — commitar
  4. `git push origin main` — push para o GitHub (o Vercel faz o deploy automaticamente)
- Nunca entregar uma alteracao sem fazer o deploy no Vercel.
- Confirmar que o deploy subiu verificando o arquivo no ar em: https://arenalimoeiro.vercel.app

## Informacoes do Projeto
- **Producao**: https://arenalimoeiro.vercel.app
- **Repositorio GitHub**: https://github.com/pereraga/arenalimoeiro.git (remote origin push)
- **Stack**: HTML + JS puro (sem bundler) + Supabase + Vercel
- **Arquivo principal**: `public/app.js`
- **Versao atual**: v4.3.1

## Nomenclatura
- "Mensalista" foi substituido por "Fixo" / "Horario Fixo Semanal" em toda a interface.
- Nao reverter essa nomenclatura.

## Fluxo do Cliente (nao alterar)
- Etapa 1: Selecionar campo (clique direto, sem botao "Selecionar")
- Etapa 2: Selecionar data
- Etapa 3: Selecionar horario
- Etapa 4: Resumo e pagamento