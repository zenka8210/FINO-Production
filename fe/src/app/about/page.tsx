import postsData from "./posts.json";
import Link from "next/link";
import styles from "./about.module.css";
import Image from "next/image";

interface Post {
  id: string;
  title: string;
  image?: string;
  content: string;
  related: string[];
}

const posts: Post[] = postsData as any;

export default function AboutPage() {
  const mainPost = posts[0];
  const relatedPosts = posts.filter((p) => p.id !== mainPost.id);

  return (
    <div className="container">
      <div className="row">
        <div className="col-8 col-md-12 col-sm-12">
          <div className={styles.aboutContainer}>
            <h1 className={styles.title}>{mainPost.title}</h1>
            {mainPost.image && (
              <div className={styles.imageWrap}>
                <Image
                  src={mainPost.image}
                  alt={mainPost.title}
                  width={600}
                  height={350}
                  className={styles.image}
                />
              </div>
            )}
            <div className={styles.content}>{mainPost.content}</div>
          </div>
        </div>
        <div className="col-4 col-md-12 col-sm-12">
          <div className={styles.sidebar}>
            <h2 className={styles.relatedTitle}>Bài viết liên quan</h2>
            <ul className={styles.relatedList}>
              {relatedPosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/about/${post.id}`}>{post.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
