const ejs = require('ejs');
const fs = require('fs');

// Read the EJS file
const template = fs.readFileSync('views/index.ejs', 'utf8');

// Render EJS to HTML
const html = ejs.render(template);

// Save it as index.html in the root directory
fs.writeFileSync('index.html', html);

console.log('index.html has been generated from index.ejs');
