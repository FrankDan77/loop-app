#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_DIR = '/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp';

interface ExtractResult {
  path: string;
  language: string;
  fileCategory: string;
  totalLines: number;
  nonEmptyLines: number;
  functions?: Array<{
    name: string;
    startLine: number;
    endLine: number;
    params?: string[];
  }>;
  classes?: Array<{
    name: string;
    startLine: number;
    endLine: number;
    methods?: Array<{ name: string; startLine: number; endLine: number }>;
  }>;
  exports?: Array<{
    name: string;
    line: number;
    isDefault: boolean;
  }>;
  callGraph?: Array<{
    caller: string;
    callee: string;
    lineNumber: number;
  }>;
  imports?: Array<{
    source: string;
    specifiers?: Array<{ imported?: string; local?: string }>;
    line: number;
  }>;
  metrics?: {
    importCount?: number;
    exportCount?: number;
    functionCount?: number;
    classCount?: number;
  };
}

interface DispatchFile {
  path: string;
  language: string;
  sizeLines: number;
  fileCategory: string;
}

interface BatchImportData {
  from: string;
  to: string;
  imports: Array<{ imported?: string; local?: string }>;
}

interface Node {
  id: string;
  type: string;
  name: string;
  filePath: string;
  summary: string;
  tags: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  lineRange?: { start: number; end: number };
  language?: string;
  metrics?: any;
}

interface Edge {
  from: string;
  to: string;
  type: string;
  weight: number;
  metadata?: any;
}

interface BatchOutput {
  batchIndex: number;
  nodes: Node[];
  edges: Edge[];
}

function getComplexity(lines: number): 'simple' | 'moderate' | 'complex' {
  if (lines < 50) return 'simple';
  if (lines <= 200) return 'moderate';
  return 'complex';
}

function generateTags(file: ExtractResult): string[] {
  const tags: string[] = [];

  if (file.path.includes('.test.')) tags.push('test');
  if (file.path.includes('/components/')) tags.push('component');
  if (file.path.includes('/lib/') || file.path.includes('/utils/')) tags.push('utility');
  if (file.path.includes('/hooks/')) tags.push('hook');
  if (file.path.includes('/stores/')) tags.push('store');
  if (file.fileCategory === 'config') tags.push('config');
  if (file.exports && file.exports.length > 0) tags.push('exports');
  if (file.functions && file.functions.length > 0) tags.push('functions');
  if (file.classes && file.classes.length > 0) tags.push('classes');

  // Ensure 3-5 tags
  if (tags.length < 3) {
    if (file.language) tags.push(file.language);
    if (file.fileCategory) tags.push(file.fileCategory);
    tags.push('code');
  }

  return tags.slice(0, 5);
}

