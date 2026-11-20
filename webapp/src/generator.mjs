/**
 * Anatomy Concept-to-Isometric SVG Generator Engine (Advanced Pro Edition)
 * Transforms high-level technical concepts into living, interactive, precision isometric figures.
 * Built strictly on Anatomy's craft rules and kit/iso-kit.mjs geometry core.
 */

import * as iso from '../../kit/iso-kit.mjs';
import { findTemplate, CONCEPT_TEMPLATES } from './templates.mjs';

const {
  AZIMUTH,
  ELEVATION,
  ISO_CSS,
  iso: toScreen,
  slabOf,
  cylinder,
  coil,
  knurl,
  topTicks,
  radialTicks,
  dotsSvg,
  lineSvg,
  wireSvg,
  solidSvg,
  plateHtml,
  pathOf,
  fitProjection
} = iso;

/**
 * Build geometry and interactive parts for a given concept ID or custom parameters
 */
export function generateAnatomyFigure(conceptId, customOptions = {}) {
  let template = findTemplate(conceptId);

  // If customPrompt is passed and conceptId is generic, create dynamic concept
  if (customOptions.customPrompt) {
    template = synthesizeCustomConcept(customOptions.customPrompt, template);
  }

  const options = { ...template.defaultParams, ...customOptions };

  // Technical canvas dimensions
  const W = 900;
  const H = 560;
  const azimuth = options.azimuth || 42;
  const elevation = options.elevation || 30;

  // 1. Initial bounding volume calculation
  const boundingPoints = getBoundingPointsForTemplate(template.id);
  const P = fitProjection(boundingPoints, W, H, { pad: 48, azimuth, elevation });

  // 2. Build model geometry
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

  // 3. Assemble SVG with technical grid and layer tagging
  const svgContent = `<svg class="iso-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${template.title}">
    <defs>
      <filter id="halo-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
      <linearGradient id="brass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffd572" />
        <stop offset="100%" stop-color="#9e6e14" />
      </linearGradient>
    </defs>
    <g class="iso-model-group">
      ${parts.join('\n')}
    </g>
  </svg>`;

  // 4. Wrap inside Anatomy Plate
  const plate = plateHtml({
    fig: template.cardFig,
    title: template.cardTitle,
    hint: template.hint,
    readout: template.readoutFormat ? template.readoutFormat(options) : `${template.cardTitle} · Ready`,
    body: svgContent
  });

  // 5. Build full standalone HTML
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

function synthesizeCustomConcept(prompt, baseTemplate) {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  let metaphor = `A precision electro-mechanical rig custom-crafted to demonstrate ${clean}, equipped with dual guide rails, spring-loaded dampers, and calibrated indicator dials.`;
  let cardFig = "Fig X";

  if (lower.includes("raft") || lower.includes("consensus")) {
    return { ...findTemplate("raft-consensus"), title: clean };
  } else if (lower.includes("lsm") || lower.includes("compaction") || lower.includes("storage")) {
    return { ...findTemplate("lsm-tree"), title: clean };
  } else if (lower.includes("attention") || lower.includes("transformer") || lower.includes("llm") || lower.includes("ai")) {
    return { ...findTemplate("transformer-attention"), title: clean };
  }

  return {
    id: "custom-" + clean.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: clean,
    category: "Custom Engineering Synthesis",
    summary: `${clean} 개념의 작동 원리를 아이소메트릭 정밀 기계 부품으로 시각화`,
    metaphor,
    partsCount: 58,
    specs: {
      mode: "Autonomous Parametric",
      precision: "0.1 mm Tolerance",
      stability: "100% Verified"
    },
    defaultParams: {
      tokens: 6,
      pressure: 2.5
    },
    readoutFormat: (val) => `${clean} · Status: SYNCHRONIZED · Load: 100% · Rate: Optimal`,
    cardFig,
    cardTitle: clean.toLowerCase(),
    hint: "마우스를 이동하여 메커니즘을 작동하고 실시간 계측값을 확인하세요"
  };
}

function getBoundingPointsForTemplate(id) {
  return [
    [-190, -120, 0],
    [190, 120, 260],
    [-190, 120, 0],
    [190, -120, 0]
  ];
}

/**
 * 1. Token Bucket Rate Limiter
 */
function buildTokenBucketModel(P, options) {
  const parts = [];
  let solidsCount = 0;
  const at = (pt) => toScreen(pt, P);

  // 1. Heavy Base Plate
  const basePlan = { x: -160, y: -100, w: 320, d: 200, r: 8 };
  parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.2), { tone: 'lo' }));
  solidsCount++;

  // Corner Screws
  const corners = [
    [-145, -85, 16],
    [145, -85, 16],
    [-145, 85, 16],
    [145, 85, 16]
  ].map(at);
  parts.push(dotsSvg(corners, { size: 0.6, tone: 'hi' }));

  // Ruler ticks along base
  const ticks = topTicks(-130, 130, 8, 4, 90, 16, [2, 4], P, 'x');
  parts.push(lineSvg(ticks.minor, { tone: 'lo' }), lineSvg(ticks.major, { tone: 'mid' }));

  // Pedestal Plate
  const pedPlan = { x: -100, y: -65, w: 200, d: 130, r: 4 };
  parts.push(solidSvg(slabOf(pedPlan, 16, 10, P, 6, 0.8), { tone: 'mid' }));
  solidsCount++;

  // 4 Support Pillars
  const pillars = [
    [-75, -45],
    [75, -45],
    [-75, 45],
    [75, 45]
  ];
  pillars.forEach(([px, py]) => {
    parts.push(solidSvg(cylinder(px, py, 5, 26, 140, P, 24), { tone: 'lo' }));
    solidsCount++;
  });

  // Top Bridge Crossbar
  const topBridge = { x: -85, y: -55, w: 170, d: 110, r: 6 };
  parts.push(solidSvg(slabOf(topBridge, 166, 14, P, 6, 1.0), { tone: 'mid' }));
  solidsCount++;

  // Inflow Nozzle at Top
  parts.push(solidSvg(cylinder(0, 0, 18, 180, 26, P, 28), { tone: 'hi' }));
  parts.push(lineSvg(knurl(0, 0, 18.5, 188, 202, 24, P), { tone: 'lo' }));
  solidsCount++;

  // Central Token Column Outer Tube
  parts.push(solidSvg(cylinder(0, 0, 36, 26, 140, P, 32), { tone: 'lo', seamless: true }));
  solidsCount++;

  // Stacked Brass Tokens
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

  // Calibrated Pressure Dial on the right
  const dialX = 120, dialY = 0, dialZ = 65, dialR = 20;
  parts.push(solidSvg(cylinder(dialX, dialY, dialR, dialZ, 10, P, 28), { tone: 'lo' }));
  solidsCount++;

  const radTicks = radialTicks(dialX, dialY, dialR - 2, 20, 4, dialZ + 10, [1.5, 3.5], P);
  parts.push(lineSvg(radTicks.minor, { tone: 'mid' }), lineSvg(radTicks.major, { tone: 'hi' }));

  // Dial Needle
  const needleCenter = at([dialX, dialY, dialZ + 10.5]);
  const needleTip = at([dialX + 11, dialY + 11, dialZ + 10.5]);
  parts.push(`<g id="dial-gauge-needle">${lineSvg(pathOf([needleCenter, needleTip]), { tone: 'lit' })}</g>`);

  // Connecting Pipe to Dial
  parts.push(wireSvg(at([36, 0, 65]), at([dialX - dialR, dialY, dialZ + 5]), { tone: 'mid', size: 1.2 }));

  // Sliding Release Shutter Gate at Bottom
  parts.push('<g id="sliding-gate">');
  const gatePlan = { x: -35, y: -20, w: 70, d: 40, r: 3 };
  parts.push(solidSvg(slabOf(gatePlan, 18, 8, P, 4, 0.6), { tone: 'lit', lit: true }));
  solidsCount++;
  parts.push('</g>');

  // Pneumatic Damper Coil Spring
  const damperCoil = coil(-45, -20, [0, -32], 8, 5, 'y', P);
  parts.push(lineSvg(damperCoil.back, { tone: 'lo' }), lineSvg(damperCoil.front, { tone: 'mid' }));

  const liveScript = `
    const plate = document.querySelector(".iso-plate");
    if (plate) {
      const readout = plate.querySelector(".iso-plate-corner[data-corner='readout']");
      const gate = plate.querySelector("#sliding-gate");
      const tokens = plate.querySelectorAll(".token-item");

      let currentTokens = ${numTokens};
      const maxTokens = 10;
      let targetShift = 0;
      let currentShift = 0;
      let pressure = 2.8;

      function updateReadout() {
        const text = "Bucket: " + currentTokens.toFixed(1) + " / " + maxTokens + " tokens · Flow: " + (pressure * 14.7).toFixed(1) + " psi · Status: " + (currentTokens >= 1 ? "PASSED (200 OK)" : "RATE_LIMITED (429)");
        if (readout) readout.textContent = text;
      }

      function updateTokens() {
        tokens.forEach((el, idx) => {
          el.style.opacity = idx < Math.round(currentTokens) ? "1" : "0.08";
        });
      }

      plate.addEventListener("pointermove", (e) => {
        const rect = plate.getBoundingClientRect();
        const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        targetShift = (share - 0.5) * 35;
        pressure = 1.5 + share * 3.2;
        currentTokens = Math.max(0, Math.min(maxTokens, maxTokens - share * 7.5));
        updateTokens();
        updateReadout();
      });

      plate.addEventListener("click", () => {
        currentTokens = Math.min(maxTokens, currentTokens + 1);
        updateTokens();
        updateReadout();
      });

      function loop() {
        currentShift += (targetShift - currentShift) * 0.15;
        if (gate) {
          gate.setAttribute("transform", "translate(" + (currentShift * 0.8) + ", " + (currentShift * 0.4) + ")");
        }
        requestAnimationFrame(loop);
      }
      loop();
      updateReadout();
    }
  `;

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 24 }
  };
}

