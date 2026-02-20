import { Timestamp } from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML content
  coverImage?: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  readTime: number; // minutes
  views: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}
