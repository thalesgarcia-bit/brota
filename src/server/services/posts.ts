import 'server-only';

import type { Prisma, PostType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      profile: {
        select: { username: true, displayName: true, avatarUrl: true },
      },
    },
  },
  plant: {
    select: {
      slug: true,
      scientificName: true,
      commonNames: { where: { isPrimary: true }, take: 1 },
    },
  },
  images: { orderBy: { position: 'asc' } },
  tags: true,
  _count: { select: { comments: true, reactions: true } },
} satisfies Prisma.PostInclude;

export type FeedPost = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }> & {
  likedByMe: boolean;
  savedByMe: boolean;
};

const PAGE_SIZE = 12;

export async function getFeed(options: {
  viewerId: string | null;
  cursor?: string | null;
  authorId?: string;
  tag?: string;
  type?: string;
  plantId?: string;
}): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const where: Prisma.PostWhereInput = { status: 'PUBLISHED' };

  if (options.authorId) where.authorId = options.authorId;
  if (options.plantId) where.plantId = options.plantId;
  if (options.type) where.type = options.type as PostType;
  if (options.tag) where.tags = { some: { tag: options.tag.toLowerCase() } };

  const rows = await prisma.post.findMany({
    where,
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  // Uma consulta só para saber o que o usuário curtiu e salvou.
  const [likes, saves] = options.viewerId
    ? await Promise.all([
        prisma.reaction.findMany({
          where: {
            userId: options.viewerId,
            postId: { in: page.map((post) => post.id) },
          },
          select: { postId: true },
        }),
        prisma.savedItem.findMany({
          where: {
            userId: options.viewerId,
            postId: { in: page.map((post) => post.id) },
          },
          select: { postId: true },
        }),
      ])
    : [[], []];

  const likedIds = new Set(likes.map((item) => item.postId));
  const savedIds = new Set(saves.map((item) => item.postId));

  return {
    posts: page.map((post) => ({
      ...post,
      likedByMe: likedIds.has(post.id),
      savedByMe: savedIds.has(post.id),
    })),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function getPostComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, status: 'PUBLISHED', parentId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: {
          id: true,
          profile: { select: { username: true, displayName: true, avatarUrl: true } },
        },
      },
      replies: {
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              profile: {
                select: { username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getTrendingTags(limit = 12) {
  const rows = await prisma.postTag.groupBy({
    by: ['tag'],
    _count: { tag: true },
    orderBy: { _count: { tag: 'desc' } },
    take: limit,
  });

  return rows.map((row) => ({ tag: row.tag, count: row._count.tag }));
}