/**
 * 2. LRU Cache Memory Rack
 */
function buildLruCacheModel(P, options) {
  const parts = [];
  let solidsCount = 0;
  const at = (pt) => toScreen(pt, P);

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

    const isHot = i === 3;
    const isCold = i === 0;
    const blockTone = isHot ? 'lit' : isCold ? 'lo' : 'hi';
    const blockPlan = { x: sx + 5, y: -48, w: slotW - 10, d: slotD - 14, r: 3 };
    const blockSolid = slabOf(blockPlan, 24, 22, P, 4, 0.5);
    parts.push(`<g class="cache-block" data-slot="${i}">
      ${solidSvg(blockSolid, { tone: blockTone, lit: isHot })}
    </g>`);
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

      let currentX = 0;
      let targetX = 0;
      let activeSlot = 2;

      function updateReadout() {
        const text = "Slot [" + (activeSlot + 1) + "/4] Active · LRU Gantry: " + (activeSlot === 3 ? "CACHE_HIT (L1 Fast)" : "CACHE_MISS_EVICT") + " · Ratio: 94.2% · Bus: READY";
        if (readout) readout.textContent = text;
      }

      plate.addEventListener("pointermove", (e) => {
        const rect = plate.getBoundingClientRect();
        const share = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        activeSlot = Math.min(3, Math.floor(share * 4));
        targetX = (share - 0.5) * 220;
        updateReadout();
      });

      function loop() {
        currentX += (targetX - currentX) * 0.12;
        if (shuttle) {
          shuttle.setAttribute("transform", "translate(" + (currentX * 0.86) + ", " + (currentX * 0.5) + ")");
        }
        requestAnimationFrame(loop);
      }
      loop();
      updateReadout();
    }
  `;

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 28 }
  };
}

/**
 * 3. Database Write-Ahead Logging (WAL) Engine
 */
function buildDatabaseWalModel(P, options) {
  const parts = [];
  let solidsCount = 0;
  const at = (pt) => toScreen(pt, P);

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

      let lsn = 1048576;
      let punchY = 0;

      function updateReadout() {
        const text = "LSN: 0x" + Math.round(lsn).toString(16).toUpperCase() + " · Sync: FSYNC_OK · Punch: " + (punchY > 5 ? "STAMPING" : "ADVANCING") + " · Durability: 100%";
        if (readout) readout.textContent = text;
      }

      plate.addEventListener("pointermove", (e) => {
        const rect = plate.getBoundingClientRect();
        const share = (e.clientX - rect.left) / rect.width;
        lsn = 1048576 + Math.floor(share * 2048);
        punchY = Math.sin(share * Math.PI * 8) * 10;
        if (punch) {
          punch.setAttribute("transform", "translate(0, " + punchY + ")");
        }
        updateReadout();
      });

      updateReadout();
    }
  `;

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 20 }
  };
}

