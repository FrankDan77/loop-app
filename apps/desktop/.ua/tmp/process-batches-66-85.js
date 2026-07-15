#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp';

function determineComplexity(lines) {
  if (lines < 50) return 'simple';
  if (lines <= 200) return 'moderate';
  return 'complex';
}

function determineNodeType(fileCategory) {
  if (fileCategory === 'config') return 'config';
  if (fileCategory === 'docs') return 'document';
  return 'file';
}

function generateFileSummary(fileData) {
  const parts = [];
  if (fileData.classes?.length) parts.push(`${fileData.classes.length} classes`);
  if (fileData.functions?.length) parts.push(`${fileData.functions.length} functions`);
  if (fileData.exports?.length) parts.push(`${fileData.exports.length} exports`);

  if (parts.length === 0) {
    return `${fileData.language || 'Code'} file with ${fileData.nonEmptyLines || 0} lines`;
  }

  return `${fileData.language || 'Code'} file: ${parts.join(', ')}`;
}

function generateTags(fileData) {
  const tags = new Set();

  if (fileData.language) tags.add(fileData.language.toLowerCase());
  if (fileData.fileCategory) tags.add(fileData.fileCategory);

  // Add tags based on file path
  const filePath = fileData.path || '';
  if (filePath.includes('/test/') || filePath.includes('.test.') || filePath.includes('.spec.')) {
    tags.add('test');
  }
  if (filePath.includes('/components/')) tags.add('component');
  if (filePath.includes('/hooks/')) tags.add('hooks');
  if (filePath.includes('/utils/')) tags.add('utilities');
  if (filePath.includes('/types/')) tags.add('types');
  if (filePath.includes('/store/') || filePath.includes('/stores/')) tags.add('state');
  if (filePath.includes('/api/')) tags.add('api');
  if (filePath.includes('/services/')) tags.add('service');

  // Add tags based on exports
  if (fileData.exports?.some(e => e.type === 'class' || e.name?.includes('Class'))) {
    tags.add('class');
  }
  if (fileData.exports?.some(e => e.type === 'function')) {
    tags.add('function');
  }

  const tagArray = Array.from(tags);

  // Ensure 3-5 tags
  if (tagArray.length < 3) {
    if (fileData.classes?.length) tagArray.push('object-oriented');
    if (fileData.functions?.length) tagArray.push('functional');
    if (!tagArray.includes('code')) tagArray.push('code');
  }

  return tagArray.slice(0, 5);
}

function shouldCreateFunctionNode(func, isExported) {
  if (isExported) return true;
  if (!func.lineRange) return false;
  const lines = func.lineRange.end - func.lineRange.start + 1;
  return lines >= 10;
}

function shouldCreateClassNode(cls, isExported) {
  if (isExported) return true;
  if (!cls.lineRange) return false;
  const lines = cls.lineRange.end - cls.lineRange.start + 1;
  if (lines >= 20) return true;
  if (cls.methods && cls.methods.length >= 2) return true;
  return false;
}

