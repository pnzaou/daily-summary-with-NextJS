import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Veuillez définir la variable d'environnement MONGODB_URI");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const dbConnection = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        })
    }
    try {
        cached.conn = await cached.promise;
        console.log(`Connexion réussi à la db ${cached.conn.connection.host}`);
    } catch (error) {
        cached.promise = null;
        console.error("Erreur lors de la connexion à MongoDB", error.message)
        throw error;
    }

    return cached.conn;
}

export default dbConnection