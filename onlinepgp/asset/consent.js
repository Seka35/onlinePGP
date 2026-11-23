// Lightweight Google Consent Mode v2 Banner
// TODO: Enable Google's certified CMP (Privacy & messaging) in Google AdSense for EEA/UK traffic.
(function () {
    const STORAGE_KEY = 'onlinepgp_consent_v2';

    function applyConsent(granted) {
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                ad_storage: granted ? 'granted' : 'denied',
                ad_user_data: granted ? 'granted' : 'denied',
                ad_personalization: granted ? 'granted' : 'denied',
                analytics_storage: granted ? 'granted' : 'denied'
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'granted') {
            applyConsent(true);
            return;
        }
        if (saved === 'denied') {
            applyConsent(false);
            return;
        }

        const banner = document.getElementById('consent-banner');
        if (!banner) return;
        banner.style.display = 'block';

        const acceptBtn = document.getElementById('consent-accept');
        const rejectBtn = document.getElementById('consent-reject');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', function () {
                localStorage.setItem(STORAGE_KEY, 'granted');
                applyConsent(true);
                banner.style.display = 'none';
            });
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function () {
                localStorage.setItem(STORAGE_KEY, 'denied');
                applyConsent(false);
                banner.style.display = 'none';
            });
        }
    });
})();
