// server/src/routes/__tests__/security.integration.test.js

import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../db/client.js";
import { resetDatabase, createTestUser } from "../../test-utils/fixtures.js";

beforeEach(async () => {
    await resetDatabase();
});

afterAll(async () => {
    await prisma.$disconnect();
});

test("GET /api/posts clamps oversized pageSize to maximum of 50 (Lecture 15, Exercise 1)", async () => {
    const user = await createTestUser();
    
    // Create 60 dummy posts
    const postsData = Array.from({ length: 60 }, (_, i) => ({
        authorId: user.id,
        title: `Post ${i + 1}`,
        body: `Body content ${i + 1}`,
        status: "PUBLISHED",
    }));
    await prisma.post.createMany({ data: postsData });

    // Request feed with an excessive pageSize parameter
    const response = await request(app).get("/api/posts?pageSize=1000");

    expect(response.status).toBe(200);
    expect(response.body.posts.length).toBe(50); // Clamped at 50
});