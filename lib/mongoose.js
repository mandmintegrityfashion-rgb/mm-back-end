import mongoose from "mongoose";

export function mongooseConnect() {
    if (mongoose.connection.readyState === 1){
        return mongoose.connection.asPromise();
    }else {
        const uri = String(process.env.MONGODB_URI || "").trim();

        if (!uri) {
            throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
        }

        return mongoose.connect(uri);
    }
}