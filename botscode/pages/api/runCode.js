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
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // Set your RapidAPI key in environment variables

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
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

  if (!RAPIDAPI_KEY) {
    res.status(500).json({ error: 'RapidAPI key is not configured' });
    return;
  }

  try {
    console.log('Submitting code to Judge0 API:', { code, languageId });
    // Submit code with wait=false to get token
    const submitResponse = await fetch(`${JUDGE0_API_BASE_URL}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: '',
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Judge0 API submission error:', errorText);
      res.status(500).json({ output: `Judge0 API submission error: ${errorText}` });
      return;
    }

    const submitResult = await submitResponse.json();
    console.log('Judge0 API submission response:', submitResult);
    const token = submitResult.token;

    if (!token) {
      res.status(500).json({ output: 'Judge0 API did not return a token' });
      return;
    }

    // Poll for result
    let result = null;
    for (let i = 0; i < 20; i++) { // max 20 attempts, 1 second apart
      const resultResponse = await fetch(`${JUDGE0_API_BASE_URL}/submissions/${token}?base64_encoded=false`, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      });
      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error('Judge0 API result error:', errorText);
        res.status(500).json({ output: `Judge0 API result error: ${errorText}` });
        return;
      }
      result = await resultResponse.json();
      console.log('Judge0 API polling result:', result);

      if (result.status && result.status.id >= 3) { // 3: Completed, 4: Accepted
        break;
      }
      await sleep(1000);
    }

    if (!result) {
      res.status(500).json({ output: 'Judge0 API polling timed out' });
      return;
    }

    let output = '';
    if (result.stdout) {
      output = result.stdout;
    } else if (result.compile_output) {
      output = result.compile_output;
    } else if (result.stderr) {
      output = result.stderr;
    } else if (result.message) {
      output = result.message;
    }

    res.status(200).json({ output });
  } catch (error) {
    console.error('Error in runCode API:', error);
    res.status(500).json({ output: 'Error: ' + error.message });
  }
}
