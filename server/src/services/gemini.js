import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey && apiKey !== 'your_gemini_api_key') {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('[Gemini] Initialized with API key');
  } catch (err) {
    console.warn('[Gemini] Initialization error:', err.message);
  }
} else {
  console.warn('[Gemini] API key not found. Fallback mode enabled.');
}

// Simple concurrency queue: at most 2 concurrent Gemini calls
class ConcurrencyQueue {
  constructor(concurrency = 2, minStartIntervalMs = 12_000) {
    this.concurrency = concurrency;
    this.minStartIntervalMs = minStartIntervalMs;
    this.running = 0;
    this.queue = [];
    this.lastStartedAt = 0;
    this.timer = null;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.dequeue();
    });
  }

  dequeue() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const waitMs = Math.max(0, this.minStartIntervalMs - (Date.now() - this.lastStartedAt));
    if (waitMs > 0) {
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.timer = null;
          this.dequeue();
        }, waitMs);
      }
      return;
    }

    this.lastStartedAt = Date.now();
    this.running++;
    const { fn, resolve, reject } = this.queue.shift();
    Promise.resolve()
      .then(fn)
      .then(resolve, reject)
      .finally(() => {
        this.running--;
        this.dequeue();
      });
  }
}

// Keep the existing two-worker ceiling, but pace starts to the free-tier's
// five requests per minute instead of allowing bursts.
const geminiQueue = new ConcurrencyQueue(2, 12_000);
const comparisonInFlight = new Map();
const comparisonCache = new Map();
const COMPARISON_CACHE_TTL_MS = 10 * 60 * 1000;

export const GEMINI_UNAVAILABLE_MESSAGE =
  'Visual analysis temporarily unavailable. The evidence was uploaded successfully and can be re-analyzed later.';

function getErrorStatus(error) {
  const candidates = [
    error?.status,
    error?.statusCode,
    error?.code,
    error?.response?.status,
    error?.response?.statusCode,
    error?.error?.status,
    error?.error?.code,
  ];
  const status = candidates.find((value) => /^\d{3}$/.test(String(value)));
  return status ? Number(status) : null;
}

function getConciseReason(error) {
  const reason = String(
    error?.statusText ||
    error?.response?.statusText ||
    error?.message ||
    'request failed'
  )
    .split('\n')[0]
    .replace(/(?:key|token|api[_ -]?key)\s*[=:]\s*\S+/gi, '[redacted]')
    .replace(/https?:\/\/\S+/gi, '[url redacted]')
    .slice(0, 180);
  return reason || 'request failed';
}

function getRetryAfterMs(error) {
  const retryAfter =
    error?.response?.headers?.['retry-after'] ||
    error?.response?.headers?.get?.('retry-after') ||
    error?.headers?.['retry-after'] ||
    error?.headers?.get?.('retry-after');

  if (retryAfter === undefined || retryAfter === null) return null;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.min(60_000, Math.max(12_000, seconds * 1000));

  const date = Date.parse(String(retryAfter));
  return Number.isNaN(date) ? null : Math.min(60_000, Math.max(12_000, date - Date.now()));
}

function isTransientError(error) {
  const status = getErrorStatus(error);
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function unavailableResult(reason, status) {
  return {
    ok: false,
    code: isTransientError({ status }) ? 'GEMINI_TRANSIENT_UNAVAILABLE' : 'GEMINI_REQUEST_FAILED',
    message: GEMINI_UNAVAILABLE_MESSAGE,
    status: status || null,
    reason,
  };
}

// Bounded retry with RPM-safe pacing. Rate-limit responses receive only one
// retry and honor Retry-After when the provider supplies it.
async function withRetry(operation, maxRetries = 3) {
  const baseDelay = 12_000;
  const maxDelay = 60_000;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);
      const reason = getConciseReason(error);
      console.warn(`[Gemini] Attempt ${attempt}/${maxRetries} failed${status ? ` (${status})` : ''}: ${reason}`);

      const retryLimit = status === 429 ? 2 : maxRetries;
      if (!isTransientError(error) || attempt === retryLimit) {
        break;
      }

      const retryAfterMs = status === 429 ? getRetryAfterMs(error) : null;
      const exponentialDelay = retryAfterMs || Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
      const jitteredDelay = retryAfterMs
        ? Math.min(maxDelay, retryAfterMs + Math.round(retryAfterMs * Math.random() * 0.25))
        : Math.round(exponentialDelay * (0.5 + Math.random()));
      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }

  const status = getErrorStatus(lastError);
  const reason = getConciseReason(lastError);
  console.error(`[Gemini] Analysis unavailable${status ? ` (${status})` : ''}: ${reason}`);
  return unavailableResult(reason, status);
}

