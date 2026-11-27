# Portfolio

A personal portfolio for Ahmad Amin Abdullah that brings projects, professional experience, skills, education, and certifications into one website. Visitors can explore published work and find contact information, while a private owner dashboard manages the content and generates tailored PDF CVs.

### Public portfolio

- Displays a personal introduction, biography, experience, skills, education, certifications, and contact links.
- Showcases projects with descriptions, technologies, cover images, and links to live demos and source repositories.
- Provides a dedicated page for each project with multiple screenshots.
- Opens project images in a full-screen viewer and shows skeleton placeholders while images load.
- Adapts to phones, tablets, and desktops, with sticky navigation between homepage sections.
- Displays published content while keeping drafts and deleted entries out of public pages.

### Owner dashboard

- Restricts access to the configured owner using Supabase authentication and multi-factor authentication.
- Creates, edits, publishes, arranges, and removes portfolio entries.
- Manages profile information, contact details, social links, and a profile photo.
- Uploads project covers and multiple screenshots, converting them to WebP images.
- Builds a CV from selected content, with adjustable section order and CV-specific wording.
- Downloads a PDF CV with selectable text, a single-column layout, and right-aligned dates.

## Technology

Built with Next.js App Router, React, and TypeScript. Supabase provides the database, authentication, and image storage. Sharp processes uploaded images, Zod validates input, and pdf-lib generates CV documents.

## Getting started

See [setup.md](setup.md) for configuration and [.env.example](.env.example) for the environment variables. After setup:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the public portfolio and `/admin` for the owner dashboard.

To preview on a phone connected to the same Wi-Fi, run `npm run dev -- --hostname 0.0.0.0` and open `http://YOUR-COMPUTER-IP:3000` on the phone.

## Checks and production build

```bash
npm run check
npm test
npm run build
npm run start
```
