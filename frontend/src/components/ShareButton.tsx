/**
 * 分享按钮组件 - 集成9个社交媒体平台 + 二维码分享
 * 优化功能：缓存、Toast提示、现代化UI、性能优化
 */

import React, { useState, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as shareService from '../services/shareService';
import type { ShareType, SharePlatform } from '../services/shareService';
import { logError } from '../utils/logger';
import './ShareButton.css';

interface ShareButtonProps {
  shareType: ShareType;
  targetId: string;
  title: string;
  description: string;
  imageUrl?: string;
  url?: string;
  onShare?: (platform: string) => void;
}

// 分享链接缓存（5分钟有效期）
const shareLinkCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

const ShareButton: React.FC<ShareButtonProps> = ({
  shareType,
  targetId,
  title,
  description,
  // imageUrl, // 保留用于未来扩展
  // url, // 保留用于未来扩展
  onShare
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 缓存键
  const cacheKey = useMemo(() => `${shareType}-${targetId}`, [shareType, targetId]);

  // Toast 提示
  const displayToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
  }, []);

  // 生成分享链接（带缓存）
  const generateShareLink = useCallback(async (platform?: SharePlatform) => {
    // 检查缓存
    const cached = shareLinkCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }

    setLoading(true);
    try {
      const response = await shareService.createShare({
        shareType,
        targetId,
        platform
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setShareId(data.shareId);

        // 存入缓存
        shareLinkCache.set(cacheKey, {
          url: data.shareUrl,
          expires: Date.now() + CACHE_TTL
        });

        return data.shareUrl;
      }
    } catch (error) {
      logError('生成分享链接失败', error, { shareType, targetId, platform });
      displayToast('生成分享链接失败，请重试');
    } finally {
      setLoading(false);
    }
    return null;
  }, [shareType, targetId, cacheKey, displayToast]);

  // 记录分享事件
  const recordShareEvent = async (_platform: string) => {
    if (!shareId) return;

    try {
      await shareService.recordShareEvent({
        shareId,
        eventType: 'share',
        referrer: window.location.href
      });
    } catch (error) {
      logError('记录分享事件失败', error, { shareId, eventType: 'share' });
    }
  };

  // Facebook分享
  const shareToFacebook = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');

    await recordShareEvent('facebook');
    onShare?.('facebook');
  };

  // Twitter分享
  const shareToTwitter = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const text = `${title} - ${description}`;
    const hashtags = 'FortuneTelling,Divination';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}&hashtags=${hashtags}`;

    window.open(twitterUrl, '_blank', 'width=600,height=400');

    await recordShareEvent('twitter');
    onShare?.('twitter');
  };

  // LinkedIn分享
  const shareToLinkedIn = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');

    await recordShareEvent('linkedin');
    onShare?.('linkedin');
  };

  // WhatsApp分享
  const shareToWhatsApp = async () => {
    const shareLink = await generateShareLink('wechat' as SharePlatform); // WeChat类似WhatsApp
    if (!shareLink) return;

    const text = `${title}\n${description}\n${shareLink}`;
    const whatsappUrl = /mobile/i.test(navigator.userAgent)
      ? `whatsapp://send?text=${encodeURIComponent(text)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(whatsappUrl, '_blank');

    await recordShareEvent('whatsapp');
    onShare?.('whatsapp');
  };

  // Telegram分享
  const shareToTelegram = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const text = `${title}\n${description}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;

    window.open(telegramUrl, '_blank');

    await recordShareEvent('telegram');
    onShare?.('telegram');
  };

  // Line分享
  const shareToLine = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareLink)}`;
    window.open(lineUrl, '_blank');

    await recordShareEvent('line');
    onShare?.('line');
  };

  // Email分享
  const shareByEmail = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\nCheck it out here: ${shareLink}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;

    window.location.href = emailUrl;

    await recordShareEvent('email');
    onShare?.('email');
  };

  // 抖音/TikTok分享
  const shareToTikTok = async () => {
    const shareLink = await generateShareLink();
    if (!shareLink) return;

    const text = `${title} - ${description}`;
    // 抖音网页版分享API（移动端会自动打开App）
    const tiktokUrl = `https://www.tiktok.com/share?url=${encodeURIComponent(shareLink)}&title=${encodeURIComponent(text)}`;

    window.open(tiktokUrl, '_blank');
    displayToast('已打开抖音分享');

    await recordShareEvent('tiktok');
    onShare?.('tiktok');
  };

  // 复制链接（带Toast提示）
  const copyLink = async () => {
    const shareLink = await generateShareLink('link');
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      displayToast('✓ 链接已复制到剪贴板！');

      await recordShareEvent('copy_link');
      onShare?.('copy_link');
    } catch (error) {
      logError('复制链接失败', error, { shareLink });
      displayToast('复制失败，请手动复制');
    }
  };

  // 显示二维码
  const showQRCode = async () => {
    const shareLink = await generateShareLink('qrcode' as SharePlatform);
    if (!shareLink) return;

    setQrCodeUrl(shareLink);
    setShowQRModal(true);
    displayToast('二维码已生成');

    await recordShareEvent('qrcode');
    onShare?.('qrcode');
  };

  // 打开分享弹窗
  const handleShare = () => {
    setShowModal(true);
  };

  return (
    <>
      <button className="share-button" onClick={handleShare} disabled={loading}>
        <svg className="share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {loading ? '生成中...' : '分享'}
      </button>

      {showModal && (
        <div className="share-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>分享到</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="share-platforms">
              <button className="platform-btn facebook" onClick={shareToFacebook}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>

              <button className="platform-btn twitter" onClick={shareToTwitter}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span>Twitter</span>
              </button>

              <button className="platform-btn linkedin" onClick={shareToLinkedIn}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </button>

              <button className="platform-btn whatsapp" onClick={shareToWhatsApp}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>WhatsApp</span>
              </button>

              <button className="platform-btn telegram" onClick={shareToTelegram}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Telegram</span>
              </button>

              <button className="platform-btn line" onClick={shareToLine}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>Line</span>
              </button>

              <button className="platform-btn email" onClick={shareByEmail}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Email</span>
              </button>

              <button className="platform-btn tiktok" onClick={shareToTikTok}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span>抖音</span>
              </button>

              <button className="platform-btn copy-link" onClick={copyLink}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span>复制链接</span>
              </button>

              <button className="platform-btn qrcode" onClick={showQRCode}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM19 19h2v2h-2z"/>
                </svg>
                <span>二维码</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 二维码弹窗 */}
      {showQRModal && (
        <div className="share-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-content">
              <h3>扫码分享</h3>
              <QRCodeSVG
                value={qrCodeUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
              <p>使用手机扫描二维码访问</p>
              <button className="qr-close-btn" onClick={() => setShowQRModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast.show && (
        <div className="share-toast">
          <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast.message}
        </div>
      )}
    </>
  );
};

export default ShareButton;
