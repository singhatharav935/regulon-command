const http = require('http');

http.get('http://localhost:3001/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Backend connected:', data));
}).on('error', (err) => console.log('Backend not reachable:', err.message));
