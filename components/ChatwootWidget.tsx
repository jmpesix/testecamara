'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    chatwootSettings: any;
    chatwootSDK: any;
  }
}

export default function ChatwootWidget() {
  useEffect(() => {
    const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;

    if (!websiteToken) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: 'pt_BR',
      type: 'standard',
    };

    (function(d, t) {
      const g: any = d.createElement(t), s: any = d.getElementsByTagName(t)[0];
      g.src = baseUrl + "/packs/js/sdk.js";
      g.defer = true;
      g.async = true;
      g.onload = function() {
        window.chatwootSDK.run({
          websiteToken: websiteToken,
          baseUrl: baseUrl
        });
      };
      s.parentNode.insertBefore(g, s);
    })(document, "script");
  }, []);

  return null;
}
