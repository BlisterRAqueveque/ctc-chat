import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribirAudio(url) {
  try {
    // Descarga el audio desde la URL de WhatsApp
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempFile = 'audio.ogg';

    fs.writeFileSync(tempFile, buffer);

    // Usa Whisper para transcribir el audio
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: 'whisper-1',
      language: 'es', // español
    });

    fs.unlinkSync(tempFile); // elimina el archivo temporal
    return transcription.text;
  } catch (err) {
    console.error('Error al transcribir el audio:', err);
    return null;
  }
}
