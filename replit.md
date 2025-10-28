# JTBC Marathon Runner Tracking Application

## Overview

A real-time marathon runner tracking application designed for the JTBC Marathon event (November 2, 2025). The application allows users to search for runners by bib number and view their live position on an interactive map along with detailed progress metrics. Built with a mobile-first approach optimized for Korean users at the race venue.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript as the primary frontend framework
- Vite for development server and production builds
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component System**
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom theme configuration
- "New York" style variant selected for component aesthetics
- Custom color system using HSL variables for light/dark mode support

**State Management**
- TanStack Query (React Query) for server state management and data fetching
- Auto-refresh mechanism with 30-second intervals for live tracking updates
- Local state management with React hooks for UI interactions
- localStorage for persisting recent search history (up to 3 recent searches)

**Design System**
- Mobile-first responsive design approach
- Korean-optimized typography using 'Noto Sans KR' and 'Roboto Mono' fonts
- Athletic/professional design aesthetic inspired by premium sports tracking apps
- Custom spacing system based on Tailwind units (2, 4, 6, 8, 12)

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- HTTP server for handling API requests and serving static assets
- Custom logging middleware for request/response tracking

**API Design**
- RESTful API endpoint: `/api/runner/:bibNumber`
- Web scraping approach using Axios and Cheerio to fetch runner data
- No database persistence - data fetched on-demand from external source
- Response format follows shared schema validation with Zod

**Data Processing**
- Real-time calculation of runner positions based on checkpoint progress
- Interpolation of GPS coordinates between predefined course checkpoints
- Seoul Marathon course mapped with 11 key checkpoints (start to finish)
- Time and distance parsing with null-safe handling for incomplete data

### External Dependencies

**Third-Party Libraries**
- **Leaflet.js**: Interactive map rendering with OpenStreetMap tiles
- **Axios**: HTTP client for web scraping race data
- **Cheerio**: HTML parsing for extracting runner information from source
- **date-fns**: Date and time manipulation utilities

**External Services**
- OpenStreetMap tile server for map visualization
- Google Fonts CDN for Korean and monospace typography
- Neon Database (PostgreSQL) infrastructure provisioned but not actively used in current implementation

**UI Component Dependencies**
- Radix UI primitives: 20+ component packages for accessible UI elements
- class-variance-authority: Type-safe component variant management
- cmdk: Command palette component
- React Hook Form with Zod resolvers for form validation

### Database Schema

**Schema Definition**
- Drizzle ORM configured with PostgreSQL dialect
- Database URL environment variable required for connection
- Schema file location: `shared/schema.ts`
- Migration output directory: `./migrations`

**Data Models**
- Runner schema with Zod validation (no persistent storage currently used)
- User schema defined but implemented with in-memory storage (MemStorage class)
- Recent search tracking handled client-side via localStorage

**Note**: While database infrastructure is configured, the current implementation uses web scraping and in-memory storage rather than persistent database operations. The database may be integrated for future features such as caching runner data or storing user preferences.