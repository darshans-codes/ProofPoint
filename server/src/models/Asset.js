import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      trim: true,
    },
    locationName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    capturedDate: {
      type: Date,
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    cloudinary: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
      secureUrl: { type: String, required: true },
      width: Number,
      height: Number,
      format: String,
      bytes: Number,
      resourceType: { type: String, default: 'image' },
    },
    transformations: {
      thumb: String,
      medium: String,
      watermarked: String,
      poster: String,
    },
    ai: {
      caption: String,
      tags: [String],
      activity: String,
      metrics: {
        trees: { type: Number, default: 0 },
        waste: { type: String, enum: ['low', 'medium', 'high', 'n/a'], default: 'n/a' },
        waterClarity: { type: String, enum: ['good', 'fair', 'poor', 'n/a'], default: 'n/a' },
        vegetationLevel: { type: String, enum: ['low', 'medium', 'high', 'n/a'], default: 'n/a' },
        peopleCount: { type: Number, default: 0 },
      },
      analyzedAt: Date,
    },
    exif: {
      lat: Number,
      lng: Number,
      takenAt: Date,
      camera: String,
      hasGps: { type: Boolean, default: false },
    },
    claimedGeo: {
      lat: Number,
      lng: Number,
    },
    sourceMetadata: {
      type: {
        type: String,
        enum: ['public_source_demo'],
      },
      sourceDate: Date,
      credit: String,
      license: String,
      url: String,
      context: String,
    },
    verification: {
      status: {
        type: String,
        enum: ['verified', 'needs_review', 'flagged'],
        default: 'needs_review',
        index: true,
      },
      score: {
        type: Number,
        default: 0,
        index: true,
      },
      checks: [
        {
          name: String,
          passed: Boolean,
          detail: String,
        },
      ],
    },
    phash: {
      type: String,
      index: true,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
    embedding: {
      type: [Number],
      select: false, // Never return in list responses unless explicitly requested
    },
    provenance: [
      {
        event: { type: String, required: true },
        at: { type: Date, default: Date.now },
        detail: String,
      },
    ],
    usedInReports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
  },
  {
    timestamps: true,
  }
);

assetSchema.index({ project: 1, capturedDate: -1 });
assetSchema.index({ 'exif.lat': 1, 'exif.lng': 1 });

export const Asset = mongoose.model('Asset', assetSchema);
