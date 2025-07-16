import { Product } from '../components/interface';

export async function getDetail(url:string){
let res = await fetch(url);
  let data = await res.json();
  let product: Product = {
    id: data.id,
    name: data.name,
    price: data.price,
    image: data.image,
    description: data.description,
    category: data.category
  }
  return product;
}