const request = require("supertest");
const app = require("../app.js");

describe("smoke", () => {
    it("GET /listings returns 200", async () => {
        const res = await request(app).get("/listings");
        expect(res.status).toBe(200);
    });
});
