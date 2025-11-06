import { MockData } from '@/types';

export const mockData: MockData = {
  folders: [
    {
      id: 'featured',
      name: 'Featured',
      type: 'folder',
      children: [
        {
          id: 'client-a',
          name: 'Client A',
          type: 'folder',
          items: [
            {
              id: '1',
              filename: 'work_01.jpg',
              thumb: 'https://picsum.photos/seed/1/400/400',
              full: 'https://picsum.photos/seed/1/1200/1600',
              date: '2025-01',
              dimensions: '3000x4000',
            },
            {
              id: '2',
              filename: 'work_02.jpg',
              thumb: 'https://picsum.photos/seed/2/400/400',
              full: 'https://picsum.photos/seed/2/1200/1600',
              date: '2025-01',
              dimensions: '3000x4000',
            },
          ],
        },
        { id: 'client-b', name: 'Client B', type: 'folder', items: [] },
      ],
    },
    {
      id: '2025',
      name: '2025',
      type: 'folder',
      items: [
        {
          id: '3',
          filename: 'work_03.jpg',
          thumb: 'https://picsum.photos/seed/3/400/400',
          full: 'https://picsum.photos/seed/3/1200/1600',
          date: '2025-02',
          dimensions: '3000x4000',
        },
        {
          id: '4',
          filename: 'work_04.jpg',
          thumb: 'https://picsum.photos/seed/4/400/400',
          full: 'https://picsum.photos/seed/4/1200/1600',
          date: '2025-02',
          dimensions: '3000x4000',
        },
      ],
    },
    { id: '2024', name: '2024', type: 'folder', items: [] },
  ],
  pages: [
    {
      id: 'about',
      name: 'About.txt',
      type: 'txt',
      content: `ABOUT
════════════════════════

Hi, I'm a freelance artist specializing in anime-style illustrations and character design.

I work with clients worldwide to bring their creative visions to life.

SKILLS:
- Character Design
- Illustration
- Concept Art
- Digital Painting`,
    },
    {
      id: 'contact',
      name: 'Contact.txt',
      type: 'txt',
      content: `CONTACT
════════════════════════

Email: hi@lum.bio

For commissions and inquiries, please reach out via email.

Response time: 1-2 business days`,
    },
  ],
  socials: [
    { name: 'Instagram', code: 'IG', url: '#' },
    { name: 'Twitter', code: 'TW', url: '#' },
    { name: 'Email', code: 'EM', url: 'mailto:hi@lum.bio' },
  ],
};
