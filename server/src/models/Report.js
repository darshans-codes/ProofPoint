import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    assetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
      },
    ],
    heroAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
    beforeAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
    afterAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
    headline: {
      type: String,
      default: '',
    },
    narrative: {
      type: String,
      default: '',
    },
    socialCaption: {
      type: String,
      default: '',
    },
    metricsSummary: [
      {
        label: String,
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
        change: String,
        direction: {
          type: String,
          enum: ['improved', 'worsened', 'neutral'],
          default: 'neutral',
        },
      },
    ],
    verifiedPercent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model('Report', reportSchema);
