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
        const { page = 1, pageSize = 10, search } = req.query;
        const result = search
            ? await PostService.search({ query: search, page: Number(page), pageSize: Number(pageSize) })
            : await PostService.listPublished({ page: Number(page), pageSize: Number(pageSize) });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

router.get("/stats", (req, res) => {
    res.status(200).json(getStats());
});

router.delete("/posts/:id", requireAuth, async (req, res, next) => {
    try {
        const post = await PostService.getById(req.params.id);
        if (!post) return res.status(404).json({ error: { code: "NOT_FOUND" } });
        
        // A01's fix, in one line: check that the logged-in user actually
        // owns this resource before allowing the action on it.
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: { code: "FORBIDDEN" } });
        }

        await PostService.delete(req.params.id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

export default router;