const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get files with logger calls
function getFilesWithLoggerCalls() {
  try {
    const output = execSync(`find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "Logger\\." 2>/dev/null || true`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file && file.length > 0);
  } catch (error) {
    console.log('No files with logger calls found');
    return [];
  }
}

// Fix logger call formats in a file
function fixLoggerCallsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip logger.ts itself
    if (filePath.includes('src/config/logger.ts')) {
      console.log(`⏭️  Skipping ${filePath}`);
      return false;
    }
    
    // Fix logger calls with multiple arguments
    // Pattern: logger.method('message', arg1, arg2, ...) -> logger.method('message', { arg1, arg2, ... })
    const loggerMethods = ['error', 'warn', 'info', 'debug'];
    
    for (const method of loggerMethods) {
      // Match logger calls with multiple arguments
      const pattern = new RegExp(`(\\w+Logger\\.${method}\\s*\\(\\s*['"'][^'"]*['"]\\s*,\\s*)([^)]+)\\)`, 'g');
      
      content = content.replace(pattern, (match, prefix, args) => {
        // Check if args already look like an object
        if (args.trim().startsWith('{') && args.trim().endsWith('}')) {
          return match; // Already properly formatted
        }
        
        // Split arguments and wrap in object if there are multiple
        const argList = args.split(',').map(arg => arg.trim());
        if (argList.length > 1) {
          // Multiple arguments - wrap in object
          const objectArgs = argList.map(arg => {
            // If it's a simple variable name, use it as key: value
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(arg)) {
              return arg;
            }
            // Otherwise, create a generic key
            return arg;
          }).join(', ');
          
          modified = true;
          return `${prefix}{ ${objectArgs} })`;
        }
        
        return match; // Single argument, leave as is
      });
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed logger calls in ${filePath}`);
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
  console.log('🔄 Finding files with logger calls...');
  const files = getFilesWithLoggerCalls();
  
  console.log(`📁 Found ${files.length} files with logger calls`);
  
  let fixed = 0;
  for (const file of files) {
    if (fixLoggerCallsInFile(file)) {
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed logger calls in ${fixed} files`);
}

// Run the script
main();
