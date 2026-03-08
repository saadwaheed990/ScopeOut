/**
 * WhatsApp Floating Widget
 * Impulse Driving School
 * Self-contained: creates its own DOM elements with inline styles
 */
(function() {
    'use strict';

    var WHATSAPP_NUMBER = '447368543368';
    var DEFAULT_MESSAGE = encodeURIComponent('Hi! I\'d like to enquire about driving lessons.');
    var WHATSAPP_URL = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + DEFAULT_MESSAGE;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Remove the existing static WhatsApp float button if present
        var existing = document.querySelector('.whatsapp-float');
        if (existing) existing.parentNode.removeChild(existing);

        createWidget();
        injectStyles();
    }

    function injectStyles() {
        var style = document.createElement('style');
        style.textContent = [
            '@keyframes impulseWhatsappPulse {',
            '  0% { box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4); }',
            '  50% { box-shadow: 0 4px 30px rgba(37, 211, 102, 0.6), 0 0 0 15px rgba(37, 211, 102, 0); }',
            '  100% { box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4); }',
            '}',
            '@keyframes impulseWhatsappBounce {',
            '  0%, 100% { transform: scale(1); }',
            '  50% { transform: scale(1.05); }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function createWidget() {
        // Container
        var container = document.createElement('div');
        container.id = 'impulseWhatsappWidget';
        container.style.cssText = [
            'position: fixed',
            'bottom: 24px',
            'right: 24px',
            'z-index: 9999',
            'display: flex',
            'flex-direction: column',
            'align-items: flex-end',
            'gap: 8px'
        ].join(';');

        // Tooltip
        var tooltip = document.createElement('div');
        tooltip.id = 'impulseWhatsappTooltip';
        tooltip.textContent = 'Chat with us on WhatsApp';
        tooltip.style.cssText = [
            'background: #fff',
            'color: #0a1628',
            'padding: 8px 14px',
            'border-radius: 8px',
            'font-family: Inter, sans-serif',
            'font-size: 0.85rem',
            'font-weight: 500',
            'box-shadow: 0 4px 15px rgba(0,0,0,0.15)',
            'white-space: nowrap',
            'opacity: 0',
            'transform: translateX(10px)',
            'transition: all 0.3s ease',
            'pointer-events: none',
            'position: relative'
        ].join(';');

        // Tooltip arrow
        var arrow = document.createElement('div');
        arrow.style.cssText = [
            'position: absolute',
            'bottom: -6px',
            'right: 26px',
            'width: 12px',
            'height: 12px',
            'background: #fff',
            'transform: rotate(45deg)',
            'box-shadow: 3px 3px 5px rgba(0,0,0,0.05)'
        ].join(';');
        tooltip.appendChild(arrow);

        // Button
        var button = document.createElement('a');
        button.href = WHATSAPP_URL;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.setAttribute('aria-label', 'Chat with us on WhatsApp');
        button.style.cssText = [
            'display: flex',
            'align-items: center',
            'justify-content: center',
            'width: 60px',
            'height: 60px',
            'background: #25D366',
            'border-radius: 50%',
            'color: #fff',
            'font-size: 1.75rem',
            'text-decoration: none',
            'cursor: pointer',
            'transition: all 0.3s ease',
            'animation: impulseWhatsappPulse 2s ease-in-out infinite, impulseWhatsappBounce 3s ease-in-out infinite'
        ].join(';');

        // Icon - use FA if loaded, otherwise use SVG
        var icon = document.createElement('i');
        icon.className = 'fab fa-whatsapp';
        icon.style.cssText = 'font-size: 1.75rem; line-height: 1;';
        button.appendChild(icon);

        // Hover events
        button.addEventListener('mouseenter', function() {
            button.style.background = '#20bd5a';
            button.style.transform = 'scale(1.1)';
            button.style.animationPlayState = 'paused';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(0)';
        });

        button.addEventListener('mouseleave', function() {
            button.style.background = '#25D366';
            button.style.transform = 'scale(1)';
            button.style.animationPlayState = 'running';
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateX(10px)';
        });

        container.appendChild(tooltip);
        container.appendChild(button);
        document.body.appendChild(container);

        // Mobile responsive: slightly smaller on mobile
        var mq = window.matchMedia('(max-width: 768px)');
        function handleMobile(e) {
            if (e.matches) {
                button.style.width = '52px';
                button.style.height = '52px';
                icon.style.fontSize = '1.5rem';
                container.style.bottom = '18px';
                container.style.right = '18px';
            } else {
                button.style.width = '60px';
                button.style.height = '60px';
                icon.style.fontSize = '1.75rem';
                container.style.bottom = '24px';
                container.style.right = '24px';
            }
        }
        if (mq.addEventListener) {
            mq.addEventListener('change', handleMobile);
        } else {
            mq.addListener(handleMobile);
        }
        handleMobile(mq);
    }
})();