import { Project } from '../models/Project.js';
import { Asset } from '../models/Asset.js';
import { Report } from '../models/Report.js';

export async function autoSeedIfEmpty() {
  try {
    // Repair any legacy/dead seed image URLs
    await Asset.updateMany(
      {
        $or: [
          { 'cloudinary.url': { $regex: 'photo-1511497584788' } },
          { 'transformations.medium': { $regex: 'photo-1511497584788' } },
          { 'transformations.thumb': { $regex: 'photo-1511497584788' } },
        ],
      },
      {
        $set: {
          'cloudinary.url': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
          'cloudinary.secureUrl': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
          'transformations.thumb': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=400&q=70',
          'transformations.medium': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
          'transformations.watermarked': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        },
      }
    );

    const count = await Project.countDocuments();
    if (count > 0) return;

    console.log('[AutoSeed] Empty database detected. Populating demo projects, evidence frames, and impact reports...');

    // 1. Project 1: Watts Branch
    const wattsProject = await Project.create({
      name: 'Watts Branch Stream Restoration — Public Source Demo',
      location: 'Watts Branch, Anacostia River watershed',
      description: 'Public-source documentary before-and-after photographs from the U.S. Fish & Wildlife Service, included for product demonstration and clearly distinct from ProofPoint field evidence.',
      startDate: new Date('2011-02-14'),
    });

    const wattsBefore = await Asset.create({
      project: wattsProject._id,
      projectName: wattsProject.name,
      locationName: 'Watts Branch, Anacostia River watershed',
      capturedDate: new Date('2011-02-14T00:00:00Z'),
      kind: 'image',
      cloudinary: {
        publicId: 'watts_branch_before_demo',
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        secureUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 800,
        format: 'jpg',
        bytes: 450000,
        resourceType: 'image',
      },
      transformations: {
        thumb: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=70',
        medium: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        watermarked: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      },
      ai: {
        caption: 'Public-source baseline documentary photograph of degraded stream corridor before bank stabilization.',
        tags: ['watts-branch', 'stream-restoration', 'baseline', 'erosion', 'riparian'],
        activity: 'baseline environmental survey',
        metrics: { trees: 2, waste: 'medium', waterClarity: 'poor', vegetationLevel: 'low', peopleCount: 0 },
        analyzedAt: new Date(),
      },
      exif: { lat: 38.8921, lng: -76.9242, takenAt: new Date('2011-02-14T00:00:00Z'), camera: 'Canon EOS 5D', hasGps: true },
      claimedGeo: { lat: 38.8921, lng: -76.9242 },
      sourceMetadata: {
        type: 'public_source_demo',
        sourceDate: new Date('2011-02-14T00:00:00Z'),
        credit: 'Mark Secrist, U.S. Fish & Wildlife Service',
        license: 'Public domain',
        url: 'https://www.flickr.com/photos/usfwsnortheast/7557235384/',
        context: 'Watts Branch, Anacostia River watershed',
      },
      verification: {
        status: 'needs_review',
        score: 75,
        checks: [
          { name: 'GPS Coordinates Present', passed: true, detail: 'Hardware EXIF coordinates extracted.' },
          { name: 'Location Matches Claim', passed: true, detail: 'Within 0.05 km of project site.' },
          { name: 'EXIF Timestamp Confirmed', passed: true, detail: 'Original camera shutter date confirmed.' },
          { name: 'Perceptual Duplicate Detection', passed: true, detail: 'Unique fingerprint across dataset.' },
          { name: 'Public Source Label Required', passed: false, detail: 'Public demonstration archive; marked for verification review.' },
        ],
      },
      phash: '0101010101010101',
      provenance: [
        { event: 'uploaded', at: new Date('2011-02-14T00:00:00Z'), detail: 'Public-source demo image ingested.' },
        { event: 'verified', at: new Date(), detail: 'Verification audit completed with NEEDS_REVIEW badge.' },
      ],
      usedInReports: [],
    });

    const wattsAfter = await Asset.create({
      project: wattsProject._id,
      projectName: wattsProject.name,
      locationName: 'Watts Branch, Anacostia River watershed',
      capturedDate: new Date('2011-08-19T00:00:00Z'),
      kind: 'image',
      cloudinary: {
        publicId: 'watts_branch_after_demo',
        url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        secureUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 800,
        format: 'jpg',
        bytes: 480000,
        resourceType: 'image',
      },
      transformations: {
        thumb: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=400&q=70',
        medium: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        watermarked: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
      },
      ai: {
        caption: 'Public-source post-intervention photograph showing stabilized riverbank and lush native shrub vegetation.',
        tags: ['watts-branch', 'stream-restoration', 'after', 'stabilized', 'riparian-vegetation'],
        activity: 'post-intervention monitoring',
        metrics: { trees: 18, waste: 'low', waterClarity: 'good', vegetationLevel: 'high', peopleCount: 0 },
        analyzedAt: new Date(),
      },
      exif: { lat: 38.8922, lng: -76.9241, takenAt: new Date('2011-08-19T00:00:00Z'), camera: 'Canon EOS 5D', hasGps: true },
      claimedGeo: { lat: 38.8922, lng: -76.9241 },
      sourceMetadata: {
        type: 'public_source_demo',
        sourceDate: new Date('2011-08-19T00:00:00Z'),
        credit: 'Mark Secrist, U.S. Fish & Wildlife Service',
        license: 'Public domain',
        url: 'https://www.flickr.com/photos/usfwsnortheast/7557277790/',
        context: 'Watts Branch, Anacostia River watershed',
      },
      verification: {
        status: 'needs_review',
        score: 75,
        checks: [
          { name: 'GPS Coordinates Present', passed: true, detail: 'Hardware EXIF coordinates extracted.' },
          { name: 'Location Matches Claim', passed: true, detail: 'Within 0.04 km of project site.' },
          { name: 'EXIF Timestamp Confirmed', passed: true, detail: 'Post-intervention timestamp verified.' },
          { name: 'Perceptual Duplicate Detection', passed: true, detail: 'Unique image hash.' },
        ],
      },
      phash: '0202020202020202',
      provenance: [
        { event: 'uploaded', at: new Date('2011-08-19T00:00:00Z'), detail: 'Public-source after image ingested.' },
        { event: 'verified', at: new Date(), detail: 'Verification audit completed.' },
      ],
      usedInReports: [],
    });

    // 2. Project 2: Acre River Riparian Buffer Project
    const acreProject = await Project.create({
      name: 'Acre River Riparian Buffer Project',
      location: 'Acre Basin, Amazonia, Brazil',
      description: 'Community-led reforestation and riparian buffer rehabilitation along degraded cattle-pasture riverbanks in the Acre watershed.',
      startDate: new Date('2024-02-10'),
    });

    const acreAsset1 = await Asset.create({
      project: acreProject._id,
      projectName: acreProject.name,
      locationName: 'Section 4B - River Mile 14',
      capturedDate: new Date('2024-03-12T10:14:00Z'),
      kind: 'image',
      cloudinary: {
        publicId: 'acre_river_baseline',
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        secureUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 800,
        format: 'jpg',
        bytes: 420000,
        resourceType: 'image',
      },
      transformations: {
        thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=70',
        medium: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        watermarked: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      },
      ai: {
        caption: 'Severely eroded clay riverbank with sparse shrub groundcover and exposed topsoil prior to community sapling planting.',
        tags: ['riparian', 'riverbank', 'erosion', 'baseline', 'degraded-pasture', 'soil'],
        activity: 'baseline environmental terrain survey and soil assessment',
        metrics: { trees: 3, waste: 'low', waterClarity: 'fair', vegetationLevel: 'low', peopleCount: 2 },
        analyzedAt: new Date(),
      },
      exif: { lat: -9.9748, lng: -67.8242, takenAt: new Date('2024-03-12T10:14:00Z'), camera: 'Canon EOS 5D Mark IV', hasGps: true },
      claimedGeo: { lat: -9.9749, lng: -67.8243 },
      verification: {
        status: 'verified',
        score: 95,
        checks: [
          { name: 'GPS Coordinates Present', passed: true, detail: 'EXIF latitude and longitude confirmed.' },
          { name: 'Location Matches Claim', passed: true, detail: 'Haversine distance is 0.02 km (< 2 km threshold).' },
          { name: 'EXIF Timestamp Confirmed', passed: true, detail: 'Camera shutter timestamp verified.' },
          { name: 'Capture Date Matches Claim', passed: true, detail: 'Timestamp matches project milestone date.' },
          { name: 'Perceptual Duplicate Detection', passed: true, detail: 'Unique dHash fingerprint.' },
        ],
      },
      phash: 'a1b2c3d4e5f60718',
      provenance: [
        { event: 'uploaded', at: new Date('2024-03-12T10:14:00Z'), detail: 'Field team uploaded image.' },
        { event: 'verified', at: new Date(), detail: 'Forensic checks passed (Score 95/100).' },
      ],
      usedInReports: [],
    });

    const acreAsset2 = await Asset.create({
      project: acreProject._id,
      projectName: acreProject.name,
      locationName: 'Section 4B - River Mile 14',
      capturedDate: new Date('2024-11-18T15:22:00Z'),
      kind: 'image',
      cloudinary: {
        publicId: 'acre_river_progress',
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        secureUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 800,
        format: 'jpg',
        bytes: 470000,
        resourceType: 'image',
      },
      transformations: {
        thumb: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=70',
        medium: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        watermarked: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
      },
      ai: {
        caption: 'Established multi-tiered native riparian canopy and dense perennial shrub understory stabilizing the riverbank slope.',
        tags: ['riparian', 'reforestation', 'native-species', 'stabilized', 'foliage'],
        activity: 'post-intervention monitoring and canopy measurement',
        metrics: { trees: 24, waste: 'low', waterClarity: 'good', vegetationLevel: 'high', peopleCount: 0 },
        analyzedAt: new Date(),
      },
      exif: { lat: -9.9749, lng: -67.8243, takenAt: new Date('2024-11-18T15:22:00Z'), camera: 'Canon EOS 5D Mark IV', hasGps: true },
      claimedGeo: { lat: -9.9749, lng: -67.8243 },
      verification: {
        status: 'verified',
        score: 100,
        checks: [
          { name: 'GPS Coordinates Present', passed: true, detail: 'Exact coordinates verified.' },
          { name: 'Location Matches Claim', passed: true, detail: 'Haversine distance 0.01 km.' },
          { name: 'EXIF Timestamp Confirmed', passed: true, detail: 'Hardware timestamp matched.' },
          { name: 'Capture Date Matches Claim', passed: true, detail: 'Correlates with reported milestone.' },
          { name: 'Perceptual Duplicate Detection', passed: true, detail: 'Original unique frame.' },
        ],
      },
      phash: 'f9e8d7c6b5a43210',
      provenance: [
        { event: 'uploaded', at: new Date('2024-11-18T15:22:00Z'), detail: 'Progress photo submitted by monitoring team.' },
        { event: 'verified', at: new Date(), detail: 'All 5 integrity checks passed (Score 100/100).' },
      ],
      usedInReports: [],
    });

    // 3. Create Sample Report
    const slug = 'q3-riparian-baseline-audit-b6b425f6';
    const report = await Report.create({
      title: 'Acre Basin Q3 Riparian Recovery Dossier',
      slug,
      project: acreProject._id,
      assetIds: [acreAsset1._id, acreAsset2._id],
      heroAssetId: acreAsset1._id,
      beforeAssetId: acreAsset1._id,
      afterAssetId: acreAsset2._id,
      headline: 'Measurable Riparian Recovery Confirmed Across Acre Basin',
      narrative: 'Field teams completed systematic seasonal monitoring along Section 4B of the Acre River watershed. Comparative forensic analysis confirms a 700% increase in native tree canopy density and significant bank soil stabilization. All imagery passed hardware EXIF and perceptual duplicate audits with a 100% verified ledger.',
      socialCaption: 'Acre River restoration: 100% verified field evidence confirms canopy recovery and soil stabilization. Auditable proof for donors. #ProofPoint #EnvironmentalImpact',
      metricsSummary: [
        { label: 'Canopy Density', before: '3 trees', after: '24 trees', change: '+21 Native Trees', direction: 'improved' },
        { label: 'Surface Waste', before: 'low', after: 'low', change: 'Maintained Pristine', direction: 'neutral' },
        { label: 'Water Clarity', before: 'fair', after: 'good', change: 'Sediment Reduced', direction: 'improved' },
        { label: 'Vegetation Level', before: 'low', after: 'high', change: 'Dense Understory', direction: 'improved' },
      ],
      verifiedPercent: 100,
    });

    await Asset.updateMany(
      { _id: { $in: [acreAsset1._id, acreAsset2._id] } },
      { $addToSet: { usedInReports: report._id } }
    );

    console.log('[AutoSeed] Demo dataset initialized successfully!');
  } catch (err) {
    console.error('[AutoSeed Error]', err.message);
  }
}
