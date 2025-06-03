import { Product } from './interface';
import ProductItem from './ProductItem';
import styles from '../page.module.css';

export default function ProductList({
  props
}: { 
    props: {
    title: string,
    products: Product[]
  }
}) {    
    
  return (
    <section className={styles.productSection}>
      <h1 className={styles.sectionTitle}>{props.title}</h1>
      <div className={styles.productGrid}>
      {props.products.map((product, index) => (
    <ProductItem key={product.id ?? `product-${index}`} product={product} />
    ))}
      </div>
    </section>
  );
}