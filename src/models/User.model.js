import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["gerant", "comptable", "admin"],
      default: "gerant",
    },
    // Un manager peut gérer plusieurs businesses
    businesses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
