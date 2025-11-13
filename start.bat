@echo off
chcp 65001 >nul
echo ======================================
echo   掌握财富运势 - 启动脚本
echo ======================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js ^(^>= 16.0.0^)
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node -v
npm -v
echo.

REM 检查依赖是否已安装
if not exist "backend\node_modules" (
    echo 📦 正在安装后端依赖...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 正在安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

echo.
echo 🚀 正在启动服务...
echo.

REM 启动后端服务
echo 📡 启动后端服务 ^(http://localhost:3000^)...
cd backend
start "后端服务" cmd /c "npm run dev"
cd ..

REM 等待后端服务启动
timeout /t 3 /nobreak >nul

echo ✅ 后端服务启动成功
echo.

REM 启动前端服务
echo 🌐 启动前端服务 ^(http://localhost:5173^)...
echo.
echo ======================================
echo   服务已启动!
echo   前端: http://localhost:5173
echo   后端: http://localhost:3000
echo   关闭窗口即可停止服务
echo ======================================
echo.

cd frontend
call npm run dev

pause
