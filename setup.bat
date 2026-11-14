@echo off
echo === Installing backend ===
cd /d "%~dp0backend"
call npm install
if not exist .env copy .env.example .env
echo === Installing frontend ===
cd /d "%~dp0frontend"
call npm install
if not exist .env copy .env.example .env
echo.
echo DONE. Now open backend\.env and set DB_PASSWORD to your MySQL password.
echo Then run:  cd backend ^&^& npm run migrate ^&^& npm run seed
echo After that, double-click start.bat
pause
