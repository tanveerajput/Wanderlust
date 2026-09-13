require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), quiet: true });

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

// Masks any user:pass@ credentials so a connection string never gets echoed
// back with its password, even inside driver error messages.
function redact(str) {
    if (typeof str !== "string") return str;
    return str.replace(/:\/\/([^:@\/\s]+):([^@\/\s]+)@/g, "://$1:****@");
}

let failures = 0;

function report(label, ok, detail) {
    console.log(`[${ok ? "PASS" : "FAIL"}] ${label}${detail ? " - " + detail : ""}`);
    if (!ok) failures++;
    return ok;
}

async function main() {
    const dbUrl = process.env.ATLAS_URL;

    // Step 1: defined + first 30 chars (password masked before slicing)
    if (!report("ATLAS_URL is defined", Boolean(dbUrl))) {
        console.log("Set ATLAS_URL in your .env file at the project root and re-run.");
        process.exitCode = 1;
        return;
    }
    const redactedUrl = redact(dbUrl);
    console.log(
        `       first 30 chars (password masked): ${JSON.stringify(redactedUrl.slice(0, 30))} (total length ${dbUrl.length})`
    );

    // Step 2: scheme check
    const isSrv = dbUrl.startsWith("mongodb+srv://");
    const isStandard = dbUrl.startsWith("mongodb://");
    report("ATLAS_URL starts with mongodb+srv:// or mongodb://", isSrv || isStandard);
    if (!isSrv && !isStandard) {
        process.exitCode = 1;
        return;
    }

    // Step 3: SRV resolution (only meaningful for mongodb+srv:// URIs)
    if (isSrv) {
        const afterScheme = dbUrl.slice("mongodb+srv://".length);
        const hostPart = afterScheme.includes("@") ? afterScheme.split("@")[1] : afterScheme;
        const host = hostPart.split(/[/?]/)[0];
        try {
            const records = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
            report("SRV record resolved", true, `${records.length} host(s) returned`);
        } catch (err) {
            report("SRV record resolved", false, redact(err.message));
        }
    } else {
        console.log("       SRV lookup skipped - not a mongodb+srv:// URI");
    }

    // Step 4: mongoose connection with a 10s timeout
    try {
        await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 10000,
        });
        report("Mongoose connection established", true);
        await mongoose.disconnect();
    } catch (err) {
        report("Mongoose connection established", false, redact(err.message));
    }

    process.exitCode = failures > 0 ? 1 : 0;
}

main().catch((err) => {
    console.error("[FAIL] unexpected error -", redact(err.message));
    process.exitCode = 1;
});
