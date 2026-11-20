/**
 * Anatomy Studio — Standalone Browser Edition (2026 Impeccable Standard)
 * Zero-Server, 100% Client-Side Interactive Isometric Technical Illustrating Engine.
 * Supports Bring-Your-Own Gemini API Key (stored purely in browser localStorage).
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. ISO-KIT GEOMETRY & MATH CORE (Client-Side Vector Math Engine)
  // =========================================================================

  const AZIMUTH = 45;
  const ELEVATION = 30;
  const SHADES = 4;
  const RADIANS = Math.PI / 180;
  const UNIT = Math.sqrt(1.6);

  function cameraOf({ scale = 1, azimuth = AZIMUTH, elevation = ELEVATION }) {
    const a = azimuth * RADIANS;
    const e = elevation * RADIANS;
    return { sinA: Math.sin(a), cosA: Math.cos(a), sinE: Math.sin(e), cosE: Math.cos(e), k: scale * UNIT };
  }

  function iso([x, y, z], projection) {
    const { origin } = projection;
    const { sinA, cosA, sinE, cosE, k } = cameraOf(projection);
    return [origin[0] + (x * sinA - y * cosA) * k, origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * k];
  }

  function towardViewer(projection) {
    const { sinA, cosA } = cameraOf(projection);
    return [cosA, sinA];
  }

  function depthOf([x, y, z], projection) {
    const { sinA, cosA, sinE, cosE } = cameraOf(projection);
    return (x * cosA + y * sinA) * cosE + z * sinE;
  }

  const tenth = (value) => {
    const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
    return text === "-0" ? "0" : text;
  };

  function pathOf(points, closed = false) {
    if (!points.length) return "";
    return points.map(([x, y], at) => `${at ? "L" : "M"}${tenth(x)} ${tenth(y)}`).join("") + (closed ? "Z" : "");
  }

  function roundedPlan({ x, y, w, d, r }, steps = 8) {
    const radius = Math.max(0, Math.min(r, w / 2, d / 2));
    const corners = [
      [x + w - radius, y + radius, -90],
      [x + w - radius, y + d - radius, 0],
      [x + radius, y + d - radius, 90],
      [x + radius, y + radius, 180],
    ];
    if (radius === 0) return corners.map(([cx, cy]) => [cx, cy]);
    const points = [];
    corners.forEach(([cx, cy, start]) => {
      for (let s = 0; s <= steps; s++) {
        const rad = (start + (s / steps) * 90) * RADIANS;
        points.push([cx + Math.cos(rad) * radius, cy + Math.sin(rad) * radius]);
      }
    });
    return points;
  }

  function circleRing(cx, cy, radius, steps = 32) {
    const points = [];
    for (let i = 0; i < steps; i++) {
      const rad = ((i / steps) * 360) * RADIANS;
      points.push([cx + Math.cos(rad) * radius, cy + Math.sin(rad) * radius]);
    }
    return points;
  }

  function ringOf(plan, steps = 8) {
    return Array.isArray(plan) ? plan : roundedPlan(plan, steps);
  }

  function extrude(ring, z, height, projection, { convex = false, bevel = 0 } = {}) {
    const topZ = z + height;
    const count = ring.length;
    const top2d = ring.map(([rx, ry]) => iso([rx, ry, topZ], projection));
    const bot2d = ring.map(([rx, ry]) => iso([rx, ry, z], projection));
    const topPath = pathOf(top2d, true);

    const shades = Array.from({ length: SHADES }, () => []);
    const outlines = [];
    const [vx, vy] = towardViewer(projection);

    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[next];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy);
      if (len < 1e-4) continue;
      const nx = -dy / len;
      const ny = dx / len;
      const dot = nx * vx + ny * vy;
      if (convex && dot <= 0) continue;

      const tone = Math.min(SHADES - 1, Math.max(0, Math.floor(((dot + 1) / 2) * SHADES)));
      const quad = [bot2d[i], bot2d[next], top2d[next], top2d[i]];
      shades[tone].push(pathOf(quad, true));
      outlines.push(pathOf([top2d[i], top2d[next]]));
    }

    return { top: topPath, shades: shades.map(paths => paths.join("")), outline: outlines.join("") };
  }

  function slabOf(plan, z, height, projection, steps = 8, bevel = 0) {
    return extrude(ringOf(plan, steps), z, height, projection, { convex: true, bevel });
  }

  function cylinder(cx, cy, radius, z, height, projection, steps = 32, bevel = 0) {
    return extrude(circleRing(cx, cy, radius, steps), z, height, projection, { convex: true, bevel });
  }

  function knurl(cx, cy, radius, z0, z1, count, projection) {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      const p0 = iso([px, py, z0], projection);
      const p1 = iso([px, py, z1], projection);
      lines.push(pathOf([p0, p1]));
    }
    return lines.join("");
  }

  function coil(from, to, center, radius, turns, axis, projection, perTurn = 16) {
    const count = Math.max(1, Math.round(turns * perTurn));
    const back = [];
    const front = [];
    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const t1 = (i + 1) / count;
      const a0 = t0 * turns * Math.PI * 2;
      const a1 = t1 * turns * Math.PI * 2;

      let p0, p1;
      if (axis === 'y') {
        const y0 = from + t0 * (to - from);
        const y1 = from + t1 * (to - from);
        p0 = [center[0] + Math.cos(a0) * radius, y0, center[1] + Math.sin(a0) * radius];
        p1 = [center[0] + Math.cos(a1) * radius, y1, center[1] + Math.sin(a1) * radius];
      } else {
        const z0 = from + t0 * (to - from);
        const z1 = from + t1 * (to - from);
        p0 = [center[0] + Math.cos(a0) * radius, center[1] + Math.sin(a0) * radius, z0];
        p1 = [center[0] + Math.cos(a1) * radius, center[1] + Math.sin(a1) * radius, z1];
      }
      const s0 = iso(p0, projection);
      const s1 = iso(p1, projection);
      if (Math.sin(a0) < 0) {
        back.push(pathOf([s0, s1]));
      } else {
        front.push(pathOf([s0, s1]));
      }
    }
    return { back: back.join(""), front: front.join("") };
  }

  function topTicks(from, to, step, every, edge, z, lengths, projection, axis = "x") {
    const minor = [];
    const major = [];
    const first = Math.ceil(from / step) * step;
    let idx = 0;
    for (let v = first; v <= to; v += step, idx++) {
      const isMajor = idx % every === 0;
      const len = isMajor ? lengths[1] : lengths[0];
      let p0, p1;
      if (axis === "x") {
        p0 = [v, edge, z];
        p1 = [v, edge - len, z];
      } else {
        p0 = [edge, v, z];
        p1 = [edge - len, v, z];
      }
      const s0 = iso(p0, projection);
      const s1 = iso(p1, projection);
      const path = pathOf([s0, s1]);
      if (isMajor) major.push(path);
      else minor.push(path);
    }
    return { minor: minor.join(""), major: major.join("") };
  }

  function radialTicks(cx, cy, radius, count, every, z, lengths, projection) {
    const minor = [];
    const major = [];
    for (let i = 0; i < count; i++) {
      const isMajor = i % every === 0;
      const len = isMajor ? lengths[1] : lengths[0];
      const angle = (i / count) * Math.PI * 2;
      const p0 = [cx + Math.cos(angle) * (radius - len), cy + Math.sin(angle) * (radius - len), z];
      const p1 = [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, z];
      const s0 = iso(p0, projection);
      const s1 = iso(p1, projection);
      const path = pathOf([s0, s1]);
      if (isMajor) major.push(path);
      else minor.push(path);
    }
    return { minor: minor.join(""), major: major.join("") };
  }

  function fitProjection(points, width, height, { pad = 24, headroom = 0, azimuth = AZIMUTH, elevation = ELEVATION } = {}) {
    const unit = { origin: [0, 0], scale: 1, azimuth, elevation };
    const flat = points.map((point) => iso(point, unit));
    const xs = flat.map(([x]) => x);
    const ys = flat.map(([, y]) => y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const up = Math.min(...ys);
    const down = Math.max(...ys);
    const scale = Math.min((width - pad * 2) / (right - left), (height - pad * 2 - headroom) / (down - up));
    return {
      origin: [width / 2 - ((left + right) / 2) * scale, headroom + (height - headroom) / 2 - ((up + down) / 2) * scale],
      scale,
      azimuth,
      elevation,
    };
  }

  function solidSvg(solid, { tone = "hi", lit = false, seamless = false } = {}) {
    const litAttr = lit ? ' data-lit="true"' : "";
    const seamAttr = seamless ? ' data-seamless="true"' : "";
    const shades = solid.shades.map((s, i) => s ? `<path class="iso-shade" data-shade="${i}" d="${s}"/>` : "").join("");
    return `<g class="iso-solid" data-tone="${tone}"${litAttr}${seamAttr}>
      <path class="iso-fill" d="${solid.top}"/>
      ${shades}
      <path class="iso-top" d="${solid.top}"/>
      <path class="iso-line iso-edge" d="${solid.outline}"/>
    </g>`;
  }

  function lineSvg(d, { tone = "lo", dotted = false, dashed = false, flow = false } = {}) {
    if (!d) return "";
    let extra = "";
    if (dotted) extra += ' data-dotted="true"';
    if (dashed) extra += ' data-dashed="true"';
    if (flow) extra += ' data-flow="true"';
    return `<path class="iso-line" data-tone="${tone}" d="${d}"${extra}/>`;
  }

  function dotsSvg(points, { size = 0.5, tone = "mid" } = {}) {
    const circles = points.map(([x, y]) => `<circle cx="${tenth(x)}" cy="${tenth(y)}" r="${size}"/>`).join("");
    return `<g class="iso-dots" data-tone="${tone}">${circles}</g>`;
  }

  function wireSvg(from, to, { tone = "lo", size = 1.2 } = {}) {
    const d = pathOf([from, to]);
    return `<g class="iso-wire" data-tone="${tone}">
      ${lineSvg(d, { tone })}
      <circle class="iso-wire-end" cx="${tenth(from[0])}" cy="${tenth(from[1])}" r="${size}"/>
      <circle class="iso-wire-end" cx="${tenth(to[0])}" cy="${tenth(to[1])}" r="${size}"/>
    </g>`;
  }

  function plateHtml({ fig, title, hint, readout = "", body }) {
    const corner = (name, text, extra = "") => `<span class="iso-plate-corner" data-corner="${name}"${extra}>${text}</span>`;
    return `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true">${corner("fig", fig)}${title ? corner("title", title) : ""}${hint ? corner("hint", hint) : ""}${corner("readout", readout, " data-readout")}</div><div class="iso-plate-body">${body}</div></div></figure>`;
  }

  const ISO_CSS = `
.iso{
  --anatomy-page:#0b0b0b;--anatomy-card:#131313;--anatomy-text:#a3a3a3;--anatomy-strong:#e6e6e6;--anatomy-muted:#6e6e6e;
  --anatomy-paper:#131313;--anatomy-face:#1b1b1b;--anatomy-top:#1c1c1c;
  --anatomy-shade-0:#0f0f0f;--anatomy-shade-1:#121212;--anatomy-shade-2:#151515;--anatomy-shade-3:#181818;
  --anatomy-lit-top:#262626;--anatomy-lit-shade:#1d1d1d;
  --anatomy-hi:#d4d4d4;--anatomy-mid:#6a6a6a;--anatomy-lo:#3e3e3e;--anatomy-faint:#2a2a2a;--anatomy-lit:#ffffff;
  --anatomy-halo:#050505;--anatomy-halo-opacity:.9;--anatomy-dot:#e6e6e6;
  --anatomy-red:#ff6b6b;--anatomy-green:#6be0a0;--anatomy-blue:#6b9bff;
  --anatomy-weight:.6px;--anatomy-ease:cubic-bezier(.32,.72,0,1);
  --anatomy-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --anatomy-lift:inset 0 1px 0 0 #ffffff0a,inset 0 0 0 1px #ffffff06,0 0 0 1px #00000026,0 1px 1px -.5px #00000014,0 3px 3px -1.5px #00000014,0 6px 6px -3px #00000014,0 12px 12px -6px #00000014;
}
.iso[data-theme="light"]{
  --anatomy-page:#f2f2ef;--anatomy-card:#fbfbfa;--anatomy-text:#57575a;--anatomy-strong:#18181a;--anatomy-muted:#8c8c90;
  --anatomy-paper:#fbfbfa;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
  --anatomy-shade-0:#dcdcd9;--anatomy-shade-1:#e5e5e2;--anatomy-shade-2:#ededea;--anatomy-shade-3:#f4f4f1;
  --anatomy-lit-top:#ffffff;--anatomy-lit-shade:#eeeeeb;
  --anatomy-hi:#26262a;--anatomy-mid:#8a8a8f;--anatomy-lo:#b4b4b8;--anatomy-faint:#d4d4d6;--anatomy-lit:#000000;
  --anatomy-halo:#8a8a80;--anatomy-halo-opacity:.32;--anatomy-dot:#3a3a3e;
  --anatomy-red:#e5484d;--anatomy-green:#30a46c;--anatomy-blue:#3e63dd;
  --anatomy-lift:inset 0 1px 0 0 #ffffff,0 0 0 1px #0000000f,0 1px 1px -.5px #0000000a,0 3px 3px -1.5px #0000000a,0 6px 6px -3px #0000000a,0 12px 12px -6px #0000000a;
}
.iso-figure{margin:0;width:100%}
.iso-plate{background:var(--anatomy-card);box-shadow:var(--anatomy-lift);border-radius:10px;padding:16px 20px;position:relative;width:100%;box-sizing:border-box}
.iso-plate-corners{display:flex;justify-content:space-between;align-items:center;padding:4px 0 12px;font:12px/1.4 var(--anatomy-mono);color:var(--anatomy-muted);pointer-events:none}
.iso-plate-corner[data-corner="fig"]{color:var(--anatomy-strong);font-weight:600}
.iso-plate-corner[data-corner="readout"]{color:var(--anatomy-text);font-variant-numeric:tabular-nums}
.iso-plate-body{width:100%;overflow:visible}
.iso-svg{display:block;width:100%;height:auto;overflow:visible}
.iso-svg path,.iso-svg circle{vector-effect:non-scaling-stroke}
.iso-fill{fill:var(--anatomy-paper);stroke:none}
.iso-solid[data-lit]>.iso-fill{fill:var(--anatomy-face)}
.iso-shade,.iso-top{stroke:none}
.iso-shade[data-shade="0"]{fill:var(--anatomy-shade-0)}
.iso-shade[data-shade="1"]{fill:var(--anatomy-shade-1)}
.iso-shade[data-shade="2"]{fill:var(--anatomy-shade-2)}
.iso-shade[data-shade="3"]{fill:var(--anatomy-shade-3)}
.iso-top{fill:var(--anatomy-top)}
.iso-solid[data-lit]>.iso-top{fill:var(--anatomy-lit-top)}
.iso-solid[data-lit]>.iso-shade{fill:var(--anatomy-lit-shade)}
.iso-line{fill:none;stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);stroke-linecap:round;stroke-linejoin:round}
.iso-line[data-tone="hi"]{stroke:var(--anatomy-hi)}
.iso-line[data-tone="mid"]{stroke:var(--anatomy-mid)}
.iso-line[data-tone="lo"]{stroke:var(--anatomy-lo)}
.iso-line[data-tone="faint"]{stroke:var(--anatomy-faint)}
.iso-line[data-tone="lit"]{stroke:var(--anatomy-lit)}
.iso-wire-end{fill:var(--anatomy-paper);stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight)}
.iso-dots circle{fill:var(--anatomy-dot);stroke:none;opacity:.4}
`;

  // =========================================================================
  // 2. OFFICIAL SHOWCASE GALLERY DATA (Relative Paths for GitHub Pages)
  // =========================================================================

  const GALLERY_ITEMS = [
    {
      id: 'raptor-engine',
      title: 'SpaceX Raptor 2 Test Stand',
      type: 'SVG + WebGL Shader',
      description: '시험 스탠드에 매달려 300 bar 압력으로 붉은 배기 플룸(WebGL 셰이더)을 분사하는 로켓 엔진. 호버 시 11개 어셈블리로 완전 분해(Explode view)되는 최고 난이도 마스터피스.',
      tags: ['Hero Tier', 'WebGL Shader', 'Explode View', 'Lathe & Tube'],
      htmlDark: './examples/raptor-engine/raptor-engine.html',
      htmlLight: './examples/raptor-engine/raptor-engine-light.html',
      badge: 'Flagship'
    },
    {
      id: 'turning-dial',
      title: 'Precision 3D Turning Dial',
      type: 'True 3D Mode',
      description: '황동과 크롬 재질의 로봇 손이 놓인 다이얼 잠금장치. 드래그 시 실시간 3D 재투영과 4톤 셰이딩이 60fps로 매 프레임 다시 계산되는 3D 모드 쇼케이스.',
      tags: ['3D Mode', 'Turn Runtime', 'Robot Hand', 'Dynamic Shading'],
      htmlDark: './examples/turning-dial/turning-dial.html',
      htmlLight: './examples/turning-dial/turning-dial-light.html',
      badge: '3D Beta'
    },
    {
      id: 'desk-computer',
      title: 'Vintage CRT Desk Computer',
      type: 'Pure SVG',
      description: '85개 솔리드 파트와 850개 패스로 정밀하게 빚어낸 빈티지 데스크톱 컴퓨터. 키보드를 직접 타이핑하면 CRT 평면 화면에 텍스트가 렌더링되며 전원 오프 시 점으로 수축.',
      tags: ['Interactive Typing', 'CRT Projection', '85 Solids', '850 Paths'],
      htmlDark: './examples/desk-computer/desk-computer.html',
      htmlLight: './examples/desk-computer/desk-computer-light.html',
      badge: 'Keyboard Live'
    },
    {
      id: 'arcade-cabinet',
      title: 'Coin-Op Arcade Cabinet',
      type: 'Cutaway Mechanical',
      description: '측면 패널이 열린 업라이트 아케이드 기계. 쿼터 동전을 투입하면 30도 경사로를 굴러 마이크로스위치를 튕기고 펄스가 기판 케이블을 타고 흘러 CRT가 부팅되는 기계식 예술.',
      tags: ['Cutaway Hero', 'Coin Physics', 'Signal Pulse', 'CRT Attract'],
      htmlDark: './examples/arcade-cabinet/arcade-cabinet.html',
      htmlLight: './examples/arcade-cabinet/arcade-cabinet-light.html',
      badge: 'Interactive Hero'
    },
    {
      id: 'ripple-tank',
      title: 'Physics Wave Ripple Tank',
      type: 'SVG + Dual WebGL',
      description: '4개 다리 위의 물리 실험실 수조. 두 개의 진동 팁이 만든 파동 간섭과 바닥 스크린에 투영되는 가성 집속선(Caustics)을 분산 광학 모델과 듀얼 셰이더로 계산.',
      tags: ['Optics Model', 'Caustics Shader', 'Dual Canvas', 'Wave Physics'],
      htmlDark: './examples/ripple-tank/ripple-tank.html',
      htmlLight: './examples/ripple-tank/ripple-tank-light.html',
      badge: 'Physics'
    },
    {
      id: 'dial-indicator',
      title: 'Dial Gauge Block Comparator',
      type: 'Pure SVG',
      description: '초정밀 게이지 블록과 다이얼 인디케이터 계측기. 마우스로 캐리지를 슬라이딩하면 바늘이 0.1px 단위로 블록 단차를 읽어내는 초경량 300줄 레퍼런스 모델.',
      tags: ['Core Reference', 'Spring Physics', 'Live Dial', 'Minimal'],
      htmlDark: './examples/dial-indicator/dial-indicator.html',
      htmlLight: './examples/dial-indicator/dial-indicator-light.html',
      badge: 'Clean Spec'
    },
    {
      id: 'push-button',
      title: 'Industrial Push-Button Switch',
      type: 'Pure SVG',
      description: '헤비 베이스 위의 산업용 누름 버튼 스위치 메커니즘. 누를 때 코일 스프링 압축과 단자 접점 연결을 정밀하게 표현.',
      tags: ['Switch', 'Coil Spring', 'Contact Terminal'],
      htmlDark: './examples/push-button/push-button.html',
      htmlLight: './examples/push-button/push-button-light.html',
      badge: 'Mechanical'
    }
  ];

  // =========================================================================
  // 3. MASTERPIECE CONCEPT TEMPLATES LIBRARY (9 Built-ins)
  // =========================================================================

  const CONCEPT_TEMPLATES = [
    {
      id: "token-bucket",
      title: "Token Bucket Rate Limiter",
      category: "Distributed Systems & Networking",
      summary: "일정 주기로 생성되는 토큰을 버킷에 채우고 요청마다 토큰을 소모하여 트래픽 버스트를 완충하는 알고리즘",
      metaphor: "정밀 황동 토큰 디스크가 일정 클럭 속도로 수직 아크릴 튜브로 떨어지고, 하단 공압 댐퍼 서보 셔터가 네트워크 패킷 버스트당 토큰을 배출하며 유량 다이얼을 갱신하는 정밀 분배 장치.",
      partsCount: 64,
      specs: { capacity: 10, refillRate: "2.0 tokens/sec", burstAllowance: "150%", springTension: "320 N/m" },
      defaultParams: { tokens: 6, maxTokens: 10, inflowRate: 2, pressure: 2.8 },
      readoutFormat: (val) => `Bucket: ${val.tokens.toFixed(1)} / ${val.maxTokens} tokens · Flow: ${(val.pressure * 14.7).toFixed(1)} psi · Status: ${val.tokens >= 1 ? "PASSED (200 OK)" : "RATE_LIMITED (429)"}`,
      cardFig: "Fig 1",
      cardTitle: "Token bucket rate limiter",
      hint: "마우스를 좌우로 움직여 트래픽 버스트 조절 · 클릭/스페이스로 토큰 수동 투입"
    },
    {
      id: "lru-cache",
      title: "LRU Cache Memory Rack",
      category: "Operating Systems & Memory",
      summary: "최근에 가장 적게 사용된 엔트리를 우선적으로 제거하여 고속 캐시 공간을 유지하는 알고리즘",
      metaphor: "최신도 순서대로 정렬된 알루미늄 메모리 블록 트레이. 랙-앤-피니언 갠트리 캐리지가 Hot 블록을 선두로 재배치하고 가장 오래된 Cold 블록을 축출 호퍼로 밀어내는 기계식 셔틀.",
      partsCount: 78,
      specs: { slots: 4, busSpeed: "100 MHz Ultra-Wide", gripperForce: "45 N", hitRatio: "94.2%" },
      defaultParams: { activeSlot: 2, hitRate: 0.94, evictions: 12 },
      readoutFormat: (val) => `Slot [${val.activeSlot + 1}/4] Active · LRU Gantry: ${val.activeSlot === 3 ? "CACHE_HIT (L1 Fast)" : "CACHE_MISS_EVICT"} · Hit Rate: 94.2% · Bus: READY`,
      cardFig: "Fig 2",
      cardTitle: "LRU cache gantry shuttle",
      hint: "슬롯 위로 마우스를 슬라이드하여 캐시 엔트리 조회 및 갠트리 이동"
    },
    {
      id: "database-wal",
      title: "Database Write-Ahead Logging Engine",
      category: "Database Engines & Storage",
      summary: "트랜잭션의 영속성과 ACID 원자성을 위해 메인 디스크 수정 전 순차 로그 파일에 선행 기록하는 엔진",
      metaphor: "회전하는 인덱스 데이터 플래터 앞을 달리는 연속 순차 펀치 테이프 릴. 펀치 바늘이 LSN(Log Sequence Number)을 각인하고 fsync 동기화가 확인된 후에만 메인 디스크 플래터에 커밋하는 동기화 장비.",
      partsCount: 82,
      specs: { syncMode: "fsync-always", lsn: 1048576, tapeFeed: "12 mm/s", durability: "100%" },
      defaultParams: { lsn: 1048576, headPressure: 85 },
      readoutFormat: (val) => `LSN: 0x${Math.round(val.lsn).toString(16).toUpperCase()} · Sync: FSYNC_OK · Punch Head: ${val.headPressure.toFixed(0)} kPa · Durability: 100%`,
      cardFig: "Fig 3",
      cardTitle: "Write-ahead logging recorder",
      hint: "마우스 위치에 따라 순차 트랜잭션 로그가 전진하고 디스크 커밋 바늘이 동기화됩니다"
    },
    {
      id: "gpu-pipeline",
      title: "GPU Shader Execution Pipeline",
      category: "Computer Graphics & Hardware",
      summary: "버텍스 셰이딩, 래스터라이징, 프래그먼트 셰이딩으로 이어지는 하드웨어 그래픽스 렌더링 파이프라인",
      metaphor: "원시 다각형 와이어프레임 블랭크가 정밀 프레스(Vertex Stage), 미세 핀 매트릭스 그리드(Rasterizer), 4색 안료 분사 노즐(Fragment Stage)을 순차 통과하는 3단 계단식 제조 갠트리.",
      partsCount: 94,
      specs: { stages: "Vertex -> Raster -> Fragment", warpSize: 32, clockRate: "2.4 GHz", throughput: "144 Gpix/s" },
      defaultParams: { stageProgress: 0.65, activeWarps: 28, fillRate: 144, dieTemp: 68.5 },
      readoutFormat: (val) => `Pipeline: ${(val.stageProgress * 100).toFixed(0)}% · Active Warps: ${Math.round(val.activeWarps)}/32 · Throughput: ${val.fillRate} Gpix/s · Temp: ${val.dieTemp.toFixed(1)}°C`,
      cardFig: "Fig 4",
      cardTitle: "GPU graphics shader pipeline",
      hint: "마우스를 좌우로 드래그하여 지오메트리 큐브를 파이프라인 단계별로 통과시킵니다"
    },
    {
      id: "kafka-bus",
      title: "Kafka Event Stream Partition Bus",
      category: "Message Queues & Streaming",
      summary: "대용량 실시간 이벤트 스트림을 여러 파티션으로 분산 저장하고 독립된 컨슈머 오프셋으로 추적하는 시스템",
      metaphor: "상부 호퍼에서 굴러떨어지는 볼 베어링 메시지가 3개의 파티션 슈트 레일로 분기되고, 각 레일 끝의 래칫 스텝퍼 휠이 컨슈머 오프셋을 순차적으로 전진시키는 분류 기계.",
      partsCount: 72,
      specs: { partitions: 3, ackMode: "all", lagOffset: 0, ingestRate: "350 msg/sec" },
      defaultParams: { partition: 1, offset: 4892, flowRate: 350 },
      readoutFormat: (val) => `Partition: P-${val.partition} · Offset: ${Math.round(val.offset)} · Ingest: ${Math.round(val.flowRate)} msg/s · Consumer Lag: 0`,
      cardFig: "Fig 5",
      cardTitle: "Distributed partition event bus",
      hint: "마우스 위치에 따라 파티션 레일이 선택되고 컨슈머 오프셋 휠이 회전합니다"
    },
    {
      id: "zk-lock",
      title: "Zero-Knowledge Proof Mystery Lock",
      category: "Cryptography & Security",
      summary: "비밀값(Witness) 자체를 노출하지 않고도 명제와 수식의 유효성만을 증명하는 영지식 증명 암호학 메커니즘",
      metaphor: "내부에 은폐된 미로 핀 텀블러 실린더. 편심 캠이 회전하면서 비밀 키의 홈 깊이를 외부에 보이지 않고도 대수적 다항식 제약 조건이 100% 일치함을 기계적으로 확인하는 비밀 락 장비.",
      partsCount: 68,
      specs: { curve: "BLS12-381", constraints: "4096 R1CS", soundness: "2^-128" },
      defaultParams: { rotation: 45, verified: true },
      readoutFormat: (val) => `Cam Angle: ${val.rotation.toFixed(1)}° · Constraint: ${val.verified ? "SATISFIED (VALID)" : "SEARCHING..."} · Soundness: 2^-128`,
      cardFig: "Fig 6",
      cardTitle: "Zero-knowledge verification lock",
      hint: "다이얼 크라운을 회전시켜 비밀 위트니스 캠과 공용 제약 핀을 일치시키세요"
    },
    {
      id: "raft-consensus",
      title: "Raft Consensus Heartbeat Cluster",
      category: "Distributed Consensus",
      summary: "분산 노드 간의 상태 머신 복제와 리더 선출, 하트비트 동기화를 보장하는 합의 알고리즘",
      metaphor: "3개의 기계식 실린더 노드가 원형 베이스에 배치되고, 중앙의 리더 노드에서 뻗어나온 펄스 캠축이 일정한 틱 속도로 팔로워 실린더의 피스톤을 동기화시키는 합의 링.",
      partsCount: 86,
      specs: { quorum: "2/3 Nodes Majority", term: 14, heartbeatInterval: "150 ms" },
      defaultParams: { term: 14, quorumSync: true },
      readoutFormat: (val) => `Term: ${val.term} · Leader: Node-A · Quorum: 3/3 Replicated · Heartbeat: 150ms · State: COMMITTED`,
      cardFig: "Fig 7",
      cardTitle: "Raft state machine replication ring",
      hint: "마우스를 이동하여 네트워크 지연을 시뮬레이션하고 합의 펄스를 확인하세요"
    },
    {
      id: "lsm-tree",
      title: "LSM-Tree MemTable & SSTable Compactor",
      category: "Storage Systems",
      summary: "메모리 상의 MemTable에 고속 순차 쓰기 후 불변 SSTable로 플러시하고 계층별 병합(Compaction)하는 스토리지 엔진",
      metaphor: "상단의 회전식 황동 인메모리 버퍼 휠에서 데이터 블록이 고속 적재되고, 한계에 도달하면 하단 계층형 슬라이딩 플레이트(Level 0/1/2)로 압축 프레스가 눌러 병합하는 계층 분쇄기.",
      partsCount: 92,
      specs: { writeAmplification: "1.8x", memtableSize: "64 MB", compactionRatio: "10:1" },
      defaultParams: { level: 1, flushProgress: 0.72 },
      readoutFormat: (val) => `MemTable: ${(val.flushProgress * 100).toFixed(0)}% Fill · Compacting: Level-${val.level} -> ${val.level + 1} · IOPS: 48,000`,
      cardFig: "Fig 8",
      cardTitle: "LSM-Tree compaction press",
      hint: "마우스로 MemTable 유입량을 조절하여 SSTable 플러시 및 계층 압축을 유도하세요"
    },
    {
      id: "transformer-attention",
      title: "Transformer Multi-Head Attention Matrix",
      category: "Artificial Intelligence & LLM",
      summary: "Query, Key, Value 벡터의 내적과 소프트맥스 행렬곱을 통해 시퀀스 내 토큰 간의 맥락적 가중치를 계산하는 어텐션 엔진",
      metaphor: "3중 가이드 레일을 따라 이동하는 Q/K/V 프리즘 갠트리와, 그 아래 교차 지점에서 빛을 굴절시켜 가중치 스팟을 형성하는 다이아몬드 편광 매트릭스 플레이트.",
      partsCount: 98,
      specs: { heads: 8, dModel: 512, attentionKernel: "FlashAttention-3" },
      defaultParams: { headIndex: 2, sparsity: 0.88, temperature: 0.7 },
      readoutFormat: (val) => `Head: [3/8] · Softmax Temperature: ${val.temperature.toFixed(2)} · Attention Sparsity: ${(val.sparsity * 100).toFixed(0)}% · Kernel: FlashAttention-3`,
      cardFig: "Fig 9",
      cardTitle: "Multi-head attention optical prism",
      hint: "마우스 위치로 토큰 간의 쿼리-키 교차점을 이동시켜 어텐션 스팟을 점등합니다"
    }
  ];

  function findTemplate(id) {
    return CONCEPT_TEMPLATES.find(t => t.id === id) || CONCEPT_TEMPLATES[0];
  }

  // =========================================================================
  // 4. GEOMETRY GENERATOR & MODEL BUILDERS
  // =========================================================================

  function generateAnatomyFigure(conceptId, customOptions = {}) {
    let template = findTemplate(conceptId);
    if (customOptions.customPrompt) {
      template = synthesizeConceptMeta(customOptions.customPrompt, template, customOptions.aiMeta);
    }

    const options = { ...template.defaultParams, ...customOptions };
    const W = 900;
    const H = 560;
    const azimuth = options.azimuth || 42;
    const elevation = options.elevation || 30;

    const boundingPoints = [
      [-190, -120, 0],
      [190, 120, 260],
      [-190, 120, 0],
      [190, -120, 0]
    ];
    const P = fitProjection(boundingPoints, W, H, { pad: 48, azimuth, elevation });

    let modelData;
    switch (template.id) {
      case 'token-bucket':
        modelData = buildTokenBucketModel(P, options);
        break;
      case 'lru-cache':
        modelData = buildLruCacheModel(P, options);
        break;
      case 'database-wal':
        modelData = buildDatabaseWalModel(P, options);
        break;
      case 'gpu-pipeline':
        modelData = buildGpuPipelineModel(P, options);
        break;
      case 'kafka-bus':
        modelData = buildKafkaBusModel(P, options);
        break;
      case 'zk-lock':
        modelData = buildZkLockModel(P, options);
        break;
      case 'raft-consensus':
        modelData = buildRaftModel(P, options);
        break;
      case 'lsm-tree':
        modelData = buildLsmTreeModel(P, options);
        break;
      case 'transformer-attention':
        modelData = buildTransformerAttentionModel(P, options);
        break;
      default:
        modelData = buildGenericParametricModel(P, template, options);
        break;
    }

    const { parts, liveScript, stats } = modelData;

    const svgContent = `<svg class="iso-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${template.title}">
      <defs>
        <filter id="halo-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <g class="iso-model-group">
        ${parts.join('\n')}
      </g>
    </svg>`;

    const plate = plateHtml({
      fig: template.cardFig,
      title: template.cardTitle,
      hint: template.hint,
      readout: template.readoutFormat ? template.readoutFormat(options) : `${template.cardTitle} · Ready`,
      body: svgContent
    });

    const standaloneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${template.title} — Anatomy</title>
  <style>
    ${ISO_CSS}
    * { box-sizing: border-box; }
    html { color-scheme: ${options.theme === 'light' ? 'light' : 'dark'}; }
    body {
      margin: 0;
      padding: 32px 16px;
      background: var(--anatomy-page);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font: 14px/1.6 ui-sans-serif, system-ui, -apple-system, sans-serif;
    }
    .iso-stage {
      width: min(900px, 100% - 32px);
    }
  </style>
</head>
<body class="iso" data-theme="${options.theme === 'light' ? 'light' : 'dark'}">
  <main class="iso-stage">
    ${plate}
  </main>
  <script type="module">
    ${liveScript}
  </script>
</body>
</html>`;

    return {
      id: template.id,
      template,
      svgContent,
      plateHtml: plate,
      standaloneHtml,
      partsCount: stats.solidsCount,
      stats,
      options
    };
  }

  function synthesizeConceptMeta(cleanPrompt, baseTemplate, aiMeta = null) {
    if (aiMeta) {
      return {
        id: "ai-" + cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: aiMeta.title || cleanPrompt,
        category: aiMeta.category || "AI Synthesized Concept",
        summary: aiMeta.summary || `${cleanPrompt} 개념을 물리적 기계 메커니즘으로 구현`,
        metaphor: aiMeta.metaphor || `A precision apparatus engineered for ${cleanPrompt}`,
        partsCount: 65,
        specs: aiMeta.specs || { Mode: "Gemini AI Synthesized", Precision: "0.1mm" },
        defaultParams: { tokens: 6, pressure: 2.8 },
        readoutFormat: (val) => `${cleanPrompt} · AI Synthesized · Real-time Sync`,
        cardFig: "Fig AI",
        cardTitle: (aiMeta.title || cleanPrompt).toLowerCase(),
        hint: "마우스를 이동하여 AI 합성 메커니즘을 작동하고 실시간 계측값을 확인하세요"
      };
    }

    const lower = cleanPrompt.toLowerCase();
    if (lower.includes("raft") || lower.includes("consensus")) return { ...findTemplate("raft-consensus"), title: cleanPrompt };
    if (lower.includes("lsm") || lower.includes("storage") || lower.includes("compaction")) return { ...findTemplate("lsm-tree"), title: cleanPrompt };
    if (lower.includes("attention") || lower.includes("transformer") || lower.includes("llm")) return { ...findTemplate("transformer-attention"), title: cleanPrompt };
    if (lower.includes("cache") || lower.includes("memory")) return { ...findTemplate("lru-cache"), title: cleanPrompt };
    if (lower.includes("stream") || lower.includes("queue") || lower.includes("kafka")) return { ...findTemplate("kafka-bus"), title: cleanPrompt };

    return {
      id: "custom-" + cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: cleanPrompt,
      category: "Parametric Mechanical Synthesis",
      summary: `${cleanPrompt} 개념의 핵심 작동 원리를 아이소메트릭 정밀 기계로 시각화`,
      metaphor: `A precision electro-mechanical rig custom-crafted to demonstrate ${cleanPrompt}, equipped with dual guide rails, spring dampers, and calibrated indicator dials.`,
      partsCount: 58,
      specs: { Mode: "Parametric Heuristic", Precision: "0.1 mm Tolerance" },
      defaultParams: { tokens: 6, pressure: 2.5 },
      readoutFormat: (val) => `${cleanPrompt} · Status: SYNCHRONIZED · Load: 100% · Rate: Optimal`,
      cardFig: "Fig X",
      cardTitle: cleanPrompt.toLowerCase(),
      hint: "마우스를 이동하여 메커니즘을 작동하고 실시간 계측값을 확인하세요"
    };
  }

  // Individual Model Builders
  function buildTokenBucketModel(P, options) {
    const parts = [];
    let solidsCount = 0;
    const at = (pt) => iso(pt, P);

    const basePlan = { x: -160, y: -100, w: 320, d: 200, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.2), { tone: 'lo' }));
    solidsCount++;

    const corners = [[-145, -85, 16], [145, -85, 16], [-145, 85, 16], [145, 85, 16]].map(at);
    parts.push(dotsSvg(corners, { size: 0.6, tone: 'hi' }));

    const ticks = topTicks(-130, 130, 8, 4, 90, 16, [2, 4], P, 'x');
    parts.push(lineSvg(ticks.minor, { tone: 'lo' }), lineSvg(ticks.major, { tone: 'mid' }));

    const pedPlan = { x: -100, y: -65, w: 200, d: 130, r: 4 };
    parts.push(solidSvg(slabOf(pedPlan, 16, 10, P, 6, 0.8), { tone: 'mid' }));
    solidsCount++;

    [[-75, -45], [75, -45], [-75, 45], [75, 45]].forEach(([px, py]) => {
      parts.push(solidSvg(cylinder(px, py, 5, 26, 140, P, 24), { tone: 'lo' }));
      solidsCount++;
    });

    const topBridge = { x: -85, y: -55, w: 170, d: 110, r: 6 };
    parts.push(solidSvg(slabOf(topBridge, 166, 14, P, 6, 1.0), { tone: 'mid' }));
    solidsCount++;

    parts.push(solidSvg(cylinder(0, 0, 18, 180, 26, P, 28), { tone: 'hi' }));
    parts.push(lineSvg(knurl(0, 0, 18.5, 188, 202, 24, P), { tone: 'lo' }));
    solidsCount++;

    parts.push(solidSvg(cylinder(0, 0, 36, 26, 140, P, 32), { tone: 'lo', seamless: true }));
    solidsCount++;

    const numTokens = Math.min(options.tokens !== undefined ? options.tokens : 6, 10);
    parts.push('<g id="token-stack">');
    for (let i = 0; i < 10; i++) {
      const tz = 32 + i * 13;
      const isPresent = i < numTokens;
      const tokenSolid = cylinder(0, 0, 30, tz, 8, P, 28);
      parts.push(`  <g class="token-item" data-index="${i}" style="transition: opacity 0.2s; opacity: ${isPresent ? 1 : 0.08};">
        ${solidSvg(tokenSolid, { tone: isPresent ? 'hi' : 'faint', lit: isPresent && i === numTokens - 1 })}
      </g>`);
      solidsCount++;
    }
    parts.push('</g>');

    const dialX = 120, dialY = 0, dialZ = 65, dialR = 20;
    parts.push(solidSvg(cylinder(dialX, dialY, dialR, dialZ, 10, P, 28), { tone: 'lo' }));
    solidsCount++;

    const radTicks = radialTicks(dialX, dialY, dialR - 2, 20, 4, dialZ + 10, [1.5, 3.5], P);
    parts.push(lineSvg(radTicks.minor, { tone: 'mid' }), lineSvg(radTicks.major, { tone: 'hi' }));

    const needleCenter = at([dialX, dialY, dialZ + 10.5]);
    const needleTip = at([dialX + 11, dialY + 11, dialZ + 10.5]);
    parts.push(`<g id="dial-gauge-needle">${lineSvg(pathOf([needleCenter, needleTip]), { tone: 'lit' })}</g>`);
    parts.push(wireSvg(at([36, 0, 65]), at([dialX - dialR, dialY, dialZ + 5]), { tone: 'mid', size: 1.2 }));

    parts.push('<g id="sliding-gate">');
    const gatePlan = { x: -35, y: -20, w: 70, d: 40, r: 3 };
    parts.push(solidSvg(slabOf(gatePlan, 18, 8, P, 4, 0.6), { tone: 'lit', lit: true }));
    solidsCount++;
    parts.push('</g>');

    const damperCoil = coil(-45, -20, [0, -32], 8, 5, 'y', P);
    parts.push(lineSvg(damperCoil.back, { tone: 'lo' }), lineSvg(damperCoil.front, { tone: 'mid' }));

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        const gate = plate.querySelector("#sliding-gate");
        const tokens = plate.querySelectorAll(".token-item");
        let currentTokens = ${numTokens}, maxTokens = 10, targetShift = 0, currentShift = 0, pressure = 2.8;

        function updateReadout() {
          const text = "Bucket: " + currentTokens.toFixed(1) + " / " + maxTokens + " tokens · Flow: " + (pressure * 14.7).toFixed(1) + " psi · Status: " + (currentTokens >= 1 ? "PASSED (200 OK)" : "RATE_LIMITED (429)");
          if (readout) readout.textContent = text;
        }

        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          targetShift = (share - 0.5) * 35;
          pressure = 1.5 + share * 3.2;
          currentTokens = Math.max(0, Math.min(maxTokens, maxTokens - share * 7.5));
          tokens.forEach((el, idx) => el.style.opacity = idx < Math.round(currentTokens) ? "1" : "0.08");
          updateReadout();
        });

        plate.addEventListener("click", () => {
          currentTokens = Math.min(maxTokens, currentTokens + 1);
          tokens.forEach((el, idx) => el.style.opacity = idx < Math.round(currentTokens) ? "1" : "0.08");
          updateReadout();
        });

        function loop() {
          currentShift += (targetShift - currentShift) * 0.15;
          if (gate) gate.setAttribute("transform", "translate(" + (currentShift * 0.8) + ", " + (currentShift * 0.4) + ")");
          requestAnimationFrame(loop);
        }
        loop();
        updateReadout();
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 24 } };
  }

  function buildLruCacheModel(P, options) {
    const parts = [];
    let solidsCount = 0;
    const at = (pt) => iso(pt, P);

    const basePlan = { x: -180, y: -90, w: 360, d: 180, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    const ticks = topTicks(-150, 150, 8, 5, 80, 16, [2, 4], P, 'x');
    parts.push(lineSvg(ticks.minor, { tone: 'lo' }), lineSvg(ticks.major, { tone: 'mid' }));

    const slotW = 60, slotD = 110, slotGap = 16, startX = -138;
    for (let i = 0; i < 4; i++) {
      const sx = startX + i * (slotW + slotGap);
      const bayPlan = { x: sx, y: -55, w: slotW, d: slotD, r: 4 };
      parts.push(solidSvg(slabOf(bayPlan, 16, 8, P, 4, 0.6), { tone: 'mid' }));
      solidsCount++;

      const isHot = i === 3, isCold = i === 0;
      const blockTone = isHot ? 'lit' : isCold ? 'lo' : 'hi';
      const blockPlan = { x: sx + 5, y: -48, w: slotW - 10, d: slotD - 14, r: 3 };
      parts.push(`<g class="cache-block" data-slot="${i}">${solidSvg(slabOf(blockPlan, 24, 22, P, 4, 0.5), { tone: blockTone, lit: isHot })}</g>`);
      solidsCount++;
      parts.push(dotsSvg([at([sx + slotW / 2, -50, 25])], { size: 0.5, tone: isHot ? 'lit' : 'mid' }));
    }

    parts.push(solidSvg(cylinder(0, -70, 4, 90, 320, P, 20), { tone: 'mid' }));
    parts.push(solidSvg(cylinder(0, 50, 4, 90, 320, P, 20), { tone: 'mid' }));
    solidsCount += 2;

    parts.push(solidSvg(cylinder(-160, 0, 6, 16, 80, P, 20), { tone: 'lo' }));
    parts.push(solidSvg(cylinder(160, 0, 6, 16, 80, P, 20), { tone: 'lo' }));
    solidsCount += 2;

    parts.push('<g id="lru-shuttle">');
    const carriagePlan = { x: -24, y: -75, w: 48, d: 130, r: 4 };
    parts.push(solidSvg(slabOf(carriagePlan, 84, 14, P, 4, 0.6), { tone: 'hi' }));
    parts.push(solidSvg(cylinder(0, 0, 10, 60, 24, P, 20), { tone: 'lit', lit: true }));
    solidsCount += 2;
    parts.push('</g>');

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        const shuttle = plate.querySelector("#lru-shuttle");
        let currentX = 0, targetX = 0, activeSlot = 2;

        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          activeSlot = Math.min(3, Math.floor(share * 4));
          targetX = (share - 0.5) * 220;
          if (readout) readout.textContent = "Slot [" + (activeSlot + 1) + "/4] Active · LRU Gantry: " + (activeSlot === 3 ? "CACHE_HIT (L1 Fast)" : "CACHE_MISS_EVICT") + " · Ratio: 94.2% · Bus: READY";
        });

        function loop() {
          currentX += (targetX - currentX) * 0.12;
          if (shuttle) shuttle.setAttribute("transform", "translate(" + (currentX * 0.86) + ", " + (currentX * 0.5) + ")");
          requestAnimationFrame(loop);
        }
        loop();
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 28 } };
  }

  function buildDatabaseWalModel(P, options) {
    const parts = [];
    let solidsCount = 0;
    const at = (pt) => iso(pt, P);

    const basePlan = { x: -160, y: -90, w: 320, d: 180, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    parts.push(solidSvg(cylinder(-80, 0, 52, 16, 28, P, 32), { tone: 'mid' }));
    parts.push(solidSvg(cylinder(-80, 0, 20, 44, 16, P, 24), { tone: 'hi' }));
    solidsCount += 2;

    parts.push('<g id="wal-punch-head">');
    const punchArmPlan = { x: -90, y: 45, w: 20, d: 35, h: 10, r: 3 };
    parts.push(solidSvg(slabOf(punchArmPlan, 40, 10, P, 4, 0.5), { tone: 'hi' }));
    parts.push(solidSvg(cylinder(-80, 65, 3, 16, 26, P, 16), { tone: 'lit', lit: true }));
    solidsCount += 2;
    parts.push('</g>');

    parts.push(solidSvg(cylinder(80, 0, 62, 16, 14, P, 32), { tone: 'lo' }));
    parts.push(solidSvg(cylinder(80, 0, 58, 30, 8, P, 32), { tone: 'hi' }));
    parts.push(solidSvg(cylinder(80, 0, 14, 38, 18, P, 24), { tone: 'lit' }));
    solidsCount += 3;

    [26, 40, 50].forEach((r) => {
      const t = radialTicks(80, 0, r, 16, 4, 38, [1, 2], P);
      parts.push(lineSvg(t.minor, { tone: 'mid' }));
    });

    parts.push(wireSvg(at([-60, 30, 48]), at([60, 20, 48]), { tone: 'lit', size: 1.2 }));

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        const punch = plate.querySelector("#wal-punch-head");
        let lsn = 1048576, punchY = 0;

        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = (e.clientX - rect.left) / rect.width;
          lsn = 1048576 + Math.floor(share * 2048);
          punchY = Math.sin(share * Math.PI * 8) * 10;
          if (punch) punch.setAttribute("transform", "translate(0, " + punchY + ")");
          if (readout) readout.textContent = "LSN: 0x" + Math.round(lsn).toString(16).toUpperCase() + " · Sync: FSYNC_OK · Punch: " + (punchY > 5 ? "STAMPING" : "ADVANCING") + " · Durability: 100%";
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 20 } };
  }

  function buildGpuPipelineModel(P, options) {
    const parts = [];
    let solidsCount = 0;

    const basePlan = { x: -180, y: -80, w: 360, d: 160, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    const stages = [-110, 0, 110];
    stages.forEach((sx, idx) => {
      const sPlan = { x: sx - 40, y: -50, w: 80, d: 100, r: 4 };
      parts.push(solidSvg(slabOf(sPlan, 16, 10, P, 4, 0.6), { tone: 'mid' }));
      solidsCount++;

      if (idx === 0) {
        parts.push(solidSvg(cylinder(sx, 0, 20, 55, 32, P, 24), { tone: 'hi' }));
        solidsCount++;
      } else if (idx === 1) {
        const t = topTicks(sx - 25, sx + 25, 6, 3, 0, 27, [2, 4], P, 'x');
        parts.push(lineSvg(t.major, { tone: 'hi' }));
      } else {
        parts.push(solidSvg(cylinder(sx - 12, -12, 6, 58, 24, P, 18), { tone: 'lit', lit: true }));
        parts.push(solidSvg(cylinder(sx + 12, 12, 6, 58, 24, P, 18), { tone: 'hi' }));
        solidsCount += 2;
      }
    });

    parts.push('<g id="gpu-carrier">');
    const carrierPlan = { x: -16, y: -16, w: 32, d: 32, r: 3 };
    parts.push(solidSvg(slabOf(carrierPlan, 28, 20, P, 4, 0.5), { tone: 'lit', lit: true }));
    solidsCount++;
    parts.push('</g>');

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        const carrier = plate.querySelector("#gpu-carrier");
        let currentX = 0, targetX = 0;

        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          targetX = (share - 0.5) * 230;
          const stage = share < 0.33 ? "VERTEX_SHADER" : share < 0.66 ? "RASTERIZER" : "FRAGMENT_DYE";
          if (readout) readout.textContent = "Pipeline: " + Math.round(share * 100) + "% · Stage: " + stage + " · Warps: " + (24 + Math.round(share * 8)) + "/32 · 144 fps";
        });

        function loop() {
          currentX += (targetX - currentX) * 0.14;
          if (carrier) carrier.setAttribute("transform", "translate(" + (currentX * 0.86) + ", " + (currentX * 0.5) + ")");
          requestAnimationFrame(loop);
        }
        loop();
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 22 } };
  }

  function buildKafkaBusModel(P, options) {
    const parts = [];
    let solidsCount = 0;

    const basePlan = { x: -160, y: -80, w: 320, d: 160, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    [-40, 0, 40].forEach((cy, idx) => {
      const chutePlan = { x: -130, y: cy - 10, w: 260, d: 20, r: 3 };
      parts.push(solidSvg(slabOf(chutePlan, 16, 8, P, 4, 0.5), { tone: 'mid' }));
      solidsCount++;

      const dialSolid = cylinder(130, cy, 12, 20, 10, P, 20);
      parts.push(solidSvg(dialSolid, { tone: idx === 1 ? 'lit' : 'hi', lit: idx === 1 }));
      solidsCount++;
    });

    parts.push(solidSvg(cylinder(-110, 0, 28, 60, 36, P, 28), { tone: 'hi' }));
    solidsCount++;

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const partition = share < 0.33 ? 0 : share < 0.66 ? 1 : 2;
          if (readout) readout.textContent = "Partition: P-" + partition + " · Offset: " + (4800 + Math.round(share * 350)) + " · Ingest: " + (280 + Math.round(share * 120)) + " msg/s · Lag: 0";
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 18 } };
  }

  function buildZkLockModel(P, options) {
    const parts = [];
    let solidsCount = 0;

    const basePlan = { x: -140, y: -90, w: 280, d: 180, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 18, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    parts.push(solidSvg(cylinder(0, 0, 65, 18, 60, P, 32), { tone: 'mid' }));
    solidsCount++;

    parts.push('<g id="zk-tumbler">');
    parts.push(solidSvg(cylinder(0, 0, 44, 58, 38, P, 28), { tone: 'hi' }));
    parts.push(lineSvg(knurl(0, 0, 44.5, 82, 96, 28, P), { tone: 'lo' }));
    solidsCount++;
    parts.push('</g>');

    [0, 1, 2].forEach((i) => {
      const angle = i * 0.7;
      const px = Math.cos(angle) * 68;
      const py = Math.sin(angle) * 68;
      parts.push(solidSvg(cylinder(px, py, 5, 45, 18, P, 16), { tone: 'hi' }));
      solidsCount++;
    });

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        const tumbler = plate.querySelector("#zk-tumbler");
        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const angle = share * 180;
          const match = Math.abs(angle - 90) < 15;
          if (readout) readout.textContent = "Cam Angle: " + angle.toFixed(1) + "° · Constraint: " + (match ? "SATISFIED (VALID)" : "SEARCHING...") + " · Soundness: 2^-128";
          if (tumbler) tumbler.setAttribute("transform", "rotate(" + (share * 60 - 30) + " 440 270)");
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 18 } };
  }

  function buildRaftModel(P, options) {
    const parts = [];
    let solidsCount = 0;
    const at = (pt) => iso(pt, P);

    parts.push(solidSvg(cylinder(0, 0, 130, 0, 18, P, 36), { tone: 'lo' }));
    solidsCount++;

    const angles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    angles.forEach((ang, idx) => {
      const nx = Math.cos(ang) * 75;
      const ny = Math.sin(ang) * 75;
      const isLeader = idx === 0;

      parts.push(solidSvg(cylinder(nx, ny, 24, 18, 20, P, 24), { tone: isLeader ? 'hi' : 'mid' }));
      parts.push(solidSvg(cylinder(nx, ny, 16, 38, isLeader ? 35 : 22, P, 20), { tone: isLeader ? 'lit' : 'hi', lit: isLeader }));
      solidsCount += 2;
      parts.push(wireSvg(at([0, 0, 30]), at([nx, ny, 30]), { tone: isLeader ? 'lit' : 'mid', size: 1.4 }));
    });

    parts.push(solidSvg(cylinder(0, 0, 22, 18, 30, P, 24), { tone: 'lit', lit: true }));
    solidsCount++;

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const quorum = share > 0.3 ? "3/3 Quorum (Synced)" : "2/3 Quorum (Degraded)";
          if (readout) readout.textContent = "Term: 14 · Leader: Node-A · " + quorum + " · Heartbeat: " + (120 + Math.round(share * 60)) + "ms · State: COMMITTED";
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 22 } };
  }

  function buildLsmTreeModel(P, options) {
    const parts = [];
    let solidsCount = 0;

    const basePlan = { x: -170, y: -90, w: 340, d: 180, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 18, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    parts.push(solidSvg(cylinder(0, 0, 55, 80, 24, P, 32), { tone: 'lit', lit: true }));
    parts.push(lineSvg(knurl(0, 0, 55.5, 90, 102, 32, P), { tone: 'hi' }));
    solidsCount++;

    const levels = [
      { z: 18, h: 12, w: 260, d: 130, tone: 'lo' },
      { z: 34, h: 12, w: 200, d: 100, tone: 'mid' },
      { z: 50, h: 12, w: 140, d: 70, tone: 'hi' }
    ];

    levels.forEach((lvl) => {
      const plan = { x: -lvl.w / 2, y: -lvl.d / 2, w: lvl.w, d: lvl.d, r: 4 };
      parts.push(solidSvg(slabOf(plan, lvl.z, lvl.h, P, 4, 0.6), { tone: lvl.tone }));
      solidsCount++;
    });

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const fill = Math.round(share * 100);
          const level = share < 0.4 ? "L0 -> L1" : "L1 -> L2";
          if (readout) readout.textContent = "MemTable: " + fill + "% Fill · Compacting: " + level + " · IOPS: " + (32000 + fill * 250);
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 24 } };
  }

  function buildTransformerAttentionModel(P, options) {
    const parts = [];
    let solidsCount = 0;

    const basePlan = { x: -160, y: -100, w: 320, d: 200, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    const gridTicks = topTicks(-130, 130, 10, 5, 80, 16, [2, 5], P, 'x');
    parts.push(lineSvg(gridTicks.major, { tone: 'hi' }), lineSvg(gridTicks.minor, { tone: 'mid' }));

    const railY = [-50, 0, 50];
    railY.forEach((ry, idx) => {
      parts.push(solidSvg(cylinder(0, ry, 5, 75, 280, P, 20), { tone: 'mid' }));
      solidsCount++;

      const prismPlan = { x: -20, y: ry - 14, w: 40, d: 28, r: 2 };
      parts.push(solidSvg(slabOf(prismPlan, 65, 24, P, 4, 0.5), { tone: idx === 1 ? 'lit' : 'hi', lit: idx === 1 }));
      solidsCount++;
    });

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        plate.addEventListener("pointermove", (e) => {
          const rect = plate.getBoundingClientRect();
          const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const head = Math.min(8, Math.floor(share * 8) + 1);
          if (readout) readout.textContent = "Head: [" + head + "/8] · Softmax Temp: " + (0.5 + share * 0.5).toFixed(2) + " · Sparsity: " + Math.round(share * 100) + "% · Kernel: FlashAttention-3";
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 26 } };
  }

  function buildGenericParametricModel(P, template, options) {
    const parts = [];
    let solidsCount = 0;

    const basePlan = { x: -160, y: -90, w: 320, d: 180, r: 8 };
    parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
    solidsCount++;

    const subPlan = { x: -100, y: -60, w: 200, d: 120, r: 4 };
    parts.push(solidSvg(slabOf(subPlan, 16, 12, P, 4, 0.6), { tone: 'mid' }));
    solidsCount++;

    parts.push(solidSvg(cylinder(0, 0, 42, 28, 70, P, 28), { tone: 'hi' }));
    parts.push(solidSvg(cylinder(0, 0, 30, 92, 18, P, 24), { tone: 'lit', lit: true }));
    solidsCount += 2;

    const liveScript = `
      const plate = document.querySelector(".iso-plate");
      if (plate) {
        const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
        plate.addEventListener("pointermove", () => {
          if (readout) readout.textContent = "${template.title} · Active · Rate: 100%";
        });
      }
    `;

    return { parts, liveScript, stats: { solidsCount, partsTotal: solidsCount + 16 } };
  }

  // =========================================================================
  // 5. EXPORT SUITE (Browser-side File & Code Bundler)
  // =========================================================================

  function exportBundle(figureData, format = 'html', options = {}) {
    const { template, standaloneHtml, svgContent } = figureData;
    const theme = options.theme || 'dark';

    switch (format) {
      case 'svg':
        return {
          filename: `${template.id}-figure.svg`,
          mimeType: 'image/svg+xml',
          content: wrapPureSvg(svgContent, theme)
        };
      case 'react':
        return {
          filename: `${toPascalCase(template.id)}Figure.tsx`,
          mimeType: 'text/typescript',
          content: generateReactTsx(figureData)
        };
      case 'blueprint':
        return {
          filename: `${template.id}-blueprint-a4.html`,
          mimeType: 'text/html',
          content: generateBlueprintA4(figureData)
        };
      case 'embed':
        return {
          filename: `${template.id}-embed.html`,
          mimeType: 'text/html',
          content: `<iframe src="./examples/${template.id}/${template.id}.html" width="100%" height="600" style="border:none; border-radius:12px; overflow:hidden;" title="${template.title} — Anatomy"></iframe>`
        };
      case 'html':
      default:
        return {
          filename: `${template.id}-interactive.html`,
          mimeType: 'text/html',
          content: standaloneHtml
        };
    }
  }

  function wrapPureSvg(svgContent, theme) {
    const isLight = theme === 'light';
    const styles = `
      <style>
        .iso-fill { fill: ${isLight ? '#fbfbfa' : '#131313'}; }
        .iso-shade[data-shade="0"] { fill: ${isLight ? '#dcdcd9' : '#0f0f0f'}; }
        .iso-shade[data-shade="1"] { fill: ${isLight ? '#e5e5e2' : '#121212'}; }
        .iso-shade[data-shade="2"] { fill: ${isLight ? '#ededea' : '#151515'}; }
        .iso-shade[data-shade="3"] { fill: ${isLight ? '#f4f4f1' : '#181818'}; }
        .iso-top { fill: ${isLight ? '#ffffff' : '#1c1c1c'}; }
        .iso-solid[data-lit] > .iso-top { fill: ${isLight ? '#ffffff' : '#262626'}; }
        .iso-solid[data-lit] > .iso-shade { fill: ${isLight ? '#eeeeeb' : '#1d1d1d'}; }
        .iso-line { stroke: ${isLight ? '#b4b4b8' : '#3e3e3e'}; stroke-width: 0.6px; fill: none; }
        .iso-line[data-tone="hi"] { stroke: ${isLight ? '#26262a' : '#d4d4d4'}; }
        .iso-line[data-tone="mid"] { stroke: ${isLight ? '#8a8a8f' : '#6a6a6a'}; }
        .iso-line[data-tone="lit"] { stroke: ${isLight ? '#000000' : '#ffffff'}; }
        .iso-wire-end { fill: ${isLight ? '#fbfbfa' : '#131313'}; stroke: ${isLight ? '#8a8a8f' : '#6a6a6a'}; stroke-width: 0.6px; }
        .iso-dots circle { fill: ${isLight ? '#3a3a3e' : '#e6e6e6'}; }
      </style>
    `;
    return svgContent.replace('<svg class="iso-svg"', `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg"`).replace('</defs>', `</defs>${styles}`);
  }

  function toPascalCase(str) {
    return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  function generateReactTsx(figureData) {
    const { template, svgContent } = figureData;
    const compName = toPascalCase(template.id) + 'Figure';
    return `import React, { useEffect, useRef, useState } from 'react';

/**
 * ${template.title}
 * Concept: ${template.summary}
 * Metaphor: ${template.metaphor}
 */
