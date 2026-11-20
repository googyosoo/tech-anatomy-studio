/**
 * Anatomy WebApp Server
 * Lightweight, zero-dependency Node.js HTTP Server
 * Serves the interactive Anatomy Studio, Gallery of Official Examples,
 * and Concept-to-Isometric Generation API.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPT_TEMPLATES } from './src/templates.mjs';
import { generateAnatomyFigure } from './src/generator.mjs';
import { exportBundle } from './src/exporter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const PORT = process.env.PORT || 3400;

// Official Showcase Gallery metadata
const SHOWCASE_ITEMS = [
  {
    id: 'raptor-engine',
    title: 'SpaceX Raptor 2 Test Stand',
    type: 'SVG + WebGL Shader',
    description: '시험 스탠드에 매달려 300 bar 압력으로 붉은 배기 플룸(WebGL 셰이더)을 분사하는 로켓 엔진. 호버 시 11개 어셈블리로 완전 분해(Explode view)되는 최고 난이도 마스터피스.',
    tags: ['Hero Tier', 'WebGL Shader', 'Explode View', 'Lathe & Tube'],
    dir: 'raptor-engine',
    htmlDark: '/examples/raptor-engine/raptor-engine.html',
    htmlLight: '/examples/raptor-engine/raptor-engine-light.html',
    badge: 'Flagship'
  },
  {
    id: 'turning-dial',
    title: 'Precision 3D Turning Dial',
    type: 'True 3D Mode',
    description: '황동과 크롬 재질의 로봇 손이 놓인 다이얼 잠금장치. 드래그 시 실시간 3D 재투영과 4톤 셰이딩이 60fps로 매 프레임 다시 계산되는 3D 모드 쇼케이스.',
    tags: ['3D Mode', 'Turn Runtime', 'Robot Hand', 'Dynamic Shading'],
    dir: 'turning-dial',
    htmlDark: '/examples/turning-dial/turning-dial.html',
    htmlLight: '/examples/turning-dial/turning-dial-light.html',
    badge: '3D Beta'
  },
  {
    id: 'desk-computer',
    title: 'Vintage CRT Desk Computer',
    type: 'Pure SVG',
    description: '85개 솔리드 파트와 850개 패스로 정밀하게 빚어낸 빈티지 데스크톱 컴퓨터. 키보드를 직접 타이핑하면 CRT 평면 화면에 텍스트가 렌더링되며 전원 오프 시 점으로 수축.',
    tags: ['Interactive Typing', 'CRT Projection', '85 Solids', '850 Paths'],
    dir: 'desk-computer',
    htmlDark: '/examples/desk-computer/desk-computer.html',
    htmlLight: '/examples/desk-computer/desk-computer-light.html',
    badge: 'Keyboard Live'
  },
  {
    id: 'arcade-cabinet',
    title: 'Coin-Op Arcade Cabinet',
    type: 'Cutaway Mechanical',
    description: '측면 패널이 열린 업라이트 아케이드 기계. 쿼터 동전을 투입하면 30도 경사로를 굴러 마이크로스위치를 튕기고 펄스가 기판 케이블을 타고 흘러 CRT가 부팅되는 기계식 예술.',
    tags: ['Cutaway Hero', 'Coin Physics', 'Signal Pulse', 'CRT Attract'],
    dir: 'arcade-cabinet',
    htmlDark: '/examples/arcade-cabinet/arcade-cabinet.html',
    htmlLight: '/examples/arcade-cabinet/arcade-cabinet-light.html',
    badge: 'Interactive Hero'
  },
  {
    id: 'ripple-tank',
    title: 'Physics Wave Ripple Tank',
    type: 'SVG + Dual WebGL',
    description: '4개 다리 위의 물리 실험실 수조. 두 개의 진동 팁이 만든 파동 간섭과 바닥 스크린에 투영되는 가성 집속선(Caustics)을 분산 광학 모델과 듀얼 셰이더로 계산.',
    tags: ['Optics Model', 'Caustics Shader', 'Dual Canvas', 'Wave Physics'],
    dir: 'ripple-tank',
    htmlDark: '/examples/ripple-tank/ripple-tank.html',
    htmlLight: '/examples/ripple-tank/ripple-tank-light.html',
    badge: 'Physics'
  },
  {
    id: 'dial-indicator',
    title: 'Dial Gauge Block Comparator',
    type: 'Pure SVG',
    description: '초정밀 게이지 블록과 다이얼 인디케이터 계측기. 마우스로 캐리지를 슬라이딩하면 바늘이 0.1px 단위로 블록 단차를 읽어내는 초경량 300줄 레퍼런스 모델.',
    tags: ['Core Reference', 'Spring Physics', 'Live Dial', 'Minimal'],
    dir: 'dial-indicator',
    htmlDark: '/examples/dial-indicator/dial-indicator.html',
    htmlLight: '/examples/dial-indicator/dial-indicator-light.html',
    badge: 'Clean Spec'
  },
  {
    id: 'push-button',
    title: 'Industrial Push-Button Switch',
    type: 'Pure SVG',
    description: '헤비 베이스 위의 산업용 누름 버튼 스위치 메커니즘. 누를 때 코일 스프링 압축과 단자 접점 연결을 정밀하게 표현.',
    tags: ['Switch', 'Coil Spring', 'Contact Terminal'],
    dir: 'push-button',
    htmlDark: '/examples/push-button/push-button.html',
    htmlLight: '/examples/push-button/push-button-light.html',
    badge: 'Mechanical'
  }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS & Common Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // --- API Routes ---

    // 1. Showcase Gallery List
    if (pathname === '/api/gallery' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, items: SHOWCASE_ITEMS }));
      return;
    }

    // 2. Built-in Concepts List
    if (pathname === '/api/concepts' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, concepts: CONCEPT_TEMPLATES }));
      return;
    }

    // 3. Generate Concept Figure
    if (pathname === '/api/generate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const conceptId = body.conceptId || 'token-bucket';
      const options = body.options || {};

      const result = generateAnatomyFigure(conceptId, options);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result }));
      return;
    }

    // 4. Export Figure Bundle
    if (pathname === '/api/export' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const conceptId = body.conceptId || 'token-bucket';
      const format = body.format || 'html';
      const options = body.options || {};

      const figureData = generateAnatomyFigure(conceptId, options);
      const bundle = exportBundle(figureData, format, options);

      res.writeHead(200, {
        'Content-Type': bundle.mimeType,
        'Content-Disposition': `attachment; filename="${bundle.filename}"`
      });
      res.end(bundle.content);
      return;
    }

    // --- Static File Serving ---

    // Root path -> serve webapp/public/index.html
    if (pathname === '/' || pathname === '/index.html') {
      serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'));
      return;
    }

    // Serve from webapp/public
    const publicFilePath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(publicFilePath) && fs.statSync(publicFilePath).isFile()) {
      serveStaticFile(res, publicFilePath);
      return;
    }

    // Serve from examples/ (for embedded iframe viewers)
    if (pathname.startsWith('/examples/')) {
      const exampleFilePath = path.join(ROOT_DIR, pathname);
      if (fs.existsSync(exampleFilePath) && fs.statSync(exampleFilePath).isFile()) {
        serveStaticFile(res, exampleFilePath);
        return;
      }
    }

    // Serve kit files if needed
    if (pathname.startsWith('/kit/')) {
      const kitFilePath = path.join(ROOT_DIR, pathname);
      if (fs.existsSync(kitFilePath) && fs.statSync(kitFilePath).isFile()) {
        serveStaticFile(res, kitFilePath);
        return;
      }
    }

    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mime });
  res.end(content);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 Anatomy Interactive Studio & WebApp running!`);
    console.log(`🔗 Local URL: http://localhost:${port}`);
    console.log(`🎨 Concept Generator & Official Gallery ready.`);
    console.log(`========================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server startup error:', err);
    }
  });
}

startServer(PORT);
