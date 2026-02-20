import mongoose from 'mongoose';

let cached = global._mongooseConn;

if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null };
}

export default async function dbConnect() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGO_URI)
            .then((m) => m);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
