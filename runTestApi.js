const http = require('http');

const data = JSON.stringify({
  language: "python3",
  source: "print(\"Hello, BotsCode\")"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/execute',
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
