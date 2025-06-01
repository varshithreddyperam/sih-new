const http = require('http');

const data = JSON.stringify({
  language: 'python3',
  version: '3.x.x',
  files: [
    {
      name: 'main.py',
      content: 'print("Hello, BotsCode!")'
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v2/execute',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let responseData = '';
  res.on('data', chunk => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
