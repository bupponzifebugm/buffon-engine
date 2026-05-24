const fs = require('fs');
const md = fs.readFileSync('C:/Users/buffo/Downloads/trading/BUFFON_AI_SYSTEM_PROMPT.md', 'utf-8');
const safeMd = md.replace(/`/g, '\\`').replace(/\$/g, '\\$');
const out = 'export const COACH_SYSTEM_PROMPT = `\n' + safeMd + '\n`;\n';
fs.writeFileSync('C:/Users/buffo/Downloads/trading/buffon-engine/src/lib/coachPrompt.js', out);
