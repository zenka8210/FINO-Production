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
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1 className={styles.sectionTitle}>{props.title}</h1>
          </div>
        </div>
        <div className="row">
          {props.products.map((product: Product) => (
            <div key={product.id} className="col-3 col-md-6 col-sm-12">
              <ProductItem product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}