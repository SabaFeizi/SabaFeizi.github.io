// Clickjacking protection for the admin panel. GitHub Pages cannot send the
// X-Frame-Options / frame-ancestors headers, so the CMS bundle is only loaded
// when this page is the top-level window. Inside a frame, nothing runs.
'use strict';
if (window.top === window.self) {
  const script = document.createElement('script');
  script.src = 'sveltia-cms.js';
  document.body.append(script);
} else {
  document.documentElement.textContent = 'The admin panel cannot be displayed inside a frame.';
}