/**
 * 4. GPU Shader Pipeline
 */
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
        if (carrier) {
          carrier.setAttribute("transform", "translate(" + (currentX * 0.86) + ", " + (currentX * 0.5) + ")");
        }
        requestAnimationFrame(loop);
      }
      loop();
    }
  `;

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 22 }
  };
}

/**
 * 5. Kafka Event Bus
 */
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

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 18 }
  };
}

/**
 * 6. Zero-Knowledge Proof Lock
 */
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
        if (tumbler) {
          tumbler.setAttribute("transform", "rotate(" + (share * 60 - 30) + " 440 270)");
        }
      });
    }
  `;

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 18 }
  };
}

/**
 * 7. Raft Consensus Heartbeat Cluster
 */
function buildRaftModel(P, options) {
  const parts = [];
  let solidsCount = 0;
  const at = (pt) => toScreen(pt, P);

  // Circular Cluster Base
  parts.push(solidSvg(cylinder(0, 0, 130, 0, 18, P, 36), { tone: 'lo' }));
  solidsCount++;

  // 3 Node Cylinders arranged radially
  const angles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  angles.forEach((ang, idx) => {
    const nx = Math.cos(ang) * 75;
    const ny = Math.sin(ang) * 75;
    const isLeader = idx === 0;

    // Node Pedestal
    parts.push(solidSvg(cylinder(nx, ny, 24, 18, 20, P, 24), { tone: isLeader ? 'hi' : 'mid' }));
    // Node Piston
    parts.push(solidSvg(cylinder(nx, ny, 16, 38, isLeader ? 35 : 22, P, 20), { tone: isLeader ? 'lit' : 'hi', lit: isLeader }));
    solidsCount += 2;

    // Connecting linkage arm from center
    parts.push(wireSvg(at([0, 0, 30]), at([nx, ny, 30]), { tone: isLeader ? 'lit' : 'mid', size: 1.4 }));
  });

  // Central Pulse Cam
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

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 22 }
  };
}