function generateFileSummary(file: ExtractResult): string {
  const parts: string[] = [];

  if (file.path.includes('.test.')) {
    parts.push('Test file');
  } else if (file.fileCategory === 'config') {
    parts.push('Configuration file');
  } else if (file.fileCategory === 'document') {
    parts.push('Documentation');
  } else {
    parts.push('Source file');
  }

  if (file.functions && file.functions.length > 0) {
    parts.push(`${file.functions.length} function${file.functions.length > 1 ? 's' : ''}`);
  }
  if (file.classes && file.classes.length > 0) {
    parts.push(`${file.classes.length} class${file.classes.length > 1 ? 'es' : ''}`);
  }
  if (file.exports && file.exports.length > 0) {
    parts.push(`${file.exports.length} export${file.exports.length > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}

function processBatch(batchIndex: number): BatchOutput {
  const extractPath = join(BASE_DIR, `ua-file-extract-results-${batchIndex}.json`);
  const dispatchPath = join(BASE_DIR, `dispatch-${batchIndex}.json`);

  const extractData = JSON.parse(readFileSync(extractPath, 'utf-8'));
  const dispatchData = JSON.parse(readFileSync(dispatchPath, 'utf-8'));

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const exportMap = new Map<string, Set<string>>();

  // Process each file
  for (const file of extractData.results || []) {
    const fileId = `file:${file.path}`;
    const complexity = getComplexity(file.nonEmptyLines || file.totalLines);

    // Create file node
    const fileNode: Node = {
      id: fileId,
      type: file.fileCategory === 'config' ? 'config' : file.fileCategory === 'document' ? 'document' : 'file',
      name: file.path.split('/').pop() || file.path,
      filePath: file.path,
      summary: generateFileSummary(file),
      tags: generateTags(file),
      complexity,
      language: file.language,
      metrics: file.metrics
    };
    nodes.push(fileNode);

    // Track exports
    if (file.exports) {
      const exportSet = new Set<string>();
      for (const exp of file.exports) {
        exportSet.add(exp.name);
      }
      exportMap.set(file.path, exportSet);
    }

    // Process functions
    if (file.functions) {
      for (const func of file.functions) {
        const lines = func.endLine - func.startLine + 1;
        const isExported = file.exports?.some(e => e.name === func.name);

        // Only include if 10+ lines OR exported
        if (lines >= 10 || isExported) {
          const funcId = `function:${file.path}:${func.name}`;
          const funcNode: Node = {
            id: funcId,
            type: 'function',
            name: func.name,
            filePath: file.path,
            summary: `Function with ${func.params?.length || 0} parameter${func.params?.length !== 1 ? 's' : ''}, ${lines} lines`,
            tags: ['function', isExported ? 'exported' : 'internal', file.language].filter(Boolean),
            complexity: getComplexity(lines),
            lineRange: { start: func.startLine, end: func.endLine }
          };
          nodes.push(funcNode);

          // Contains edge
          edges.push({
            from: fileId,
            to: funcId,
            type: 'contains',
            weight: 1.0
          });

          // Export edge
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

    // Process classes
    if (file.classes) {
      for (const cls of file.classes) {
        const lines = cls.endLine - cls.startLine + 1;
        const methodCount = cls.methods?.length || 0;
        const isExported = file.exports?.some(e => e.name === cls.name);

        // Include if: 2+ methods OR 20+ lines OR exported
        if (methodCount >= 2 || lines >= 20 || isExported) {
          const classId = `class:${file.path}:${cls.name}`;
          const classNode: Node = {
            id: classId,
            type: 'class',
            name: cls.name,
            filePath: file.path,
            summary: `Class with ${methodCount} method${methodCount !== 1 ? 's' : ''}, ${lines} lines`,
            tags: ['class', isExported ? 'exported' : 'internal', file.language].filter(Boolean),
            complexity: getComplexity(lines),
            lineRange: { start: cls.startLine, end: cls.endLine }
          };
          nodes.push(classNode);

          // Contains edge
          edges.push({
            from: fileId,
            to: classId,
            type: 'contains',
            weight: 1.0
          });

          // Export edge
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

    // Process call graph
    if (file.callGraph) {
      for (const call of file.callGraph) {
        const callerId = `function:${file.path}:${call.caller}`;
        const calleeId = `function:${file.path}:${call.callee}`;

        // Only create edge if both nodes exist
        if (nodes.some(n => n.id === callerId)) {
          edges.push({
            from: callerId,
            to: calleeId,
            type: 'calls',
            weight: 0.8,
            metadata: { lineNumber: call.lineNumber }
          });
        }
      }
    }

    // Test relationships
    if (file.path.includes('.test.')) {
      const testedPath = file.path.replace(/\.test\.(ts|tsx|js|jsx)$/, '.$1');
      const testedFileId = `file:${testedPath}`;

      edges.push({
        from: fileId,
        to: testedFileId,
        type: 'tested_by',
        weight: 0.5
      });
    }
  }

  // Process imports from dispatch data
  if (dispatchData.batchImportData) {
    const importData = dispatchData.batchImportData as Record<string, string[]>;
    for (const [fromPath, toPaths] of Object.entries(importData)) {
      for (const toPath of toPaths) {
        edges.push({
          from: `file:${fromPath}`,
          to: `file:${toPath}`,
          type: 'imports',
          weight: 0.7
        });
      }
    }
  }

  return {
    batchIndex,
    nodes,
    edges
  };
}

// Process all batches
let totalNodes = 0;
let totalEdges = 0;

for (let batchIndex = 106; batchIndex <= 117; batchIndex++) {
  console.log(`Processing batch ${batchIndex}...`);

  const output = processBatch(batchIndex);
  totalNodes += output.nodes.length;
  totalEdges += output.edges.length;

  const outputPath = join(BASE_DIR, `batch-${batchIndex}.json`);
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`  Batch ${batchIndex}: ${output.nodes.length} nodes, ${output.edges.length} edges`);
}

console.log(`\nCompleted all batches: ${totalNodes} total nodes, ${totalEdges} total edges`);
