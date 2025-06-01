import { getSuggestions, getAutoDocumentation, getSyntaxFix } from './geminiApi'; // adjust path if needed

const apiKey = "YOUR_GEMINI_API_KEY"; // replace with your actual key
const sampleCode = \`
function greet(name) {
  console.log("Hello " + name)
}
\`;

const useGeminiFeatures = async () => {
  try {
    const suggestions = await getSuggestions(sampleCode, apiKey);
    const documentation = await getAutoDocumentation(sampleCode, apiKey);
    const fixedCode = await getSyntaxFix(sampleCode, apiKey);

    console.log("Suggestions:\\n", suggestions);
    console.log("Auto Documentation:\\n", documentation);
    console.log("Syntax Fix:\\n", fixedCode);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
  }
};

useGeminiFeatures();
