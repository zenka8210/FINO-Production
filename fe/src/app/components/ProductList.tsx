import { ProductWithCategory } from '@/types';
import ProductItem from './ProductItem';
import styles from '../page.module.css';

export default function ProductList({
  props
}: {
    props: {
    title: string,
    products: ProductWithCategory[]
  }
}) {
  return (
    <section className={styles.productSection}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1 className={styles.sectionTitle}>{props.title}</h1>
          </div>
        </div>
        <div className="row">
          {props.products.map((product: ProductWithCategory) => (
            <div key={product._id} className="col-3 col-md-6 col-sm-12">
              <ProductItem product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}