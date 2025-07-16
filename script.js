class QRCodeGenerator {
    constructor() {
        this.isPremium = true; // デモ版では全機能利用可能
        this.generatedQR = null;
        this.qrGeneratedCount = 0;
        this.initializeElements();
        this.attachEventListeners();
        this.initializeAnalytics();
    }

    initializeElements() {
        this.textInput = document.getElementById('text-input');
        this.sizeSelect = document.getElementById('size-select');
        this.fgColorInput = document.getElementById('fg-color');
        this.bgColorInput = document.getElementById('bg-color');
        this.errorLevelSelect = document.getElementById('error-level');
        this.generateBtn = document.getElementById('generate-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.qrPreview = document.getElementById('qr-preview');
        this.sizeInfo = document.getElementById('size-info');
        this.errorInfo = document.getElementById('error-info');
        this.unlockBtns = document.querySelectorAll('.unlock-btn');
        this.premiumBtns = document.querySelectorAll('.premium-btn');
    }

    attachEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generateQR());
        this.downloadBtn.addEventListener('click', () => this.downloadQR());
        
        // Update info when options change
        this.sizeSelect.addEventListener('change', () => this.updatePreviewInfo());
        this.errorLevelSelect.addEventListener('change', () => this.updatePreviewInfo());
        
        // Premium feature unlock buttons
        this.unlockBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showPremiumModal());
        });
        
        this.premiumBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showPremiumModal());
        });

        // Auto-generate on text change (with debouncing)
        let timeout;
        this.textInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.textInput.value.trim()) {
                    this.generateQR();
                }
            }, 500);
        });
    }

    generateQR() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showError('テキストまたはURLを入力してください');
            return;
        }

        // セキュリティ: 入力値の検証とサニタイズ
        if (text.length > 2000) {
            this.showError('テキストが長すぎます（2000文字以下）');
            return;
        }

        // XSS対策: 危険な文字列をチェック
        if (this.containsXSS(text)) {
            this.showError('無効な文字が含まれています');
            return;
        }

        const size = parseInt(this.sizeSelect.value);
        const fgColor = this.fgColorInput.value;
        const bgColor = this.bgColorInput.value;
        const errorLevel = this.errorLevelSelect.value;

        // デモ版では全サイズ利用可能
        // if (size === 800 && !this.isPremium) {
        //     this.showPremiumModal();
        //     return;
        // }

        // Show loading state
        this.showLoading();

        // Generate QR code
        const errorLevelMapping = {
            'L': 'L',
            'M': 'M', 
            'Q': 'Q',
            'H': 'H'
        };

        const options = {
            width: size,
            height: size,
            color: {
                dark: fgColor,
                light: bgColor
            },
            errorCorrectionLevel: errorLevelMapping[errorLevel] || 'M'
        };

        // Clear previous QR code
        this.qrPreview.innerHTML = '';

        try {
            // Check if QRCode library is available
            if (typeof QRCode === 'undefined') {
                throw new Error('QRCode library not loaded');
            }

            // Generate new QR code
            QRCode.toCanvas(this.qrPreview, text, options, (error) => {
                if (error) {
                    this.showError('QRコードの生成に失敗しました');
                    console.error(error);
                    return;
                }

                            this.qrPreview.classList.add('has-qr');
            this.downloadBtn.disabled = false;
            this.generatedQR = { text, options };
            this.incrementQRCount();
            this.showSuccess('QRコードが生成されました');
            });
        } catch (error) {
            console.error('QRCode library error:', error);
            this.showFallbackQR(text);
        }
    }

    downloadQR() {
        if (!this.generatedQR) return;

        const canvas = this.qrPreview.querySelector('canvas');
        if (!canvas) return;

        // Create download link
        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();

        // Analytics (simulated)
        this.trackEvent('qr_download', {
            size: this.generatedQR.options.width,
            error_level: this.errorLevelSelect.value
        });
    }

    showLoading() {
        this.qrPreview.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>QRコードを生成中...</p>
            </div>
        `;
        this.qrPreview.classList.remove('has-qr');
    }

    showError(message) {
        // XSS対策: テキストを安全に設定
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.color = '#dc3545';
        
        const p = document.createElement('p');
        p.style.color = '#dc3545';
        p.textContent = message; // innerHTML ではなく textContent を使用
        
        placeholder.appendChild(icon);
        placeholder.appendChild(p);
        
        this.qrPreview.innerHTML = '';
        this.qrPreview.appendChild(placeholder);
        this.qrPreview.classList.remove('has-qr');
        this.downloadBtn.disabled = true;
    }

    showSuccess(message) {
        // Show temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        
        // XSS対策: 安全にメッセージを設定
        const icon = document.createElement('i');
        icon.className = 'fas fa-check';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = ` ${message}`;
        
        successDiv.appendChild(icon);
        successDiv.appendChild(textSpan);
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.opacity = '1';
            successDiv.style.transform = 'translateY(0)';
        }, 100);

        setTimeout(() => {
            successDiv.style.opacity = '0';
            successDiv.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(successDiv);
            }, 300);
        }, 3000);
    }

    showPremiumModal() {
        const modal = document.createElement('div');
        modal.className = 'premium-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 3rem;
            border-radius: 20px;
            max-width: 500px;
            margin: 0 20px;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;

        modalContent.innerHTML = `
            <i class="fas fa-star" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
            <h2 style="margin-bottom: 1rem; color: #333;">デモ版機能</h2>
            <p style="margin-bottom: 2rem; color: #666;">
                このデモ版では全ての機能を無料でお試しいただけます。<br>
                実際のサービスでは、この機能はプレミアムプランで提供されます。
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="upgrade-btn" style="
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-unlock"></i> 機能を試す
                </button>
                <button class="close-modal" style="
                    background: #f8f9fa;
                    color: #6c757d;
                    border: 2px solid #e9ecef;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    キャンセル
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 100);

        // Close modal events
        const closeModal = () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.9)';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modalContent.querySelector('.close-modal').addEventListener('click', closeModal);
        modalContent.querySelector('.upgrade-btn').addEventListener('click', () => {
            this.simulatePremiumUpgrade();
            closeModal();
        });
    }

    simulatePremiumUpgrade() {
        // Simulate premium upgrade (in real app, this would integrate with payment processor)
        this.isPremium = true;
        
        // Update UI to show premium features
        document.querySelectorAll('.premium-locked').forEach(item => {
            item.classList.remove('premium-locked');
            item.querySelector('.unlock-btn').textContent = '利用可能';
            item.querySelector('.unlock-btn').style.background = '#28a745';
        });

        // Update navigation
        const premiumNavLink = document.querySelector('.nav-link.premium');
        premiumNavLink.textContent = 'デモ版 ✓';
        premiumNavLink.style.background = 'linear-gradient(45deg, #28a745, #20c997)';

        this.showSuccess('デモ版では全機能をご利用いただけます！');
    }

    updatePreviewInfo() {
        const size = this.sizeSelect.value;
        const errorLevel = this.errorLevelSelect.value;
        
        this.sizeInfo.textContent = `サイズ: ${size}x${size}px`;
        this.errorInfo.textContent = `エラー訂正: ${errorLevel}`;
    }

    showFallbackQR(text) {
        // セキュリティ: テキストを検証
        if (this.containsXSS(text)) {
            this.showError('無効な文字が含まれています');
            return;
        }
        
        // Fallback to API service (HTTPS強制)
        const size = parseInt(this.sizeSelect.value);
        const fgColor = this.fgColorInput.value.replace('#', '');
        const bgColor = this.bgColorInput.value.replace('#', '');
        
        // セキュリティ: URLパラメータをさらに検証
        const safeText = encodeURIComponent(text.substring(0, 2000));
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${safeText}&color=${fgColor}&bgcolor=${bgColor}`;
        
        const img = document.createElement('img');
        img.src = apiUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '10px';
        img.alt = 'Generated QR Code'; // アクセシビリティ向上
        
        img.onload = () => {
            this.qrPreview.innerHTML = '';
            this.qrPreview.appendChild(img);
            this.qrPreview.classList.add('has-qr');
            this.downloadBtn.disabled = false;
            this.generatedQR = { text, apiUrl };
            this.showSuccess('QRコードが生成されました（API使用）');
        };
        img.onerror = () => {
            this.showError('QRコードの生成に失敗しました');
        };
    }

    initializeAnalytics() {
        // 訪問者数をカウント
        this.incrementVisitorCount();
        
        // QR生成数をローカルストレージから復元
        this.qrGeneratedCount = parseInt(localStorage.getItem('qr-generated-count') || '0');
        this.updateQRCountDisplay();
    }

    incrementVisitorCount() {
        // セッションストレージで同セッション内での重複カウントを防ぐ
        if (!sessionStorage.getItem('visited')) {
            let visitorCount = parseInt(localStorage.getItem('visitor-count') || '0');
            visitorCount++;
            localStorage.setItem('visitor-count', visitorCount.toString());
            sessionStorage.setItem('visited', 'true');
            
            // 表示を更新
            const visitorCountElement = document.getElementById('visitor-count');
            if (visitorCountElement) {
                visitorCountElement.textContent = visitorCount.toLocaleString();
            }
        } else {
            // 既存の訪問者数を表示
            const visitorCount = parseInt(localStorage.getItem('visitor-count') || '0');
            const visitorCountElement = document.getElementById('visitor-count');
            if (visitorCountElement) {
                visitorCountElement.textContent = visitorCount.toLocaleString();
            }
        }
    }

    incrementQRCount() {
        this.qrGeneratedCount++;
        localStorage.setItem('qr-generated-count', this.qrGeneratedCount.toString());
        this.updateQRCountDisplay();
    }

    updateQRCountDisplay() {
        const qrCountElement = document.getElementById('qr-generated-count');
        if (qrCountElement) {
            qrCountElement.textContent = this.qrGeneratedCount.toLocaleString();
        }
    }

    containsXSS(text) {
        // XSS攻撃パターンを検出
        const xssPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
            /onclick=/i,
            /onmouseover=/i,
            /<iframe/i,
            /<embed/i,
            /<object/i
        ];
        
        return xssPatterns.some(pattern => pattern.test(text));
    }

    sanitizeInput(text) {
        // HTMLエスケープ
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    trackEvent(eventName, params) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, params);
        }
        
        // Console logging for development
        console.log(`Analytics Event: ${eventName}`, params);
    }
}

// Initialize the QR code generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QRCodeGenerator();
    
    // Add some demo text to get started
    const demoTexts = [
        'https://example.com',
        'QR Code Proへようこそ！',
        'tel:03-1234-5678',
        'mailto:info@example.com'
    ];
    
    document.getElementById('text-input').placeholder = demoTexts[Math.floor(Math.random() * demoTexts.length)];
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.stat-item, .pricing-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}); 