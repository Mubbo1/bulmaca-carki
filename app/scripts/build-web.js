// Oyunu (depo kökündeki index.html + resimler + sesler) uygulamanın içine (www) koyar.
const fs = require('fs'), path = require('path');
const app = path.join(__dirname, '..'), root = path.join(app, '..'), www = path.join(app, 'www');
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(www, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(www, 'index.html'));
for (const d of ['img', 'snd', 'icons']) fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true });
console.log('www hazır:', fs.readdirSync(www).join(', '));
