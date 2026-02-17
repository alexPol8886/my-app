# CircleSync - Social Coordination Platform MVP

CircleSync is a social coordination platform designed to eliminate the chaos of group planning. It features group coordination through "Circles", event coordination, and a **Crowdsourced Lift Engine** that allows users to offer rides and join rides within events with atomic operations to prevent overbooking.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **UI Components**: Shadcn/UI (built on Radix UI)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Real-time, Edge Functions)
- **State Management**: TanStack Query (React Query) for data fetching and caching
- **Form Validation**: Zod with React Hook Form integration
- **Design**: Mobile-first, dark-mode (Glassmorphism aesthetic)

## 📋 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (signin, signup)
│   ├── circles/           # Circle pages
│   ├── calendar/          # Calendar view
│   ├── profile/           # User profile page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── bottom-nav.tsx     # Bottom navigation bar
│   ├── auth-*.tsx         # Auth form components
│   ├── protected-layout.tsx # Auth protection wrapper
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   ├── useCircles.ts      # Circle management hooks
│   ├── useEvents.ts       # Event management hooks
│   └── useRides.ts        # Ride/Lift engine hooks
├── lib/                   # Library and utilities
│   ├── supabase.ts        # Supabase client
│   ├── supabase-server.ts # Server-side Supabase client
│   ├── database.types.ts  # Auto-generated database types
│   ├── validations.ts     # Zod validation schemas
│   └── utils.ts           # Utility functions
├── providers/             # Context providers
│   └── query-provider.tsx # TanStack Query provider
└── types/                 # TypeScript type definitions
    └── index.ts           # Domain types

supabase/
└── migrations/
    └── 001_init_schema.sql # Initial database schema
```

## 📦 Core Features

### 1. **Authentication**
- Email/password signup and signin
- Automatic profile creation on signup
- Secure session management with Supabase Auth

### 2. **Circle Management**
- Create private groups (circles) with descriptions
- Share via unique 8-character invite codes
- Join circles with invite codes
- Member roles (admin/member)
- Display circle members

### 3. **Event Coordination**
- Create events within circles
- RSVP system (going/maybe/declined)
- Location tagging with lat/lng
- Event attendee tracking
- Time-based event ordering

### 4. **Crowdsourced Lift Engine** ⭐ (Core Feature)
- Users mark themselves as "going" to events
- Offer rides with customizable seat counts (1-8)
- View available rides with real-time seat counts
- Join rides with available seats
- **Atomic operations** prevent overbooking via Postgres RPC
- Real-time seat availability updates
- Pickup location tracking for each passenger
- Leave ride functionality

### 5. **User Interface**
- Bottom navigation bar (Home, Circles, Calendar, Profile)
- Mobile-first responsive design
- Dark mode with Glassmorphism aesthetic
- Loading states and error handling
- Form validation with user feedback

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account (create at https://supabase.com)

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Wait for the database to initialize
4. Go to Project Settings → API to get your credentials:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY`

### 2. Initialize Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open the file `supabase/migrations/001_init_schema.sql`
4. Copy the entire content and paste into the SQL editor
5. Click **"Run"** to execute the schema
6. Verify all tables and RLS policies are created

### 3. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### 4. Install Dependencies (if not done)

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Usage Guide

