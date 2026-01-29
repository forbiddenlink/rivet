import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect layered architecture violations
 * - UI layer importing from data layer
 * - Presentation logic in data access
 * - Missing separation of concerns
 */
export function detectLayerViolations(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  // Determine file's layer based on path
  const layer = determineLayer(filePath)

  function visit(node: ASTNode): void {
    if (
      node.type === 'ImportDeclaration' &&
      node.children &&
      node.children[0]?.type === 'Literal'
    ) {
      const importPath = node.children[0]
      if (importPath.raw.type === 'Literal' && typeof importPath.raw.value === 'string') {
        const importedLayer = determineLayer(importPath.raw.value)
        
        // Check for violations
        if (violatesLayerRules(layer, importedLayer)) {
          detections.push({
            id: `architecture-${++detectionCounter}`,
            ruleId: 'layer-violation',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'high',
            category: 'architecture',
            message: `${layer} layer should not import from ${importedLayer} layer`,
            metadata: {
              currentLayer: layer,
              importedLayer,
              importPath: importPath.raw.value,
              suggestion: 'Follow layered architecture: UI → Domain → Data',
            },
          })
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}

function determineLayer(path: string): string {
  const lower = path.toLowerCase()
  
  if (
    lower.includes('/components/') ||
    lower.includes('/ui/') ||
    lower.includes('/views/') ||
    lower.includes('/pages/')
  ) {
    return 'presentation'
  }
  
  if (
    lower.includes('/services/') ||
    lower.includes('/business/') ||
    lower.includes('/domain/') ||
    lower.includes('/use-cases/')
  ) {
    return 'domain'
  }
  
  if (
    lower.includes('/repositories/') ||
    lower.includes('/data/') ||
    lower.includes('/api/') ||
    lower.includes('/database/')
  ) {
    return 'data'
  }
  
  return 'unknown'
}

function violatesLayerRules(currentLayer: string, importedLayer: string): boolean {
  // Presentation can import from domain, but not data
  if (currentLayer === 'presentation' && importedLayer === 'data') {
    return true
  }
  
  // Data layer should not import from presentation or domain
  if (currentLayer === 'data' && (importedLayer === 'presentation' || importedLayer === 'domain')) {
    return true
  }
  
  return false
}
