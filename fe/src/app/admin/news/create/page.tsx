'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../news-form.module.css';

interface NewsFormData {
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  status: 'published' | 'draft';
  slug: string;
}

export default function CreateNewsPage() {
  const router = useRouter();
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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleContentChange = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      setFormData(prev => ({ ...prev, content }));
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    
    const items = Array.from(e.clipboardData?.items || []);
    let hasImage = false;
    
    // Xử lý ảnh từ clipboard
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        hasImage = true;
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            insertImageIntoEditor(base64, 'Ảnh được paste');
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
    
    // Nếu không có ảnh, xử lý text/html
    if (!hasImage) {
      const htmlData = e.clipboardData?.getData('text/html');
      const textData = e.clipboardData?.getData('text/plain');
      
      if (htmlData && htmlData.trim()) {
        // Clean HTML và chèn vào editor
        const cleanedHtml = cleanPastedHtml(htmlData);
        insertHtmlIntoEditor(cleanedHtml);
      } else if (textData) {
        // Chèn text thuần túy
        insertTextIntoEditor(textData);
      }
    }
  };

  const cleanPastedHtml = (html: string) => {
    // Loại bỏ các style và attribute không mong muốn
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/style="[^"]*"/gi, '')
      .replace(/class="[^"]*"/gi, '')
      .replace(/id="[^"]*"/gi, '')
      .replace(/<o:p\s*\/?>/gi, '')
      .replace(/<\/?span[^>]*>/gi, '')
      .replace(/<\/?div[^>]*>/gi, '')
      .replace(/&nbsp;/gi, ' ');
    
    return cleaned;
  };

  const insertImageIntoEditor = (src: string, alt: string) => {
    if (contentRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        img.style.borderRadius = '8px';
        
        range.deleteContents();
        range.insertNode(img);
        
        // Di chuyển cursor sau ảnh
        range.setStartAfter(img);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        handleContentChange();
      }
    }
  };

  const insertHtmlIntoEditor = (html: string) => {
    if (contentRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const div = document.createElement('div');
        div.innerHTML = html;
        
        const fragment = document.createDocumentFragment();
        while (div.firstChild) {
          fragment.appendChild(div.firstChild);
        }
        
        range.insertNode(fragment);
        handleContentChange();
      }
    }
  };

  const insertTextIntoEditor = (text: string) => {
    if (contentRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        handleContentChange();
      }
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update form with server URL instead of base64
          setFormData(prev => ({ ...prev, image: data.data.url }));
          setImagePreview(data.data.url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        // Keep using base64 as fallback
      }
    }
  };

  const insertImage = () => {
    if (imagePreview && contentRef.current) {
      const altTextValue = altText || 'Hình ảnh';
      insertImageIntoEditor(imagePreview, altTextValue);
    }
    
    // Reset modal state
    setShowImageUpload(false);
    setImagePreview('');
    setImageFile(null);
    setImageUrl('');
    setAltText('');
    setImageUploadType('file');
  };

  const formatText = (format: string) => {
    if (!contentRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Nếu không có selection, focus vào editor và tạo selection
      contentRef.current.focus();
      return;
    }
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    let formattedHtml = '';
    
    switch (format) {
      case 'bold':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần định dạng!');
          return;
        }
        formattedHtml = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần định dạng!');
          return;
        }
        formattedHtml = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        if (!selectedText) {
          alert('Vui lòng chọn văn bản cần định dạng!');
          return;
        }
        formattedHtml = `<u>${selectedText}</u>`;
        break;
      case 'h1':
        formattedHtml = `<h1>${selectedText || 'Tiêu đề 1'}</h1>`;
        break;
      case 'h2':
        formattedHtml = `<h2>${selectedText || 'Tiêu đề 2'}</h2>`;
        break;
      case 'h3':
        formattedHtml = `<h3>${selectedText || 'Tiêu đề 3'}</h3>`;
        break;
      case 'p':
        formattedHtml = `<p>${selectedText || 'Đoạn văn'}</p>`;
        break;
      case 'ul':
        formattedHtml = '<ul><li>Mục 1</li><li>Mục 2</li></ul>';
        break;
      case 'ol':
        formattedHtml = '<ol><li>Mục 1</li><li>Mục 2</li></ol>';
        break;
      case 'blockquote':
        formattedHtml = `<blockquote>${selectedText || 'Trích dẫn'}</blockquote>`;
        break;
      case 'link':
        const url = prompt('Nhập URL:');
        if (url) {
          formattedHtml = `<a href="${url}" target="_blank">${selectedText || 'Link'}</a>`;
        } else {
          return;
        }
        break;
      case 'hr':
        formattedHtml = '<hr>';
        break;
      case 'br':
        formattedHtml = '<br>';
        break;
      default:
        return;
    }
    
    range.deleteContents();
    const div = document.createElement('div');
    div.innerHTML = formattedHtml;
    
    const fragment = document.createDocumentFragment();
    while (div.firstChild) {
      fragment.appendChild(div.firstChild);
    }
    
    range.insertNode(fragment);
    handleContentChange();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.category) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Tạo tin tức thành công!');
        router.push('/admin/news');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi tạo tin tức!');
      }
    } catch (error) {
      console.error('Error creating news:', error);
      alert('Có lỗi xảy ra khi tạo tin tức!');
    }
    setLoading(false);
  };

  return (
    <div className={styles.newsForm}>
      <div className={styles.header}>
        <h1>Thêm Tin Tức Mới</h1>
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
                <div
                  ref={contentRef}
                  contentEditable
                  onInput={handleContentChange}
                  onPaste={(e) => handlePaste(e.nativeEvent)}
                  placeholder="Nhập nội dung bài viết... Sử dụng toolbar để định dạng hoặc paste ảnh trực tiếp."
                  className={styles.contentEditor}
                  style={{ minHeight: '400px', border: '1px solid #ddd', padding: '12px', borderRadius: '4px' }}
                  dangerouslySetInnerHTML={{ __html: formData.content }}
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
                  Chọn hình ảnh
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
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Lưu tin tức
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
