#!/usr/bin/env tsx
/**
 * Automated script to replace console.* statements with logger
 * 
 * Replaces:
 * - console.log() → logger.info() or logger.debug()
 * - console.warn() → logger.warn()
 * - console.error() → logger.error()
 * - console.info() → logger.info()
 * - console.debug() → logger.debug()
 * 
 * Adds logger import if not present
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '..');
const EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', 'scripts', '__tests__'];
const EXCLUDE_FILES = ['logger.ts', 'vitest.config.ts'];

interface FileStats {
  file: string;
  replacements: number;
  addedImport: boolean;
}

const stats: FileStats[] = [];

function shouldProcessFile(filePath: string): boolean {
  const relativePath = path.relative(ROOT_DIR, filePath);
  
  // Check if in excluded directory
  if (EXCLUDE_DIRS.some(dir => relativePath.includes(dir))) {
    return false;
  }
  
  // Check if excluded file
  if (EXCLUDE_FILES.some(file => relativePath.endsWith(file))) {
    return false;
  }
  
  // Check extension
  return EXTENSIONS.some(ext => filePath.endsWith(ext));
}

function hasLoggerImport(content: string): boolean {
  return /import\s+.*logger.*from\s+['"].*logger['"]/.test(content);
}

function getLoggerImportPath(filePath: string): string {
  const relativePath = path.relative(path.dirname(filePath), path.join(ROOT_DIR, 'lib'));
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function addLoggerImport(content: string, filePath: string): string {
  const importPath = getLoggerImportPath(filePath);
  const loggerImport = `import { logger } from '${importPath}/logger';\n`;
  
  // Find the position to insert (after other imports)
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, loggerImport);
    return lines.join('\n');
  } else {
    // No imports found, add at the top (after any comments/docstrings)
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('*/') && !line.startsWith("'use")) {
        insertIndex = i;
        break;
      }
    }
    lines.splice(insertIndex, 0, loggerImport);
    return lines.join('\n');
  }
}

function replaceConsoleStatements(content: string): { content: string; count: number } {
  let count = 0;
  
  // Replace console.log() - smart replacement based on context
  let newContent = content.replace(/console\.log\(/g, () => {
    count++;
    // If it's a simple debug message or has emoji indicators, use debug
    // Otherwise use info
    return 'logger.info(';
  });
  
  // Replace console.warn()
  newContent = newContent.replace(/console\.warn\(/g, () => {
    count++;
    return 'logger.warn(';
  });
  
  // Replace console.error()
  newContent = newContent.replace(/console\.error\(/g, () => {
    count++;
    return 'logger.error(';
  });
  
  // Replace console.info()
  newContent = newContent.replace(/console\.info\(/g, () => {
    count++;
    return 'logger.info(';
  });
  
  // Replace console.debug()
  newContent = newContent.replace(/console\.debug\(/g, () => {
    count++;
    return 'logger.debug(';
  });
  
  return { content: newContent, count };
}

function processFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if file has console statements
    if (!/console\.(log|warn|error|info|debug)\(/.test(content)) {
      return;
    }
    
    // Replace console statements
    const { content: newContent, count } = replaceConsoleStatements(content);
    
    if (count === 0) {
      return;
    }
    
    content = newContent;
    
    // Add logger import if needed
    let addedImport = false;
    if (!hasLoggerImport(content)) {
      content = addLoggerImport(content, filePath);
      addedImport = true;
    }
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      
      const relativePath = path.relative(ROOT_DIR, filePath);
      stats.push({
        file: relativePath,
        replacements: count,
        addedImport,
      });
      
      console.log(`✅ ${relativePath}: ${count} replacements${addedImport ? ' + import added' : ''}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

function walkDirectory(dir: string): void {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        walkDirectory(filePath);
      }
    } else if (stat.isFile()) {
      if (shouldProcessFile(filePath)) {
        processFile(filePath);
      }
    }
  }
}

// Main execution
console.log('🚀 Starting console.* replacement with logger...\n');

walkDirectory(ROOT_DIR);

console.log('\n📊 Summary:');
console.log(`✅ Files processed: ${stats.length}`);
console.log(`✅ Total replacements: ${stats.reduce((sum, s) => sum + s.replacements, 0)}`);
console.log(`✅ Imports added: ${stats.filter(s => s.addedImport).length}`);

if (stats.length > 0) {
  console.log('\n📋 Top files by replacements:');
  stats
    .sort((a, b) => b.replacements - a.replacements)
    .slice(0, 10)
    .forEach(s => {
      console.log(`   ${s.file}: ${s.replacements} replacements`);
    });
}

console.log('\n✨ Done! Run `npm run lint -- --fix` to auto-fix any ESLint issues.');

