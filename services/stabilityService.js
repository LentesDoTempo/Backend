const FormData = require('form-data');

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_ENGINE = 'stable-diffusion-xl-1024-v1-0';
const STABILITY_IMAGE_ENDPOINT = `https://api.stability.ai/v1/generation/${STABILITY_ENGINE}/image-to-image`;

const SYSTEM_PROMPT = [
    'You are an expert Restoration Architect and Historical Reconstruction Specialist focused on architectural revitalization with historical accuracy.',
    'Faithfully restore original architectural forms, proportions, materials, textures, and construction techniques consistent with the historical period.',
    'Reconstruct the surrounding landscape as it likely existed at the time of construction, respecting original geography, vegetation, and urban context.',
    'Improve visual clarity, material richness, lighting, and spatial harmony with physically plausible realism and refined color grading.',
    'Preserve the original viewpoint, scale, framing, and spatial composition of the input image.',
    'Do not add modern elements, materials, technologies, infrastructure, fictional features, people, vehicles, signage, text, logos, watermarks, or overlays.',
    'Generate only one coherent revitalized image with sharp focus, realistic textures, and restoration-accurate historical coherence.',
].join(', ');

const buildRevitalizationPrompt = ({ prompt, brief, style, title }) => {
    const promptParts = [
        SYSTEM_PROMPT,
        prompt && prompt.trim() ? `user goal: ${prompt.trim()}` : null,
        title ? `scenario: ${title}` : null,
        brief ? `art direction: ${brief}` : null,
        style ? `visual style: ${style}` : null,
    ].filter(Boolean);

    return promptParts.join(', ');
};

const parseStabilityErrorPayload = (rawBody) => {
    if (!rawBody) {
        return 'Stability API request failed';
    }

    try {
        const parsed = JSON.parse(rawBody);
        if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
            return parsed.message;
        }
        if (parsed && parsed.error && typeof parsed.error === 'string' && parsed.error.trim()) {
            return parsed.error;
        }
        return rawBody;
    } catch (error) {
        return rawBody;
    }
};

const generateRevitalizedImageWithStability = async ({ imageBuffer, imageName, mimeType, prompt, brief, style, title }) => {
    if (!STABILITY_API_KEY) {
        throw new Error('STABILITY_API_KEY nao configurada no backend');
    }

    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        throw new Error('Imagem de entrada invalida para Stability AI');
    }

    const promptText = buildRevitalizationPrompt({ prompt, brief, style, title });
    console.log('[stabilityService] Engine:', STABILITY_ENGINE);
    console.log('[stabilityService] Prompt:', promptText);

    const form = new FormData();

    // Campo obrigatório: imagem base
    form.append('init_image', imageBuffer, {
        filename: imageName || 'input.webp',
        contentType: mimeType || 'image/webp',
    });

    // Prompts no formato correto da Stability AI
    form.append('text_prompts[0][text]', promptText);
    form.append('text_prompts[0][weight]', '1');

    // Negative prompt: o que NÃO queremos
    form.append('text_prompts[1][text]', 'ruins, decay, broken walls, rubble, damaged');
    form.append('text_prompts[1][weight]', '-1');

    // Parâmetros opcionais
    form.append('image_strength', '0.5');      // 0.4 a 0.6 recomendado para restauração
    form.append('cfg_scale', '10');             // Quanto seguir o prompt (0-35, padrão 7)
    form.append('samples', '1');                // Número de imagens (1 é suficiente)
    form.append('steps', '40');                 // Qualidade vs velocidade (10-50)

    const formBuffer = form.getBuffer();
    const headers = {
        ...form.getHeaders(),
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: 'application/json',  // IMPORTANTE: retorna JSON com base64
    };

    console.log('[stabilityService] Enviando para:', STABILITY_IMAGE_ENDPOINT);
    const response = await fetch(STABILITY_IMAGE_ENDPOINT, {
        method: 'POST',
        headers,
        body: formBuffer,
        timeout: 60000,
    });

    console.log('[stabilityService] Status:', response.status);

    if (!response.ok) {
        const rawError = await response.text();
        console.error('[stabilityService] ❌ Erro HTTP:', { status: response.status, error: rawError });
        const message = parseStabilityErrorPayload(rawError);
        throw new Error(`Stability AI error (${response.status}): ${message}`);
    }

    // Resposta vem em JSON com base64
    let data;
    try {
        data = await response.json();
    } catch (error) {
        console.error('[stabilityService] ❌ Erro ao parsear JSON:', error.message);
        throw new Error('Stability API retornou resposta inválida');
    }

    console.log('[stabilityService] Resposta recebida:', {
        artifacts: data.artifacts?.length,
        finishReason: data.artifacts?.[0]?.finishReason,
    });

    if (!data.artifacts || data.artifacts.length === 0) {
        throw new Error('Stability API nao retornou imagem');
    }

    const artifact = data.artifacts[0];

    // Verificar resultado da geração
    if (artifact.finishReason === 'CONTENT_FILTERED') {
        throw new Error('Imagem bloqueada pelo filtro de conteúdo da Stability');
    }

    if (artifact.finishReason !== 'SUCCESS') {
        throw new Error(`Geração falhou: ${artifact.finishReason}`);
    }

    // Converter base64 para Buffer
    if (!artifact.base64) {
        throw new Error('Stability retornou artifact sem base64');
    }

    const outputImageBuffer = Buffer.from(artifact.base64, 'base64');
    console.log('[stabilityService] ✅ Imagem restaurada:', {
        bytes: outputImageBuffer.length,
        seed: artifact.seed,
    });

    return {
        imageBuffer: outputImageBuffer,
        mimeType: 'image/png',  // Stability retorna PNG
        promptUsed: promptText,
        seed: artifact.seed,
    };
};

module.exports = {
    buildRevitalizationPrompt,
    generateRevitalizedImageWithStability,
};
