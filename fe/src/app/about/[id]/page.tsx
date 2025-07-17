import posts from "../posts.json";
import Link from "next/link";
import styles from "../about.module.css";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function AboutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = posts.find((p) => p.id === id);
  if (!post) return notFound();
  const relatedPosts = posts.filter((p) => post.related.includes(p.id));

  return (
    <div className={styles.aboutContainer}>
      <h1 className={styles.title}>{post.title}</h1>
      {post.image && (
        <div className={styles.imageWrap}>
          <Image src={post.image} alt={post.title} width={600} height={350} className={styles.image} />
        </div>
      )}
      <div className={styles.content}>{post.content}</div>
      <h2 className={styles.relatedTitle}>Bài viết liên quan</h2>
      <ul className={styles.relatedList}>
        {relatedPosts.map((p) => (
          <li key={p.id}>
            <Link href={`/about/${p.id}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
      <div style={{marginTop: 32}}>
        <Link href="/about" style={{color: '#0070f3'}}>← Quay lại trang giới thiệu</Link>
      </div>
    </div>
  );
}
