# N1AI : LinkedIn Outreach Assistant

## Overview

This is our first open source repository!

## Features

- 🔍 LinkedIn Profile Enrichment
- 🤖 AI-Powered Message Generation
- 📊 Customizable Message Styles
- 🌐 Multi-Language Support

## Prerequisites

- Node.js (v18 or later)
- npm or Yarn
- Active accounts:
  - Unipile
  - OpenAI
  - Google Custom Search

## Environment Setup

1. Clone the repository
```bash
git clone https://github.com/N1-AI/linkedin-message-generator.git 
cd linkedin-message-generator
```

2. Copy the example environment file
```bash
cp .env.example .env
```

3. Fill in the `.env` file with your credentials:

### Required Environment Variables
- `UNIPILE_API_KEY`: Your Unipile API key
- `UNIPILE_DSN`: Unipile Data Source Name, for example `https://api15.unipile.com:14522`
- `OPENAI_API_KEY`: OpenAI API key for AI-powered recommendations eg. `sk-proj12345`
- `GOOGLE_SEARCH_API_KEY`: Google Custom Search API key
- `GOOGLE_SEARCH_ENGINE_ID`: Google Custom Search Engine ID
(These can be found in your google developer window: `https://console.cloud.google.com/`)
If you are part of the N1AI community, the unipile API key is free! Get in touch with Nic or Myself for access

## Installation

```bash
npm install
# or
yarn install
```

## Running the Application

Development Mode:
```bash
npm run dev
# or
yarn dev
```

Production Build:
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Technologies

- Next.js 13
- React
- TypeScript
- Tailwind CSS
- Shadcn/ui
- OpenAI
- Unipile API

## Mobile Responsiveness

The application is fully responsive, with dedicated mobile layouts for:
- Home Page
- Playground
- Recommendation Generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.