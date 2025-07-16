'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import styles from '../../news-form.module.css';

interface NewsFormData {
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  status: 'published' | 'draft';
  slug: string;
}

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    excerpt: '',
    content: '',
    image: '',
    category: '',
    status: 'draft',
    slug: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const categories = [
    'Xu hướng',
    'Sự kiện', 
    'Phong cách',
    'Street Style',
    'Tips',
    'Phụ kiện',
    'Thời trang nam',
    'Thời trang nữ'
  ];

  useEffect(() => {
    loadNewsData();
  }, [id]);

  const loadNewsData = async () => {
    try {
      const response = await fetch(`/api/news/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          title: data.data.title,
          excerpt: data.data.excerpt,
          content: data.data.content,
          image: data.data.image,
          category: data.data.category,
          status: data.data.status,
          slug: data.data.slug
        });
        setImagePreview(data.data.image);
      } else {
        alert('Không tìm thấy tin tức!');
        router.push('/admin/news');
      }
    } catch (error) {
      console.error('Error loading news:', error);
      alert('Không thể tải dữ liệu tin tức!');
      router.push('/admin/news');
    }
    setLoadingData(false);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    let hasHTML = false;

    // Kiểm tra có ảnh không
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        hasImage = true;
        e.preventDefault();
        
        const file = item.getAsFile();
        if (file) {
          // Tạo URL tạm thời cho ảnh
          const imageUrl = URL.createObjectURL(file);
          
          // Chèn ảnh vào vị trí con trỏ
          if (contentRef.current) {
            const textarea = contentRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const imageTag = `\n<img src="${imageUrl}" alt="Ảnh được paste" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" />\n`;
            
            const newContent = formData.content.substring(0, start) + imageTag + formData.content.substring(end);
            setFormData(prev => ({ ...prev, content: newContent }));
            
            // Reset cursor position
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + imageTag.length, start + imageTag.length);
            }, 0);
          }
          
          // Hiển thị thông báo
          alert('Đã paste ảnh vào nội dung! Lưu ý: Ảnh sẽ chỉ hiển thị trong phiên làm việc này.');
        }
        break;
      }
      
      // Kiểm tra có HTML không (từ Word, Google Docs, etc.)
      if (item.type === 'text/html') {
        hasHTML = true;
        e.preventDefault();
        
        item.getAsString((htmlContent) => {
          if (contentRef.current) {
            const textarea = contentRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // Làm sạch HTML (loại bỏ các style không cần thiết)
            const cleanHTML = htmlContent
              .replace(/<meta[^>]*>/gi, '')
              .replace(/<style[^>]*>.*?<\/style>/gi, '')
              .replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/style="[^"]*"/gi, '')
              .replace(/class="[^"]*"/gi, '')
              .replace(/<span[^>]*>/gi, '')
              .replace(/<\/span>/gi, '')
              .replace(/<o:p[^>]*>.*?<\/o:p>/gi, '')
              .replace(/<!--.*?-->/gi, '')
              .trim();
            
            const newContent = formData.content.substring(0, start) + '\n' + cleanHTML + '\n' + formData.content.substring(end);
            setFormData(prev => ({ ...prev, content: newContent }));
            
            // Reset cursor position
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + cleanHTML.length + 2, start + cleanHTML.length + 2);
            }, 0);
            
            alert('Đã paste nội dung với định dạng HTML!');
          }
        });
        break;
      }
    }

    // Nếu không có ảnh hoặc HTML, để hành vi paste mặc định xảy ra
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'title' && { slug: generateSlug(value) })
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const insertImage = () => {
    if (imagePreview && contentRef.current) {
      const textarea = contentRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const imageTag = `\n<img src="${imagePreview}" alt="Hình ảnh" style="max-width: 100%; height: auto; margin: 10px 0;" />\n`;
      
      const newContent = formData.content.substring(0, start) + imageTag + formData.content.substring(end);
      setFormData(prev => ({ ...prev, content: newContent }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + imageTag.length, start + imageTag.length);
      }, 0);
    }
    setShowImageUpload(false);
    setImagePreview('');
    setImageFile(null);
  };

  const formatText = (format: string) => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần định dạng!');
          return;
        }
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần định dạng!');
          return;
        }
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần định dạng!');
          return;
        }
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'h1':
        formattedText = `<h1>${selectedText || 'Tiêu đề 1'}</h1>`;
        break;
      case 'h2':
        formattedText = `<h2>${selectedText || 'Tiêu đề 2'}</h2>`;
        break;
      case 'h3':
        formattedText = `<h3>${selectedText || 'Tiêu đề 3'}</h3>`;
        break;
      case 'p':
        formattedText = `<p>${selectedText || 'Đoạn văn'}</p>`;
        break;
      case 'ul':
        formattedText = `<ul>\n  <li>Mục 1</li>\n  <li>Mục 2</li>\n  <li>Mục 3</li>\n</ul>`;
        break;
      case 'ol':
        formattedText = `<ol>\n  <li>Mục 1</li>\n  <li>Mục 2</li>\n  <li>Mục 3</li>\n</ol>`;
        break;
      case 'blockquote':
        formattedText = `<blockquote>${selectedText || 'Trích dẫn'}</blockquote>`;
        break;
      case 'link':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần chèn link!');
          return;
        }
        const url = prompt('Nhập URL:');
        if (url) {
          formattedText = `<a href="${url}" target="_blank">${selectedText}</a>`;
        } else {
          return;
        }
        break;
      case 'br':
        formattedText = '<br>';
        break;
      case 'hr':
        formattedText = '<hr>';
        break;
      default:
        return;
    }
    
    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.category) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Cập nhật tin tức thành công!');
        router.push('/admin/news');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi cập nhật tin tức!');
      }
    } catch (error) {
      console.error('Error updating news:', error);
      alert('Có lỗi xảy ra khi cập nhật tin tức!');
    }
    setLoading(false);
  };

  if (loadingData) {
    return (
      <div className={styles.newsForm}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#f59e0b' }}></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.newsForm}>
      <div className={styles.header}>
        <h1>Chỉnh Sửa Tin Tức</h1>
        <button 
          type="button" 
          onClick={() => router.back()}
          className={styles.backBtn}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <div className={styles.formGroup}>
              <label>Tiêu đề *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề tin tức..."
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Slug</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="url-cua-bai-viet"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tóm tắt *</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                placeholder="Nhập tóm tắt ngắn gọn về bài viết..."
                rows={3}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nội dung *</label>
              
              {/* Toolbar */}
              <div className={styles.toolbar}>
                <div className={styles.toolbarGroup}>
                  <button type="button" onClick={() => formatText('bold')} title="Đậm">
                    <i className="fas fa-bold"></i>
                  </button>
                  <button type="button" onClick={() => formatText('italic')} title="Nghiêng">
                    <i className="fas fa-italic"></i>
                  </button>
                  <button type="button" onClick={() => formatText('underline')} title="Gạch chân">
                    <i className="fas fa-underline"></i>
                  </button>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.toolbarGroup}>
                  <button type="button" onClick={() => formatText('h1')} title="Tiêu đề 1">
                    H1
                  </button>
                  <button type="button" onClick={() => formatText('h2')} title="Tiêu đề 2">
                    H2
                  </button>
                  <button type="button" onClick={() => formatText('h3')} title="Tiêu đề 3">
                    H3
                  </button>
                  <button type="button" onClick={() => formatText('p')} title="Đoạn văn">
                    P
                  </button>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.toolbarGroup}>
                  <button type="button" onClick={() => formatText('ul')} title="Danh sách">
                    <i className="fas fa-list-ul"></i>
                  </button>
                  <button type="button" onClick={() => formatText('ol')} title="Danh sách số">
                    <i className="fas fa-list-ol"></i>
                  </button>
                  <button type="button" onClick={() => formatText('blockquote')} title="Trích dẫn">
                    <i className="fas fa-quote-left"></i>
                  </button>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.toolbarGroup}>
                  <button type="button" onClick={() => formatText('link')} title="Thêm link">
                    <i className="fas fa-link"></i>
                  </button>
                  <button type="button" onClick={() => setShowImageUpload(true)} title="Thêm hình ảnh">
                    <i className="fas fa-image"></i>
                  </button>
                  <button type="button" onClick={() => formatText('hr')} title="Đường kẻ ngang">
                    <i className="fas fa-minus"></i>
                  </button>
                  <button type="button" onClick={() => formatText('br')} title="Xuống dòng">
                    <i className="fas fa-level-down-alt"></i>
                  </button>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.toolbarGroup}>
                  <button 
                    type="button" 
                    onClick={() => setShowPreview(!showPreview)} 
                    title={showPreview ? "Ẩn xem trước" : "Xem trước"}
                    className={showPreview ? styles.activeBtn : ''}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              {showPreview ? (
                <div className={styles.previewContainer}>
                  <h4 className={styles.previewTitle}>Xem trước nội dung:</h4>
                  <div 
                    className={styles.previewContent}
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              ) : (
                <textarea
                  ref={contentRef}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  placeholder="Nhập nội dung bài viết... Sử dụng HTML tags để định dạng hoặc paste ảnh trực tiếp."
                  rows={15}
                  className={styles.contentEditor}
                  required
                />
              )}
              
              <div className={styles.editorHint}>
                <i className="fas fa-info-circle"></i>
                Chọn text và dùng toolbar để định dạng. Hỗ trợ HTML tags. Nhấn nút mắt để xem trước. <strong>Có thể paste ảnh trực tiếp (Ctrl+V) hoặc paste văn bản từ Word/Google Docs với định dạng!</strong>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            <div className={styles.formGroup}>
              <label>Hình ảnh đại diện</label>
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  id="main-image"
                  hidden
                />
                <label htmlFor="main-image" className={styles.uploadBtn}>
                  <i className="fas fa-upload"></i>
                  Thay đổi hình ảnh
                </label>
                {formData.image && (
                  <div className={styles.imagePreview}>
                    <Image
                      src={formData.image}
                      alt="Preview"
                      width={200}
                      height={120}
                      className={styles.previewImg}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Danh mục *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
              </select>
            </div>

            <div className={styles.actions}>
              <button 
                type="submit" 
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Cập nhật tin tức
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => router.back()}
                className={styles.cancelBtn}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Thêm hình ảnh vào nội dung</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="content-image"
            />
            {imagePreview && (
              <div className={styles.modalPreview}>
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={300}
                  height={200}
                  className={styles.modalImg}
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <button 
                type="button" 
                onClick={insertImage}
                disabled={!imagePreview}
                className={styles.insertBtn}
              >
                Chèn hình ảnh
              </button>
              <button 
                type="button" 
                onClick={() => setShowImageUpload(false)}
                className={styles.cancelBtn}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
