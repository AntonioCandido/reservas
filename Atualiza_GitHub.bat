@echo off
set "MENSAGEM_DO_COMMIT=Atualizacao rapida via script"

echo.
echo === Atualizando o GitHub ===
echo.

echo 1. Buscando as ultimas mudancas do GitHub...
git pull origin main || (echo ATENCAO: Problema ao baixar mudancas. Verifique sua conexao ou conflitos. && pause)

echo 2. Adicionando todos os arquivos novos/modificados...
git add . || (echo ERRO: Nao consegui adicionar os arquivos! && pause && exit /b)

echo 3. Salvando as mudancas locais...
git commit -m "%MENSAGEM_DO_COMMIT%" || (echo Nenhuma mudanca para salvar ou erro no commit. && pause)

echo 4. Enviando tudo para o GitHub...
git push origin main || (echo ERRO: Nao consegui enviar para o GitHub! Verifique suas credenciais ou configuracao. && pause && exit /b)

echo.
echo === PRONTO! Repositorio atualizado. ===
echo.
pause