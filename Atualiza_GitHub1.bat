@echo off
echo Verificando e atualizando o repositório Git...
echo.

:: Navega para o diretório atual onde o script esta sendo executado
:: (Assumindo que este script esta no diretorio raiz do repositorio)
cd /d "%~dp0"

:: Verifica se o Git esta instalado e acessivel
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Git nao encontrado. Certifique-se de que o Git esta instalado e no PATH.
    echo Baixe e instale o Git em: https://git-scm.com/downloads
    goto :eof
)

:: Puxa as ultimas alteracoes do repositorio remoto (fetch)
echo Executando git fetch...
git fetch

:: Junta as alteracoes do branch remoto para o branch local (merge)
echo Executando git pull...
git pull

:: Verifica se houve erros durante o pull
if %errorlevel% neq 0 (
    echo ERRO: Nao foi possivel atualizar o repositorio. Verifique sua conexao ou conflitos.
) else (
    echo Repositorio atualizado com sucesso!
)

echo.
pause