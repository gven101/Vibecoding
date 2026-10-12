export const TONES = {
  professional: 'Respond in a professional, formal tone. Use precise language and well-structured explanations. No slang or emojis.',
  casual: 'Respond in a friendly, casual, conversational tone, like chatting with a friend. Contractions and light humor are fine.',
  concise: 'Respond as briefly as possible. Give the direct answer in a few sentences or bullet points. No preamble or filler.',
};

export const buildSystemPrompt = (tone) =>
  `You are a helpful AI assistant.\n\nTone instruction: ${TONES[tone]}`;
