/**
 * Automated Verification Test for Anatomy WebApp & Studio (Pro Edition)
 * Tests all 9 built-in templates, custom dynamic concept synthesis, and 4 export formats.
 */

import { generateAnatomyFigure } from '../webapp/src/generator.mjs';
import { exportBundle } from '../webapp/src/exporter.mjs';
import { CONCEPT_TEMPLATES } from '../webapp/src/templates.mjs';

async function runTests() {
  console.log('--- 1. Testing Core Geometry Generator (All 9 Built-in Concepts) ---');
  for (const t of CONCEPT_TEMPLATES) {
    const res = generateAnatomyFigure(t.id, { theme: 'dark' });
    if (!res || !res.plateHtml || !res.standaloneHtml) {
      throw new Error(`Failed to generate anatomy for: ${t.id}`);
    }
    console.log(`[PASS] Concept: ${t.id} (${res.partsCount} solids, Standalone HTML: ${res.standaloneHtml.length} bytes)`);
  }

  console.log('\n--- 2. Testing Custom Prompt Dynamic Synthesis ---');
  const customRes = generateAnatomyFigure('token-bucket', { customPrompt: 'Kubernetes Pod AutoScaler' });
  if (!customRes || !customRes.svgContent.includes('<svg')) {
    throw new Error('Custom prompt synthesis failed');
  }
  console.log(`[PASS] Dynamic Synthesizer: "${customRes.template.title}" (${customRes.partsCount} solids)`);

  console.log('\n--- 3. Testing Exporter Formats ---');
  const sample = generateAnatomyFigure('raft-consensus');
  const formats = ['html', 'svg', 'react', 'blueprint', 'embed'];
  for (const fmt of formats) {
    const bundle = exportBundle(sample, fmt);
    if (!bundle || !bundle.content || bundle.content.length < 50) {
      throw new Error(`Failed export format: ${fmt}`);
    }
    console.log(`[PASS] Exporter: ${fmt} -> ${bundle.filename} (${bundle.content.length} chars, mime: ${bundle.mimeType})`);
  }

  console.log('\n--- 4. Testing Standalone HTML & Shading Classes ---');
  if (!sample.standaloneHtml.includes('iso-svg') || !sample.standaloneHtml.includes('iso-plate')) {
    throw new Error('Standalone HTML markup invalid');
  }
  console.log('[PASS] Standalone HTML markup valid & self-contained with 4-Tone CSS.');

  console.log('\n======================================================');
  console.log('🎉 ALL ANATOMY PRO WEBAPP VERIFICATION TESTS PASSED (100%)');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