### Creating an Account
1. Navigate to the app home (you'll be redirected to signin)
2. Click **"Create one"** to go to signup
3. Enter email, password, and full name
4. Account and profile are automatically created
5. You'll be logged in and redirected to home

### Creating a Circle
1. From home page, click **"Create Circle"**
2. Enter circle name and optional description
3. Circle is created with a unique 8-character invite code
4. You're automatically added as an admin member
5. Share the invite code with others to let them join

### Joining a Circle
1. From home page, click **"Join Circle"**
2. Enter the 8-character invite code
3. You'll be added to the circle as a member
4. Circle appears in your "Your Circles" list

### Creating an Event
1. Navigate to a circle
2. Create a new event with:
   - Title
   - Optional description
   - Location name
   - Start time (must be in future)
   - Optional end time
3. Event appears in the circle's dashboard
4. You're automatically marked as the creator

### Using the Lift Engine

**If you're attending an event:**
1. Mark yourself as **"Going"** to the event
2. Two options appear:
   - **"Drive"**: Offer a ride to others
   - **"Need a Lift"**: Join an available ride

**If offering a ride:**
1. Enter your pickup location
2. Select number of available seats (1-8)
3. Ride is created and appears to other attendees
4. Other attendees can join your ride

**If joining a ride:**
1. View available rides for the event
2. Select a ride with available seats
3. Optionally enter your pickup location
4. Click **"Join Ride"**
5. Your spot is atomically reserved (no overbooking)

**Leaving a ride:**
1. Go to your joined rides
2. Click **"Leave"**
3. Your seat is returned to the driver's available pool

## 🔐 Security Features

1. **Row-Level Security (RLS)**: All tables enforce RLS policies
2. **Atomic Operations**: `join_ride()` and `leave_ride()` use Postgres transactions
3. **User Isolation**: Users only see data they have access to
4. **Auth Required**: Protected pages redirect unauthenticated users
5. **Valid Invite Codes**: Codes are checked before circle joining
6. **Event Validation**: Users can only create events in circles they're members of

## 📊 Database Schema Highlights

### Key Tables
- **profiles**: User data (full_name, avatar_url, home_location)
- **circles**: Group data with unique invite_code
- **circle_members**: Membership with role (admin/member)
- **events**: Event details with location and timestamps
- **event_attendees**: RSVP tracking (going/maybe/declined)
- **rides**: Ride offerings from drivers with seat counts
- **ride_passengers**: Passenger list with pickup locations

### RPC Functions (Atomic Operations)
```sql
join_ride(p_ride_id UUID, p_passenger_id UUID, p_pickup_location TEXT)
  -- Atomically adds passenger & decrements remaining_seats
  
leave_ride(p_ride_id UUID, p_passenger_id UUID)
  -- Atomically removes passenger & increments remaining_seats

generate_invite_code()
  -- Generates unique 8-character invite codes
```

## 🎯 Development Notes

### Architecture
- **Server Components** by default for data fetching
- **Client Components** for interactive features (`'use client'`)
- **React Query** caching with 5-min stale time
- **Zod** validation schemas for all forms

### Best Practices Implemented
1. Type-safe database queries
2. Real-time RLS policies
3. Optimistic updates with React Query
4. Form validation with user feedback
5. Loading & error states on all async operations
6. Mobile-responsive design patterns

### Database Indexes
All foreign key relationships and frequently queried fields have indexes for performance optimization.

## 📝 Missing - Phase 2 Features

These are marked as "coming soon" in the UI:

- [ ] Event dashboard with list of upcoming events
- [ ] Calendar view (using react-day-picker or custom grid)
- [ ] Circle chat and real-time messaging
- [ ] Push notifications for ride updates
- [ ] Map integration for location visualization
- [ ] User ratings and reviews system
- [ ] Advanced filtering and search
- [ ] PWA support for offline access
- [ ] Image uploads for avatars
- [ ] Event cancellation with notifications

## 🛠️ Building Production

```bash
npm run build
npm start
```

## 📱 PWA Ready

The project is structured to support PWA features:
- Mobile viewport configuration in layout
- App-like bottom navigation
- Responsive dark mode design
- Ready for service worker integration

## 🤝 Architecture Decisions

1. **Supabase + Next.js**: Real-time capabilities with full-stack TypeScript
2. **TanStack Query**: Powerful caching and synchronization
3. **RLS Policies**: Data security at the database layer
4. **Atomic RPCs**: Prevents race conditions in ride joining
5. **Bottom Nav**: Mobile app-like navigation pattern
6. **Dark Mode**: Reduced eye strain, modern aesthetic

## 🚀 Deployment

Ready to deploy on:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- Self-hosted VPS

## 📄 License

MIT License - Feel free to use for learning, development, and commercial projects.

## 👨‍💻 Author

Built as a comprehensive MVP demonstration of modern full-stack web development with Next.js 15, Supabase, and TypeScript.
