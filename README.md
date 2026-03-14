# Medi-Remind - AI-Powered Health Assistant

**Simplified medicine instructions for everyone.**

Medi-Remind is a mobile-first Progressive Web Application that uses **Google Gemini AI** to scan medicine strips/prescriptions via camera, extract information, and deliver simplified audio instructions in the user's preferred language. It is designed to help **elderly users and non-English speakers** understand their medications safely.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup (Supabase)](#database-setup-supabase)
- [How It Works](#how-it-works)
- [AI Models Used](#ai-models-used)
- [Multi-Language Support](#multi-language-support)
- [API Reference (Services)](#api-reference-services)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **Medicine Scanner** | Scan medicine strips or prescriptions using the camera or by uploading a photo |
| **AI Analysis** | Google Gemini AI extracts medicine name, dosage, frequency, instructions, purpose, and side effects |
| **Text-to-Speech** | AI-generated voice narration of medicine information in the user's chosen language and voice |
| **Drug Interaction Checker** | Automatically checks new medicines against the user's current medication list for dangerous interactions |
| **Family Profiles** | Create multiple profiles (e.g., Mom, Dad, Grandma) with individual medication lists and preferences |
| **Medication Reminders** | Set time-based reminders for each medicine per profile |
| **Nearby Pharmacies** | Find nearby pharmacies using Google Maps integration via Gemini |
| **Scan History** | Full history of all scanned medicines with timestamps and stored images |
| **Authentication** | Secure email/password auth via Supabase with email verification |
| **Cloud Sync** | All data (profiles, medications, reminders, scan history) synced to Supabase cloud database |
| **9 Languages** | English, Hindi, Marathi, Telugu, Tamil, Gujarati, Punjabi, Spanish, French |
| **Mobile-First PWA** | Designed for mobile with touch-optimized UI, safe area insets, and app-like experience |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **AI/ML** | Google Gemini API (`@google/genai`) |
| **Backend/Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Icons** | Lucide React |
| **Deployment** | Any static host (Vercel, Netlify, etc.) |

---

## Architecture

```
+-------------------------------------------------------------+
|                    FRONTEND (React + Vite)                   |
|                                                              |
|  +----------+  +----------+  +----------+  +---------+      |
|  |  Login   |  |  Scan    |  | Profile  |  | History |      |
|  |  Page    |  |  Tab     |  | Manager  |  |  Tab    |      |
|  +----+-----+  +----+-----+  +----+-----+  +----+----+      |
|       |              |             |              |          |
|  +----v--------------v-------------v--------------v----+     |
|  |              AuthContext (useAuth)                   |     |
|  +----------------------+------------------------------+     |
|                         |                                    |
|  +----------------------v------------------------------+     |
|  |              Services Layer                          |    |
|  |  +-----------------+  +--------------------------+   |    |
|  |  | GeminiService   |  | SupabaseService          |  |    |
|  |  | - analyzeImage  |  | - profiles CRUD          |  |    |
|  |  | - interactions  |  | - medications CRUD       |  |    |
|  |  | - findPharmacy  |  | - reminders CRUD         |  |    |
|  |  | - generateTTS   |  | - scan history           |  |    |
|  |  +--------+--------+  | - image storage          |  |    |
|  |           |            +------------+-------------+  |    |
|  +-----------+-------------------------+----------------+    |
+--------------+-------------------------+---------------------+
               |                         |
       +-------v-------+       +--------v--------+
       |  Google Gemini |       |    Supabase     |
       |  AI API        |       |  - PostgreSQL   |
       |  - Vision      |       |  - Auth         |
       |  - Text        |       |  - Storage      |
       |  - TTS         |       |  - RLS Policies |
       |  - Maps        |       +-----------------+
       +----------------+
```

---

## Project Structure

```
Medi-Remind/
|-- index.html                 # Entry HTML with PWA meta tags
|-- index.tsx                  # React root with AuthProvider
|-- index.css                  # Global styles
|-- App.tsx                    # Main app component (state, routing, logic)
|-- types.ts                   # TypeScript interfaces and enums
|-- constants.ts               # Languages, voices, UI translations, AI prompts
|-- schema.sql                 # Supabase database schema + RLS policies
|-- vite.config.ts             # Vite configuration with React + Tailwind
|-- package.json               # Dependencies and scripts
|-- tsconfig.json              # TypeScript configuration
|
|-- components/
|   |-- LoginPage.tsx          # Email/password auth with signup flow
|   |-- ProfileManager.tsx     # Family profile CRUD with language selection
|   |-- LanguageSelector.tsx   # Language picker (9 languages)
|   |-- VoiceSelector.tsx      # AI voice picker (5 voices with previews)
|   |-- AnalysisResult.tsx     # Medicine scan results display
|   |-- InteractionAlert.tsx   # Drug interaction warning banner
|   |-- RemindersManager.tsx   # Medication reminder list
|   |-- PharmacyLocator.tsx    # Nearby pharmacy finder
|   |-- ScanHistory.tsx        # Scan history timeline
|
|-- contexts/
|   |-- AuthContext.tsx         # React context for Supabase authentication
|
|-- services/
|   |-- geminiService.ts       # Google Gemini AI integration (vision, TTS, maps)
|   |-- supabase.ts            # Supabase client initialization
|   |-- supabaseService.ts     # Database CRUD operations + image storage
|
|-- public/
    |-- favicon.svg            # App favicon
```

---

## Getting Started

### Prerequisites

- **Node.js** version 18 or higher
- **npm** version 9 or higher
- A **Google Gemini API Key** - [Get one here](https://aistudio.google.com/app/apikey)
- A **Supabase project** - [Create one here](https://supabase.com/dashboard)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Faizal956/Medicare.git
cd Medicare

# 2. Install dependencies
npm install

# 3. Create environment file (see Environment Variables section)
# Create a .env file in the project root

# 4. Set up Supabase database tables (see Database Setup section)

# 5. Start development server
npm run dev
```

The app will be available at **http://localhost:3000**

### Build for Production

```bash
npm run build      # Output in dist/
npm run preview    # Preview production build locally
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Google Gemini API Key (required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase credentials (required for auth + database)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your_anon_key_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI analysis, TTS, and Maps |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key (JWT format) |

> **Important:** The `.env` file is git-ignored and should never be committed. The `VITE_` prefix is required for Vite to expose variables to the client-side code via `import.meta.env`.

---

## Database Setup (Supabase)

### Step 1: Create Tables

Go to your Supabase Dashboard, then SQL Editor, then New Query. Paste and run the contents of `schema.sql`.

This creates 4 tables:

| Table | Description |
|-------|-------------|
| `profiles` | Family member profiles (name, color, language, voice preferences) |
| `medications` | Medications per profile (name, timestamp) |
| `reminders` | Time-based medication reminders per profile |
| `scan_history` | All scanned medicines with full AI analysis (JSONB) and image references |

### Step 2: Row Level Security (RLS)

The schema automatically enables **Row Level Security** on all tables. Each user can only read/write their own data:

- `profiles` - filtered by `user_id = auth.uid()`
- `medications` and `reminders` - filtered by profile ownership
- `scan_history` - filtered by `user_id = auth.uid()`

### Step 3: Storage Bucket (Optional)

For storing scanned medicine images:

1. Go to Supabase Dashboard, then Storage, then New Bucket
2. Name: `medicine-images`
3. Public: **No** (uses signed URLs)

### Database Schema (ER Diagram)

```
+----------------+       +----------------+
|  auth.users    |       |   profiles     |
|----------------|       |----------------|
| id (PK)        |<---+  | id (PK, UUID)  |
| email          |    +--| user_id (FK)   |
| ...            |       | name           |
+----------------+       | color          |
                         | preferred_     |
                         |  language      |
                         | preferred_     |
                         |  voice         |
                         +-------+--------+
                                 |
                 +---------------+---------------+
                 |               |               |
        +--------v------+ +-----v--------+ +----v-----------+
        |  medications  | |  reminders   | | scan_history   |
        |---------------| |--------------| |----------------|
        | id (PK)       | | id (PK)      | | id (PK)        |
        | profile_id(FK)| | profile_id   | | user_id (FK)   |
        | name          | | medicine_name| | profile_id(FK) |
        | added_at      | | dosage       | | medicine_name  |
        +---------------+ | time         | | analysis(JSON) |
                          | active       | | image_path     |
                          +--------------+ | scanned_at     |
                                           +----------------+
```

---

## How It Works

### 1. Authentication Flow

```
User --> Email/Password --> Supabase Auth --> JWT Token --> Session
                                                 |
                               AuthContext provides user to all components
```

### 2. Medicine Scanning Flow

1. User captures or uploads a medicine image
2. Image is converted to Base64
3. Sent to Gemini AI (`gemini-3-flash-preview`) with a system prompt
4. AI returns structured JSON: name, dosage, frequency, instructions, side effects
5. Drug interaction check runs against the user's current medication list
6. Results displayed with option to listen via AI-generated speech (TTS)
7. Scan is saved to Supabase (`scan_history` table + image to Storage)

### 3. Text-to-Speech Flow

1. User clicks "Listen" on the analysis result
2. Translated text sent to Gemini TTS (`gemini-2.5-flash-preview-tts`)
3. AI generates PCM audio with selected voice persona
4. Audio decoded from Base64 to Int16Array to AudioBuffer
5. Played via Web Audio API at 24kHz sample rate

---

## AI Models Used

| Model | Purpose | Details |
|-------|---------|---------|
| `gemini-3-flash-preview` | Medicine image analysis | Vision model - reads text from medicine strips, extracts structured data |
| `gemini-3-pro-preview` | Drug interaction checking | More capable model for pharmacological reasoning |
| `gemini-2.5-flash` | Nearby pharmacy search | Uses Google Maps tool for location-based pharmacy discovery |
| `gemini-2.5-flash-preview-tts` | Text-to-Speech | Generates natural-sounding audio narration in 5 voice personas |

### AI Voice Personas

| Voice ID | Persona | Recommended For |
|----------|---------|-----------------|
| Kore | Calm and Professional | English, Tamil |
| Puck | Friendly and Bright | Gujarati, Spanish |
| Charon | Clear and Formal | Telugu |
| Fenrir | Deep and Reassuring | Hindi, Punjabi |
| Zephyr | Gentle and Soft | Marathi, French |

---

## Multi-Language Support

The app supports **9 languages** with complete UI translations:

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `hi` | Hindi | हिन्दी |
| `mr` | Marathi | मराठी |
| `te` | Telugu | తెలుగు |
| `ta` | Tamil | தமிழ் |
| `gu` | Gujarati | ગુજરાતી |
| `pa` | Punjabi | पंजाबी |
| `es` | Spanish | Espanol |
| `fr` | French | Francais |

Each language has:

- Full UI translation (60+ strings per language)
- Recommended AI voice pairing
- AI-generated medicine explanations in that language
- TTS audio narration in that language

---

## API Reference (Services)

### GeminiService (services/geminiService.ts)

```typescript
class GeminiService {
  analyzeImage(base64Image: string, languageName: string): Promise<MedicineAnalysis>
  checkInteractions(newMedicine: string, existingMedicines: string[], languageName: string): Promise<InteractionResult>
  findNearbyPharmacies(lat: number, lng: number): Promise<PharmacyLocation[]>
  generateSpeech(text: string, voiceName: string): Promise<string>
}
```

All methods include **automatic retry logic** with exponential backoff for transient errors (500, 503, quota limits, network errors).

### SupabaseService (services/supabaseService.ts)

```typescript
// Profiles
getProfiles(userId: string): Promise<DbProfile[]>
saveProfile(userId: string, profile: {...}): Promise<DbProfile>
updateProfile(profileId: string, updates: {...}): Promise<void>
deleteProfile(profileId: string): Promise<void>

// Medications
getMedications(profileId: string): Promise<DbMedication[]>
addMedication(profileId: string, name: string): Promise<DbMedication>
removeMedication(medicationId: string): Promise<void>

// Reminders
getReminders(profileId: string): Promise<DbReminder[]>
addReminder(profileId: string, reminder: {...}): Promise<DbReminder>
deleteReminder(reminderId: string): Promise<void>

// Scan History
saveScanEntry(entry: {...}): Promise<DbScanEntry>
getScanHistory(userId: string): Promise<DbScanEntry[]>

// Image Storage
uploadMedicineImage(userId: string, base64Data: string): Promise<string>
getMedicineImageUrl(filePath: string): string
```

---

## Security

| Concern | Solution |
|---------|----------|
| **Authentication** | Supabase Auth with email/password + email verification |
| **Data Isolation** | PostgreSQL Row Level Security - users only access their own data |
| **API Keys** | Stored in `.env` (git-ignored), never exposed in client bundle |
| **Image Storage** | Private Supabase Storage bucket with signed URLs |
| **Input Validation** | Client-side validation + structured AI response schemas |
| **Session Management** | JWT-based sessions managed by Supabase SDK |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with React, Google Gemini AI, and Supabase