function processBatch(batchIndex) {
  const extractFile = path.join(BASE_DIR, `ua-file-extract-results-${batchIndex}.json`);
  const dispatchFile = path.join(BASE_DIR, `dispatch-${batchIndex}.json`);

  const extractData = JSON.parse(fs.readFileSync(extractFile, 'utf-8'));
  const dispatchData = JSON.parse(fs.readFileSync(dispatchFile, 'utf-8'));

  const nodes = [];
  const edges = [];

  // Process each file
  for (const fileData of extractData.results || []) {
    const filePath = fileData.path;
    const fileId = `file:${filePath}`;

    // Create file node
    const fileNode = {
      id: fileId,
      type: determineNodeType(fileData.fileCategory),
      name: path.basename(filePath),
      filePath: filePath,
      summary: generateFileSummary(fileData),
      tags: generateTags(fileData),
      complexity: determineComplexity(fileData.nonEmptyLines || fileData.totalLines || 0)
    };
    nodes.push(fileNode);

    // Track exports for this file
    const exportedNames = new Set();
    if (fileData.exports) {
      for (const exp of fileData.exports) {
        if (exp.name) exportedNames.add(exp.name);
      }
    }

    // Create function nodes
    if (fileData.functions) {
      for (const func of fileData.functions) {
        const isExported = exportedNames.has(func.name);

        // Convert startLine/endLine to lineRange
        const lineRange = (func.startLine && func.endLine)
          ? { start: func.startLine, end: func.endLine }
          : null;

        // Create modified func object with lineRange
        const funcWithRange = { ...func, lineRange };

        if (shouldCreateFunctionNode(funcWithRange, isExported)) {
          const funcId = `function:${filePath}:${func.name}`;
          const lines = lineRange ? lineRange.end - lineRange.start + 1 : 20;

          const funcNode = {
            id: funcId,
            type: 'function',
            name: func.name,
            filePath: filePath,
            summary: `Function: ${func.name}`,
            tags: ['function', fileData.language?.toLowerCase() || 'code'].filter(Boolean),
            complexity: determineComplexity(lines)
          };

          if (lineRange) {
            funcNode.lineRange = lineRange;
          }

          nodes.push(funcNode);

          // Contains edge
          edges.push({
            from: fileId,
            to: funcId,
            type: 'contains',
            weight: 1.0
          });

          // Exports edge if exported
          if (isExported) {
            edges.push({
              from: fileId,
              to: funcId,
              type: 'exports',
              weight: 0.8
            });
          }
        }
      }
    }

    // Create class nodes
    if (fileData.classes) {
      for (const cls of fileData.classes) {
        const isExported = exportedNames.has(cls.name);

        // Convert startLine/endLine to lineRange
        const lineRange = (cls.startLine && cls.endLine)
          ? { start: cls.startLine, end: cls.endLine }
          : null;

        // Create modified class object with lineRange
        const clsWithRange = { ...cls, lineRange };

        if (shouldCreateClassNode(clsWithRange, isExported)) {
          const classId = `class:${filePath}:${cls.name}`;
          const lines = lineRange ? lineRange.end - lineRange.start + 1 : 30;

          const classNode = {
            id: classId,
            type: 'class',
            name: cls.name,
            filePath: filePath,
            summary: `Class: ${cls.name}`,
            tags: ['class', fileData.language?.toLowerCase() || 'code'].filter(Boolean),
            complexity: determineComplexity(lines)
          };

          if (lineRange) {
            classNode.lineRange = lineRange;
          }

          nodes.push(classNode);

          // Contains edge
          edges.push({
            from: fileId,
            to: classId,
            type: 'contains',
            weight: 1.0
          });

          // Exports edge if exported
          if (isExported) {
            edges.push({
              from: fileId,
              to: classId,
              type: 'exports',
              weight: 0.8
            });
          }
        }
      }
    }

    // Create call edges from callGraph
    if (fileData.callGraph) {
      for (const call of fileData.callGraph) {
        const callerId = `function:${filePath}:${call.caller}`;
        const calleeId = `function:${filePath}:${call.callee}`;

        // Only create edge if both nodes exist
        if (nodes.some(n => n.id === callerId) && nodes.some(n => n.id === calleeId)) {
          edges.push({
            from: callerId,
            to: calleeId,
            type: 'calls',
            weight: 0.8
          });
        }
      }
    }
  }

  // Process imports from dispatch data
  if (dispatchData.batchImportData) {
    for (const [importer, importees] of Object.entries(dispatchData.batchImportData)) {
      const fromId = `file:${importer}`;

      if (Array.isArray(importees)) {
        for (const importee of importees) {
          const toId = `file:${importee}`;

          // Create edge even if target is not in this batch (cross-batch reference)
          if (nodes.some(n => n.id === fromId)) {
            edges.push({
              from: fromId,
              to: toId,
              type: 'imports',
              weight: 0.7
            });
          }
        }
      }
    }
  }

  // Create tested_by edges (test files to implementation files)
  for (const node of nodes) {
    if (node.type === 'file' && (node.tags.includes('test') || node.filePath.includes('.test.') || node.filePath.includes('.spec.'))) {
      // Find corresponding implementation file
      const implPath = node.filePath
        .replace('.test.', '.')
        .replace('.spec.', '.')
        .replace(/\/test\//, '/src/')
        .replace(/\/__tests__\//, '/');

      const implId = `file:${implPath}`;
      if (nodes.some(n => n.id === implId)) {
        edges.push({
          from: node.id,
          to: implId,
          type: 'tested_by',
          weight: 0.5
        });
      }
    }
  }

  return { nodes, edges, batchIndex };
}

// Process all batches 66-85
let totalNodes = 0;
let totalEdges = 0;

for (let i = 66; i <= 85; i++) {
  try {
    console.log(`Processing batch ${i}...`);
    const result = processBatch(i);

    const outputFile = path.join(BASE_DIR, `batch-${i}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      batchIndex: result.batchIndex,
      nodes: result.nodes,
      edges: result.edges,
      metadata: {
        nodeCount: result.nodes.length,
        edgeCount: result.edges.length,
        processedAt: new Date().toISOString()
      }
    }, null, 2));

    totalNodes += result.nodes.length;
    totalEdges += result.edges.length;

    console.log(`  ✓ Batch ${i}: ${result.nodes.length} nodes, ${result.edges.length} edges`);
  } catch (error) {
    console.error(`  ✗ Batch ${i} failed:`, error.message);
  }
}

console.log(`\nCompleted processing batches 66-85`);
console.log(`Total nodes: ${totalNodes}`);
console.log(`Total edges: ${totalEdges}`);
