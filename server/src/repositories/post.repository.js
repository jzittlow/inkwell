// server/src/repositories/post.repository.js

import { prisma } from "../db/client.js";
import { toPublicUser } from "../dto/user.dto.js";

const MAX_PAGE_SIZE = 50;

export const PostRepository = {
    create({ authorId, title, body, status, publishedAt }) {
        return prisma.post.create({
            data: { authorId, title, body, status, publishedAt },
        });
    },

    createWithTags({ authorId, title, body, status, publishedAt, tagNames }) {
    return prisma.post.create({
      data: {
        authorId,
        title,
        body,
        status,
        publishedAt,
        tags: {
          create: tagNames.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });
  },
    
    async findPublished({ page = 1, pageSize = 10 }) {
        const effectivePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE); // Ensure pageSize is between 1 and MAX_PAGE_SIZE
        const rows = await prisma.post.findMany({
            where: { status: "PUBLISHED" },
            include: { author: true },
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * effectivePageSize,
            take: effectivePageSize + 1, // fetch one extra row to compute hasMore
        });
        const hasMore = rows.length > effectivePageSize;
        return { posts: rows.slice(0, effectivePageSize).map((post) => ({ ...post, author: toPublicUser(post.author) })), hasMore };
    },

    async searchPublished({ query, page = 1, pageSize = 10 }) {
        const effectivePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE); // Ensure pageSize is between 1 and MAX_PAGE_SIZE
        const where = {
            status: "PUBLISHED",
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { body: { contains: query, mode: "insensitive" } }
            ]
        };
        const rows = await prisma.post.findMany({
            where,
            include: { author: true },
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * effectivePageSize,
            take: effectivePageSize + 1,
        });
        const hasMore = rows.length > effectivePageSize;
        return { posts: rows.slice(0, effectivePageSize).map((post) => ({ ...post, author: toPublicUser(post.author) })), hasMore };
    },
};