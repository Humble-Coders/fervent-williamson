const fs = require('fs');
const path = require('path');

// Fix logger syntax errors in a file
function fixLoggerSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip logger.ts itself
    if (filePath.includes('src/config/logger.ts')) {
      console.log(`⏭️  Skipping ${filePath}`);
      return false;
    }
    
    // Fix patterns like { variable.method() } -> { key: variable.method() }
    const patterns = [
      // Fix { variable.method() } patterns
      { 
        from: /(\w+Logger\.\w+\([^,]+,\s*{\s*)([a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\))(\s*})/g,
        to: (match, prefix, methodCall, suffix) => {
          const varName = methodCall.split('.')[0];
          return `${prefix}${varName}: ${methodCall}${suffix}`;
        }
      },
      // Fix { 'quoted': value } patterns in object literals
      {
        from: /(\w+Logger\.\w+\([^,]+,\s*{\s*[^}]*)'([^']+)':\s*([^,}]+)/g,
        to: (match, prefix, key, value) => {
          const camelKey = key.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
          return match.replace(`'${key}':`, `${camelKey}:`);
        }
      },
      // Fix double braces {{ -> {
      {
        from: /(\w+Logger\.\w+\([^,]+,\s*){\s*{/g,
        to: '$1{'
      },
      // Fix }} -> }
      {
        from: /}\s*}\s*\)/g,
        to: '})'
      }
    ];
    
    for (const pattern of patterns) {
      if (typeof pattern.to === 'function') {
        content = content.replace(pattern.from, pattern.to);
      } else {
        if (pattern.from.test(content)) {
          content = content.replace(pattern.from, pattern.to);
          modified = true;
        }
      }
    }
    
    // Additional specific fixes
    const specificFixes = [
      // Fix blob.size, 'type:', blob.type patterns
      {
        from: /{\s*blob\.size\s*,\s*'type:':\s*blob\.type\s*}/g,
        to: '{ size: blob.size, type: blob.type }'
      },
      // Fix text.substring(0, 100) patterns
      {
        from: /{\s*text\.substring\([^)]+\)\s*}/g,
        to: '{ preview: text.substring(0, 100) }'
      },
      // Fix files.map patterns
      {
        from: /{\s*files\.map\([^}]+\)\s*}/g,
        to: (match) => {
          const content = match.slice(1, -1).trim(); // Remove { }
          return `{ files: ${content} }`;
        }
      }
    ];
    
    for (const fix of specificFixes) {
      if (typeof fix.to === 'function') {
        content = content.replace(fix.from, fix.to);
      } else {
        if (fix.from.test(content)) {
          content = content.replace(fix.from, fix.to);
          modified = true;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed logger syntax in ${filePath}`);
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
  const filesToCheck = [
    'src/services/bulkImportService.ts',
    'src/services/adminSalonService.ts'
  ];
  
  console.log('🔄 Fixing logger syntax errors...');
  
  let fixed = 0;
  for (const file of filesToCheck) {
    if (fixLoggerSyntaxInFile(file)) {
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed logger syntax in ${fixed} files`);
}

// Run the script
main();
