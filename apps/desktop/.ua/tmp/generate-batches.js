#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BATCHES = [21, 22, 23, 24, 25];
const TMP_DIR = __dirname;

// Helper to determine complexity
function getComplexity(lines) {
  if (lines < 50) return 'simple';
  if (lines <= 200) return 'moderate';
  return 'complex';
}

// Extract tags from path
function deriveTags(filePath, fileCategory) {
  const tags = new Set();
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('test')) tags.add('test');
  if (lowerPath.includes('hook')) tags.add('hooks');
  if (lowerPath.includes('component')) tags.add('component');
  if (lowerPath.includes('renderer')) tags.add('renderer');
  if (lowerPath.includes('trpc')) tags.add('trpc');
  if (lowerPath.includes('util')) tags.add('utils');
  if (lowerPath.includes('type')) tags.add('types');
  if (lowerPath.includes('schema')) tags.add('schema');
  if (lowerPath.includes('store')) tags.add('state');
  if (lowerPath.includes('route')) tags.add('routing');
  if (fileCategory === 'config') tags.add('config');

  // Add language/framework tags
  if (lowerPath.endsWith('.tsx')) tags.add('react');
  if (lowerPath.endsWith('.ts') && !lowerPath.endsWith('.tsx')) tags.add('typescript');

  return Array.from(tags).slice(0, 5);
}

// Generate summary from file path
function generateSummary(filePath, fileCategory, metrics) {
  const basename = path.basename(filePath, path.extname(filePath));
  const isTest = filePath.includes('.test.');
  const isIndex = basename === 'index';

  if (isTest) return `Test suite for ${basename.replace('.test', '')}`;
  if (isIndex) return `Barrel export module`;
  if (fileCategory === 'config') return `Configuration file`;
  if (metrics?.functionCount > 0) return `Module with ${metrics.functionCount} function(s)`;
  if (metrics?.classCount > 0) return `Module with ${metrics.classCount} class(es)`;
  return `TypeScript module`;
}