/**
 * 8. LSM-Tree MemTable & SSTable Compactor
 */
function buildLsmTreeModel(P, options) {
  const parts = [];
  let solidsCount = 0;

  // Heavy stepped chassis
  const basePlan = { x: -170, y: -90, w: 340, d: 180, r: 8 };
  parts.push(solidSvg(slabOf(basePlan, 0, 18, P, 6, 1.0), { tone: 'lo' }));
  solidsCount++;

  // Top In-Memory Ring Buffer (MemTable)
  parts.push(solidSvg(cylinder(0, 0, 55, 80, 24, P, 32), { tone: 'lit', lit: true }));
  parts.push(lineSvg(knurl(0, 0, 55.5, 90, 102, 32, P), { tone: 'hi' }));
  solidsCount++;

  // 3-Level Tiered Plates (L0, L1, L2 SSTables)
  const levels = [
    { z: 18, h: 12, w: 260, d: 130, tone: 'lo' },
    { z: 34, h: 12, w: 200, d: 100, tone: 'mid' },
    { z: 50, h: 12, w: 140, d: 70, tone: 'hi' }
  ];

  levels.forEach((lvl, idx) => {
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

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 24 }
  };
}

/**
 * 9. Transformer Multi-Head Attention Matrix
 */
function buildTransformerAttentionModel(P, options) {
  const parts = [];
  let solidsCount = 0;

  // Grid Base Matrix Plate
  const basePlan = { x: -160, y: -100, w: 320, d: 200, r: 8 };
  parts.push(solidSvg(slabOf(basePlan, 0, 16, P, 6, 1.0), { tone: 'lo' }));
  solidsCount++;

  // Attention Weight Grid Ticks
  const gridTicks = topTicks(-130, 130, 10, 5, 80, 16, [2, 5], P, 'x');
  parts.push(lineSvg(gridTicks.major, { tone: 'hi' }), lineSvg(gridTicks.minor, { tone: 'mid' }));

  // 3 Prism Rails (Query, Key, Value)
  const railY = [-50, 0, 50];
  railY.forEach((ry, idx) => {
    parts.push(solidSvg(cylinder(0, ry, 5, 75, 280, P, 20), { tone: 'mid' }));
    solidsCount++;

    // Sliding Optical Prism on rail
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

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 26 }
  };
}

/**
 * Generic Parametric Model
 */
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

  return {
    parts,
    liveScript,
    stats: { solidsCount, partsTotal: solidsCount + 16 }
  };
}
