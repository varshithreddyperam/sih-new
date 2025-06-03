import fetch from 'node-fetch';

const JUDGE0_API_BASE_URL = 'https://judge0-ce.p.rapidapi.com';

const languageMap = {
  javascript: 63, // JavaScript (Node.js 14.15.4)
  python: 71,     // Python (3.8.1)
  python3: 71,
  java: 62,       // Java (OpenJDK 13.0.1)
  c: 50,          // C (GCC 9.2.0)
  cpp: 54,        // C++ (GCC 9.2.0)
  ruby: 72,       // Ruby (2.7.0)
  go: 60,         // Go (1.13.8)
};

const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = '91d8d6e654mshacc1c9b8e36c96fp1f5dbcjsn22273515f012';

async function checkRapidApiKey() {
  return true; // No API key needed for public Judge0 API
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Handle GET request to fetch supported languages
    try {
      const response = await fetch(`${JUDGE0_API_BASE_URL}/languages`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Judge0 API getLanguages error:', errorText);
        res.status(500).json({ error: 'Failed to fetch languages' });
        return;
      }
      const languages = await response.json();
      res.status(200).json(languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, language } = req.body;

  if (!code || !language) {
    res.status(400).json({ error: 'Code and language are required' });
    return;
  }

  const languageId = languageMap[language.toLowerCase()];
  if (!languageId) {
    res.status(400).json({ error: 'Language not supported' });
    return;
  }

  try {
    console.log('Submitting code to Judge0 API:', { code, languageId });
    // Submit code with wait=true for synchronous execution
    const submitResponse = await fetch(`${JUDGE0_API_BASE_URL}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: '',
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`Judge0 API submission error: Status ${submitResponse.status} - ${errorText}`);
      res.status(500).json({ output: `Judge0 API submission error: Status ${submitResponse.status} - ${errorText}` });
      return;
    }

    const result = await submitResponse.json();
    console.log('Judge0 API execution result:', JSON.stringify(result, null, 2));

    let output = '';
    if (result.stdout) {
      output = result.stdout;
    } else if (result.compile_output) {
      output = result.compile_output;
    } else if (result.stderr) {
      output = result.stderr;
    } else if (result.message) {
      output = result.message;
    } else {
      output = 'No output received from Judge0 API';
    }

    // Ensure output is a string before sending response
    if (typeof output !== 'string') {
      output = JSON.stringify(output);
    }
    res.status(200).json({ output });
  } catch (error) {
    console.error('Error in runCode API:', error);
    res.status(500).json({ output: 'Error: ' + error.message });
  }
}
