/**
 * Cookie Consent Banner - GDPR Compliant
 * Impulse Driving School
 * Self-contained: creates its own DOM elements with inline styles
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'impulse_cookie_consent';
    var saved = localStorage.getItem(STORAGE_KEY);

    // If consent already given, apply preferences and exit
    if (saved) {
        try {
            var prefs = JSON.parse(saved);
            applyConsent(prefs);
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
        if (saved) return;
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        createBanner();
        createPreferencesModal();
        // Small delay for slide-up animation
        setTimeout(function() {
            var banner = document.getElementById('cookieConsentBanner');
            if (banner) banner.style.transform = 'translateY(0)';
        }, 500);
    }

    function createBanner() {
        var banner = document.createElement('div');
        banner.id = 'cookieConsentBanner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.style.cssText = [
            'position: fixed',
            'bottom: 0',
            'left: 0',
            'right: 0',
            'z-index: 99999',
            'background: #0a1628',
            'color: #fff',
            'padding: 1.25rem 1.5rem',
            'box-shadow: 0 -4px 20px rgba(0,0,0,0.3)',
            'transform: translateY(100%)',
            'transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            'font-family: Inter, sans-serif',
            'border-top: 3px solid #1a73e8'
        ].join(';');

        var container = document.createElement('div');
        container.style.cssText = [
            'max-width: 1200px',
            'margin: 0 auto',
            'display: flex',
            'align-items: center',
            'justify-content: space-between',
            'gap: 1.5rem',
            'flex-wrap: wrap'
        ].join(';');

        var textDiv = document.createElement('div');
        textDiv.style.cssText = 'flex: 1; min-width: 280px;';
        textDiv.innerHTML = '<p style="margin:0 0 0.25rem;font-size:0.95rem;line-height:1.6;color:rgba(255,255,255,0.85);">' +
            'We use cookies to enhance your browsing experience, analyse site traffic, and personalise content. ' +
            'By clicking "Accept All", you consent to our use of cookies. ' +
            '<a href="' + getPrivacyLink() + '" style="color:#4fc3f7;text-decoration:underline;">Read our Privacy Policy</a></p>';

        var buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = [
            'display: flex',
            'gap: 0.75rem',
            'flex-wrap: wrap',
            'flex-shrink: 0'
        ].join(';');

        var btnAccept = createButton('Accept All', '#1a73e8', '#fff', function() {
            saveConsent({ essential: true, analytics: true, marketing: true });
        });

        var btnReject = createButton('Reject Non-Essential', 'transparent', '#fff', function() {
            saveConsent({ essential: true, analytics: false, marketing: false });
        });
        btnReject.style.border = '1px solid rgba(255,255,255,0.3)';

        var btnManage = createButton('Manage Preferences', 'transparent', 'rgba(255,255,255,0.7)', function() {
            var modal = document.getElementById('cookiePreferencesModal');
            if (modal) modal.style.display = 'flex';
        });
        btnManage.style.border = 'none';
        btnManage.style.textDecoration = 'underline';
        btnManage.style.padding = '0.5rem 0.75rem';

        buttonsDiv.appendChild(btnAccept);
        buttonsDiv.appendChild(btnReject);
        buttonsDiv.appendChild(btnManage);

        container.appendChild(textDiv);
        container.appendChild(buttonsDiv);
        banner.appendChild(container);
        document.body.appendChild(banner);
    }

    function createPreferencesModal() {
        var overlay = document.createElement('div');
        overlay.id = 'cookiePreferencesModal';
        overlay.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: 0',
            'right: 0',
            'bottom: 0',
            'z-index: 100000',
            'background: rgba(0,0,0,0.6)',
            'display: none',
            'align-items: center',
            'justify-content: center',
            'padding: 1rem',
            'font-family: Inter, sans-serif'
        ].join(';');

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.style.display = 'none';
        });

        var modal = document.createElement('div');
        modal.style.cssText = [
            'background: #fff',
            'border-radius: 12px',
            'max-width: 500px',
            'width: 100%',
            'max-height: 90vh',
            'overflow-y: auto',
            'padding: 2rem',
            'box-shadow: 0 20px 60px rgba(0,0,0,0.3)'
        ].join(';');

        var title = document.createElement('h3');
        title.style.cssText = 'font-family: "Plus Jakarta Sans", sans-serif; font-size: 1.35rem; font-weight: 700; color: #0a1628; margin: 0 0 0.5rem;';
        title.textContent = 'Cookie Preferences';

        var desc = document.createElement('p');
        desc.style.cssText = 'font-size: 0.9rem; color: #64748b; line-height: 1.6; margin: 0 0 1.5rem;';
        desc.textContent = 'Choose which cookies you want to allow. Essential cookies are always active as they are necessary for the website to function properly.';

        modal.appendChild(title);
        modal.appendChild(desc);

        // Cookie categories
        var categories = [
            {
                id: 'essential',
                name: 'Essential Cookies',
                desc: 'Required for the website to function. These cannot be disabled.',
                locked: true,
                checked: true
            },
            {
                id: 'analytics',
                name: 'Analytics Cookies',
                desc: 'Help us understand how visitors use our website so we can improve it.',
                locked: false,
                checked: false
            },
            {
                id: 'marketing',
                name: 'Marketing Cookies',
                desc: 'Used to deliver relevant advertisements and measure campaign effectiveness.',
                locked: false,
                checked: false
            }
        ];

        var toggles = {};

        categories.forEach(function(cat) {
            var item = document.createElement('div');
            item.style.cssText = 'border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;';

            var header = document.createElement('div');
            header.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';

            var nameEl = document.createElement('div');
            nameEl.innerHTML = '<strong style="font-size: 0.95rem; color: #0a1628;">' + cat.name + '</strong>';

            var toggle = document.createElement('label');
            toggle.style.cssText = [
                'position: relative',
                'display: inline-block',
                'width: 44px',
                'height: 24px',
                'cursor: ' + (cat.locked ? 'not-allowed' : 'pointer')
            ].join(';');

            var input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = cat.checked;
            input.disabled = cat.locked;
            input.style.cssText = 'opacity: 0; width: 0; height: 0;';
            toggles[cat.id] = input;

            var slider = document.createElement('span');
            var activeColor = '#1a73e8';
            var inactiveColor = cat.locked ? '#1a73e8' : '#cbd5e1';
            slider.style.cssText = [
                'position: absolute',
                'top: 0',
                'left: 0',
                'right: 0',
                'bottom: 0',
                'background: ' + (input.checked ? activeColor : inactiveColor),
                'border-radius: 24px',
                'transition: background 0.3s'
            ].join(';');

            var circle = document.createElement('span');
            circle.style.cssText = [
                'position: absolute',
                'height: 18px',
                'width: 18px',
                'left: ' + (input.checked ? '23px' : '3px'),
                'bottom: 3px',
                'background: #fff',
                'border-radius: 50%',
                'transition: left 0.3s'
            ].join(';');

            if (!cat.locked) {
                input.addEventListener('change', function() {
                    slider.style.background = input.checked ? activeColor : inactiveColor;
                    circle.style.left = input.checked ? '23px' : '3px';
                });
            }

            slider.appendChild(circle);
            toggle.appendChild(input);
            toggle.appendChild(slider);

            header.appendChild(nameEl);
            header.appendChild(toggle);

            var descEl = document.createElement('p');
            descEl.style.cssText = 'margin: 0.5rem 0 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;';
            descEl.textContent = cat.desc;

            item.appendChild(header);
            item.appendChild(descEl);
            modal.appendChild(item);
        });

        // Modal buttons
        var modalBtns = document.createElement('div');
        modalBtns.style.cssText = 'display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap;';

        var saveBtn = createButton('Save Preferences', '#1a73e8', '#fff', function() {
            saveConsent({
                essential: true,
                analytics: toggles.analytics.checked,
                marketing: toggles.marketing.checked
            });
        });
        saveBtn.style.flex = '1';
        saveBtn.style.minWidth = '140px';
        saveBtn.style.justifyContent = 'center';

        var acceptAllBtn = createButton('Accept All', '#0a1628', '#fff', function() {
            saveConsent({ essential: true, analytics: true, marketing: true });
        });
        acceptAllBtn.style.flex = '1';
        acceptAllBtn.style.minWidth = '140px';
        acceptAllBtn.style.justifyContent = 'center';

        modalBtns.appendChild(saveBtn);
        modalBtns.appendChild(acceptAllBtn);
        modal.appendChild(modalBtns);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function createButton(text, bg, color, onClick) {
        var btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = [
            'background: ' + bg,
            'color: ' + color,
            'border: none',
            'padding: 0.65rem 1.25rem',
            'border-radius: 6px',
            'font-size: 0.85rem',
            'font-weight: 600',
            'cursor: pointer',
            'transition: all 0.3s ease',
            'font-family: Inter, sans-serif',
            'white-space: nowrap',
            'display: inline-flex',
            'align-items: center'
        ].join(';');
        btn.addEventListener('click', onClick);
        btn.addEventListener('mouseenter', function() {
            btn.style.opacity = '0.9';
            btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', function() {
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0)';
        });
        return btn;
    }

    function saveConsent(prefs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        applyConsent(prefs);
        hideBanner();
    }

    function applyConsent(prefs) {
        // Block or allow analytics cookies
        if (prefs.analytics) {
            window.impulse_analytics_consent = true;
        } else {
            window.impulse_analytics_consent = false;
        }

        // Block or allow marketing cookies
        if (prefs.marketing) {
            window.impulse_marketing_consent = true;
        } else {
            window.impulse_marketing_consent = false;
        }
    }

    function hideBanner() {
        var banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.style.transform = 'translateY(100%)';
            setTimeout(function() {
                if (banner.parentNode) banner.parentNode.removeChild(banner);
            }, 500);
        }
        var modal = document.getElementById('cookiePreferencesModal');
        if (modal) {
            modal.style.display = 'none';
            setTimeout(function() {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
            }, 500);
        }
    }

    function getPrivacyLink() {
        // Detect if we're in the pages/ directory or root
        var path = window.location.pathname;
        if (path.indexOf('/pages/') !== -1) {
            return 'privacy.html';
        }
        return 'pages/privacy.html';
    }
})();