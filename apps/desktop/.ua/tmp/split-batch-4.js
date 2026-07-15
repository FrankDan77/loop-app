const data = require('./batch-4-raw.json');
const fs = require('fs');

const { nodes, edges } = data;

// Calculate split: parts = ceil(max(nodes/60, edges/120))
const parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
console.log(`Splitting into ${parts} parts (${nodes.length} nodes, ${edges.length} edges)`);

// Get unique file paths and sort alphabetically
const filePaths = [...new Set(nodes.filter(n => n.type === 'file' || n.type === 'config').map(n => n.filePath))].sort();
console.log(`${filePaths.length} files total`);

// Split files into chunks
const filesPerPart = Math.ceil(filePaths.length / parts);
const fileChunks = [];
for (let i = 0; i < parts; i++) {
  fileChunks.push(filePaths.slice(i * filesPerPart, (i + 1) * filesPerPart));
}

// Create parts
for (let partIdx = 0; partIdx < parts; partIdx++) {
  const partFiles = new Set(fileChunks[partIdx]);
  
  // Include file nodes and their contained function/class nodes
  const partNodes = nodes.filter(n => {
    if (n.type === 'file' || n.type === 'config') {
      return partFiles.has(n.filePath);
    }
    // function/class nodes belong to the part if their file is in this part
    return partFiles.has(n.filePath);
  });
  
  const partNodeIds = new Set(partNodes.map(n => n.id));
  
  // Include edges where both from and to are in this part
  const partEdges = edges.filter(e => partNodeIds.has(e.from) && partNodeIds.has(e.to));
  
  const output = {
    nodes: partNodes,
    edges: partEdges
  };
  
  const filename = `batch-4-part-${partIdx + 1}.json`;
  fs.writeFileSync(`../intermediate/${filename}`, JSON.stringify(output, null, 2));
  console.log(`Part ${partIdx + 1}: ${partNodes.length} nodes, ${partEdges.length} edges -> ${filename}`);
}
