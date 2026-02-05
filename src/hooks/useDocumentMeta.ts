import { useEffect, useMemo } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { PAGE_IDS, ROUTES } from '@/config/routes';
import { DEFAULT_META } from '@/config/seo';
import { buildAppUrl, buildFolderUrl, buildPageUrl } from '@/utils/urlHelpers';
import { updateDocumentMeta, type DocumentMeta } from '@/utils/documentMeta';

const normalizeText = (value?: string | null) => value?.trim() ?? '';

const buildDescription = (value: string | undefined, fallback: string) => {
  const normalized = value ? normalizeText(value) : '';
  if (!normalized) {
    return fallback;
  }
  if (normalized.length <= 160) {
    return normalized;
  }
  return `${normalized.slice(0, 157)}...`;
};

const withBrand = (title: string) =>
  title ? `${title} | ${DEFAULT_META.title}` : DEFAULT_META.title;

const toAbsoluteUrl = (value: string | undefined | null) => {
  if (!value) {
    return null;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return buildAppUrl(normalized);
};

export const useDocumentMeta = () => {
  const { currentView, currentPath } = useNavigation();
  const { lightboxImage } = useLightbox();

  const meta = useMemo<DocumentMeta>(() => {
    const defaultUrl = buildAppUrl('/');
    const defaultImage = buildAppUrl(DEFAULT_META.ogImagePath);
    const baseMeta: DocumentMeta = {
      title: DEFAULT_META.title,
      description: DEFAULT_META.description,
      url: defaultUrl,
      image: defaultImage,
      siteName: DEFAULT_META.siteName,
      ogTitle: DEFAULT_META.ogTitle,
      ogDescription: DEFAULT_META.ogDescription,
      twitterTitle: DEFAULT_META.ogTitle,
      twitterDescription: DEFAULT_META.ogDescription,
    };

    if (lightboxImage && lightboxImage.itemType === 'work') {
      const title = normalizeText(lightboxImage.title) || lightboxImage.filename;
      const description = buildDescription(
        lightboxImage.description,
        DEFAULT_META.description
      );
      const imageUrl =
        toAbsoluteUrl(lightboxImage.full) ??
        toAbsoluteUrl(lightboxImage.thumb) ??
        defaultImage;
      const folderPath = currentPath.slice(1);
      const url = folderPath.length ? buildFolderUrl(folderPath) : defaultUrl;

      return {
        ...baseMeta,
        title: withBrand(title),
        ogTitle: title,
        twitterTitle: title,
        description,
        ogDescription: description,
        twitterDescription: description,
        image: imageUrl,
        url,
      };
    }

    if (currentView?.type === 'txt') {
      const title = normalizeText(currentView.data.name);
      const description = buildDescription(
        currentView.data.content,
        DEFAULT_META.description
      );
      const url =
        currentView.data.id === PAGE_IDS.CONTACT_VERIFY
          ? buildAppUrl(ROUTES.CONTACT_VERIFY)
          : buildPageUrl(currentView.data.id);

      return {
        ...baseMeta,
        title: withBrand(title),
        ogTitle: title,
        twitterTitle: title,
        description,
        ogDescription: description,
        twitterDescription: description,
        url,
      };
    }

    if (currentView?.type === 'folder') {
      const title = normalizeText(currentView.data.name);
      const description = buildDescription(
        currentView.data.description,
        `Browse ${title} in HAKU's portfolio.`
      );
      const folderPath = currentPath.slice(1);
      const url = folderPath.length ? buildFolderUrl(folderPath) : defaultUrl;

      return {
        ...baseMeta,
        title: withBrand(title),
        ogTitle: title,
        twitterTitle: title,
        description,
        ogDescription: description,
        twitterDescription: description,
        url,
      };
    }

    return baseMeta;
  }, [currentPath, currentView, lightboxImage]);

  useEffect(() => {
    updateDocumentMeta(meta);
  }, [meta]);
};
