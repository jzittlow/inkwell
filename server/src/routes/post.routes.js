// server/src/routes/post.routes.js
//
// Wires PostService's publish() and listPublished() to
// the API contract's POST /api/posts and GET /api/posts (Lecture 4).
// Same thin-route discipline as auth.routes.js: no businessrules here.

import { Router } from "express";
import { PostService } from "../services/post.service.js";
import { getStats } from "../events/listeners/count-published-posts.listener.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/posts", requireAuth, async (req, res) => {
    try {
        // Never trust client-supplied identity fields — derive
        // authorId from the authenticated request, not the request body.
        const post = await PostService.publish({
            ...req.body,
            authorId: req.user.id, // set by requireAuth middleware from the verified JWT
        });
        res.status(201).json(post);
    } catch (err) {
        next(err);
        //res.status(400).json({
        //    error: { code: err.code || "VALIDATION_ERROR", message: err.message }
        //});
    }
});

router.get("/posts", async (req, res) => {
    try {
        const { page = 1, search } = req.query;
        const result = search
            ? await PostService.search({ query: search, page: Number(page) })
            : await PostService.listPublished({ page: Number(page) });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

router.get("/stats", (req, res) => {
    res.status(200).json(getStats());
});

export default router;