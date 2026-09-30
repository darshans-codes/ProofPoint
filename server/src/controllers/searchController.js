import { Asset } from '../models/Asset.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { embedText } from '../services/gemini.js';
import { cosineSimilarity } from '../utils/cosine.js';

export const searchAssets = asyncHandler(async (req, res) => {
  const { query, limit = 12 } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  const queryEmbedding = await embedText(query);
  const queryTokens = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);

  // Retrieve assets with embeddings
  const assets = await Asset.find({ embedding: { $exists: true, $ne: [] } })
    .select('+embedding')
    .populate('project', 'name location');

  const scored = [];

  for (const asset of assets) {
    let similarity = 0;
    if (queryEmbedding && asset.embedding && asset.embedding.length > 0) {
      similarity = cosineSimilarity(queryEmbedding, asset.embedding);
    }

    // Keyword matching bonus: +0.05 per keyword found in caption, tags, or activity (up to +0.20)
    let keywordHits = [];
    const textPool = [
      asset.ai?.caption || '',
      ...(asset.ai?.tags || []),
      asset.ai?.activity || '',
      asset.locationName || '',
      asset.projectName || '',
    ]
      .join(' ')
      .toLowerCase();

    for (const token of queryTokens) {
      if (textPool.includes(token)) {
        keywordHits.push(token);
      }
    }

    const keywordBonus = Math.min(0.25, keywordHits.length * 0.05);
    const finalScore = Math.min(1.0, Math.max(0, similarity + keywordBonus));

    const obj = asset.toObject();
    delete obj.embedding;

    scored.push({
      ...obj,
      searchScore: Math.round(finalScore * 100),
      matchedTerms: keywordHits,
      matchReason:
        keywordHits.length > 0
          ? `matched on: ${keywordHits.join(', ')}`
          : `semantic context match (${Math.round(similarity * 100)}%)`,
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.searchScore - a.searchScore);

  const results = scored.slice(0, parseInt(limit, 10));

  res.json({
    query,
    count: results.length,
    results,
  });
});
