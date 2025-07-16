'use client';
import styles from './CategoryCards.module.css';

const categoryCards = [
  { id: 'quan-ao', name: 'Quần Áo', color: '#87CEEB', bgColor: '#E6F3FF', icon: '👕' },
  { id: 'mu-non', name: 'Mũ Nón', color: '#FFB347', bgColor: '#FFF2E6', icon: '🧢' },
  { id: 'giay-dep', name: 'Giày Dép', color: '#90EE90', bgColor: '#F0FFF0', icon: '👟' },
  { id: 'phu-kien', name: 'Phụ Kiện', color: '#FFB6C1', bgColor: '#FFF0F5', icon: '⌚️' },
  { id: 'ba-lo', name: 'Balo', color: '#98FB98', bgColor: '#F0FFF0', icon: '🎒' }
];

export default function CategoryCards() {
  return (
    <div className={styles.categoryCardsContainer}>
      <div className={styles.cardsGrid}>
        {categoryCards.map((category) => (
          <a 
            key={category.id}
            href={`/products?category=${category.id}`}
            className={styles.categoryCard}
            style={{ backgroundColor: category.bgColor }}
          >
            <div className={styles.cardContent}>              <div 
                className={styles.bearIcon}
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </div>
              <span className={styles.categoryName}>{category.name}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
