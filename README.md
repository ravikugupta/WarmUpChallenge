<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nexus Intelligence - WarmUpChallenge

This is a React application powered by the Gemini AI API and Supabase for data management.

View your app in AI Studio: https://ai.studio/apps/2c266ca3-4f14-4176-beaf-0968a43f36f7

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Environment Variables

This project requires the following environment variables:

- `VITE_GEMINI_API_KEY` - Your Gemini API key from [ai.google.dev](https://ai.google.dev/)
- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file by copying from the template:
   ```bash
   cp .env.local.example .env.local
   ```

3. Fill in your environment variables in `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Docker Deployment

To build the Docker image with environment variables:

```bash
docker build \
  --build-arg VITE_GEMINI_API_KEY=your_key \
  --build-arg VITE_SUPABASE_URL=your_url \
  --build-arg VITE_SUPABASE_ANON_KEY=your_anon_key \
  -t nexus-app .
```

To run locally:

```bash
docker run -p 8080:8080 nexus-app
```

## Cloud Deployment (Google Cloud Build)

The `cloudbuild.yaml` file is configured to deploy to Cloud Run. Set the environment variables when triggering the build:

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_VITE_GEMINI_API_KEY=your_key,_VITE_SUPABASE_URL=your_url,_VITE_SUPABASE_ANON_KEY=your_anon_key
```

Or configure them in the Cloud Build trigger settings in the Google Cloud Console.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Clean the dist folder

