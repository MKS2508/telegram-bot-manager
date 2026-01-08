import { docs, docsEn } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

// Source para español (default)
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

// Source para inglés
export const sourceEn = loader({
  baseUrl: '/en/docs',
  source: docsEn.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}

export async function getRawMarkdownContent(
  page: InferPageType<typeof source> | InferPageType<typeof sourceEn>
) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
