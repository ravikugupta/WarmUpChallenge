# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_GEMINI_API_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables for the build
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Build the app to the dist folder
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app to the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
