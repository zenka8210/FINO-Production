export interface Product {
  id: number | string;
  name: string;
  price: number;
  image: string;
  description: string;
  category?: number | string; // optional là OK
}
