import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    description: String,
    montant: Number
})

const PlateformeSchema = new mongoose.Schema({
    nom: String,
    fondDeCaisse: Number,
    uvDisponible: Number,
    rechargeUV: Number,
    totalDepot: Number,
    totalRetrait: Number,
    commission: Number,
    disponibilites: Number,
    dettes: [TransactionSchema],
})

const BanqueSchema = new mongoose.Schema({
    nom: String,
    montant: {type: String, default: 0}
})

const EntreeSchema = new mongoose.Schema({
    business: {type: mongoose.Schema.Types.ObjectId, ref: "Business"},
    description: String,
    montant: Number
})

const RapportSchema = new mongoose.Schema({
    date: { type: Date, required: true, default: () => new Date() },
    banques: [BanqueSchema],
    caissePrincipale: {
        montant: Number,
        entrees: [EntreeSchema],
        sorties: [TransactionSchema]
    },
    plateformes: [PlateformeSchema],
    dettes: [TransactionSchema]
})

const RapportCompta = mongoose.models.RapportCompta || mongoose.model("RapportCompta", RapportSchema)

export default RapportCompta