const extractResults = require('./ua-file-extract-results-4.json');
const dispatch = require('./dispatch-4.json');

const nodes = [];
const edges = [];

// Helper: generate node IDs
function fileNodeId(path) { return `file:${path}`; }
function functionNodeId(path, name) { return `function:${path}:${name}`; }
function classNodeId(path, name) { return `class:${path}:${name}`; }

// Helper: determine complexity
function getComplexity(nonEmptyLines) {
  if (nonEmptyLines < 50) return 'simple';
  if (nonEmptyLines < 200) return 'moderate';
  return 'complex';
}

// Helper: generate tags
function generateFileTags(path, category) {
  const tags = [];
  if (path.includes('/renderer/')) tags.push('renderer');
  if (path.includes('/lib/')) tags.push('library');
  if (path.includes('/components/')) tags.push('component');
  if (path.includes('/hooks/')) tags.push('hook');
  if (path.includes('/utils/')) tags.push('utility');
  if (path.includes('/routers/')) tags.push('router');
  if (path.includes('test.ts')) tags.push('test');
  if (path.includes('.tsx')) tags.push('react');
  if (category === 'code') tags.push('typescript');
  return tags.slice(0, 5);
}

// Process each file
for (const result of extractResults.results) {
  const { path, fileCategory, nonEmptyLines, functions = [], classes = [], exports = [] } = result;
  
  // Create file node
  const fileSummary = path.includes('index.ts') 
    ? 'Barrel export file re-exporting module components'
    : path.includes('test.ts')
    ? 'Test suite for module functionality'
    : path.includes('/routers/')
    ? 'tRPC router defining API endpoints'
    : path.includes('/hooks/')
    ? 'React hook for component state/logic'
    : path.includes('/components/')
    ? 'React component for UI rendering'
    : path.includes('/utils/')
    ? 'Utility functions for shared logic'
    : path.includes('/lib/')
    ? 'Library module with shared functionality'
    : 'TypeScript module with application logic';
  
  nodes.push({
    id: fileNodeId(path),
    type: fileCategory === 'config' ? 'config' : 'file',
    name: path.split('/').pop(),
    filePath: path,
    summary: fileSummary,
    tags: generateFileTags(path, fileCategory),
    complexity: getComplexity(nonEmptyLines)
  });
  
  // Create function nodes (10+ lines OR exported)
  const exportedNames = new Set(exports.map(e => e.name));
  for (const func of functions) {
    const lineCount = func.endLine - func.startLine + 1;
    const isExported = exportedNames.has(func.name);
    
    if (lineCount >= 10 || isExported) {
      nodes.push({
        id: functionNodeId(path, func.name),
        type: 'function',
        name: func.name,
        filePath: path,
        summary: `Function in ${path.split('/').pop()}`,
        tags: [isExported ? 'exported' : 'internal', 'function'],
        complexity: getComplexity(lineCount),
        lineRange: [func.startLine, func.endLine]
      });
      
      // contains edge
      edges.push({
        from: fileNodeId(path),
        to: functionNodeId(path, func.name),
        type: 'contains',
        weight: 1.0
      });
      
      // exports edge if exported
      if (isExported) {
        edges.push({
          from: fileNodeId(path),
          to: functionNodeId(path, func.name),
          type: 'exports',
          weight: 0.8
        });
      }
    }
  }
  
  // Create class nodes (2+ methods or 20+ lines OR exported)
  for (const cls of classes || []) {
    const isExported = exportedNames.has(cls.name);
    const lineCount = cls.endLine - cls.startLine + 1;
    const methodCount = cls.methods?.length || 0;
    
    if (methodCount >= 2 || lineCount >= 20 || isExported) {
      nodes.push({
        id: classNodeId(path, cls.name),
        type: 'class',
        name: cls.name,
        filePath: path,
        summary: `Class in ${path.split('/').pop()}`,
        tags: [isExported ? 'exported' : 'internal', 'class'],
        complexity: getComplexity(lineCount),
        lineRange: [cls.startLine, cls.endLine]
      });
      
      edges.push({
        from: fileNodeId(path),
        to: classNodeId(path, cls.name),
        type: 'contains',
        weight: 1.0
      });
      
      if (isExported) {
        edges.push({
          from: fileNodeId(path),
          to: classNodeId(path, cls.name),
          type: 'exports',
          weight: 0.8
        });
      }
    }
  }
}

// Create import edges
for (const [filePath, imports] of Object.entries(dispatch.batchImportData)) {
  for (const importPath of imports) {
    edges.push({
      from: fileNodeId(filePath),
      to: fileNodeId(importPath),
      type: 'imports',
      weight: 0.7,
      direction: 'forward'
    });
  }
}

// Create test edges
for (const result of extractResults.results) {
  if (result.path.includes('.test.ts')) {
    const imports = dispatch.batchImportData[result.path] || [];
    for (const importPath of imports) {
      if (!importPath.includes('.test.ts')) {
        edges.push({
          from: fileNodeId(importPath),
          to: fileNodeId(result.path),
          type: 'tested_by',
          weight: 0.5,
          direction: 'forward'
        });
      }
    }
  }
}

console.log(JSON.stringify({ nodeCount: nodes.length, edgeCount: edges.length, nodes, edges }));
