# DeNovo — Blog / CMS Snippet Brief
## MDX posts, categories, SEO meta, RSS feed. No external CMS.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Dependencies to Install
```bash
npm install next-mdx-remote gray-matter reading-time
```

---

## Approach

File-based MDX blog. Posts live in `/content/posts/` as `.mdx` files.
No database required for content — files are the source of truth.
Database used only for analytics (view counts) and comments if needed.

---

## File Structure to Add

```
content/
└── posts/
    ├── getting-started.mdx       # Sample post 1
    └── how-it-works.mdx          # Sample post 2

src/
├── app/
│   ├── blog/
│   │   ├── page.tsx              # Blog index — list all posts
│   │   ├── [slug]/
│   │   │   └── page.tsx          # Individual post
│   │   └── feed.xml/
│   │       └── route.ts          # RSS feed
│   └── api/
│       └── blog/
│           └── views/
│               └── route.ts      # Track + return view counts
└── lib/
    └── blog/
        ├── posts.ts              # Read + parse MDX files
        └── types.ts              # Post type definitions
```

---

## Implementation Details

### `src/lib/blog/types.ts`
```typescript
export interface PostFrontmatter {
  title: string
  description: string
  date: string           // YYYY-MM-DD
  author?: string
  category?: string
  tags?: string[]
  image?: string         // OG image URL
  published: boolean
}

export interface Post extends PostFrontmatter {
  slug: string
  content: string
  readingTime: string
  wordCount: number
}
```

### `src/lib/blog/posts.ts`
```typescript
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { Post, PostFrontmatter } from './types'

const POSTS_DIR = path.join(process.cwd(), 'content/posts')

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx'))

  return files
    .map(filename => {
      const slug = filename.replace('.mdx', '')
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8')
      const { data, content } = matter(raw)
      const frontmatter = data as PostFrontmatter
      const stats = readingTime(content)

      return {
        ...frontmatter,
        slug,
        content,
        readingTime: stats.text,
        wordCount: stats.words,
      }
    })
    .filter(post => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  return {
    ...(data as PostFrontmatter),
    slug,
    content,
    readingTime: stats.text,
    wordCount: stats.words,
  }
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(p => p.category === category)
}

export function getAllCategories(): string[] {
  const posts = getAllPosts()
  return [...new Set(posts.map(p => p.category).filter(Boolean) as string[])]
}
```

### `src/app/blog/page.tsx`
```typescript
import { getAllPosts, getAllCategories } from '@/lib/blog/posts'

export const metadata = {
  title: 'Blog',
  description: 'Latest posts and updates',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getAllCategories()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      {/* Category filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map(cat => (
          <a key={cat} href={`/blog?category=${cat}`}
             className="px-3 py-1 rounded-full bg-white/10 text-sm hover:bg-white/20">
            {cat}
          </a>
        ))}
      </div>
      {/* Post list */}
      <div className="space-y-8">
        {posts.map(post => (
          <article key={post.slug}>
            <a href={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold hover:text-violet-400">
                {post.title}
              </h2>
            </a>
            <p className="text-white/60 mt-2">{post.description}</p>
            <div className="flex gap-4 text-sm text-white/40 mt-2">
              <span>{new Date(post.date).toLocaleDateString()}</span>
              <span>{post.readingTime}</span>
              {post.category && <span>{post.category}</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
```

### `src/app/blog/[slug]/page.tsx`
```typescript
import { getPostBySlug, getAllPosts } from '@/lib/blog/posts'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, images: post.image ? [post.image] : [] },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <div className="flex gap-4 text-white/40 text-sm mt-3">
          <span>{new Date(post.date).toLocaleDateString()}</span>
          <span>{post.readingTime}</span>
          {post.author && <span>by {post.author}</span>}
        </div>
      </header>
      <div className="prose prose-invert max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  )
}
```

### `src/app/blog/feed.xml/route.ts`
```typescript
import { getAllPosts } from '@/lib/blog/posts'

export async function GET() {
  const posts = getAllPosts()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{{APP_NAME}} Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Latest posts</description>
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description>${post.description}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/blog/${post.slug}</guid>
    </item>`).join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: { 'Content-Type': 'application/rss+xml' },
  })
}
```

### Sample post — `content/posts/getting-started.mdx`
```mdx
---
title: Getting Started
description: Everything you need to know to get started.
date: 2026-03-28
author: Admin
category: Guides
tags: [getting-started, guide]
published: true
---

# Getting Started

Welcome to our platform. This guide will walk you through everything you need to know.

## Step 1

Do the first thing.

## Step 2

Do the second thing.
```

---

## Verification Checklist
- [ ] Blog index lists all published posts
- [ ] Individual post pages render MDX correctly
- [ ] Category filter works
- [ ] RSS feed returns valid XML
- [ ] `generateStaticParams` generates all post pages
- [ ] SEO meta tags correct on post pages
- [ ] Reading time displayed correctly
- [ ] Unpublished posts not shown
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ Blog index renders with sample posts
2. ✅/❌ Individual post renders MDX
3. ✅/❌ RSS feed returns valid XML
4. ✅/❌ Static generation works
5. ✅/❌ `npm run build` passes clean
