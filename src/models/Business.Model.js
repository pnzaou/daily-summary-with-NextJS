import mongoose from "mongoose";

// Types regroupés sur le tableau de bord ; un business sans type n'apparaît dans aucune section
export const BUSINESS_TYPES = ["location", "quincaillerie", "boucherie"];

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    type: {
      type: String,
      enum: BUSINESS_TYPES,
      required: false,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

const Business = mongoose.models.Business || mongoose.model("Business", BusinessSchema);

export default Business;
