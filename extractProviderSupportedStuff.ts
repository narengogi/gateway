import Providers from "./src/providers";

const output = {};

const supportedMethods = {
    complete: 'COMPLETIONS',
    chatComplete: 'CHAT_COMPLETIONS',
    embed: 'EMBEDDINGS',
    rerank: 'RERANK',
    moderate: 'MODERATION',
    'stream-complete': 'STREAM_COMPLETIONS',
    'stream-chatComplete': 'STREAM_CHAT_COMPLETIONS',
    proxy: 'PROXY',
    imageGenerate: 'IMAGE_GENERATIONS',
    createSpeech: 'TTS',
    createTranscription: 'AUDIO_TRANSCRIPTION',
    createTranslation: 'AUDIO_TRANSLATION',
    toolCalling: 'TOOL_CALLING'
}

for (const provider in Providers) {
    const providerConfig = Providers[provider];
    delete providerConfig.api;
    output[provider] = [];
    for (const method in providerConfig) {
        if (method === 'responseTransforms') {
            for (const transform in providerConfig[method]) {
                output[provider].push(supportedMethods[transform]);
            }
            continue;
        }
        // output[provider].push(supportedMethods[method]);
        if (method === 'chatComplete') {
            if (providerConfig[method].tools) output[provider].push(supportedMethods.toolCalling);
        }
    }
}

console.log(output);
