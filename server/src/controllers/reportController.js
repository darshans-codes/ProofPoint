import crypto from 'crypto';
import { Report } from '../models/Report.js';
import { Asset } from '../models/Asset.js';
import { Project } from '../models/Project.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateReportNarrative } from '../services/gemini.js';

export const createReport = asyncHandler(async (req, res) => {
  const { title, projectId, assetIds = [], beforeId, afterId } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'title and projectId are required.' });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  // Find all assets to be linked
  const assets = await Asset.find({ _id: { $in: assetIds } }).select('-embedding');

  const verifiedCount = assets.filter((a) => a.verification?.status === 'verified').length;
  const verifiedPercent = assets.length > 0 ? Math.round((verifiedCount / assets.length) * 100) : 0;
  const publicSourceDemo = assets.length > 0 && assets.every(
    (asset) => asset.sourceMetadata?.type === 'public_source_demo'
  );
  const sourceDetails = assets
    .map((asset) => asset.sourceMetadata)
    .filter(Boolean)
    .map((source) => ({
      sourceDate: source.sourceDate
        ? new Date(source.sourceDate).toISOString().slice(0, 10)
        : null,
      credit: source.credit,
      context: source.context,
    }));

  // Compute metrics summary
  let totalTrees = 0;
  let treeObsCount = 0;
  assets.forEach((a) => {
    if (a.ai?.metrics?.trees !== undefined) {
      totalTrees += a.ai.metrics.trees;
      treeObsCount++;
    }
  });

  const metricsObj = {
    totalEvidenceAssets: assets.length,
    verifiedPercent,
    averageCanopyObserved: treeObsCount > 0 ? Math.round(totalTrees / treeObsCount) : 0,
  };

  // Generate factual narrative
  const aiStory = await generateReportNarrative({
    title,
    projectName: project.name,
    locationName: project.location,
    assetCount: assets.length,
    verifiedCount,
    metrics: metricsObj,
    publicSourceDemo,
    sourceDetails,
  });

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${crypto.randomBytes(4).toString('hex')}`;

  const heroAssetId = beforeId || (assets.length > 0 ? assets[0]._id : null);

  const report = await Report.create({
    title,
    slug,
    project: project._id,
    assetIds: assets.map((a) => a._id),
    heroAssetId,
    beforeAssetId: beforeId || null,
    afterAssetId: afterId || null,
    headline: aiStory?.headline || `${project.name}: Verified Field Impact`,
    narrative:
      aiStory?.narrative ||
      `${assets.length} evidentiary records are associated with ${project.location}. The report reflects the stored verification results and does not infer field operations or environmental outcomes beyond the available records.`,
    socialCaption:
      aiStory?.socialCaption ||
      `Evidence documentation for ${project.name}: ${verifiedPercent}% of records are marked verified. Review the source and verification details before drawing conclusions.`,
    metricsSummary: publicSourceDemo ? [] : [
      {
        label: 'Verified Records',
        before: '0%',
        after: `${verifiedPercent}%`,
        change: `${verifiedPercent}% confirmed`,
        direction: 'improved',
      },
      {
        label: 'Total Field Frames',
        before: '0',
        after: `${assets.length}`,
        change: `+${assets.length} records`,
        direction: 'improved',
      },
    ],
    verifiedPercent,
  });

  // Update assets with usedInReports & provenance
  await Asset.updateMany(
    { _id: { $in: assetIds } },
    {
      $addToSet: { usedInReports: report._id },
      $push: {
        provenance: {
          event: 'added_to_report',
          at: new Date(),
          detail: `Linked to published impact report: "${report.title}" (/story/${report.slug})`,
        },
      },
    }
  );

  res.status(201).json({ report });
});

export const getReports = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const query = {};
  if (projectId) query.project = projectId;

  const reports = await Report.find(query)
    .populate('project', 'name location')
    .populate('heroAssetId', 'cloudinary transformations locationName capturedDate verification')
    .populate('beforeAssetId', 'cloudinary transformations locationName capturedDate')
    .populate('afterAssetId', 'cloudinary transformations locationName capturedDate')
    .sort({ createdAt: -1 });

  res.json({ reports });
});

export const getReportBySlug = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ slug: req.params.slug })
    .populate('project', 'name location description startDate')
    .populate({
      path: 'assetIds',
      select: '-embedding',
    })
    .populate({
      path: 'heroAssetId',
      select: '-embedding',
    })
    .populate({
      path: 'beforeAssetId',
      select: '-embedding',
    })
    .populate({
      path: 'afterAssetId',
      select: '-embedding',
    });

  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  res.json({ report });
});
