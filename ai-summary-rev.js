const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const authenticate = require('./middleware/authenticate')
const { aiLimiter } = require('./middleware/rate-limiters');
const prisma = require("./prisma/client");


const ai = new GoogleGenAI({});

const router = express.Router();

router.use(authenticate);

router.get('/summary', aiLimiter, async (req, res, next) => {

    try {
        // first find the note
        const { id } = req.body;
        const Note = await prisma.note.findUnique({
            where: { id: Number(id) }
        });

        if (!Note) {
            return res.status(404).json({
                message: "Note not found!"
            });
        }

        if (Note.userId != req.user.userId) {
            return res.status(403).json({
                message: "Unauthorized access!"
            });
        }

        const content = Note.content;

        const prompt = `Summarize the following notes in 3-5 bullet points, using simple language a student can quickly scan. Respond with ONLY valid JSON  Note: ${content}`;

        const interaction = await ai.interactions.create({
            model: 'gemini-3.1-flash-lite',
            input: prompt,
        });

        const resultSummary = JSON.parse(interaction.output_text);

        return res.status(200).json({
            summary: resultSummary.summary
        });
    } catch(err) {
        next(err);
    }

});

module.exports = router
