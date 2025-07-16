export interface Review {
  id: number;
  productId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO date
}
