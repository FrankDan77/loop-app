#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp';

function determineComplexity(nonEmptyLines) {
  if (nonEmptyLines < 50) return 'simple';
  if (nonEmptyLines <= 200) return 'moderate';
  return 'complex';
}

function determineNodeType(fileCategory) {
  if (fileCategory === 'config') return 'config';
  if (fileCategory === 'documentation') return 'document';
  return 'file';
}

function generateFileTags(filePath, language, fileCategory) {
  const tags = new Set();

  if (language) tags.add(language.toLowerCase());
  if (fileCategory) tags.add(fileCategory);

  const parts = filePath.split('/');
  if (parts.includes('test') || parts.includes('tests') || parts.includes('__tests__')) {
    tags.add('test');
  }
  if (parts.includes('components')) tags.add('component');
  if (parts.includes('hooks')) tags.add('hook');
  if (parts.includes('utils')) tags.add('utility');
  if (parts.includes('stores')) tags.add('state');
  if (parts.includes('types')) tags.add('types');

  const fileName = path.basename(filePath);
  if (fileName.includes('.test.') || fileName.includes('.spec.')) tags.add('test');
  if (fileName.includes('.config.')) tags.add('config');
  if (fileName.includes('.d.ts')) tags.add('types');

  return Array.from(tags).slice(0, 5);
}

function generateFileSummary(filePath, fileData) {
  const fileName = path.basename(filePath);
  const isTest = fileName.includes('.test.') || fileName.includes('.spec.');
  const isComponent = filePath.endsWith('.tsx') && !isTest;

  if (isTest) {
    const testedFile = filePath.replace('.test.ts', '.ts').replace('.test.tsx', '.tsx');
    return `Test suite for ${path.basename(testedFile)}`;
  }

  if (isComponent && fileData.functions && fileData.functions.length > 0) {
    return `React component: ${fileData.functions[0].name}`;
  }

  if (fileData.functions && fileData.functions.length === 1) {
    return `Utility function: ${fileData.functions[0].name}`;
  }

  if (fileData.functions && fileData.functions.length > 1) {
    return `Module with ${fileData.functions.length} functions`;
  }

  if (fileData.classes && fileData.classes.length > 0) {
    return `Class definition: ${fileData.classes[0].name}`;
  }

  return `${fileName} module`;
}

function shouldIncludeFunction(func, exports) {
  const lineCount = func.endLine - func.startLine + 1;
  const isExported = exports && exports.some(exp => exp.name === func.name);
  return lineCount >= 10 || isExported;
}

function shouldIncludeClass(cls, exports) {
  const lineCount = cls.endLine - cls.startLine + 1;
  const methods = cls.methods ? cls.methods.length : 0;
  const isExported = exports && exports.some(exp => exp.name === cls.name);
  return (methods >= 2 || lineCount >= 20) || isExported;
}

