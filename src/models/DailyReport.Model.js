import mongoose from "mongoose";

const DailyReportSchema = new mongoose.Schema(
  {
    sales: [
      {
        ref: { type: String, required: true },
        description: { type: String, required: true },
        total: { type: Number, required: true },
      },
    ],
    business: { //done
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    gerant: { //done
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { //done
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0), // début de la journée
    },
    revenueCash: { //done
      type: Number,
      default: 0,
    },
    revenueOrangeMoney: { //done
      type: Number,
      default: 0,
    },
    revenueWave: { //done
      type: Number,
      default: 0,
    },
    debts: [
      {
        ref: { type: String, required: true },
        description: { type: String, required: true },
        total: { type: Number, required: true },
      }
    ],
    reglementDebts: [
      {
        ref: { type: String, required: true },
        description: { type: String, required: true },
        total: { type: Number, required: true },
      }
    ],
    sortieCaisse: [
      {
        description: { type: String, required: true },
        total: { type: Number, required: true },
      }
    ],
    versementTataDiara: { //done
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
    // Pour empêcher plusieurs rapports pour un même manager/business/jour
    indexes: [
      {
        fields: { business: 1, gerant: 1, date: 1 },
        options: { unique: true },
      },
    ],
  }
);

const DailyReport = mongoose.models.DailyReport || mongoose.model("DailyReport", DailyReportSchema);

export default DailyReport;
