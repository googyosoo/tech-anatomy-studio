/**
 * Anatomy Exporter Suite (Advanced Pro Edition)
 * Exports interactive isometric figures into:
 * 1. Self-contained Standalone HTML (CSS, SVG, scripts all bundled)
 * 2. Pure Vector SVG (embedded styles for Figma/Illustrator)
 * 3. Modern React/Next.js TSX component
 * 4. Technical Blueprint / Engineering Patent A4 Poster Style
 * 5. Web Embed iframe snippet
 */

export function exportBundle(figureData, format = 'html', options = {}) {
  const { template, standaloneHtml, svgContent, plateHtml } = figureData;
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
        content: generateEmbedSnippet(figureData)
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
  const { template } = figureData;
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

export const ${compName}: React.FC<${compName}Props> = ({
  theme = 'dark',
  className = ''
}) => {
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
    <figure
      ref={containerRef}
      className={\`iso-figure iso \${className}\`}
      data-theme={theme}
      style={{
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <div className="iso-plate" style={{ position: 'relative' }}>
        <div className="iso-plate-corners" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, opacity: 0.8 }}>
          <span className="iso-plate-corner" data-corner="fig">${template.cardFig}</span>
          <span className="iso-plate-corner" data-corner="title">${template.cardTitle}</span>
        </div>

        <div className="iso-stage-body" style={{ width: '100%' }}>
          {/* SVG Canvas */}
          <div dangerouslySetInnerHTML={{ __html: \`${figureData.svgContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
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
      margin: 0;
      padding: 24px;
      background: #0a192f;
      color: #8892b0;
      font-family: "Courier New", Courier, monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .blueprint-frame {
      width: 100%;
      max-width: 980px;
      border: 2px solid #64ffda;
      box-shadow: 0 0 25px rgba(100, 255, 218, 0.2);
      padding: 20px;
      background: #0f2038;
      position: relative;
    }
    .blueprint-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #64ffda;
      padding-bottom: 12px;
      margin-bottom: 16px;
      color: #64ffda;
    }
    .blueprint-header h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .blueprint-svg {
      width: 100%;
      filter: drop-shadow(0 0 4px rgba(100, 255, 218, 0.4));
    }
    .blueprint-svg path {
      stroke: #64ffda !important;
      fill: #0c1a2d !important;
      fill-opacity: 0.4 !important;
    }
    .blueprint-svg line {
      stroke: #64ffda !important;
    }
    .blueprint-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #64ffda;
      padding-top: 10px;
      margin-top: 14px;
      font-size: 11px;
    }
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

    <div class="blueprint-svg">
      ${svgContent}
    </div>

    <div class="blueprint-footer">
      <div>METAPHOR: ${template.metaphor}</div>
      <div>CLASSIFICATION: OPEN-SOURCE TECHNICAL ISOMETRIC</div>
    </div>
  </div>
</body>
</html>`;
}

function generateEmbedSnippet(figureData) {
  const { template } = figureData;
  return `<iframe src="/examples/${template.id}/${template.id}.html" width="100%" height="600" style="border:none; border-radius:12px; overflow:hidden;" title="${template.title} — Anatomy"></iframe>`;
}
