const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get files with console statements
function getFilesWithConsole() {
  try {
    const output = execSync(`find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console\\." 2>/dev/null || true`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file && file.length > 0);
  } catch (error) {
    console.log('No files with console statements found');
    return [];
  }
}

// Replace console statements in a file
function replaceConsoleInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip env.ts - has intentional console statements for environment validation
    if (filePath.includes('src/config/env.ts')) {
      console.log(`⏭️  Skipping ${filePath} - intentional console statements`);
      return false;
    }
    
    // Determine appropriate logger based on file type/location
    let loggerName = 'logger';
    let loggerImport = '';
    
    if (filePath.includes('/services/')) {
      loggerName = 'serviceLogger';
      loggerImport = `import { serviceLogger } from '../config/logger';`;
    } else if (filePath.includes('/hooks/')) {
      loggerName = 'hookLogger';
      loggerImport = `import { hookLogger } from '../config/logger';`;
    } else if (filePath.includes('/store/')) {
      loggerName = 'storeLogger';
      loggerImport = `import { storeLogger } from '../config/logger';`;
    } else if (filePath.includes('/utils/')) {
      loggerName = 'utilLogger';
      loggerImport = `import { utilLogger } from '../config/logger';`;
    } else if (filePath.includes('/components/')) {
      loggerName = 'componentLogger';
      loggerImport = `import { componentLogger } from '../config/logger';`;
    } else if (filePath.includes('/config/')) {
      loggerName = 'configLogger';
      loggerImport = `import { configLogger } from './logger';`;
    } else {
      loggerName = 'logger';
      loggerImport = `import { logger } from '../config/logger';`;
    }
    
    // Add logger import if not present
    if (!content.includes('from \'../config/logger\'') && 
        !content.includes('from \'./logger\'') &&
        !content.includes('from \'../../config/logger\'')) {
      
      // Find the right place to insert import
      const importMatch = content.match(/^(import .+?;)$/m);
      if (importMatch) {
        content = content.replace(importMatch[0], `${importMatch[0]}\n${loggerImport}`);
        modified = true;
      } else {
        // If no imports found, add at the beginning
        content = `${loggerImport}\n\n${content}`;
        modified = true;
      }
    }
    
    // Replace console statements with appropriate logger
    const replacements = [
      { from: /console\.log\(/g, to: `${loggerName}.info(` },
      { from: /console\.info\(/g, to: `${loggerName}.info(` },
      { from: /console\.warn\(/g, to: `${loggerName}.warn(` },
      { from: /console\.error\(/g, to: `${loggerName}.error(` },
      { from: /console\.debug\(/g, to: `${loggerName}.debug(` }
    ];
    
    for (const replacement of replacements) {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🔄 Finding frontend files with console statements...');
  const files = getFilesWithConsole();
  
  console.log(`📁 Found ${files.length} files with console statements`);
  
  let updated = 0;
  for (const file of files) {
    if (replaceConsoleInFile(file)) {
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} files`);
  console.log('🔄 Checking remaining console statements...');
  
  try {
    const remaining = execSync(`find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -c "console\\." 2>/dev/null | awk -F: '{sum += $2} END {print sum}'`, { encoding: 'utf8' });
    console.log(`📊 Remaining console statements: ${remaining.trim()}`);
  } catch (error) {
    console.log('📊 No remaining console statements found!');
  }
}

// Run the script
main();
