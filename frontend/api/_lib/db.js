import mongoose from 'mongoose';

let cached = global._mongooseConn;

if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null };
}

export default async function dbConnect() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const uri = (process.env.MONGO_URI || '').trim();
        if (!uri) throw new Error('MONGO_URI is not set');

        cached.promise = mongoose
            .connect(uri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                maxPoolSize: 10,
            })
            .then((m) => m)
            .catch((err) => {
                cached.promise = null;
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
