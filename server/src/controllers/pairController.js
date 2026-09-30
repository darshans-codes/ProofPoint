import { Asset } from '../models/Asset.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { haversineDistanceMeters } from '../utils/haversine.js';

function hasUsableMedia(asset) {
  const urls = [
    asset?.transformations?.medium,
    asset?.transformations?.watermarked,
    asset?.cloudinary?.secureUrl,
    asset?.cloudinary?.url,
  ];

  return urls.some(
    (url) =>
      typeof url === 'string' &&
      /^https?:\/\//i.test(url) &&
      !url.includes('images.unsplash.com')
  );
}

export const getSuggestedPairs = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  const query = { kind: 'image' };
  if (projectId) {
    query.project = projectId;
  }

  const assets = await Asset.find(query)
    .select('-embedding')
    .sort({ capturedDate: 1 });

  if (assets.length < 2) {
    return res.json({ pairs: [] });
  }

  // Clusters: Group by spatial proximity (< 100m) or fallback to locationName
  const clusters = [];

  for (const asset of assets) {
    let placed = false;

    for (const cluster of clusters) {
      const representative = cluster[0];

      // Check GPS distance if both have GPS
      if (asset.exif?.hasGps && representative.exif?.hasGps) {
        const dist = haversineDistanceMeters(
          asset.exif.lat,
          asset.exif.lng,
          representative.exif.lat,
          representative.exif.lng
        );
        if (dist <= 100) {
          cluster.push(asset);
          placed = true;
          break;
        }
      } else if (
        asset.locationName &&
        representative.locationName &&
        asset.locationName.trim().toLowerCase() === representative.locationName.trim().toLowerCase()
      ) {
        // Fallback: match by identical location name
        cluster.push(asset);
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push([asset]);
    }
  }

  const suggestedPairs = [];

  for (const cluster of clusters) {
    if (cluster.length < 2) continue;

    // Sort chronologically by exif.takenAt or capturedDate
    cluster.sort((a, b) => {
      const dateA = new Date(a.exif?.takenAt || a.capturedDate).getTime();
      const dateB = new Date(b.exif?.takenAt || b.capturedDate).getTime();
      return dateA - dateB;
    });

    const before = cluster[0];
    const after = cluster[cluster.length - 1];

    if (!hasUsableMedia(before) || !hasUsableMedia(after)) {
      continue;
    }

    const timeBefore = new Date(before.exif?.takenAt || before.capturedDate).getTime();
    const timeAfter = new Date(after.exif?.takenAt || after.capturedDate).getTime();
    const daysBetween = Math.round((timeAfter - timeBefore) / (1000 * 3600 * 24));

    // Only suggest if at least 1 day apart
    if (daysBetween >= 1) {
      let distanceMeters = 0;
      let hasPreciseGps = false;

      if (before.exif?.hasGps && after.exif?.hasGps) {
        distanceMeters = Math.round(
          haversineDistanceMeters(
            before.exif.lat,
            before.exif.lng,
            after.exif.lat,
            after.exif.lng
          )
        );
        hasPreciseGps = true;
      }

      const confidence = hasPreciseGps && distanceMeters <= 50 ? 'high' : hasPreciseGps ? 'medium' : 'low';

      suggestedPairs.push({
        id: `${before._id}_${after._id}`,
        before,
        after,
        distanceMeters,
        daysBetween,
        confidence,
        locationName: before.locationName,
        projectName: before.projectName,
      });
    }
  }

  res.json({ pairs: suggestedPairs });
});
