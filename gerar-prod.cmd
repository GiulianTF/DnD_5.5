@echo off
REM Atalho para dar duplo-clique no Windows — chama o script PowerShell.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gerar-prod.ps1"
pause
