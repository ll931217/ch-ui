// src/features/workspace/explain/export.ts
import { ExplainResult } from '@/types/common';

/**
 * Export EXPLAIN result as JSON file
 */
export function exportAsJson(explainResult: ExplainResult): void {
  const json = JSON.stringify(
    {
      type: explainResult.type,
      tree: explainResult.tree,
      rawText: explainResult.rawText,
      rawJson: explainResult.rawJson,
    },
    null,
    2
  );

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `explain-${explainResult.type.toLowerCase()}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export EXPLAIN tree as SVG file
 * This is a simplified implementation - for full SVG export,
 * we would need to serialize the actual SVG DOM from the TreeView
 */
export function exportAsSvg(explainResult: ExplainResult): void {
  // Get the SVG element from the DOM
  const svgElement = document.querySelector('.tree-view-svg') as SVGElement;

  if (!svgElement) {
    // Fallback: create a simple text-based SVG
    const svg = createSimpleSvg(explainResult);
    downloadSvg(svg, `explain-${explainResult.type.toLowerCase()}-${Date.now()}.svg`);
    return;
  }

  // Clone the SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;

  // Serialize to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);

  // Add XML header and download
  const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
  downloadSvg(fullSvg, `explain-${explainResult.type.toLowerCase()}-${Date.now()}.svg`);
}

/**
 * Create a simple SVG representation of the tree
 */
function createSimpleSvg(explainResult: ExplainResult): string {
  const lines = explainResult.rawText.split('\n');
  const height = lines.length * 20 + 40;
  const width = 800;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;
  svg += `<text x="10" y="20" font-family="monospace" font-size="14" font-weight="bold">EXPLAIN ${explainResult.type}</text>`;

  lines.forEach((line, index) => {
    const y = 50 + index * 20;
    const escapedLine = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    svg += `<text x="10" y="${y}" font-family="monospace" font-size="12">${escapedLine}</text>`;
  });

  svg += '</svg>';
  return svg;
}

/**
 * Download SVG string as file
 */
function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export EXPLAIN result as PNG (uses canvas to render SVG)
 */
export function exportAsPng(explainResult: ExplainResult): void {
  const svgElement = document.querySelector('.tree-view-svg') as SVGElement;

  if (!svgElement) {
    console.error('SVG element not found');
    return;
  }

  // Serialize SVG
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Create image
  const img = new Image();
  img.onload = () => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = svgElement.clientWidth || 800;
    canvas.height = svgElement.clientHeight || 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Draw image on canvas
    ctx.drawImage(img, 0, 0);

    // Download canvas as PNG
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Could not create blob');
        return;
      }

      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `explain-${explainResult.type.toLowerCase()}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(pngUrl);
    });

    URL.revokeObjectURL(url);
  };

  img.src = url;
}
