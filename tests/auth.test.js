const request = require("supertest");
const app = require("../app.js");
const User = require("../models/user.js");
const { registerAndLogin } = require("./helpers/auth.js");

test("1. POST /signup with valid data creates a user and logs them in", async () => {
    const agent = request.agent(app);
    const username = `alice_${Date.now()}`;

    const res = await agent.post("/signup").type("form").send({
        username,
        email: `${username}@example.com`,
        password: "password123",
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/listings");

    const createdUser = await User.findOne({ username });
    expect(createdUser).not.toBeNull();

    // "logged in" = the same agent's session now passes isLoggedIn
    const newFormRes = await agent.get("/listings/new");
    expect(newFormRes.status).toBe(200);
});

test("2. POST /signup with a duplicate username creates no second user", async () => {
    const username = `bob_${Date.now()}`;

    const agent1 = request.agent(app);
    await agent1.post("/signup").type("form").send({
        username,
        email: `${username}@example.com`,
        password: "password123",
    });

    expect(await User.countDocuments({ username })).toBe(1);

    const agent2 = request.agent(app);
    const res = await agent2.post("/signup").type("form").send({
        username,
        email: `different_${username}@example.com`,
        password: "otherpassword",
    });

    // the signup controller catches the duplicate-username error and
    // redirects back to /signup (not /listings, which is the success path)
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/signup");

    expect(await User.countDocuments({ username })).toBe(1);
});

test("3. POST /login with wrong password does not create a session", async () => {
    const { user } = await registerAndLogin(app);

    const freshAgent = request.agent(app);
    const res = await freshAgent.post("/login").type("form").send({
        username: user.username,
        password: "definitely-wrong-password",
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");

    // no session was established: a protected route still bounces to /login
    const protectedRes = await freshAgent.get("/listings/new");
    expect(protectedRes.status).toBe(302);
    expect(protectedRes.headers.location).toBe("/login");
});

test("4. GET /logout destroys the session", async () => {
    const { agent } = await registerAndLogin(app);

    const beforeLogout = await agent.get("/listings/new");
    expect(beforeLogout.status).toBe(200);

    const res = await agent.get("/logout");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/listings");

    const afterLogout = await agent.get("/listings/new");
    expect(afterLogout.status).toBe(302);
    expect(afterLogout.headers.location).toBe("/login");
});
