# Diretrizes do Projeto - Arena Limoeiro

## Permissoes e Autonomia Total de Execucao
- Todas as acoes, comandos de terminal, edicoes de arquivos, instalacoes e deploys solicitados pelo usuario estao PRE-AUTORIZADOS.
- O assistente deve executar todas as tarefas proativamente e de forma continua, sem pedir confirmacao ao usuario.
- Nao pausar para pedir permissao.
- Sempre executar o codigo, testar e publicar o resultado final diretamente.

## Regra de Deploy e Sincronização Unificada (Site + APK) - OBRIGATÓRIA
- **Apos TODA alteracao de codigo ou solicitacao de atualizacao**, sempre executar o fluxo completo de sincronizacao 100%:
  1. `node -c public/app.js` — validar sintaxe do JavaScript.
  2. Atualizar cache buster em `public/index.html` (incrementar versao).
  3. `npx.cmd cap sync android` — sincronizar o codigo web identico para dentro do projeto Android nativo.
  4. `git add -A && git commit -m "..."` — commitar todas as alteracoes.
  5. `git push origin main` — push para o GitHub (o Vercel atualiza o site no ar em segundos).
  6. Compilar o APK atualizado com `$env:JAVA_HOME = "C:\Users\PC\.jdks\jbr-21.0.11"` e `.\android\gradlew.bat -p .\android assembleDebug`.
  7. Copiar o APK novo para `C:\Users\PC\Desktop\Aplicativo Arena Limoeiro\Arena-Limoeiro-Nativo.apk`.
  8. Se houver celular conectado via ADB (Wi-Fi ou USB), instalar automaticamente com `adb install -r`.
- **Nunca** entregar uma alteracao apenas no site ou apenas no APK. Ambos devem estar sempre 100% sincronizados.
- Confirmar que o deploy subiu no Vercel: https://arenalimoeiro.vercel.app

## Informacoes do Projeto
- **Producao**: https://arenalimoeiro.vercel.app
- **Repositorio GitHub**: https://github.com/pereraga/arenalimoeiro.git (remote origin push)
- **Stack**: HTML + JS puro (sem bundler) + Supabase + Vercel
- **Arquivo principal**: `public/app.js`
- **Versao atual**: v4.4.9

## Nomenclatura
- "Mensalista" foi substituido por "Fixo" / "Horario Fixo Semanal" em toda a interface.
- Nao reverter essa nomenclatura.

## Fluxo do Cliente (nao alterar)
- Etapa 1: Selecionar campo (clique direto, sem botao "Selecionar")
- Etapa 2: Selecionar data
- Etapa 3: Selecionar horario
- Etapa 4: Resumo e pagamento