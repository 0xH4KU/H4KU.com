# Lum.bio Portfolio

A modern, interactive portfolio website built with React, TypeScript, and Vite. Features a unique file-system inspired navigation interface with dark/light theme support.

## Features

### Core Features
- **File System Navigation**: Browse portfolio content through an intuitive folder/file interface
- **Dark/Light Theme**: Automatic theme detection with manual toggle support
- **Responsive Design**: Optimized for desktop and mobile viewing
- **URL Routing**: Deep linking support - all pages and folders have shareable URLs
- **Resizable Sidebar**: Customizable navigation panel width with persistent preferences

### Image Gallery
- **Image Lightbox**: Full-screen image viewer with gallery navigation
- **Keyboard Navigation**: Use arrow keys (←/→) to browse images, ESC to close
- **Image Counter**: See your position in the gallery (e.g., "3 / 10")
- **Error Handling**: Graceful fallback for failed image loads

### Search & Discovery
- **Quick Search**: Fast search across folders, images, and text files
- **Keyboard Navigation**: Navigate search results with arrow keys, Enter to select
- **Debounced Input**: Smooth, performant search experience

### Accessibility & UX
- **WCAG Compliant**: Focus indicators, skip links, and ARIA labels
- **Reduced Motion Support**: Respects user's motion preferences
- **Keyboard Friendly**: Full keyboard navigation support
- **Screen Reader Optimized**: Proper semantic HTML and ARIA attributes

### Developer Tools
- **Crosshair Tool**: Precise pixel alignment helper for designers

## Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.4.5
- **Build Tool**: Vite 7.1.12
- **Icons**: lucide-react
- **Styling**: CSS Modules (modular, scoped styles)
- **Routing**: React Router (client-side routing)
- **State Management**: React Context API + Custom Hooks

## Project Structure

```
src/
├── components/         # React components
│   ├── layout/        # Layout components (Sidebar, TopBar, StatusBar)
│   ├── content/       # Content display components
│   └── overlay/       # Modal/overlay components (Lightbox, Crosshair)
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── data/              # Static portfolio data
├── styles/            # CSS Modules
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── assets/            # Static assets (images, fonts)
```

## Getting Started

### Prerequisites

- Node.js 18+ or later
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-gitlab-repository-url>
cd lum.bio
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier

## 📝 Content Management

All content lives in the repository so you only need a text editor:

- **Pages**: `src/content/pages/*.md` (supports frontmatter + markdown body)
- **Folders**: `src/content/folders/*.json`
- **Works**: `src/content/works/*.json`
- **Social Links**: `src/content/socials/*.json`

Update these files directly and re-run `npm run dev` to preview changes. No external CMS or admin UI is required.

## Deployment

This project is configured for deployment on **Cloudflare Pages**.

### Deploy to Cloudflare Pages

1. Push your code to GitLab
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Create a new project and connect your GitLab repository
4. Use the following build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Environment variables**: Set EmailJS variables in Cloudflare Pages settings

The site will automatically deploy on every push to the main branch.

### Manual Deployment

You can also deploy manually using Wrangler:

```bash
npm run build
npx wrangler pages deploy dist
```

## Development Guidelines

Please read the following documents for development guidelines:

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Code standards and contribution guidelines
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Detailed architecture and development patterns
- **[agent.md](./agent.md)** - AI collaboration guidelines

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## License

All rights reserved.

## Contact

For questions or feedback, please open an issue on GitLab.
