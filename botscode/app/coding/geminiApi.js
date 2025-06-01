import axios from 'axios';

/**
 * IMPORTANT:
 * Replace 'YOUR_MODEL_NAME' with the actual model name you get from Google AI Studio's ListModels API.
 * The current 'gemini-pro' model name is not found or supported.
 */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
// or use 'gemini-1.5-pro' for higher-quality responses

const parseGeminiResponse = (response) => {
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
};

export const getSuggestions = async (code, apiKey) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: `Suggest improvements for this code:\n\n${code}` }] }],
      }
    );
    return parseGeminiResponse(response);
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};

export const getAutoDocumentation = async (code, apiKey) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: `Add detailed documentation to the following function:\n\n${code}` }] }],
      }
    );
    return parseGeminiResponse(response);
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};

export const getSyntaxFix = async (code, apiKey) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: `Fix syntax errors and improve this code:\n\n${code}` }] }],
      }
    );
    return parseGeminiResponse(response);
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};
