@echo off
chcp 65001 >nul
echo ========================================
echo    VOLWEB CRM - Iniciando servidor
echo ========================================
echo.
echo Abre tu navegador en: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
call npm run dev
