@echo off
echo 🚀 InspiraView - Tauri Setup
echo.

REM Verificar se Rust está instalado
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Rust não encontrado! Por favor instale em: https://rustup.rs/
    pause
    exit /b 1
)

REM Verificar se Tauri CLI está instalado
where tauri >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Instalando Tauri CLI...
    cargo install tauri-cli
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar Tauri CLI
        pause
        exit /b 1
    )
)

echo ✅ Ambiente configurado com sucesso!
echo.
echo Escolha uma opção:
echo 1. Executar em modo desenvolvimento
echo 2. Compilar para produção
echo 3. Sair
echo.

set /p choice=Digite sua escolha (1-3): 

if "%choice%"=="1" (
    echo 🔧 Iniciando em modo desenvolvimento...
    cd src-tauri
    cargo tauri dev
) else if "%choice%"=="2" (
    echo 🏗️ Compilando para produção...
    cd src-tauri
    cargo tauri build
    echo.
    echo ✅ Build concluído! Executável disponível em:
    echo src-tauri\target\release\bundle\
) else if "%choice%"=="3" (
    echo 👋 Até logo!
) else (
    echo ❌ Opção inválida!
)

pause
