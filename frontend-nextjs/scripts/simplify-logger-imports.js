#!/usr/bin/env node

/**
 * Script to replace all specialized logger imports with single logger import
 * This simplifies the frontend logging to match the backend approach
 */

const fs = require('fs');
const path = require('path');

// Define the source directory
const srcDir = path.join(__dirname, '../src');

// Logger import patterns to replace
const loggerImportPatterns = [
  /import\s*{\s*serviceLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*hookLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*storeLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*utilLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*componentLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*apiLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*authLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*analyticsLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*uiLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
  /import\s*{\s*configLogger\s*}\s*from\s*['"][^'"]*logger['"];?/g,
];

// Usage patterns to replace
// const loggerUsagePatterns = [
//   { pattern: /serviceLogger\./g, replacement: 'logger.' },
//   { pattern: /hookLogger\./g, replacement: 'logger.' },
//   { pattern: /storeLogger\./g, replacement: 'logger.' },
//   { pattern: /utilLogger\./g, replacement: 'logger.' },
//   { pattern: /componentLogger\./g, replacement: 'logger.' },
//   { pattern: /apiLogger\./g, replacement: 'logger.' },
//   { pattern: /authLogger\./g, replacement: 'logger.' },
//   { pattern: /analyticsLogger\./g, replacement: 'logger.' },
//   { pattern: /uiLogger\./g, replacement: 'logger.' },
//   { pattern: /configLogger\./g, replacement: 'logger.' },
// ];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace import statements
    loggerImportPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, "import { logger } from '@/config/logger';");
        modified = true;
      }
    });

    // Replace usage patterns
    loggerUsagePatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath);
    }
  });
}

console.log('🔄 Starting logger import replacement...');
walkDirectory(srcDir);
console.log('✅ Logger import replacement completed!');
