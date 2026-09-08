import mongoose, { type Types } from "mongoose";
import { ReportStatus, ReportTargetType } from "../../common/enums";

export interface IReport {
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const reportSchema = new mongoose.Schema<IReport>(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: Object.values(ReportTargetType),
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.Pending,
    },
  },
  { timestamps: true },
);

reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export const ReportModel = mongoose.model<IReport>("Report", reportSchema);
