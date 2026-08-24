require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY from env automatically

async function run() {
  const prompt = `Summarize the following note in 3 bullet points. Respond with ONLY valid JSON in this format: {"summary": ["point1", "point2", "point3"]}. No markdown, no preamble.

Note content: "Photosynthesis is the process by which plants convert sunlight into chemical energy..."`;

  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-lite',
      input: prompt,
    });

    console.log('--- RAW INTERACTION OBJECT ---');
    console.log(JSON.stringify(interaction, null, 2));
    console.log('--- EXTRACTED TEXT ---');
    console.log(interaction.output_text);
  } catch (err) {
    console.error('--- ERROR SHAPE ---');
    console.error(err);
  }
}

run();