// Process a single batch
function processBatch(batchIndex) {
  const extractPath = path.join(TMP_DIR, `ua-file-extract-results-${batchIndex}.json`);
  const dispatchPath = path.join(TMP_DIR, `dispatch-${batchIndex}.json`);

  const extractData = JSON.parse(fs.readFileSync(extractPath, 'utf8'));
  const dispatchData = JSON.parse(fs.readFileSync(dispatchPath, 'utf8'));

  const nodes = [];
  const edges = [];
  const fileNodeIds = new Set();
  const functionNodeIds = new Set();
  const classNodeIds = new Set();

  // Create file nodes and function/class nodes
  for (const result of extractData.results) {
    const fileId = `file:${result.path}`;
    fileNodeIds.add(fileId);

    const tags = deriveTags(result.path, result.fileCategory);
    const summary = generateSummary(result.path, result.fileCategory, result.metrics);
    const complexity = getComplexity(result.nonEmptyLines || result.totalLines);

    // File node
    nodes.push({
      id: fileId,
      type: result.fileCategory === 'config' ? 'config' : 'file',
      name: path.basename(result.path),
      filePath: result.path,
      summary,
      tags,
      complexity,
      lines: result.totalLines,
      nonEmptyLines: result.nonEmptyLines
    });

    // Function nodes (10+ lines OR exported)
    if (result.functions) {
      for (const func of result.functions) {
        const lineCount = func.endLine - func.startLine + 1;
        const isExported = result.exports?.some(e => e.name === func.name);

        if (lineCount >= 10 || isExported) {
          const funcId = `function:${result.path}:${func.name}`;
          functionNodeIds.add(funcId);

          nodes.push({
            id: funcId,
            type: 'function',
            name: func.name,
            filePath: result.path,
            lineRange: [func.startLine, func.endLine],
            summary: isExported ? `Exported function` : `Internal function`,
            tags: tags.slice(0, 3),
            complexity: getComplexity(lineCount)
          });

          // Contains edge
          edges.push({
            source: fileId,
            target: funcId,
            type: 'contains',
            weight: 1.0
          });

          // Exports edge
          if (isExported) {
            edges.push({
              source: fileId,
              target: funcId,
              type: 'exports',
              weight: 0.8
            });
          }
        }
      }
    }

    // Class nodes (2+ methods OR 20+ lines OR exported)
    if (result.classes) {
      for (const cls of result.classes) {
        const lineCount = cls.endLine - cls.startLine + 1;
        const methodCount = cls.methods?.length || 0;
        const isExported = result.exports?.some(e => e.name === cls.name);

        if (methodCount >= 2 || lineCount >= 20 || isExported) {
          const clsId = `class:${result.path}:${cls.name}`;
          classNodeIds.add(clsId);

          nodes.push({
            id: clsId,
            type: 'class',
            name: cls.name,
            filePath: result.path,
            lineRange: [cls.startLine, cls.endLine],
            summary: isExported ? `Exported class` : `Internal class`,
            tags: tags.slice(0, 3),
            complexity: getComplexity(lineCount)
          });

          // Contains edge
          edges.push({
            source: fileId,
            target: clsId,
            type: 'contains',
            weight: 1.0
          });

          // Exports edge
          if (isExported) {
            edges.push({
              source: fileId,
              target: clsId,
              type: 'exports',
              weight: 0.8
            });
          }
        }
      }
    }

    // Calls edges (intra-file only, between created function nodes)
    if (result.callGraph) {
      for (const call of result.callGraph) {
        const callerId = `function:${result.path}:${call.caller}`;
        const calleeId = `function:${result.path}:${call.callee}`;

        if (functionNodeIds.has(callerId) && functionNodeIds.has(calleeId)) {
          edges.push({
            source: callerId,
            target: calleeId,
            type: 'calls',
            weight: 0.8
          });
        }
      }
    }
  }

  // Imports edges from batchImportData
  if (dispatchData.batchImportData) {
    for (const [sourcePath, targets] of Object.entries(dispatchData.batchImportData)) {
      const sourceId = `file:${sourcePath}`;
      if (!fileNodeIds.has(sourceId)) continue;

      for (const target of targets) {
        const targetId = `file:${target.path}`;
        // Only emit if target is also in this batch
        if (fileNodeIds.has(targetId)) {
          edges.push({
            source: sourceId,
            target: targetId,
            type: 'imports',
            weight: 0.7
          });
        }
      }
    }
  }

  // Tested_by edges
  for (const result of extractData.results) {
    if (result.path.includes('.test.')) {
      const testFileId = `file:${result.path}`;

      // Check batchImportData for what this test imports
      if (dispatchData.batchImportData?.[result.path]) {
        for (const target of dispatchData.batchImportData[result.path]) {
          const targetId = `file:${target.path}`;
          if (fileNodeIds.has(targetId) && !target.path.includes('.test.')) {
            // Emit tested_by edge from source to test
            edges.push({
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

  // Depends_on edges for index.ts barrel files
  for (const result of extractData.results) {
    if (path.basename(result.path) === 'index.ts' && result.exports) {
      const indexFileId = `file:${result.path}`;
      const dir = path.dirname(result.path);
      const exportedNames = new Set(result.exports.map(e => e.name));

      // Find sibling files in same directory
      for (const siblingResult of extractData.results) {
        if (siblingResult.path === result.path) continue;
        if (path.dirname(siblingResult.path) !== dir) continue;

        // Check if sibling exports any of the same names
        if (siblingResult.exports) {
          for (const exp of siblingResult.exports) {
            if (exportedNames.has(exp.name)) {
              const siblingId = `file:${siblingResult.path}`;
              edges.push({
                source: indexFileId,
                target: siblingId,
                type: 'depends_on',
                weight: 0.6
              });
              break; // One edge per sibling max
            }
          }
        }
      }
    }
  }

  return { nodes, edges };
}

// Process all batches
for (const batchIndex of BATCHES) {
  console.log(`Processing batch ${batchIndex}...`);
  const { nodes, edges } = processBatch(batchIndex);

  const output = {
    batchIndex,
    nodes,
    edges,
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      generatedAt: new Date().toISOString()
    }
  };

  const outputPath = path.join(TMP_DIR, `batch-${batchIndex}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✓ Batch ${batchIndex}: ${nodes.length} nodes, ${edges.length} edges`);
}

console.log('\nAll batches completed.');
