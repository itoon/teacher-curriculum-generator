# Teacher Curriculum Generator

A modern web application that helps teachers generate curriculum plans and exams for K-12 education. Built with Next.js, Tailwind CSS, and powered by AI through OpenRouter.

## Features

- Generate detailed curriculum plans for any subject and grade level
- Create custom exams based on learning objectives
- Modern, responsive UI with Tailwind CSS
- Markdown rendering for curriculum and exam content
- Card-based display for weekly curriculum content

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons
- **Styling**: Tailwind CSS, CSS Modules
- **AI Integration**: OpenRouter API (Claude, GPT-4)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenRouter API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
4. Add your OpenRouter API key to `.env.local`

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

The application is configured for easy deployment to Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set the required environment variables in Vercel:
   - `OPEN_ROUTER_API_KEY`: Your OpenRouter API key
   - `OPEN_ROUTER_MODEL_NAME`: The model to use (e.g., `anthropic/claude-3-opus:beta`)

## Environment Variables

- `OPEN_ROUTER_API_KEY`: API key for OpenRouter
- `SITE_URL`: Your site URL (set automatically in Vercel)
- `OPEN_ROUTER_MODEL_NAME`: The AI model to use
- `USE_MOCK_DATA`: Set to "true" to use mock data in development

## License

MIT

## Project Structure

```
teacher-curriculum-generator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate-exam/
│   │   │       └── route.ts      # API endpoint for exam generation
│   │   ├── components/           # UI components
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main application page
│   └── lib/                      # Utility functions and types
├── public/                       # Static assets
├── .env.local                    # Environment variables (create this)
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [OpenRouter](https://openrouter.ai/)
