import { Asset } from '../models/Asset.js';
import { Project } from '../models/Project.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractExif } from '../services/exifService.js';
import { dHash, hammingDistance } from '../services/hashService.js';
import { uploadToCloudinary, destroyFromCloudinary, buildTransformations } from '../services/cloudinaryService.js';
import { analyzeImage, embedText, GEMINI_UNAVAILABLE_MESSAGE } from '../services/gemini.js';
import { verifyAsset } from '../services/verifyService.js';

// Batch helper: run array of tasks with max concurrency
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export const uploadAssets = asyncHandler(async (req, res) => {
  const { projectId, locationName, capturedDate, lat, lng } = req.body;

  if (!projectId || !locationName) {
    return res.status(400).json({ error: 'projectId and locationName are required.' });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: 'No files provided for upload.' });
  }

  const parsedCapturedDate = capturedDate ? new Date(capturedDate) : new Date();
  const claimedGeo =
    lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))
      ? { lat: Number(lat), lng: Number(lng) }
      : null;

  // Retrieve existing assets in project for duplicate detection
  const existingAssets = await Asset.find({ project: projectId }).select(
    'phash _id projectName cloudinary transformations'
  );

  // Process files with max 3 concurrent items
  const createdAssets = await mapConcurrent(files, 3, async (file) => {
    const isVideo = file.mimetype.startsWith('video/');
    const kind = isVideo ? 'video' : 'image';
    const buffer = file.buffer;

    // 1. Read EXIF
    const exif = await extractExif(buffer);

    // 2. Perceptual dHash (for images)
    const phash = isVideo ? null : await dHash(buffer);

    // Check for duplicates before any external upload or Gemini work.
    let duplicateMatch = !isVideo && existingAssets.find(
      (existing) => existing.phash && hammingDistance(phash, existing.phash) <= 5
    );

    // Refresh the snapshot once to reduce races with a nearby upload request.
    if (!duplicateMatch && !isVideo && phash) {
      const latestAssets = await Asset.find({ project: projectId }).select(
        'phash _id projectName cloudinary transformations'
      );
      duplicateMatch = latestAssets.find(
        (existing) => existing.phash && hammingDistance(phash, existing.phash) <= 5
      );
      if (duplicateMatch) {
        existingAssets.push(duplicateMatch);
      }
    }

    if (duplicateMatch) {
      console.log(`[Duplicate] Matching asset found: ${duplicateMatch._id}`);
      const duplicateVerification = verifyAsset(
        {
          exif,
          claimedGeo,
          capturedDate: parsedCapturedDate,
          phash,
          ai: null,
        },
        [duplicateMatch]
      );
      const duplicateAsset = await Asset.create({
        project: project._id,
        projectName: project.name,
        locationName,
        capturedDate: parsedCapturedDate,
        kind,
        cloudinary: duplicateMatch.cloudinary,
        transformations: duplicateMatch.transformations,
        ai: null,
        exif,
        claimedGeo,
        verification: duplicateVerification,
        phash,
        duplicateOf: duplicateMatch._id,
        embedding: null,
        provenance: [
          {
            event: 'uploaded',
            at: new Date(),
            detail: `Duplicate file ${file.originalname} received; existing stored media retained.`,
          },
          {
            event: 'duplicate_detected',
            at: new Date(),
            detail: `Perceptual dHash match detected against asset ${duplicateMatch._id}. Gemini analysis and embedding skipped.`,
          },
          {
            event: 'verified',
            at: new Date(),
            detail: `Verification audit completed. Status assigned: ${duplicateVerification.status.toUpperCase()} (${duplicateVerification.score}/100).`,
          },
          {
            event: 'transformed',
            at: new Date(),
            detail: 'Existing Cloudinary responsive delivery formats and watermarked evidence derivatives reused.',
          },
        ],
        usedInReports: [],
      });

      existingAssets.push({ _id: duplicateAsset._id, phash });
      const obj = duplicateAsset.toObject();
      delete obj.embedding;
      return obj;
    }

    // 3. Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: `proofpoint/${project.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      resource_type: isVideo ? 'video' : 'image',
      filename: file.originalname,
    });

    const transformations = buildTransformations(
      uploadResult.public_id,
      project.name,
      isVideo ? 'video' : 'image'
    );

    // 4. Gemini analysis (images only)
    let ai = null;
    let analysisFailed = false;
    if (!isVideo) {
      const analysisResult = await analyzeImage(buffer, file.mimetype);
      if (analysisResult?.ok === false || !analysisResult) {
        analysisFailed = true;
      } else {
        ai = { ...analysisResult };
        delete ai.ok;
        ai.analyzedAt = new Date();
      }
    }

    // 5. Verification
    const verification = verifyAsset(
      {
        exif,
        claimedGeo,
        capturedDate: parsedCapturedDate,
        phash,
        ai,
      },
      existingAssets
    );

    // 6. Generate embedding for search
    let embedding = null;
    if (ai) {
      const textToEmbed = [
        ai.caption,
        ...(ai.tags || []),
        ai.activity,
        locationName,
        project.name,
      ]
        .filter(Boolean)
        .join(' ');
      embedding = await embedText(textToEmbed);
    }

    // 7. Provenance trail
    const provenance = [
      {
        event: 'uploaded',
        at: new Date(),
        detail: `Original file ${file.originalname} (${(file.size / 1024).toFixed(1)} KB) ingested into evidence pipeline.`,
      },
      {
        event: isVideo ? 'skipped_ai_video' : analysisFailed ? 'analysis_failed' : 'analyzed',
        at: new Date(),
        detail: isVideo
          ? 'Video asset; automated visual breakdown skipped.'
          : analysisFailed
          ? 'Visual analysis temporarily unavailable. The evidence was uploaded successfully and can be re-analyzed later.'
          : `Visual features, factual caption, and metrics extracted via Gemini vision.`,
      },
      {
        event: 'verified',
        at: new Date(),
        detail: `Verification audit completed. Status assigned: ${verification.status.toUpperCase()} (${verification.score}/100).`,
      },
      {
        event: 'transformed',
        at: new Date(),
        detail: 'Cloudinary responsive delivery formats and watermarked evidence derivative generated.',
      },
    ];

    const asset = await Asset.create({
      project: project._id,
      projectName: project.name,
      locationName,
      capturedDate: parsedCapturedDate,
      kind,
      cloudinary: {
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        resourceType: uploadResult.resource_type || (isVideo ? 'video' : 'image'),
      },
      transformations,
      ai,
      exif,
      claimedGeo,
      verification,
      phash,
      duplicateOf: verification.duplicateOf,
      embedding,
      provenance,
      usedInReports: [],
    });

    // Add to local array so subsequent uploads in this batch can catch duplicates
    existingAssets.push({ _id: asset._id, phash });

    const obj = asset.toObject();
    delete obj.embedding;
    if (analysisFailed) {
      obj.analysis = {
        ok: false,
        code: 'GEMINI_TRANSIENT_UNAVAILABLE',
        message: GEMINI_UNAVAILABLE_MESSAGE,
        retryable: true,
      };
    }
    return obj;
  });

  res.status(201).json({ assets: createdAssets });
});

