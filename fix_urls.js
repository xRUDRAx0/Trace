const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the double replacement mess
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| \(import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001'\) \+ ''\}/g, "${import.meta.env.VITE_API_URL || 'http://localhost:3001'}");
    
    content = content.replace(/\(import\.meta\.env\.VITE_API_URL \|\| \(import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001'\) \+ ''\)/g, "(import.meta.env.VITE_API_URL || 'http://localhost:3001')");

    fs.writeFileSync(file, content);
});

console.log('Fixed double replacements.');
