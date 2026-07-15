#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BATCHES = [21, 22, 23, 24, 25];
const TMP_DIR = __dirname;

for (const batchIndex of BATCHES) {
  const batchPath = path.join(TMP_DIR, `batch-${batchIndex}.json`);
  const dispatchPath = path.join(TMP_DIR, `dispatch-${batchIndex}.json`);
  
  const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  const dispatchData = JSON.parse(fs.readFileSync(dispatchPath, 'utf8'));
  
  const fileNodeIds = new Set(batchData.nodes.filter(n => n.type === 'file' || n.type === 'config').map(n => n.id));
  
  // Remove old imports and tested_by edges
  batchData.edges = batchData.edges.filter(e => e.type !== 'imports' && e.type !== 'tested_by');
  
  // Add imports edges
  if (dispatchData.batchImportData) {
    for (const [sourcePath, targetPaths] of Object.entries(dispatchData.batchImportData)) {
      const sourceId = `file:${sourcePath}`;
      if (!fileNodeIds.has(sourceId)) continue;
      
      for (const targetPath of targetPaths) {
        const targetId = `file:${targetPath}`;
        if (fileNodeIds.has(targetId)) {
          batchData.edges.push({
            source: sourceId,
            target: targetId,
            type: 'imports',
            weight: 0.7
          });
        }
      }
    }
  }
  
  // Add tested_by edges
  for (const node of batchData.nodes) {
    if (node.type === 'file' && node.filePath.includes('.test.')) {
      const testFileId = node.id;
      
      if (dispatchData.batchImportData?.[node.filePath]) {
        for (const targetPath of dispatchData.batchImportData[node.filePath]) {
          const targetId = `file:${targetPath}`;
          if (fileNodeIds.has(targetId) && !targetPath.includes('.test.')) {
            batchData.edges.push({
              source: targetId,
              target: testFileId,
              type: 'tested_by',
              weight: 0.5
            });
          }
        }
      }
    }
  }
  
  batchData.metadata.edgeCount = batchData.edges.length;
  fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2));
  console.log(`✓ Batch ${batchIndex}: ${batchData.metadata.nodeCount} nodes, ${batchData.metadata.edgeCount} edges`);
}

console.log('\nImports and tested_by edges fixed.');
