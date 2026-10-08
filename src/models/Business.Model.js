import mongoose from "mongoose";
import { BUSINESS_TYPES } from "@/lib/business-types";

// Types regroupés sur le tableau de bord ; un business sans type n'apparaît dans aucune section
export { BUSINESS_TYPES };

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
