import { Asset } from '../models/Asset.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { compareImages } from '../services/gemini.js';

const comparisonInFlight = new Map();
const comparisonCache = new Map();
const COMPARISON_CACHE_TTL_MS = 10 * 60 * 1000;

function getUsableMediaUrl(asset) {
  const urls = [
    asset?.transformations?.medium,
    asset?.transformations?.watermarked,
    asset?.cloudinary?.secureUrl,
    asset?.cloudinary?.url,
  ];

  return urls.find(
    (url) => typeof url === 'string' && /^https?:\/\//i.test(url)
  );
}

async function executeComparison(req, res) {
  const { beforeId, afterId } = req.body;

  if (!beforeId || !afterId) {
    return res.status(400).json({ error: 'both beforeId and afterId are required.' });
  }

  const [beforeAsset, afterAsset] = await Promise.all([
    Asset.findById(beforeId),
    Asset.findById(afterId),
  ]);

  if (!beforeAsset || !afterAsset) {
    return res.status(404).json({ error: 'One or both assets could not be found.' });
  }
  if (beforeAsset.project.toString() !== afterAsset.project.toString()) {
    return res.status(400).json({ error: 'Comparison assets must belong to the same project.' });
  }

  const beforeUrl = getUsableMediaUrl(beforeAsset);
  const afterUrl = getUsableMediaUrl(afterAsset);
  let comparisonResult = null;
  if (beforeUrl && afterUrl) {
    try {
    const [resBefore, resAfter] = await Promise.all([
      fetch(beforeUrl),
      fetch(afterUrl),
    ]);

    if (resBefore.ok && resAfter.ok) {
      const bufBefore = Buffer.from(await resBefore.arrayBuffer());
      const bufAfter = Buffer.from(await resAfter.arrayBuffer());
      const mimeBefore = beforeAsset.cloudinary.format ? `image/${beforeAsset.cloudinary.format}` : 'image/jpeg';
      const mimeAfter = afterAsset.cloudinary.format ? `image/${afterAsset.cloudinary.format}` : 'image/jpeg';

      comparisonResult = await compareImages(bufBefore, bufAfter, mimeBefore, mimeAfter);
    }
    } catch (err) {
      console.warn('[Compare] Vision comparison warning:', err.message);
    }
  }

  if (comparisonResult?.ok === false || !comparisonResult?.summary) {
    comparisonResult = null;
  }

  // Calculate metric deltas from stored AI estimates
  const mBefore = beforeAsset.ai?.metrics || {};
  const mAfter = afterAsset.ai?.metrics || {};

  const orderLevels = { low: 1, medium: 2, high: 3, fair: 2, good: 3, poor: 1, 'n/a': 0 };

  const getDirection = (bVal, aVal, higherIsBetter = true) => {
    const scoreB = orderLevels[String(bVal).toLowerCase()] ?? 0;
    const scoreA = orderLevels[String(aVal).toLowerCase()] ?? 0;
    if (scoreA === scoreB) return 'neutral';
    if (higherIsBetter) {
      return scoreA > scoreB ? 'improved' : 'worsened';
    } else {
      return scoreA < scoreB ? 'improved' : 'worsened';
    }
  };

  const metricsSummary = comparisonResult
    ? [
        {
          label: 'Tree Canopy Count',
          before: mBefore.trees ?? 'n/a',
          after: mAfter.trees ?? 'n/a',
          change:
            mBefore.trees !== undefined && mAfter.trees !== undefined
              ? `${mAfter.trees - mBefore.trees >= 0 ? '+' : ''}${mAfter.trees - mBefore.trees}`
              : 'n/a',
          direction:
            (mAfter.trees || 0) > (mBefore.trees || 0)
              ? 'improved'
              : (mAfter.trees || 0) < (mBefore.trees || 0)
              ? 'worsened'
              : 'neutral',
        },
        {
          label: 'Surface Waste Level',
          before: mBefore.waste || 'n/a',
          after: mAfter.waste || 'n/a',
          change: `${mBefore.waste || 'n/a'} -> ${mAfter.waste || 'n/a'}`,
          direction: getDirection(mBefore.waste, mAfter.waste, false),
        },
        {
          label: 'Water Clarity',
          before: mBefore.waterClarity || 'n/a',
          after: mAfter.waterClarity || 'n/a',
          change: `${mBefore.waterClarity || 'n/a'} -> ${mAfter.waterClarity || 'n/a'}`,
          direction: getDirection(mBefore.waterClarity, mAfter.waterClarity, true),
        },
        {
          label: 'Vegetation Density',
          before: mBefore.vegetationLevel || 'n/a',
          after: mAfter.vegetationLevel || 'n/a',
          change: `${mBefore.vegetationLevel || 'n/a'} -> ${mAfter.vegetationLevel || 'n/a'}`,
          direction: getDirection(mBefore.vegetationLevel, mAfter.vegetationLevel, true),
        },
      ].filter((metric) => metric.before !== 'n/a' && metric.after !== 'n/a')
    : [];

  // Add provenance on both assets
  const provenanceEntry = {
    event: 'compared',
    at: new Date(),
    detail: `Compared against paired asset in verification suite.`,
  };

  beforeAsset.provenance.push(provenanceEntry);
  afterAsset.provenance.push(provenanceEntry);
  await Promise.all([beforeAsset.save(), afterAsset.save()]);

  res.json({
    before: beforeAsset,
    after: afterAsset,
    comparison: comparisonResult,
    metricsSummary,
  });
}

export const compareAssets = asyncHandler(async (req, res) => {
    const { beforeId, afterId } = req.body;
    if (!beforeId || !afterId) {
      return res.status(400).json({ error: 'both beforeId and afterId are required.' });
    }

    const key = `${beforeId}:${afterId}`;
    const cached = comparisonCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.body);
    }
    if (cached) comparisonCache.delete(key);

    const existing = comparisonInFlight.get(key);
    if (existing) {
      return res.json(await existing);
    }

    const request = new Promise((resolve, reject) => {
      const response = {
        statusCode: 200,
        body: null,
        status(code) {
          response.statusCode = code;
          return response;
        },
        json(body) {
          response.body = body;
          resolve(response);
        },
      };

      executeComparison(req, response).catch(reject);
    }).then((result) => {
      if (result.statusCode === 200) {
        comparisonCache.set(key, {
          body: result.body,
          expiresAt: Date.now() + COMPARISON_CACHE_TTL_MS,
        });
      }
      return result;
    }).finally(() => {
      comparisonInFlight.delete(key);
    });

    comparisonInFlight.set(key, request);
    const result = await request;
    return res.status(result.statusCode).json(result.body);
});
