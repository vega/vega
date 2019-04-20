const fs = require('fs');

module.exports = (file) => {
  return new Promise((resolve, reject) => {
    const input = file ? fs.createReadStream(file) : process.stdin;
    let text = '';
        
    input.setEncoding('utf8');
    input.on('error', err => { reject(err); });
    input.on('data', chunk => { text += chunk; });
    input.on('end', () => { resolve(text); });
  });
};
