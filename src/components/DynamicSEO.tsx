import React, { useEffect } from 'react';
import { useChat } from '../context/ChatContext';

/**
 * DynamicSEO Component
 * Dynamically injects and manages document head metadata, OpenGraph tags,
 * Twitter cards, Google verification, and Schema.org JSON-LD structured data
 * based on current view (landing, rooms, active room) and site settings.
 */
export const DynamicSEO: React.FC = () => {
  const { currentView, currentRoom, siteSettings, rooms } = useChat();

  useEffect(() => {
    // 1. Determine dynamic title, description, and canonical URL
    const defaultTitle = siteSettings?.seoTitle || siteSettings?.siteName || 'شات اليمن المطور | منصة الدردشة العربية الأولى';
    const defaultDesc = siteSettings?.seoDescription || siteSettings?.landingSubtitle || 'شات اليمن المطور - أفضل موقع شات عربي ومحادثات يمنية وعربية مباشرة بدون تسجيل. غرف دردشة عامة وخاصة، مكالمات صوتية، وراديو تفاعلي.';
    const defaultKeywords = siteSettings?.seoKeywords || 'شات اليمن المطور, شات اليمن, دردشة اليمن, شات عربي, شات صنعاء, شات عدن, شات تعز, غرف دردشة صوتية, دردشة كتابية بدون تسجيل';
    const baseUrl = siteSettings?.seoCanonicalUrl || window.location.origin;

    let pageTitle = defaultTitle;
    let pageDesc = defaultDesc;
    let pageKeywords = defaultKeywords;
    let pageUrl = baseUrl;
    let schemaType = 'WebSite';
    let schemaData: any = null;

    if (currentView === 'chat' && currentRoom && siteSettings?.enableDynamicRoomSEO !== false) {
      const roomFlag = currentRoom.flag ? ` ${currentRoom.flag}` : '';
      pageTitle = `غرفة ${currentRoom.name}${roomFlag} | ${defaultTitle}`;
      pageDesc = `انضم الآن لغرفة ${currentRoom.name} في شات اليمن المطور. ${currentRoom.description || 'دردشة جماعية تفاعلية وغرف محادثة صوتية وكتابية بدون تسجيل.'}`;
      pageKeywords = `غرفة ${currentRoom.name}, دردشة ${currentRoom.name}, ${defaultKeywords}`;
      pageUrl = `${baseUrl}/rooms/${encodeURIComponent(currentRoom.id)}`;
      schemaType = 'ChatApplication';

      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': `غرفة ${currentRoom.name} - شات اليمن المطور`,
        'applicationCategory': 'CommunicationApplication',
        'operatingSystem': 'All',
        'url': pageUrl,
        'description': pageDesc,
        'inLanguage': 'ar',
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'ratingCount': '1250'
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        }
      };
    } else if (currentView === 'rooms') {
      pageTitle = `قائمة غرف الدردشة العامة والخاصة | ${defaultTitle}`;
      pageDesc = `اختر غرفتك المفضلة في شات اليمن المطور (العامة، صنعاء، عدن، تعز، حضرموت، والمزيد) ودردش مباشرة بدون تسجيل.`;
      pageKeywords = `غرف شات اليمن, غرف الدردشة اليمنية, شات اليمن المطور, ${defaultKeywords}`;
      pageUrl = `${baseUrl}/rooms`;
      schemaType = 'CollectionPage';

      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'قائمة غرف شات اليمن المطور',
        'url': pageUrl,
        'description': pageDesc,
        'mainEntity': {
          '@type': 'ItemList',
          'itemListElement': (rooms || []).map((r, idx) => ({
            '@type': 'ListItem',
            'position': idx + 1,
            'name': `غرفة ${r.name} ${r.flag || ''}`,
            'description': r.description || `غرفة دردشة ${r.name} العامة`,
            'url': `${baseUrl}/rooms/${encodeURIComponent(r.id)}`
          }))
        }
      };
    } else {
      // Landing view
      pageTitle = defaultTitle;
      pageDesc = defaultDesc;
      pageKeywords = defaultKeywords;
      pageUrl = baseUrl;
      schemaType = 'WebSite';

      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'شات اليمن المطور',
        'alternateName': ['شات اليمن', 'دردشة اليمن', 'Yemen Chat'],
        'url': baseUrl,
        'description': pageDesc,
        'inLanguage': 'ar',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${baseUrl}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
    }

    // 2. Set document title
    document.title = pageTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attribute: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('name', 'description', pageDesc);
    setMetaTag('name', 'keywords', pageKeywords);
    setMetaTag('name', 'author', siteSettings?.seoAuthor || 'شات اليمن المطور');
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('name', 'googlebot', 'index, follow, max-snippet:-1, max-image-preview:large');

    // OpenGraph meta tags
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:url', pageUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'شات اليمن المطور');
    setMetaTag('property', 'og:locale', 'ar_YE');
    const ogImg = siteSettings?.seoOgImage ? (siteSettings.seoOgImage.startsWith('http') ? siteSettings.seoOgImage : `${baseUrl}${siteSettings.seoOgImage}`) : `${baseUrl}/owner_badge.svg`;
    setMetaTag('property', 'og:image', ogImg);

    // Twitter card meta tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDesc);
    setMetaTag('name', 'twitter:image', ogImg);

    // Canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', pageUrl);

    // Sitemap link tag
    let sitemapLink = document.querySelector('link[rel="sitemap"]') as HTMLLinkElement | null;
    if (!sitemapLink) {
      sitemapLink = document.createElement('link');
      sitemapLink.setAttribute('rel', 'sitemap');
      sitemapLink.setAttribute('type', 'application/xml');
      sitemapLink.setAttribute('title', 'Sitemap');
      document.head.appendChild(sitemapLink);
    }
    sitemapLink.setAttribute('href', `${baseUrl}/sitemap.xml`);

    // Google Site Verification (Search Console)
    if (siteSettings?.googleSiteVerification) {
      setMetaTag('name', 'google-site-verification', siteSettings.googleSiteVerification);
    }

    // Bing Webmaster Site Verification
    if (siteSettings?.bingSiteVerification) {
      setMetaTag('name', 'msvalidate.01', siteSettings.bingSiteVerification);
    }

    // Schema.org JSON-LD injection
    let jsonLdScript = document.getElementById('dynamic-schema-jsonld') as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'dynamic-schema-jsonld';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }
    if (schemaData) {
      jsonLdScript.text = JSON.stringify(schemaData);
    }
  }, [currentView, currentRoom, siteSettings, rooms]);

  return null; // Head-only dynamic injector
};
