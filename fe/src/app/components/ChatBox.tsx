'use client';
import { useState, useRef, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './ChatBox.module.css';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const predefinedResponses: { [key: string]: string } = {
  'xin chào': 'Xin chào! Tôi là AI hỗ trợ khách hàng của shop. Tôi có thể giúp gì cho bạn?',
  'hello': 'Xin chào! Tôi là AI hỗ trợ khách hàng của shop. Tôi có thể giúp gì cho bạn?',
  'hi': 'Chào bạn! Tôi có thể hỗ trợ bạn về sản phẩm, đơn hàng, và chính sách của shop.',
  'sản phẩm': 'Chúng tôi có các sản phẩm áo thun nam, nữ, phụ kiện và set quần áo. Bạn quan tâm đến loại sản phẩm nào?',
  'áo thun': 'Chúng tôi có nhiều loại áo thun nam và nữ với giá từ 100.000 - 500.000 VNĐ. Tất cả đều chất lượng cao và thiết kế thời trang.',
  'giá': 'Giá sản phẩm của chúng tôi từ 100.000 - 500.000 VNĐ tùy loại. Bạn có thể xem chi tiết giá từng sản phẩm trên trang web.',
  'giao hàng': 'Chúng tôi có 2 hình thức giao hàng: Giao hàng tiết kiệm (20.000 VNĐ) và Giao hàng nhanh (50.000 VNĐ). Thời gian giao hàng từ 2-5 ngày.',
  'thanh toán': 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví Momo và thẻ tín dụng.',
  'đổi trả': 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày với sản phẩm chưa sử dụng và còn nguyên tag.',
  'size': 'Chúng tôi có đủ size từ S đến XXL. Bạn có thể tham khảo bảng size chi tiết trong mô tả sản phẩm.',
  'liên hệ': 'Bạn có thể liên hệ với chúng tôi qua hotline: 1900-1234, email: support@shop.com hoặc chat trực tiếp tại đây.',
  'khuyến mãi': 'Chúng tôi thường xuyên có các chương trình khuyến mãi. Hiện tại có mã giảm giá SAVE10 (10%), SAVE50 (50.000đ), FREESHIP (miễn phí ship).',
  'mã giảm giá': 'Các mã giảm giá hiện có: SAVE10 (giảm 10%), SAVE50 (giảm 50.000đ), FREESHIP (miễn phí ship). Áp dụng tại trang giỏ hàng.',
  'bye': 'Cảm ơn bạn đã liên hệ! Chúc bạn mua sắm vui vẻ. Hẹn gặp lại!',
  'tạm biệt': 'Cảm ơn bạn đã liên hệ! Chúc bạn mua sắm vui vẻ. Hẹn gặp lại!',
  'cảm ơn': 'Không có gì! Tôi rất vui được hỗ trợ bạn. Bạn có cần hỗ trợ gì thêm không?'
};

const quickReplies = [
  'Sản phẩm nổi bật',
  'Chính sách giao hàng', 
  'Cách thanh toán',
  'Đổi trả hàng',
  'Mã giảm giá',
  'Liên hệ hỗ trợ'
];

export default function ChatBox() {
  const { success } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Khởi tạo messages và load từ localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Đảm bảo timestamp là Date object
        const messagesWithDateTimestamp = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDateTimestamp);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setDefaultWelcomeMessage();
      }
    } else {
      setDefaultWelcomeMessage();
    }
  }, []);

  // Lưu messages vào localStorage khi thay đổi
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const setDefaultWelcomeMessage = () => {
    setMessages([{
      id: '1',
      text: 'Xin chào! Tôi là AI hỗ trợ khách hàng. Tôi có thể giúp gì cho bạn hôm nay? 😊',
      isBot: true,
      timestamp: new Date()
    }]);
  };

  const clearChatHistory = () => {
    localStorage.removeItem('chatMessages');
    setDefaultWelcomeMessage();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      // Gọi API chat để có response thông minh hơn
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: messages.slice(-5).map(m => m.text) // Gửi 5 tin nhắn gần nhất làm context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.response;
        }
      }
    } catch (error) {
      console.error('Chat API Error:', error);
    }

    // Fallback về response cũ nếu API lỗi
    const lowerMessage = userMessage.toLowerCase();
    
    // Tìm response phù hợp
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    // Response mặc định
    const defaultResponses = [
      'Cảm ơn bạn đã liên hệ! Tôi đang tìm hiểu thông tin này. Bạn có thể liên hệ hotline 1900-1234 để được hỗ trợ trực tiếp.',
      'Đây là một câu hỏi hay! Để được tư vấn chi tiết, bạn có thể nhắn tin cho chúng tôi hoặc gọi hotline 1900-1234.',
      'Tôi sẽ chuyển yêu cầu này cho team hỗ trợ. Trong thời gian chờ, bạn có thể xem thêm thông tin trên website của chúng tôi.'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Thêm tin nhắn của user
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay và gọi API
    setTimeout(async () => {
      try {
        const responseText = await generateResponse(text);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          isBot: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error generating response:', error);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hotline 1900-1234.',
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    }, 1000 + Math.random() * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };
  const handleQuickReply = (reply: string) => {
    let message = '';
    switch(reply) {
      case 'Sản phẩm nổi bật':
        message = 'Cho tôi xem sản phẩm nổi bật nhất của shop';
        break;
      case 'Chính sách giao hàng':
        message = 'Cho tôi biết về chính sách giao hàng';
        break;
      case 'Cách thanh toán':
        message = 'Shop hỗ trợ những hình thức thanh toán nào?';
        break;
      case 'Đổi trả hàng':
        message = 'Tôi muốn biết về chính sách đổi trả';
        break;
      case 'Mã giảm giá':
        message = 'Hiện tại có mã giảm giá nào không?';
        break;
      case 'Liên hệ hỗ trợ':
        message = 'Tôi muốn liên hệ với bộ phận hỗ trợ';
        break;
      default:
        message = reply;
    }
    sendMessage(message);
  };

  // Detect links và tạo action buttons
  const renderMessageWithActions = (text: string) => {
    const lines = text.split('\n');
    return (
      <div>
        {lines.map((line, index) => (
          <div key={index}>
            {line}
            {index < lines.length - 1 && <br />}
          </div>
        ))}
        
        {/* Action buttons cho một số response đặc biệt */}
        {text.includes('catalog') || text.includes('sản phẩm') && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={styles.actionButton}
              onClick={() => window.open('/products', '_blank')}
            >
              🛍️ Xem sản phẩm
            </button>
          </div>
        )}
        
        {text.includes('giỏ hàng') && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={styles.actionButton}
              onClick={() => window.open('/cart', '_blank')}
            >
              🛒 Xem giỏ hàng
            </button>
          </div>
        )}
        
        {text.includes('mã giảm giá') || text.includes('SAVE') && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={styles.actionButton}
              onClick={() => {
                navigator.clipboard.writeText('SAVE10');
                success('Đã copy mã!', 'Mã giảm giá SAVE10 đã được sao chép');
              }}
            >
              📋 Copy SAVE10
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                navigator.clipboard.writeText('FREESHIP');
                success('Đã copy mã!', 'Mã miễn phí ship FREESHIP đã được sao chép');
              }}
            >
              📋 Copy FREESHIP
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={styles.chatButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat hỗ trợ"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className={styles.chatBox}>          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.avatar}>🤖</div>
              <div>
                <div className={styles.botName}>AI Hỗ trợ</div>
                <div className={styles.status}>Đang online</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={styles.clearButton}
                onClick={clearChatHistory}
                title="Xóa lịch sử chat"
              >
                🗑️
              </button>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.chatMessages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.isBot ? styles.botMessage : styles.userMessage
                }`}
              >
                {message.isBot && (
                  <div className={styles.messageAvatar}>🤖</div>
                )}
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>
                    {renderMessageWithActions(message.text)}
                  </div>                  <div className={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.messageAvatar}>🤖</div>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className={styles.quickReplies}>
              <div className={styles.quickRepliesTitle}>Câu hỏi thường gặp:</div>
              <div className={styles.quickRepliesButtons}>
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    className={styles.quickReplyButton}
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form className={styles.chatInput} onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className={styles.input}
              disabled={isTyping}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputValue.trim() || isTyping}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
