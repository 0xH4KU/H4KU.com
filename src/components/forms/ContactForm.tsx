import { useState, FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/config/emailjs';
import styles from './ContactForm.module.css';

const EMAILJS_IS_CONFIGURED = Boolean(
  EMAILJS_CONFIG.SERVICE_ID &&
    EMAILJS_CONFIG.TEMPLATE_ID &&
    EMAILJS_CONFIG.PUBLIC_KEY
);

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState<FormStatus>({ type: 'idle' });

  // 🛡️ Anti-spam protection (免費防護措施)
  const [honeypot, setHoneypot] = useState(''); // Honeypot 蜜罐欄位
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0); // Rate limiting
  const [formStartTime] = useState<number>(Date.now()); // 表單開始時間

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 🛡️ Anti-spam Check 1: Honeypot（蜜罐檢查）
    // 如果隱藏欄位被填寫，說明是機器人
    if (honeypot) {
      console.log('🤖 Bot detected via honeypot');
      // 假裝成功，但不實際發送
      setStatus({
        type: 'success',
        message: "Message sent successfully! I'll get back to you soon.",
      });
      setFormData({ name: '', email: '', message: '' });
      return;
    }

    // 🛡️ Anti-spam Check 2: Rate Limiting（頻率限制）
    // 60秒內只能提交一次
    const now = Date.now();
    if (now - lastSubmitTime < 60000) {
      setStatus({
        type: 'error',
        message:
          'Please wait a moment before sending another message (1 minute cooldown)',
      });
      return;
    }

    // 🛡️ Anti-spam Check 3: Time Check（時間檢查）
    // 表單必須至少花3秒填寫（防止瞬間提交）
    const fillTime = now - formStartTime;
    if (fillTime < 3000) {
      setStatus({
        type: 'error',
        message: 'Please take your time filling out the form',
      });
      return;
    }

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: 'error',
        message: 'Please fill in all fields',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    // Check if EmailJS is configured
    if (!EMAILJS_IS_CONFIGURED) {
      setStatus({
        type: 'error',
        message:
          'Email service is not configured. Please contact me directly at hi@lum.bio',
      });
      return;
    }

    setStatus({ type: 'loading' });
    setLastSubmitTime(now); // 記錄提交時間

    try {
      // EmailJS credentials from environment variables
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      setStatus({
        type: 'success',
        message: "Message sent successfully! I'll get back to you soon.",
      });

      // Reset form
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatus({
        type: 'error',
        message:
          'Failed to send message. Please try again or email directly at hi@lum.bio',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className={styles.contactForm}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={status.type === 'loading'}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={status.type === 'loading'}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Message:
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            disabled={status.type === 'loading'}
            className={styles.textarea}
            rows={6}
            required
          />
        </div>

        {/* 🍯 Honeypot Field - 機器人陷阱（人類看不到） */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <label htmlFor="website">
            Website (please leave this field blank):
          </label>
          <input
            type="text"
            id="website"
            name="website"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={status.type === 'loading'}
          className={styles.button}
        >
          {status.type === 'loading' ? 'Sending...' : 'Send Message'}
        </button>

        {status.message && (
          <div
            className={`${styles.message} ${
              status.type === 'success' ? styles.success : styles.error
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
