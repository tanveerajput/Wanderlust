const { MongoMemoryReplSet } = require("mongodb-memory-server");

// Multi-document transactions need a replica set; a standalone mongod rejects
// them. The replica set is started here, in Jest's parent process, rather than
// in setup.js: MongoMemoryReplSet.create() hangs when run inside a test file's
// VM context (its internal driver client cannot take the runtimeAdapters
// workaround that setup.js applies to its own connection).
module.exports = async () => {
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    globalThis.__MONGO_REPLSET__ = replSet;
    process.env.MONGO_URI_TEST = replSet.getUri();
};