export const getAssets = asyncHandler(async (req, res) => {
  const { projectId, locationName, status, from, to, page = 1, limit = 50 } = req.query;

  const query = {};
  if (projectId) query.project = projectId;
  if (locationName) query.locationName = new RegExp(locationName, 'i');
  if (status) query['verification.status'] = status;
  if (from || to) {
    query.capturedDate = {};
    if (from) query.capturedDate.$gte = new Date(from);
    if (to) query.capturedDate.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [assets, total] = await Promise.all([
    Asset.find(query)
      .select('-embedding')
      .populate('project', 'name location')
      .sort({ capturedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Asset.countDocuments(query),
  ]);

  // Overall status breakdown for the current filtered query
  const counts = await Asset.aggregate([
    { $match: projectId ? { project: query.project } : {} },
    {
      $group: {
        _id: '$verification.status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts = {
    verified: 0,
    needs_review: 0,
    flagged: 0,
    total: 0,
  };
  counts.forEach((c) => {
    if (statusCounts[c._id] !== undefined) {
      statusCounts[c._id] = c.count;
    }
    statusCounts.total += c.count;
  });

  res.json({
    assets,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
    counts: statusCounts,
  });
});

export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .select('-embedding')
    .populate('project', 'name location description')
    .populate('usedInReports', 'title slug');

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  res.json({ asset });
});

export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  // Destroy on Cloudinary
  if (asset.cloudinary?.publicId) {
    try {
      await destroyFromCloudinary(
        asset.cloudinary.publicId,
        asset.cloudinary.resourceType || 'image'
      );
    } catch (err) {
      console.warn('[Asset Delete] Cloudinary destroy warning:', err.message);
    }
  }

  await Asset.findByIdAndDelete(req.params.id);
  res.json({ ok: true, message: 'Asset deleted successfully.' });
});

export const reanalyzeAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  if (asset.kind === 'video') {
    return res.status(400).json({ error: 'Video assets cannot be analyzed by image vision models.' });
  }

  // Fetch image buffer from secureUrl
  const imageRes = await fetch(asset.cloudinary.secureUrl);
  if (!imageRes.ok) {
    return res.status(502).json({ error: 'Could not fetch image file from storage for re-analysis.' });
  }
  const arrayBuffer = await imageRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Re-run Gemini analysis
  const mimeType = asset.cloudinary.format ? `image/${asset.cloudinary.format}` : 'image/jpeg';
  const analysisResult = await analyzeImage(buffer, mimeType);
  if (analysisResult?.ok === false || !analysisResult) {
    return res.status(503).json({
      error: analysisResult?.message || GEMINI_UNAVAILABLE_MESSAGE,
      code: analysisResult?.code || 'GEMINI_ANALYSIS_UNAVAILABLE',
      retryable: true,
    });
  }
  const ai = { ...analysisResult };
  delete ai.ok;
  ai.analyzedAt = new Date();

  // Re-embed
  const textToEmbed = [
    ai.caption,
    ...(ai.tags || []),
    ai.activity,
    asset.locationName,
    asset.projectName,
  ]
    .filter(Boolean)
    .join(' ');
  const embedding = await embedText(textToEmbed);

  // Re-verify against other project assets
  const existingAssets = await Asset.find({
    project: asset.project,
    _id: { $ne: asset._id },
  }).select('phash _id');

  const verification = verifyAsset(
    {
      exif: asset.exif,
      claimedGeo: asset.claimedGeo,
      capturedDate: asset.capturedDate,
      phash: asset.phash,
      ai,
    },
    existingAssets
  );

  asset.ai = ai;
  if (embedding) asset.embedding = embedding;
  asset.verification = verification;
  asset.provenance.push({
    event: 'reanalyzed',
    at: new Date(),
    detail: `Manual re-analysis triggered. New verification score: ${verification.score}/100 (${verification.status.toUpperCase()}).`,
  });

  await asset.save();

  const obj = asset.toObject();
  delete obj.embedding;
  res.json({ asset: obj });
});
