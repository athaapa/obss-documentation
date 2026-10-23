// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  vite: { optimizeDeps: { include: ['mermaid'] } },
  integrations: [
    starlight({
      title: 'SARP OBSS',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/sarp-uw/titan' },
      ],
      components: {
        MarkdownContent: './src/components/MarkdownContent.astro',
        SocialIcons: './src/components/SocialIcons.astro',
      },
      customCss: ['./src/styles/custom.css'],
      logo: {
        src: './src/assets/sarp-logo-header.webp',
        alt: 'SARP logo',
      },
      description: 'University of Washington SARP flight computer software documentation.',
      sidebar: [
        { label: 'Overview', slug: 'overview' },
        {
          label: 'Architecture',
          items: [
            { slug: 'architecture' },
            {
              label: 'Application',
              items: [
                { slug: 'architecture/application' },
                { slug: 'architecture/application/state-machine' },
              ],
            },
            { label: 'Device', items: [{ autogenerate: { directory: 'architecture/device' } }] },
            {
              label: 'Peripheral',
              items: [
                { slug: 'architecture/peripheral' },
                { slug: 'architecture/peripheral/dma' },
                { slug: 'architecture/peripheral/errc' },
                { slug: 'architecture/peripheral/flash' },
                { slug: 'architecture/peripheral/gpio' },
                { slug: 'architecture/peripheral/i2c' },
                { slug: 'architecture/peripheral/mutex' },
                { slug: 'architecture/peripheral/pwm' },
                { slug: 'architecture/peripheral/qspi' },
                { slug: 'architecture/peripheral/spi' },
                { slug: 'architecture/peripheral/systick' },
                { slug: 'architecture/peripheral/thread' },
                { slug: 'architecture/peripheral/uart' },
                { slug: 'architecture/peripheral/watchdog' },
              ],
            },
          ],
        },
        {
          label: 'Fundamentals',
          items: [{ autogenerate: { directory: 'architecture/peripheral/fundamentals' } }],
        },
        { label: 'Internals', items: [{ autogenerate: { directory: 'internals' } }], collapsed: true },
        { label: 'How-to guides', items: [{ autogenerate: { directory: 'how-to' } }] },
      ],
    }),
  ],
});
