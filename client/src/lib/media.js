export function getEvidenceImageUrl(asset, variant = 'thumb') {
  const url =
    asset?.transformations?.[variant] ||
    asset?.cloudinary?.secureUrl ||
    asset?.cloudinary?.url;

  if (!url || url.includes('images.unsplash.com')) return '';
  return url;
}
