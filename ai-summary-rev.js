const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const authenticate = require('./middleware/authenticate')
const { aiLimiter } = require('./middleware/rate-limiters');
const prisma = require("./prisma/client");


const ai = new GoogleGenAI({});

const router = express.Router();

router.use(authenticate);

router.get('/summary/:id', aiLimiter, async (req, res, next) => {

    try {
        // first find the note
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                message: "ID is invalid."
            });
        }

        const note = await prisma.note.findUnique({
            where: { id: Number(id) }
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found!"
            });
        }

        if (note.userId != req.user.userId) {
            return res.status(403).json({
                message: "Unauthorized access!"
            });
        }

        const content = note.content;

        if (content?.trim().length == 0) {
            return res.status(400).json({
                message: "Notes are empty hence the request cannot be entertained."
            });
        }

        const prompt = `Summarize the following notes in 3-5 bullet points, using simple language a student can quickly scan. Respond with ONLY valid JSON and strictly avoid JSON fences. Note: ${content}`;

        const interaction = await ai.interactions.create({
            model: 'gemini-3.1-flash-lite',
            input: prompt,
        });

        const resultSummary = JSON.parse(interaction.output_text);

        if (!resultSummary || !resultSummary.summary || !Array.isArray(resultSummary.summary)) {
            return res.status(502).json({
                message: "Invalid AI response. Try again later!"
            })
        }

        const summary = resultSummary.summary;

        return res.status(200).json({
            summary: summary
        });
    } catch (err) {
        next(err);
    }

});

router.get('/rev/:id', aiLimiter, async (req, res, next) => {

    try {
        // first find the note
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                message: "ID is invalid."
            });
        }

        const note = await prisma.note.findUnique({
            where: { id: Number(id) }
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found!"
            });
        }

        if (note.userId != req.user.userId) {
            return res.status(403).json({
                message: "Unauthorized access!"
            });
        }

        const content = note.content;

        if (content?.trim().length == 0) {
            return res.status(400).json({
                message: "Notes are empty hence the request cannot be entertained."
            });
        }

        const prompt = `provide 5 to 10 questions (appropriate according to the size of the content) for revision along with answers separately. Respond with ONLY valid JSON with this format and strictly without JSON fences: {questions:[], answers:[]} with the order of answers matching exactly the order of the questions. Notes: ${content}`;

        const interaction = await ai.interactions.create({
            model: 'gemini-3.1-flash-lite',
            input: prompt,
        });

        const result = JSON.parse(interaction.output_text);

        if (!result || !result.questions || !result.answers || !Array.isArray(result.questions) || !Array.isArray(result.answers)) {
            return res.status(502).json({
                message: "Invalid AI response. Try again later!"
            });
        }

        if (result.questions.length === 0 || result.questions.length !== result.answers.length) {
            return res.status(502).json({ message: "Invalid AI response. Try again later!" });
        }

        return res.status(200).json({
            questions: result.questions,
            answers: result.answers
        });
    } catch (err) {
        next(err);
    }

});



module.exports = router