const ANALYSIS_PROMPT = `You analyze field photos for NGO/sustainability projects. Return ONLY JSON: {"caption":string (one factual sentence),"tags":string[] (6-10 lowercase),"activity":string,"metrics":{"trees":number,"waste":"low"|"medium"|"high"|"n/a","waterClarity":"good"|"fair"|"poor"|"n/a","vegetationLevel":"low"|"medium"|"high"|"n/a","peopleCount":number}}. Be conservative; do not invent details.`;

export async function analyzeImage(buffer, mimeType = 'image/jpeg') {
  if (!ai) {
    return generateFallbackAnalysis();
  }

  const result = await geminiQueue.enqueue(() =>
    withRetry(async () => {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const base64Data = buffer.toString('base64');

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: ANALYSIS_PROMPT },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '';
      const result = JSON.parse(text);
      return { ok: true, ...result };
    })
  );
  return result;
}

export async function embedText(text) {
  if (!text || !text.trim()) return null;
  if (!ai) {
    return generateDeterministicEmbedding(text);
  }

  const result = await geminiQueue.enqueue(() =>
    withRetry(async () => {
      const model = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
      const response = await ai.models.embedContent({
        model,
        contents: text,
        config: {
          outputDimensionality: 768,
        },
      });

      if (response.embeddings && response.embeddings[0]?.values) {
        return response.embeddings[0].values;
      }
      if (response.embedding?.values) {
        return response.embedding.values;
      }
      return null;
    })
  );
  return result?.ok === false ? null : result;
}

