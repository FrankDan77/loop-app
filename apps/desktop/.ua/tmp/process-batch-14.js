const fs = require('fs');
const path = require('path');

// Read input files
const resultsPath = '/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/ua-file-extract-results-14.json';
const dispatchPath = '/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/dispatch-14.json';

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
const dispatch = JSON.parse(fs.readFileSync(dispatchPath, 'utf-8'));

const nodes = [];
const edges = [];
const nodeIdMap = new Map();
let nodeIdCounter = 1;

function getNodeId(identifier) {
  if (!nodeIdMap.has(identifier)) {
    nodeIdMap.set(identifier, `n${nodeIdCounter++}`);
  }
  return nodeIdMap.get(identifier);
}

function calculateFunctionLines(func) {
  return func.endLine - func.startLine + 1;
}

// Process each file
for (const fileData of results.results) {
  const filePath = fileData.path;
  const fileNodeId = getNodeId(filePath);

  // Create file node
  nodes.push({
    id: fileNodeId,
    label: path.basename(filePath),
    type: 'file',
    path: filePath,
    lines: fileData.totalLines,
    language: fileData.language
  });

  // Process functions - include if 10+ lines OR exported
  const exportedNames = new Set((fileData.exports || []).map(e => e.name));

  if (fileData.functions) {
    for (const func of fileData.functions) {
      const funcLines = calculateFunctionLines(func);
      const isExported = exportedNames.has(func.name);

      // Include if 10+ lines OR exported
      if (funcLines >= 10 || isExported) {
        const funcNodeId = getNodeId(`${filePath}::${func.name}`);

        nodes.push({
          id: funcNodeId,
          label: func.name,
          type: 'function',
          path: filePath,
          startLine: func.startLine,
          endLine: func.endLine,
          lines: funcLines,
          exported: isExported
        });

        // Edge from file to function (contains)
        edges.push({
          source: fileNodeId,
          target: funcNodeId,
          type: 'contains',
          weight: 1
        });
      }
    }
  }

  // Process classes - include if 2+ methods OR 20+ lines OR exported
  if (fileData.classes) {
    for (const cls of fileData.classes) {
      const classLines = cls.endLine - cls.startLine + 1;
      const isExported = exportedNames.has(cls.name);
      const methodCount = (cls.methods || []).length;

      // Include if (2+ methods OR 20+ lines) OR exported
      if (methodCount >= 2 || classLines >= 20 || isExported) {
        const classNodeId = getNodeId(`${filePath}::${cls.name}`);

        nodes.push({
          id: classNodeId,
          label: cls.name,
          type: 'class',
          path: filePath,
          startLine: cls.startLine,
          endLine: cls.endLine,
          lines: classLines,
          methods: methodCount,
          exported: isExported
        });

        // Edge from file to class (contains)
        edges.push({
          source: fileNodeId,
          target: classNodeId,
          type: 'contains',
          weight: 1
        });
      }
    }
  }

  // Process imports - create edges from this file to imported files
  const imports = dispatch.batchImportData[filePath] || [];
  for (const importPath of imports) {
    const importFileNodeId = getNodeId(importPath);

    edges.push({
      source: fileNodeId,
      target: importFileNodeId,
      type: 'imports',
      weight: 2
    });
  }

  // Process call graph - create edges between functions
  if (fileData.callGraph) {
    for (const call of fileData.callGraph) {
      const callerNodeId = getNodeId(`${filePath}::${call.caller}`);

      // Check if callee is a local function or external
      if (nodeIdMap.has(`${filePath}::${call.callee}`)) {
        const calleeNodeId = getNodeId(`${filePath}::${call.callee}`);
        edges.push({
          source: callerNodeId,
          target: calleeNodeId,
          type: 'calls',
          weight: 1
        });
      }
    }
  }

  // Process exports - create edges from functions/classes to file
  if (fileData.exports) {
    for (const exp of fileData.exports) {
      const symbolNodeId = nodeIdMap.get(`${filePath}::${exp.name}`);
      if (symbolNodeId) {
        edges.push({
          source: symbolNodeId,
          target: fileNodeId,
          type: 'exports',
          weight: 1
        });
      }
    }
  }
}

// Create knowledge graph structure
const knowledgeGraph = {
  batchIndex: 14,
  totalBatches: 117,
  fileCount: dispatch.files.length,
  nodeCount: nodes.length,
  edgeCount: edges.length,
  nodes: nodes,
  edges: edges,
  metadata: {
    generated: new Date().toISOString(),
    keyFiles: [
      'src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/page.tsx',
      'src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/useWorkspacePaneOpeners/useWorkspacePaneOpeners.ts',
      'src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/state/fileDocumentStore/fileDocumentStore.ts',
      'src/renderer/routes/_authenticated/components/V2NotificationController/lib/lifecycleEvents.ts',
      'src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/ChatPane/components/SessionSelector/SessionSelector.tsx',
      'src/shared/file-types.ts'
    ]
  }
};

// Write output
const outputPath = '/Users/wushengyu/Develop/hustle/superset/apps/desktop/.ua/tmp/batch-14.json';
fs.writeFileSync(outputPath, JSON.stringify(knowledgeGraph, null, 2));

console.log(`Knowledge graph created successfully!`);
console.log(`Files: ${dispatch.files.length}`);
console.log(`Nodes: ${nodes.length}`);
console.log(`Edges: ${edges.length}`);
console.log(`Output: ${outputPath}`);
