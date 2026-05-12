const fs = require('fs');
const path = require('path');

const dir = 'e:/HKBK/src';

const replacements = {
  'bg-\\[hsl\\(var\\(--background\\)\\)\\]': 'bg-gray-50 dark:bg-slate-900',
  'text-\\[hsl\\(var\\(--foreground\\)\\)\\]': 'text-gray-900 dark:text-white',
  'text-\\[hsl\\(var\\(--muted-foreground\\)\\)\\]': 'text-gray-500 dark:text-gray-400',
  'bg-\\[hsl\\(var\\(--card\\)\\)\\]': 'bg-white dark:bg-slate-800',
  'border-\\[hsl\\(var\\(--border\\)\\)\\]': 'border-gray-200 dark:border-slate-700',
  'bg-\\[hsl\\(var\\(--muted\\)\\)\\]': 'bg-gray-100 dark:bg-slate-700',
  'bg-\\[hsl\\(var\\(--muted\\)/0\\.3\\)\\]': 'bg-gray-50 dark:bg-slate-800',
  'bg-\\[hsl\\(var\\(--muted\\)/0\\.5\\)\\]': 'bg-gray-50 dark:bg-slate-700/50',
  'bg-\\[hsl\\(var\\(--primary\\)\\)\\]': 'bg-blue-600 dark:bg-blue-500',
  'text-\\[hsl\\(var\\(--primary\\)\\)\\]': 'text-blue-600 dark:text-blue-400',
  'text-\\[hsl\\(var\\(--primary-foreground\\)\\)\\]': 'text-white',
  'bg-\\[hsl\\(var\\(--primary\\)/0\\.1\\)\\]': 'bg-blue-50 dark:bg-blue-900/30',
  'ring-\\[hsl\\(var\\(--primary\\)/0\\.2\\)\\]': 'ring-blue-100 dark:ring-blue-900/50',
  'ring-\\[hsl\\(var\\(--primary\\)\\)\\]': 'ring-blue-500',
  'text-\\[hsl\\(var\\(--destructive\\)\\)\\]': 'text-red-600 dark:text-red-400',
  'bg-\\[hsl\\(var\\(--destructive\\)/0\\.1\\)\\]': 'bg-red-50 dark:bg-red-900/30',
  'bg-\\[hsl\\(var\\(--secondary\\)\\)\\]': 'bg-gray-100 dark:bg-slate-700',
  'text-\\[hsl\\(var\\(--secondary-foreground\\)\\)\\]': 'text-gray-900 dark:text-white',
  'border-\\[hsl\\(var\\(--input\\)\\)\\]': 'border-gray-300 dark:border-slate-600',
  'focus:ring-\\[hsl\\(var\\(--ring\\)\\)\\]': 'focus:ring-blue-500',
  'focus:border-\\[hsl\\(var\\(--ring\\)\\)\\]': 'focus:border-blue-500',
  'placeholder-\\[hsl\\(var\\(--muted-foreground\\)\\)\\]': 'placeholder-gray-400 dark:placeholder-gray-500',
  'dark ': ' ' // remove any random isolated dark classes that were empty
};

function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    const fullPath = path.join(currentPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const [regexStr, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(regexStr, 'g');
        content = content.replace(regex, replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walkDir(dir);
console.log('Done');
