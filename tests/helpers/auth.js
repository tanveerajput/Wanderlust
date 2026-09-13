const request = require("supertest");

// app.js only wires up express.urlencoded(), not express.json(), so the
// signup form must be posted with .type("form") or req.body will be empty.
async function registerAndLogin(app, overrides = {}) {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user = {
        username: `testuser_${unique}`,
        email: `${unique}@example.com`,
        password: "password123",
        ...overrides,
    };

    const agent = request.agent(app);
    const res = await agent.post("/signup").type("form").send(user);

    // The signup controller always responds with a redirect: to /listings on
    // success, back to /signup (with a flashed error) on failure - so a 4xx/5xx
    // status never actually happens here and can't be used to detect failure.
    if (res.status >= 400 || res.headers.location !== "/listings") {
        throw new Error(
            `registerAndLogin: signup did not succeed (status ${res.status}, redirected to ${res.headers.location})`
        );
    }

    return { agent, user };
}

module.exports = { registerAndLogin };
