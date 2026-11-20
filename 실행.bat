@echo off
chcp 65001 > nul
title Anatomy Studio - 로컬 실행기

echo ==========================================================
echo   Anatomy Studio - 아이소메트릭 기계 일러스트 웹앱
echo   (100%% 서버 없는 정적 웹앱 - GitHub Pages 호환)
echo ==========================================================
echo.
echo 브라우저에서 Anatomy Studio를 실행합니다...
echo 경로: %~dp0site\index.html
echo.

start "" "%~dp0site\index.html"

echo 실행이 완료되었습니다. 창을 닫으셔도 웹앱은 계속 동작합니다.
timeout /t 3 > nul
exit
