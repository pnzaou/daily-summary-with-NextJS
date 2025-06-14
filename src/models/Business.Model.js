import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
  },
  {
    timestamps: true,
  }
);

const Business = mongoose.models.Business || mongoose.model("Business", BusinessSchema);

export default Business;
