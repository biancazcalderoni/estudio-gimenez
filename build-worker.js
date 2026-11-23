import fs from 'fs';
const html = fs.readFileSync('./public/index.html', 'utf-8');

// Escape backticks
const escaped = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const worker = `const html = \`${escaped}\`;

export default {
  async fetch(request) {
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
`;

fs.writeFileSync('./worker.js', worker);
console.log('Worker.js generated successfully with embedded HTML');