function processBatch(batchNum) {
  const extractFile = path.join(BASE_DIR, `ua-file-extract-results-${batchNum}.json`);
  const dispatchFile = path.join(BASE_DIR, `dispatch-${batchNum}.json`);

  if (!fs.existsSync(extractFile) || !fs.existsSync(dispatchFile)) {
    throw new Error(`Missing files for batch ${batchNum}`);
  }

  const extractData = JSON.parse(fs.readFileSync(extractFile, 'utf-8'));
  const dispatchData = JSON.parse(fs.readFileSync(dispatchFile, 'utf-8'));

  const nodes = [];
  const edges = [];

  for (const fileData of extractData.results) {
    const filePath = fileData.path;
    const fileId = `file:${filePath}`;

    const fileNode = {
      id: fileId,
      type: determineNodeType(fileData.fileCategory),
      name: path.basename(filePath),
      filePath: filePath,
      summary: generateFileSummary(filePath, fileData),
      tags: generateFileTags(filePath, fileData.language, fileData.fileCategory),
      complexity: determineComplexity(fileData.nonEmptyLines || 0),
      metadata: {
        language: fileData.language,
        totalLines: fileData.totalLines,
        nonEmptyLines: fileData.nonEmptyLines
      }
    };
    nodes.push(fileNode);

    if (fileData.functions && Array.isArray(fileData.functions)) {
      for (const func of fileData.functions) {
        if (shouldIncludeFunction(func, fileData.exports)) {
          const funcId = `function:${filePath}:${func.name}`;
          const funcNode = {
            id: funcId,
            type: 'function',
            name: func.name,
            filePath: filePath,
            summary: `Function ${func.name}`,
            tags: ['function', fileData.language].filter(Boolean),
            complexity: determineComplexity(func.endLine - func.startLine + 1),
            lineRange: {
              start: func.startLine,
              end: func.endLine
            }
          };
          nodes.push(funcNode);

          edges.push({
            source: fileId,
            target: funcId,
            type: 'contains',
            weight: 1.0
          });

          if (fileData.exports && fileData.exports.some(exp => exp.name === func.name)) {
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

    if (fileData.classes && Array.isArray(fileData.classes)) {
      for (const cls of fileData.classes) {
        if (shouldIncludeClass(cls, fileData.exports)) {
          const clsId = `class:${filePath}:${cls.name}`;
          const clsNode = {
            id: clsId,
            type: 'class',
            name: cls.name,
            filePath: filePath,
            summary: `Class ${cls.name}`,
            tags: ['class', fileData.language].filter(Boolean),
            complexity: determineComplexity(cls.endLine - cls.startLine + 1),
            lineRange: {
              start: cls.startLine,
              end: cls.endLine
            },
            metadata: {
              methods: cls.methods ? cls.methods.length : 0
            }
          };
          nodes.push(clsNode);

          edges.push({
            source: fileId,
            target: clsId,
            type: 'contains',
            weight: 1.0
          });

          if (fileData.exports && fileData.exports.some(exp => exp.name === cls.name)) {
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

    if (fileData.callGraph && Array.isArray(fileData.callGraph)) {
      for (const call of fileData.callGraph) {
        const callerId = `function:${filePath}:${call.caller}`;
        const calleeId = `function:${filePath}:${call.callee}`;

        if (nodes.some(n => n.id === callerId) && nodes.some(n => n.id === calleeId)) {
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

  if (dispatchData.batchImportData) {
    for (const [importerPath, importedPaths] of Object.entries(dispatchData.batchImportData)) {
      const importerId = `file:${importerPath}`;

      if (Array.isArray(importedPaths)) {
        for (const importedPath of importedPaths) {
          const importedId = `file:${importedPath}`;

          edges.push({
            source: importerId,
            target: importedId,
            type: 'imports',
            weight: 0.7
          });

          edges.push({
            source: importerId,
            target: importedId,
            type: 'depends_on',
            weight: 0.6
          });
        }
      }
    }
  }

  for (const node of nodes) {
    if (node.type === 'file' && (node.tags.includes('test') || node.name.includes('.test.') || node.name.includes('.spec.'))) {
      const implPath = node.filePath
        .replace('.test.ts', '.ts')
        .replace('.test.tsx', '.tsx')
        .replace('.spec.ts', '.ts')
        .replace('.spec.tsx', '.tsx');

      const implId = `file:${implPath}`;
      if (nodes.some(n => n.id === implId) && implId !== node.id) {
        edges.push({
          source: node.id,
          target: implId,
          type: 'tested_by',
          weight: 0.5
        });
      }
    }
  }

  return {
    batchIndex: batchNum,
    nodes,
    edges,
    metadata: {
      processedAt: new Date().toISOString(),
      fileCount: extractData.results.length,
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  };
}

let totalNodes = 0;
let totalEdges = 0;
const completedBatches = [];

for (let i = 26; i <= 45; i++) {
  try {
    console.log(`Processing batch ${i}...`);
    const result = processBatch(i);

    const outputFile = path.join(BASE_DIR, `batch-${i}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    totalNodes += result.nodes.length;
    totalEdges += result.edges.length;
    completedBatches.push(i);
    console.log(`  Batch ${i}: ${result.nodes.length} nodes, ${result.edges.length} edges`);
  } catch (error) {
    console.error(`  Error processing batch ${i}:`, error.message);
  }
}

console.log('\n=== Summary ===');
console.log(`Completed batches: ${completedBatches.join(', ')}`);
console.log(`Total nodes: ${totalNodes}`);
console.log(`Total edges: ${totalEdges}`);
