const os = require("os");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

// Registered via setupFilesAfterEnv, so this beforeAll is queued before any
// test file's own beforeAll/it blocks. Jest requires every test file (which
// requires app.js) before running ANY beforeAll, but app.js never opens a
// mongoose connection under NODE_ENV === "test" - it only registers models
// against the shared mongoose singleton. This beforeAll then connects that
// same singleton to the in-memory server, and since Jest runs all beforeAll
// hooks to completion before any test body executes, every request made
// inside an it() is guaranteed to run against an already-open connection.
beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), {
        // Without this, connect() hangs/fails here (verified: removing it
        // reproduces the failure) - see driver's client_metadata dynamic import.
        runtimeAdapters: { os },
    });
}, 30000);

afterEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(
        Object.values(collections).map((collection) => collection.deleteMany({}))
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
        await mongod.stop();
    }
});
