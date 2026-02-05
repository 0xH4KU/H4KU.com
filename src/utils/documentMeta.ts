export type DocumentMeta = {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterCard?: string;
};

type MetaAttribute = 'name' | 'property';

const upsertMetaTag = (
  attribute: MetaAttribute,
  key: string,
  content: string
) => {
  if (typeof document === 'undefined') {
    return;
  }

  let meta = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`
  );

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
};

const upsertLinkTag = (rel: string, href: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
};

export const updateDocumentMeta = (meta: DocumentMeta) => {
  if (typeof document === 'undefined') {
    return;
  }

  const ogTitle = meta.ogTitle ?? meta.title;
  const ogDescription = meta.ogDescription ?? meta.description;
  const twitterTitle = meta.twitterTitle ?? ogTitle;
  const twitterDescription = meta.twitterDescription ?? ogDescription;
  const twitterCard = meta.twitterCard ?? 'summary_large_image';
  const ogType = meta.ogType ?? 'website';

  document.title = meta.title;

  upsertMetaTag('name', 'title', meta.title);
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('property', 'og:title', ogTitle);
  upsertMetaTag('property', 'og:description', ogDescription);
  upsertMetaTag('property', 'og:image', meta.image);
  upsertMetaTag('property', 'og:url', meta.url);
  upsertMetaTag('property', 'og:type', ogType);
  if (meta.siteName) {
    upsertMetaTag('property', 'og:site_name', meta.siteName);
  }

  upsertMetaTag('name', 'twitter:title', twitterTitle);
  upsertMetaTag('name', 'twitter:description', twitterDescription);
  upsertMetaTag('name', 'twitter:image', meta.image);
  upsertMetaTag('name', 'twitter:url', meta.url);
  upsertMetaTag('name', 'twitter:card', twitterCard);

  upsertLinkTag('canonical', meta.url);
};
