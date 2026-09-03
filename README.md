# Hospl - AI Clinic Management Software

A modern React + Tailwind CSS landing page for Hospl, an AI-powered clinic management platform.

## Features

- **AI-powered clinic management** - Automate appointment booking, customer communication, and payments
- **Responsive design** - Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI** - Built with React and Tailwind CSS for a professional look
- **Fast performance** - Optimized with Vite for quick development and production builds

## Project Structure

```
src/
├── components/
│   ├── layout/           # Navigation and footer components
│   ├── ui/              # Reusable UI components (Button, Badge, etc.)
│   └── landing/         # Landing page sections (Hero, Features, CTA)
├── constants/           # Colors and content constants
├── pages/              # Page components
├── App.jsx             # Main app component
├── main.jsx            # React entry point
└── index.css           # Global styles with Tailwind
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will open automatically in your browser at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## Technologies

- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next generation frontend build tool
- **PostCSS** - CSS processing

## Color Palette

- Primary Color: `#1ab2a6` (Teal)
- Primary Hover: `#169d92`
- Surface: `#f8f9ff` (Light Blue)
- Text Main: `#0f172a` (Dark Slate)
- Text Muted: `#475569` (Slate)

## License

© 2024 Hospl. All rights reserved.
# CareS frontend

## Kiểm tra trước khi hợp nhất

```powershell
npm run check
```

Lệnh này lần lượt kiểm tra ESLint, file/import/dependency không còn sử dụng và build production.
