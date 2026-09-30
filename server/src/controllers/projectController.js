import { Project } from '../models/Project.js';
import { Asset } from '../models/Asset.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });

  // Compute asset and verification statistics per project
  const stats = await Asset.aggregate([
    {
      $group: {
        _id: '$project',
        totalAssets: { $sum: 1 },
        verifiedCount: {
          $sum: { $cond: [{ $eq: ['$verification.status', 'verified'] }, 1, 0] },
        },
        needsReviewCount: {
          $sum: { $cond: [{ $eq: ['$verification.status', 'needs_review'] }, 1, 0] },
        },
        flaggedCount: {
          $sum: { $cond: [{ $eq: ['$verification.status', 'flagged'] }, 1, 0] },
        },
        earliestDate: { $min: '$capturedDate' },
        latestDate: { $max: '$capturedDate' },
      },
    },
  ]);

  const statsMap = new Map();
  stats.forEach((s) => {
    statsMap.set(s._id.toString(), s);
  });

  const enriched = projects.map((p) => {
    const s = statsMap.get(p._id.toString()) || {
      totalAssets: 0,
      verifiedCount: 0,
      needsReviewCount: 0,
      flaggedCount: 0,
    };
    return {
      ...p.toObject(),
      totalAssets: s.totalAssets,
      verifiedCount: s.verifiedCount,
      needsReviewCount: s.needsReviewCount,
      flaggedCount: s.flaggedCount,
      verifiedPercent: s.totalAssets > 0 ? Math.round((s.verifiedCount / s.totalAssets) * 100) : 0,
      earliestDate: s.earliestDate,
      latestDate: s.latestDate,
    };
  });

  res.json({ projects: enriched });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, location, startDate } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: 'Project name and location are required.' });
  }

  const project = await Project.create({
    name,
    description: description || '',
    location,
    startDate: startDate || new Date(),
  });

  res.status(201).json({
    project: {
      ...project.toObject(),
      totalAssets: 0,
      verifiedCount: 0,
      verifiedPercent: 0,
    },
  });
});
