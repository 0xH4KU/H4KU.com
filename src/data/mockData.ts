import { MockData } from '@/types';

export const mockData: MockData = {
  folders: [
    {
      id: 'featured',
      name: 'featured',
      type: 'folder',
      children: [
        {
          id: 'featured-2025',
          name: '2025',
          type: 'folder',
        },
      ],
    },
    {
      id: 'sketches',
      name: 'sketches',
      type: 'folder',
      children: [
        {
          id: 'sketches-2025',
          name: '2025',
          type: 'folder',
        },
      ],
    },
  ],
  pages: [
    {
      id: 'about',
      name: 'About.txt',
      type: 'txt',
      content: `ABOUT
════════════════════════

Lum (@lummuu_)
Freelance illustrator

Anime-style illustrations
Character design
Digital art

Available for commissions`,
    },
    {
      id: 'contact',
      name: 'Contact.txt',
      type: 'txt',
      content: `CONTACT
════════════════════════

Email: hi@lum.bio

For commissions and inquiries,
please reach out via email or
use the contact form.

Response time: 1-2 business days`,
    },
  ],
  socials: [
    { name: 'Instagram', code: 'IG', url: 'https://instagram.com/lummuu_' },
    { name: 'Twitter', code: 'TW', url: 'https://twitter.com/lummuu_' },
    { name: 'Email', code: 'EM', url: 'mailto:hi@lum.bio' },
  ],
};
