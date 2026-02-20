export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  imageUrl?: string;
  featured: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

export type TestimonialInput = Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>;
