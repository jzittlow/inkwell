// server/src/services/__tests__/post.service.test.js

import { jest } from "@jest/globals";

const mockPostRepository = { createWithTags: jest.fn() };
const mockEventBus = { emit: jest.fn() };
const mockSearchStrategy = { search: jest.fn() };

jest.unstable_mockModule("../../repositories/post.repository.js", () => ({
    PostRepository: mockPostRepository,
}));

jest.unstable_mockModule("../../events/event-bus.js", () => ({
    EventBus: mockEventBus,
}));

jest.unstable_mockModule("../search/substring-search.strategy.js", () => ({
    SubstringSearchStrategy: mockSearchStrategy,
}));

const { PostService } = await import("../post.service.js");

beforeEach(() => { jest.clearAllMocks(); });

describe("PostService.publish", () => {
    test("publish() creates a PUBLISHED post and emits post.published", async () => {
        mockPostRepository.createWithTags.mockResolvedValue({ id: "p1", title: "Hello", status: "PUBLISHED" });
        const post = await PostService.publish({ authorId: "u1", title: "Hello", body: "World" });
        expect(post.status).toBe("PUBLISHED");
        expect(mockEventBus.emit).toHaveBeenCalledWith(
            "post.published", 
            expect.objectContaining({ postId: "p1" })
        );
    });

    test("publish() rejects an empty title", async () => {
        await expect(
            PostService.publish({ authorId: "u1", title: "", body: "World" })
        ).rejects.toThrow();
    });
});

describe("PostService.search", () => {
    test("returns matching posts when search query yields results (row 1)", async () => {
        const mockResults = { posts: [{ id: "p1", title: "TestPost" }], hasMore: false };
        mockSearchStrategy.search.mockResolvedValue(mockResults);
        const result = await PostService.search({ query: "TestPost", page: 1 });
        expect(result.posts.length).toBe(1);
        expect(result.posts[0].title).toBe("TestPost");
    });

    test("returns empty list when query matches no posts (row 2)", async () => {
        mockSearchStrategy.search.mockResolvedValue({ posts: [], hasMore: false });
        const result = await PostService.search({ query: "nomatches", page: 1 });
        expect(result.posts).toEqual([]);
        expect(result.hasMore).toBe(false);
    });

    test("defaults to page 1 and pageSize 10 if pagination options are omitted (row 3)", async () => {
        mockSearchStrategy.search.mockResolvedValue({ posts: [], hasMore: false });
        await PostService.search({ query: "default" });
        expect(mockSearchStrategy.search).toHaveBeenCalledWith("default", { page: 1, pageSize: 10 });
    });

    test("passes custom page number and page size to the search strategy (row 4)", async () => {
        mockSearchStrategy.search.mockResolvedValue({ posts: [{ id: "p2", title: "Page 2 Post" }], hasMore: true });
        const result = await PostService.search({ query: "custom", page: 2, pageSize: 5 });
        expect(mockSearchStrategy.search).toHaveBeenCalledWith("custom", { page: 2, pageSize: 5 });
        expect(result.posts.length).toBe(1);
        expect(result.hasMore).toBe(true);
    });

    test("propagates strategy failure if underlying search mechanism fails (row 4)", async () => {
        mockSearchStrategy.search.mockRejectedValue(new Error("Search database offline"));
        await expect(
            PostService.search({ query: "crash test", page: 1 })
        ).rejects.toThrow("Search database offline");
    });
});