export interface ${compName}Props {
  theme?: 'dark' | 'light';
  className?: string;
}

export const ${compName}: React.FC<${compName}Props> = ({ theme = 'dark', className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [readoutText, setReadoutText] = useState('${template.cardTitle} · Ready');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setReadoutText(\`${template.cardTitle} · Step: \${Math.round(share * 100)}%\`);
    };
    el.addEventListener('pointermove', handlePointerMove);
    return () => el.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <figure ref={containerRef} className={\`iso-figure iso \${className}\`} data-theme={theme} style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div className="iso-plate" style={{ position: 'relative' }}>
        <div className="iso-plate-corners" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, opacity: 0.8 }}>
          <span className="iso-plate-corner" data-corner="fig">${template.cardFig}</span>
          <span className="iso-plate-corner" data-corner="title">${template.cardTitle}</span>
        </div>
        <div className="iso-stage-body" style={{ width: '100%' }}>
          <div dangerouslySetInnerHTML={{ __html: \`${svgContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
        </div>
        <div className="iso-plate-corners" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12 }}>
          <span className="iso-plate-corner" data-corner="hint" style={{ opacity: 0.6 }}>${template.hint}</span>
          <span className="iso-plate-corner" data-corner="readout" style={{ fontFamily: 'ui-monospace, monospace' }}>{readoutText}</span>
        </div>
      </div>
      <figcaption style={{ fontSize: 13, marginTop: 8, opacity: 0.75, textAlign: 'center' }}>
        <strong>${template.title}</strong> — ${template.summary}
      </figcaption>
    </figure>
  );
};

export default ${compName};
`;
  }

  function generateBlueprintA4(figureData) {
    const { template, svgContent } = figureData;
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${template.title} — Technical Patent Blueprint</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 24px; background: #0a192f; color: #8892b0;
      font-family: "Courier New", Courier, monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;
    }
    .blueprint-frame {
      width: 100%; max-width: 980px; border: 2px solid #64ffda; box-shadow: 0 0 25px rgba(100, 255, 218, 0.2); padding: 20px; background: #0f2038;
    }
    .blueprint-header { display: flex; justify-content: space-between; border-bottom: 1px dashed #64ffda; padding-bottom: 12px; margin-bottom: 16px; color: #64ffda; }
    .blueprint-header h1 { margin: 0; font-size: 18px; letter-spacing: 0.1em; text-transform: uppercase; }
    .blueprint-svg { width: 100%; filter: drop-shadow(0 0 4px rgba(100, 255, 218, 0.4)); }
    .blueprint-svg path { stroke: #64ffda !important; fill: #0c1a2d !important; fill-opacity: 0.4 !important; }
    .blueprint-svg line { stroke: #64ffda !important; }
    .blueprint-footer { display: flex; justify-content: space-between; border-top: 1px dashed #64ffda; padding-top: 10px; margin-top: 14px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="blueprint-frame">
    <div class="blueprint-header">
      <div>
        <h1>ANATOMY SCHEMATIC // ${template.cardFig}</h1>
        <div style="font-size: 12px; opacity: 0.8;">SPECIFICATION: ${template.title.toUpperCase()}</div>
      </div>
      <div style="text-align: right; font-size: 12px;">
        <div>PROJECT: ANATOMY-STUDIO</div>
        <div>SCALE: 1:1 METRIC ISO</div>
      </div>
    </div>
    <div class="blueprint-svg">${svgContent}</div>
    <div class="blueprint-footer">
      <div>METAPHOR: ${template.metaphor}</div>
      <div>CLASSIFICATION: OPEN-SOURCE TECHNICAL ISOMETRIC</div>
    </div>
  </div>
</body>
</html>`;
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // 6. GEMINI API CLIENT (Bring Your Own Key, localStorage Only)
  // =========================================================================

  const STORAGE_KEY = 'anatomy_gemini_api_key';

  function getStoredApiKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setStoredApiKey(key) {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function callGeminiApi(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are the master mechanical architect of the Anatomy project. 
The core philosophy is "The object is the explanation." Do not draw boxes and arrows; invent a real, recognizable, precision physical machine whose working is the concept.
Convert the given concept into a structured JSON with:
{
  "title": "Title of Concept",
  "category": "Domain Category",
  "summary": "1 sentence explanation in Korean",
  "metaphor": "1 sentence detailed physical machine metaphor in Korean",
  "specs": { "key1": "val1", "key2": "val2", "key3": "val3" }
}
Output strictly valid JSON only.`;

    const payload = {
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nConcept to visualize: "${prompt}"` }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const resData = await response.json();
    const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error("No response generated from Gemini.");
    return JSON.parse(candidateText);
  }

  // =========================================================================
  // 7. APP CONTROLLER & UI LIFECYCLE
  // =========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    const state = {
      theme: 'dark',
      viewerTheme: 'dark',
      activeTab: 'showcase',
      viewMode: 'solid',
      zoomLevel: 1.0,
      selectedShowcase: GALLERY_ITEMS[0],
      currentConceptId: 'token-bucket',
      currentFigureData: null,
      tunerParams: {
        azimuth: 42,
        elevation: 30,
        tokens: 6,
        pressure: 2.8,
        blueprintMode: false
      }
    };

    // Tab Navigation
    const tabButtons = {
      showcase: document.getElementById('tab-btn-showcase'),
      studio: document.getElementById('tab-btn-studio'),
      tuner: document.getElementById('tab-btn-tuner'),
      export: document.getElementById('tab-btn-export')
    };
    const tabPanes = {
      showcase: document.getElementById('tab-content-showcase'),
      studio: document.getElementById('tab-content-studio'),
      tuner: document.getElementById('tab-content-tuner'),
      export: document.getElementById('tab-content-export')
    };

    function switchTab(tabId) {
      state.activeTab = tabId;
      Object.keys(tabButtons).forEach(key => {
        const btn = tabButtons[key];
        const pane = tabPanes[key];
        if (key === tabId) {
          btn.classList.add('bg-neutral-800', 'text-white', 'shadow-sm', 'border', 'border-neutral-700/50');
          btn.classList.remove('text-neutral-400');
          pane.classList.remove('hidden');
        } else {
          btn.classList.remove('bg-neutral-800', 'text-white', 'shadow-sm', 'border', 'border-neutral-700/50');
          btn.classList.add('text-neutral-400');
          pane.classList.add('hidden');
        }
      });
      if (window.lucide) window.lucide.createIcons();
      if (tabId === 'tuner' && state.currentFigureData) {
        updateTunerPreview();
      }
    }

    Object.keys(tabButtons).forEach(key => {
      tabButtons[key].addEventListener('click', () => switchTab(key));
    });

    // 3-Step Guide Click Handlers
    document.querySelectorAll('.step-card-jump').forEach(card => {
      card.addEventListener('click', () => {
        const targetTab = card.getAttribute('data-tab');
        if (targetTab) switchTab(targetTab);
      });
    });

    // Theme Toggle
    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
      document.documentElement.setAttribute('data-theme', state.theme);

      const sunIcon = themeToggleBtn.querySelector('.light-icon');
      const moonIcon = themeToggleBtn.querySelector('.dark-icon');
      if (state.theme === 'light') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
      if (state.currentConceptId) loadConceptFigure(state.currentConceptId);
    });

    // Showcase Gallery Logic
    const showcaseCardsContainer = document.getElementById('showcase-cards');
    const showcaseIframe = document.getElementById('showcase-iframe');
    const activeModelTitle = document.getElementById('active-model-title');
    const activeModelBadge = document.getElementById('active-model-badge');
    const showcaseHint = document.getElementById('showcase-hint');
    const toggleViewerThemeBtn = document.getElementById('btn-toggle-viewer-theme');
    const viewerThemeLabel = document.getElementById('viewer-theme-label');
    const fullscreenViewerBtn = document.getElementById('btn-fullscreen-viewer');

    function renderShowcaseCards() {
      showcaseCardsContainer.innerHTML = GALLERY_ITEMS.map((item, idx) => `
        <div class="showcase-card cursor-pointer p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800/80 hover:border-cyan-500/40 transition-all ${idx === 0 ? 'border-cyan-500/60 bg-neutral-800/90' : ''}" data-id="${item.id}">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-white">${item.title}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">${item.badge}</span>
          </div>
          <p class="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">${item.description}</p>
          <div class="flex items-center flex-wrap gap-1">
            ${item.tags.map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 font-mono">${t}</span>`).join('')}
          </div>
        </div>
      `).join('');

      showcaseCardsContainer.querySelectorAll('.showcase-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          const item = GALLERY_ITEMS.find(i => i.id === id);
          if (item) selectShowcaseItem(item);
        });
      });
    }

    function selectShowcaseItem(item) {
      state.selectedShowcase = item;
      showcaseCardsContainer.querySelectorAll('.showcase-card').forEach(card => {
        if (card.getAttribute('data-id') === item.id) {
          card.classList.add('border-cyan-500/60', 'bg-neutral-800/90');
        } else {
          card.classList.remove('border-cyan-500/60', 'bg-neutral-800/90');
        }
      });
      activeModelTitle.textContent = item.title;
      activeModelBadge.textContent = item.badge;
      showcaseHint.textContent = item.description;
      updateIframeSource();
    }

    function updateIframeSource() {
      if (!state.selectedShowcase) return;
      const url = state.viewerTheme === 'light' ? state.selectedShowcase.htmlLight : state.selectedShowcase.htmlDark;
      showcaseIframe.src = url;
      viewerThemeLabel.textContent = state.viewerTheme === 'light' ? 'Dark 버전 보기' : 'Light 버전 보기';
    }

    toggleViewerThemeBtn.addEventListener('click', () => {
      state.viewerTheme = state.viewerTheme === 'light' ? 'dark' : 'light';
      updateIframeSource();
    });

    fullscreenViewerBtn.addEventListener('click', () => {
      if (showcaseIframe.requestFullscreen) showcaseIframe.requestFullscreen();
    });

    // Concept Studio Logic
    const presetContainer = document.getElementById('preset-buttons-container');
    const customConceptInput = document.getElementById('custom-concept-input');
    const generateConceptBtn = document.getElementById('btn-generate-concept');
    const studioPlateContainer = document.getElementById('studio-plate-container');
    const zoomInnerWrapper = document.getElementById('zoom-inner-wrapper');
    const canvasPartsCount = document.getElementById('canvas-parts-count');
    const conceptMetaphorDesc = document.getElementById('concept-metaphor-desc');
    const codePreviewArea = document.getElementById('code-preview-area');

    function renderConceptPresets() {
      presetContainer.innerHTML = CONCEPT_TEMPLATES.map((c, idx) => `
        <button class="preset-btn p-2 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 hover:border-purple-500/50 text-left transition-all ${idx === 0 ? 'border-purple-500 bg-neutral-800' : ''}" data-id="${c.id}">
          <div class="text-[11px] font-bold text-white truncate">${c.title}</div>
          <div class="text-[9px] text-neutral-400 truncate mt-0.5">${c.cardFig}</div>
        </button>
      `).join('');

      presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('border-purple-500', 'bg-neutral-800'));
          btn.classList.add('border-purple-500', 'bg-neutral-800');
          loadConceptFigure(id);
        });
      });
    }

    function loadConceptFigure(conceptId, customOpts = {}) {
      state.currentConceptId = conceptId;
      try {
        const result = generateAnatomyFigure(conceptId, {
          theme: state.theme,
          azimuth: state.tunerParams.azimuth,
          elevation: state.tunerParams.elevation,
          tokens: state.tunerParams.tokens,
          pressure: state.tunerParams.pressure,
          ...customOpts
        });

        state.currentFigureData = result;
        zoomInnerWrapper.innerHTML = result.plateHtml;
        applyViewMode();
        applyZoom();

        // Run live script
        if (result.standaloneHtml) {
          const scriptMatch = result.standaloneHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
          if (scriptMatch && scriptMatch[1]) {
            try {
              const fn = new Function(scriptMatch[1]);
              fn();
            } catch (e) {
              console.warn('Script execution notice:', e);
            }
          }
        }

        canvasPartsCount.textContent = `${result.stats.solidsCount} Solids · ${result.stats.partsTotal} Total Parts`;
        conceptMetaphorDesc.textContent = result.template.metaphor;
        updateCodePreview(result);
      } catch (err) {
        console.error(err);
        zoomInnerWrapper.innerHTML = `<div class="p-4 text-xs text-rose-400">생성 실패: ${err.message}</div>`;
      }
    }

    // View Mode Control
    const btnModeSolid = document.getElementById('btn-mode-solid');
    const btnModeXray = document.getElementById('btn-mode-xray');
    const btnModeExplode = document.getElementById('btn-mode-explode');

    function setViewMode(mode) {
      state.viewMode = mode;
      [btnModeSolid, btnModeXray, btnModeExplode].forEach(btn => {
        btn.classList.remove('bg-neutral-800', 'text-white');
        btn.classList.add('text-neutral-400');
      });
      if (mode === 'solid') btnModeSolid.classList.add('bg-neutral-800', 'text-white');
      if (mode === 'xray') btnModeXray.classList.add('bg-neutral-800', 'text-white');
      if (mode === 'explode') btnModeExplode.classList.add('bg-neutral-800', 'text-white');
      applyViewMode();
    }

    function applyViewMode() {
      studioPlateContainer.classList.remove('viewport-xray', 'viewport-exploded');
      if (state.viewMode === 'xray') studioPlateContainer.classList.add('viewport-xray');
      else if (state.viewMode === 'explode') studioPlateContainer.classList.add('viewport-exploded');
    }

    btnModeSolid.addEventListener('click', () => setViewMode('solid'));
    btnModeXray.addEventListener('click', () => setViewMode('xray'));
    btnModeExplode.addEventListener('click', () => setViewMode('explode'));

    // Zoom Controls
    const btnZoom1x = document.getElementById('btn-zoom-1x');
    const btnZoom2x = document.getElementById('btn-zoom-2x');
    const btnZoom4x = document.getElementById('btn-zoom-4x');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    function setZoom(level) {
      state.zoomLevel = level;
      [btnZoom1x, btnZoom2x, btnZoom4x].forEach(b => {
        b.classList.remove('bg-neutral-800', 'text-white');
        b.classList.add('text-neutral-400');
      });
      if (level === 1.0) btnZoom1x.classList.add('bg-neutral-800', 'text-white');
      if (level === 2.0) btnZoom2x.classList.add('bg-neutral-800', 'text-white');
      if (level === 4.0) btnZoom4x.classList.add('bg-neutral-800', 'text-white');
      applyZoom();
    }

    function applyZoom() {
      zoomInnerWrapper.style.transform = `scale(${state.zoomLevel})`;
    }

    btnZoom1x.addEventListener('click', () => setZoom(1.0));
    btnZoom2x.addEventListener('click', () => setZoom(2.0));
    btnZoom4x.addEventListener('click', () => setZoom(4.0));
    btnZoomReset.addEventListener('click', () => setZoom(1.0));

    // Concept Generation with Gemini Key support
    generateConceptBtn.addEventListener('click', async () => {
      const query = customConceptInput.value.trim();
      if (!query) {
        showToast('개념이나 알고리즘 이름을 입력해 주세요.');
        return;
      }

      const apiKey = getStoredApiKey();
      if (apiKey) {
        showToast('Gemini AI가 물리적 기계 메타포를 분석 중...');
        generateConceptBtn.disabled = true;
        try {
          const aiMeta = await callGeminiApi(query, apiKey);
          loadConceptFigure('token-bucket', { customPrompt: query, aiMeta });
          showToast(`Gemini AI 분석: "${query}" 기계 일러스트 생성 완료!`);
        } catch (e) {
          console.warn('Gemini call error:', e);
          showToast(`Gemini 연결 오류 (${e.message}). 내장 룰베이스로 생성합니다.`);
          loadConceptFigure('token-bucket', { customPrompt: query });
        } finally {
          generateConceptBtn.disabled = false;
        }
      } else {
        // No key: use pure client-side heuristic synthesizer
        loadConceptFigure('token-bucket', { customPrompt: query });
        showToast(`내장 엔진: "${query}" 기계식 일러스트 생성 완료!`);
      }
    });

    // Parametric Tuner
    const sliderAzimuth = document.getElementById('slider-azimuth');
    const sliderElevation = document.getElementById('slider-elevation');
    const sliderTokens = document.getElementById('slider-tokens');
    const sliderPressure = document.getElementById('slider-pressure');
    const valAzimuth = document.getElementById('val-azimuth');
    const valElevation = document.getElementById('val-elevation');
    const valTokens = document.getElementById('val-tokens');
    const valPressure = document.getElementById('val-pressure');
    const btnToggleBlueprint = document.getElementById('btn-toggle-blueprint-mode');
    const tunerPreviewContainer = document.getElementById('tuner-preview-container');

    let debounceTimer = null;
    function debounceUpdate() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadConceptFigure(state.currentConceptId);
        updateTunerPreview();
      }, 100);
    }

    sliderAzimuth.addEventListener('input', (e) => {
      state.tunerParams.azimuth = Number(e.target.value);
      valAzimuth.textContent = `${state.tunerParams.azimuth}°`;
      debounceUpdate();
    });

    sliderElevation.addEventListener('input', (e) => {
      state.tunerParams.elevation = Number(e.target.value);
      valElevation.textContent = `${state.tunerParams.elevation}°`;
      debounceUpdate();
    });

    sliderTokens.addEventListener('input', (e) => {
      state.tunerParams.tokens = Number(e.target.value);
      valTokens.textContent = `${state.tunerParams.tokens} units`;
      debounceUpdate();
    });

    sliderPressure.addEventListener('input', (e) => {
      state.tunerParams.pressure = Number(e.target.value);
      valPressure.textContent = `${state.tunerParams.pressure} bar`;
      debounceUpdate();
    });

    btnToggleBlueprint.addEventListener('click', () => {
      state.tunerParams.blueprintMode = !state.tunerParams.blueprintMode;
      btnToggleBlueprint.textContent = state.tunerParams.blueprintMode ? '청사진 모드 끄기' : '청사진 모드 켜기';
      btnToggleBlueprint.classList.toggle('bg-cyan-500', state.tunerParams.blueprintMode);
      btnToggleBlueprint.classList.toggle('text-black', state.tunerParams.blueprintMode);

      if (state.tunerParams.blueprintMode) {
        tunerPreviewContainer.classList.add('bg-[#0a192f]', 'border-[#64ffda]');
        tunerPreviewContainer.style.filter = 'drop-shadow(0 0 10px rgba(100,255,218,0.3))';
      } else {
        tunerPreviewContainer.classList.remove('bg-[#0a192f]', 'border-[#64ffda]');
        tunerPreviewContainer.style.filter = '';
      }
    });

    function updateTunerPreview() {
      if (state.currentFigureData) {
        tunerPreviewContainer.innerHTML = state.currentFigureData.plateHtml;
      }
    }

    // Export Suite (Pure Client-side Blob Downloads)
    const btnExportHtml = document.getElementById('btn-export-html');
    const btnExportSvg = document.getElementById('btn-export-svg');
    const btnExportReact = document.getElementById('btn-export-react');
    const btnExportBlueprint = document.getElementById('btn-export-blueprint');
    const btnCopyCodeBlock = document.getElementById('btn-copy-code-block');

    function triggerExport(format) {
      if (!state.currentFigureData) return;
      const bundle = exportBundle(state.currentFigureData, format, {
        theme: state.theme,
        azimuth: state.tunerParams.azimuth,
        elevation: state.tunerParams.elevation,
        tokens: state.tunerParams.tokens,
        pressure: state.tunerParams.pressure
      });

      if (format === 'react') {
        navigator.clipboard.writeText(bundle.content);
        showToast('React TSX 컴포넌트 코드가 클립보드에 복사되었습니다!');
        return;
      }

      downloadBlob(bundle.content, bundle.filename, bundle.mimeType);
      showToast(`${format.toUpperCase()} 파일 다운로드가 시작되었습니다.`);
    }

    btnExportHtml.addEventListener('click', () => triggerExport('html'));
    btnExportSvg.addEventListener('click', () => triggerExport('svg'));
    btnExportReact.addEventListener('click', () => triggerExport('react'));
    btnExportBlueprint.addEventListener('click', () => triggerExport('blueprint'));

    btnCopyCodeBlock.addEventListener('click', () => {
      navigator.clipboard.writeText(codePreviewArea.textContent);
      showToast('코드가 클립보드에 복사되었습니다!');
    });

    function updateCodePreview(result) {
      const bundle = exportBundle(result, 'react', { theme: state.theme });
      codePreviewArea.textContent = bundle.content;
    }

    // Gemini API Key Modal Management
    const btnOpenApiKeyModal = document.getElementById('btn-open-api-key-modal');
    const apiKeyModal = document.getElementById('api-key-modal');
    const btnCloseApiKeyModal = document.getElementById('btn-close-api-key-modal');
    const apiKeyInput = document.getElementById('gemini-api-key-input');
    const btnSaveApiKey = document.getElementById('btn-save-api-key');
    const btnClearApiKey = document.getElementById('btn-clear-api-key');
    const apiKeyBadge = document.getElementById('api-key-status-badge');

    function updateApiKeyBadge() {
      const key = getStoredApiKey();
      if (key) {
        apiKeyBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Gemini Key 연결됨</span>`;
        apiKeyBadge.className = "text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5 cursor-pointer";
      } else {
        apiKeyBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-neutral-500"></span><span>API Key 설정 (선택)</span>`;
        apiKeyBadge.className = "text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center gap-1.5 cursor-pointer hover:text-white";
      }
    }

    btnOpenApiKeyModal.addEventListener('click', () => {
      apiKeyInput.value = getStoredApiKey();
      apiKeyModal.classList.remove('hidden');
    });

    apiKeyBadge.addEventListener('click', () => {
      apiKeyInput.value = getStoredApiKey();
      apiKeyModal.classList.remove('hidden');
    });

    btnCloseApiKeyModal.addEventListener('click', () => {
      apiKeyModal.classList.add('hidden');
    });

    btnSaveApiKey.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      setStoredApiKey(key);
      updateApiKeyBadge();
      apiKeyModal.classList.add('hidden');
      showToast(key ? 'Gemini API Key가 안전하게 저장되었습니다.' : 'API Key가 삭제되었습니다.');
    });

    btnClearApiKey.addEventListener('click', () => {
      setStoredApiKey('');
      apiKeyInput.value = '';
      updateApiKeyBadge();
      apiKeyModal.classList.add('hidden');
      showToast('API Key가 제거되었습니다.');
    });

    // Toast Notification
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    let toastTimer = null;
    function showToast(msg) {
      toastMsg.textContent = msg;
      toast.classList.remove('translate-y-12', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-12', 'opacity-0');
      }, 2800);
    }

    // App Initialization
    renderShowcaseCards();
    renderConceptPresets();
    updateApiKeyBadge();
    loadConceptFigure('token-bucket');
  });

})();
