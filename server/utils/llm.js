const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runLLM(systemPrompt, userPrompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(userPrompt);

    const responseText = result.response.text();
    return responseText;

  } catch (err) {
    return `LLM ERROR: ${err.message}`;
  }
}

module.exports = { runLLM };
