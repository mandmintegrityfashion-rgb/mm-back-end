import mongoose from "mongoose";
import { Resolver } from "dns/promises";

let connectionPromise;
const fallbackDnsServers = ["8.8.8.8", "1.1.1.1"];

function normalizeEnvValue(value) {
    const normalized = String(value || "").trim();

    if (
        normalized.length >= 2 &&
        ((normalized.startsWith('"') && normalized.endsWith('"')) ||
            (normalized.startsWith("'") && normalized.endsWith("'")))
    ) {
        return normalized.slice(1, -1).trim();
    }

    return normalized;
}

function createDatabaseError(message) {
    const error = new Error(message);
    error.statusCode = 500;
    error.publicMessage = message;
    return error;
}

function normalizeConnectionError(error) {
    if (error?.publicMessage) {
        return error;
    }

    if (isMongoSrvLookupError(error)) {
        return createDatabaseError(
            "Database DNS lookup failed. Verify MONGODB_URI or use a network that allows MongoDB SRV lookups."
        );
    }

    return error;
}

function isMongoSrvUri(uri) {
    return String(uri || "").startsWith("mongodb+srv://");
}

function isMongoSrvLookupError(error) {
    const details = `${error?.code || ""} ${error?.syscall || ""} ${error?.hostname || ""} ${error?.message || ""}`;
    return /querysrv|mongodb/i.test(details) && /(ENOTFOUND|ECONNREFUSED|ETIMEOUT|ESERVFAIL|REFUSED|NODATA)/i.test(details);
}

function buildMongoAuthSegment(parsedUrl) {
    if (!parsedUrl.username) {
        return "";
    }

    const username = encodeURIComponent(parsedUrl.username);
    const password = parsedUrl.password ? `:${encodeURIComponent(parsedUrl.password)}` : "";
    return `${username}${password}@`;
}

function mergeTxtParams(searchParams, txtRecords) {
    for (const recordParts of txtRecords) {
        const record = recordParts.join("").trim();

        if (!record) {
            continue;
        }

        for (const segment of record.split("&")) {
            const [rawKey, rawValue = ""] = segment.split("=");
            const key = String(rawKey || "").trim();

            if (!key || searchParams.has(key)) {
                continue;
            }

            searchParams.set(key, rawValue);
        }
    }
}

async function buildDirectMongoUri(uri) {
    const parsedUrl = new URL(uri);
    const resolver = new Resolver();
    resolver.setServers(fallbackDnsServers);

    const [srvRecords, txtRecords] = await Promise.all([
        resolver.resolveSrv(`_mongodb._tcp.${parsedUrl.hostname}`),
        resolver.resolveTxt(parsedUrl.hostname).catch(() => []),
    ]);

    if (!srvRecords.length) {
        throw createDatabaseError(
            "Database host could not be resolved. Update MONGODB_URI with a current MongoDB Atlas connection string."
        );
    }

    const hosts = srvRecords
        .sort((left, right) => left.name.localeCompare(right.name) || left.port - right.port)
        .map((record) => `${record.name}:${record.port}`)
        .join(",");
    const databaseName = parsedUrl.pathname && parsedUrl.pathname !== "/" ? parsedUrl.pathname : "/";
    const searchParams = new URLSearchParams(parsedUrl.search);

    mergeTxtParams(searchParams, txtRecords);
    if (!searchParams.has("tls") && !searchParams.has("ssl")) {
        searchParams.set("tls", "true");
    }

    const queryString = searchParams.toString();
    return `mongodb://${buildMongoAuthSegment(parsedUrl)}${hosts}${databaseName}${queryString ? `?${queryString}` : ""}`;
}

async function connectWithSrvFallback(uri) {
    try {
        return await mongoose.connect(uri);
    } catch (error) {
        if (!isMongoSrvUri(uri) || !isMongoSrvLookupError(error)) {
            throw error;
        }

        const directUri = await buildDirectMongoUri(uri);
        return mongoose.connect(directUri);
    }
}

export function mongooseConnect() {
    if (mongoose.connection.readyState === 1){
        return mongoose.connection.asPromise();
    }else {
        const uri = normalizeEnvValue(process.env.MONGODB_URI);

        if (!uri) {
            throw createDatabaseError('Invalid/Missing environment variable: "MONGODB_URI"');
        }

        if (!connectionPromise) {
            connectionPromise = connectWithSrvFallback(uri).catch((error) => {
                connectionPromise = null;
                throw normalizeConnectionError(error);
            });
        }

        return connectionPromise.catch((error) => {
            throw normalizeConnectionError(error);
        });
    }
}