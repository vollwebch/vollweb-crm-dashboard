@echo off
chcp 65001 >nul
echo ========================================
echo    VOLWEB CRM - Instalador Automático
echo ========================================
echo.

:: Verificar si Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado.
    echo.
    echo Por favor, instala Node.js desde:
    echo https://nodejs.org/
    echo.
    echo Elige la versión LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

:: Instalar dependencias
echo [1/3] Instalando dependencias...
echo Esto puede tardar unos minutos...
echo.
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error al instalar dependencias.
    pause
    exit /b 1
)
echo.
echo [OK] Dependencias instaladas.
echo.

:: Generar cliente Prisma
echo [2/3] Configurando base de datos...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Error al configurar Prisma.
    pause
    exit /b 1
)
echo.

:: Ejecutar migraciones
echo [3/3] Creando base de datos...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [ERROR] Error al crear base de datos.
    pause
    exit /b 1
)
echo.

echo ========================================
echo    ¡INSTALACIÓN COMPLETADA!
echo ========================================
echo.
echo Ahora ejecuta: iniciar.bat
echo.
pause
