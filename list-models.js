import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    // Wait, the SDK no longer directly exposes listModels easily.
    // Let me try fetching directly via REST to list models to see what is available.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
}

listModels();