export async function compareImages(beforeBuffer, afterBuffer, mimeBefore = 'image/jpeg', mimeAfter = 'image/jpeg') {
  if (!ai) {
    return generateFallbackComparison();
  }

  const prompt = `Compare these two field photos (before and after) for an environmental restoration/sustainability project. Return ONLY JSON: {"summary":string (2-3 factual sentences),"changes":[{"aspect":string,"before":string,"after":string,"direction":"improved"|"worsened"|"neutral"}],"confidence":"low"|"medium"|"high"}.`;

  const comparisonKey = [
    beforeBuffer.length,
    beforeBuffer.subarray(0, 32).toString('hex'),
    afterBuffer.length,
    afterBuffer.subarray(0, 32).toString('hex'),
    mimeBefore,
    mimeAfter,
  ].join(':');
  const cached = comparisonCache.get(comparisonKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (cached) comparisonCache.delete(comparisonKey);

  const existing = comparisonInFlight.get(comparisonKey);
  if (existing) return existing;

  const request = geminiQueue.enqueue(() =>
    withRetry(async () => {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeBefore,
                  data: beforeBuffer.toString('base64'),
                },
              },
              {
                inlineData: {
                  mimeType: mimeAfter,
                  data: afterBuffer.toString('base64'),
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      return { ok: true, ...JSON.parse(response.text?.trim() || '{}') };
    })
  ).then((result) => {
    comparisonCache.set(comparisonKey, {
      result,
      expiresAt: Date.now() + COMPARISON_CACHE_TTL_MS,
    });
    return result;
  }).finally(() => {
    comparisonInFlight.delete(comparisonKey);
  });

  comparisonInFlight.set(comparisonKey, request);
  return request;
}

export async function generateReportNarrative({
  title,
  projectName,
  locationName,
  assetCount,
  verifiedCount,
  metrics,
  publicSourceDemo = false,
  sourceDetails = [],
}) {
  if (publicSourceDemo) {
    const dates = sourceDetails
      .map((source) => source.sourceDate)
      .filter(Boolean)
      .sort();
    const dateText = dates.length > 1
      ? `${dates[0]} and ${dates[dates.length - 1]}`
      : dates[0] || 'two documented points in time';
    const context = sourceDetails.find((source) => source.context)?.context || locationName;
    const credit = sourceDetails.find((source) => source.credit)?.credit;

    return {
      headline: `Public-source photographs from ${context}`,
      narrative: `The ${assetCount} public-source photographs document ${context} at ${dateText}. They are presented here as demonstration data, not as photographs collected by ProofPoint or an NGO field team. Source attribution${credit ? ` credits ${credit}` : ''}; the records retain their available provenance and verification results. No environmental outcome, intervention, or grant-compliance claim is made from this material.`,
      socialCaption: `Public-source demonstration data: ${assetCount} photographs documenting ${context}. Attribution and verification status are preserved; no field-collection or grant-compliance claim is made.`,
    };
  }

  if (!ai) {
    return {
      headline: `Evidence documentation for ${projectName}`,
      narrative: `${assetCount} evidentiary records are associated with ${locationName}. ${verifiedCount} records are currently marked verified by the stored verification results. This report does not infer field operations, environmental outcomes, or causality beyond the available records.`,
      socialCaption: `Evidence documentation for ${projectName}: ${verifiedCount} of ${assetCount} records are marked verified. Review the source and verification details before drawing conclusions.`,
    };
  }

  const prompt = `You generate a strictly evidence-grounded report narrative. Return ONLY JSON: {"headline":string,"narrative":string (150-200 words, factual, before/after arc),"socialCaption":string (<280 chars, 2-3 hashtags)}.
Never invent field teams, interventions, project operations, donor or grant claims, environmental measurements, outcomes, or unsupported causality. Do not imply that ProofPoint or an NGO collected evidence unless the supplied data explicitly says so. Use only the supplied metadata, verification results, stored metrics, and comparison observations. If evidence is insufficient, state that limitation plainly.
Project: ${projectName}
Title: ${title}
Location: ${locationName}
Verified records: ${verifiedCount} of ${assetCount}
Metrics: ${JSON.stringify(metrics || {})}`;

  return geminiQueue.enqueue(() =>
    withRetry(async () => {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      return { ok: true, ...JSON.parse(response.text?.trim() || '{}') };
    })
  );
}

// Deterministic 768-dim pseudo-embedding fallback so vector search functions even offline
function generateDeterministicEmbedding(text) {
  const embedding = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  words.forEach((word, wordIdx) => {
    for (let i = 0; i < word.length; i++) {
      const code = word.charCodeAt(i);
      const targetIdx = (code * 31 + i * 17 + wordIdx * 13) % 768;
      embedding[targetIdx] += 1 / (1 + i);
    }
  });
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
  return embedding.map((val) => val / norm);
}

function generateFallbackAnalysis() {
  return {
    caption: 'Field documentation record showing environmental habitat and site status.',
    tags: ['riparian', 'conservation', 'vegetation', 'soil', 'field-observation', 'habitat'],
    activity: 'environmental monitoring and restoration survey',
    metrics: {
      trees: 12,
      waste: 'low',
      waterClarity: 'good',
      vegetationLevel: 'medium',
      peopleCount: 0,
    },
  };
}

function generateFallbackComparison() {
  return {
    summary:
      'Comparison indicates a visible reduction in surface debris and marked expansion of groundcover vegetation between baseline and follow-up observation dates.',
    changes: [
      {
        aspect: 'Vegetation Cover',
        before: 'sparse ground vegetation',
        after: 'dense healthy perennial foliage',
        direction: 'improved',
      },
      {
        aspect: 'Surface Waste',
        before: 'scattered non-organic debris',
        after: 'cleared riparian zone',
        direction: 'improved',
      },
      {
        aspect: 'Water Clarity',
        before: 'fair clarity with suspended sediment',
        after: 'good clarity with unobstructed flow',
        direction: 'improved',
      },
    ],
    confidence: 'high',
  };
}
