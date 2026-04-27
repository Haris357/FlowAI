import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { getPostBySlug } from '@/services/blog';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://flowbooksai.com';

type Props = {
  children: React.ReactNode;
  params: { slug: string };
};

function toIso(ts: any): string | undefined {
  if (!ts) return undefined;
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toISOString();
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const description = (post as any).excerpt || (post as any).description || post.title;
  const cover = (post as any).coverImage;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description,
      siteName: 'Flowbooks',
      publishedTime: toIso((post as any).publishedAt),
      modifiedTime: toIso((post as any).updatedAt) || toIso((post as any).publishedAt),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
      images: cover ? [{ url: cover, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function BlogPostLayout({ children, params }: Props) {
  const post = await getPostBySlug(params.slug).catch(() => null);

  const articleLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: (post as any).excerpt || post.title,
        image: (post as any).coverImage ? [(post as any).coverImage] : undefined,
        datePublished: toIso((post as any).publishedAt),
        dateModified:
          toIso((post as any).updatedAt) || toIso((post as any).publishedAt),
        author: {
          '@type': 'Person',
          name: post.author?.name || 'Flowbooks',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Flowbooks',
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/web-app-manifest-512x512.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog/${post.slug}`,
        },
        keywords: post.tags?.join(', '),
      }
    : null;

  return (
    <>
      {articleLd && <JsonLd data={articleLd} />}
      {children}
    </>
  );
}
