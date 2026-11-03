const http = require('http');

const server = http.createServer((req, res) => {
  const target = `http://localhost:3000${req.url}`;
  res.writeHead(302, { Location: target });
  res.end(`Redirecting to ${target}`);
});

server.listen(5173, '0.0.0.0', () => {
  console.log('Redirect server running on http://localhost:5173 -> http://localhost:3000');
});
