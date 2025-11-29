# SecureTransfer - Frontend Documentation

A modern, secure file transfer application built with React and Vite. This frontend provides a complete user interface for encrypted file sharing, device management, and secure note creation.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Encryption System](#encryption-system)
6. [Pages](#pages)
7. [Components](#components)
8. [Contexts](#contexts)
9. [Services](#services)
10. [Utilities](#utilities)
11. [Routing](#routing)
12. [Styling](#styling)

---

## Project Overview

SecureTransfer is a privacy-focused file sharing platform that emphasizes:

- **End-to-End Encryption**: Files are encrypted on the client before upload
- **Zero-Knowledge Architecture**: Server cannot access file contents
- **RSA + AES Hybrid Encryption**: Secure communication over HTTP without HTTPS
- **Privacy Mode**: UI blur feature to hide sensitive information
- **Device Management**: Track and control active sessions
- **Secure Notes**: Create and share encrypted text notes
- **Link Controls**: Password protection, expiry dates, and download limits

### Encryption Architecture

Since this project operates over **HTTP** (not HTTPS), we implement **application-level encryption** to ensure confidentiality:

```
┌─────────────┐     HTTP (Encrypted Payload)     ┌─────────────┐
│   Client    │ ◄──────────────────────────────► │   Server    │
│             │                                   │             │
│ ┌─────────┐ │                                   │ ┌─────────┐ │
│ │RSA Keys │ │   AES-256-GCM encrypted data     │ │RSA Keys │ │
│ │(2048bit)│ │   RSA-OAEP encrypted AES key     │ │(2048bit)│ │
│ └─────────┘ │                                   │ └─────────┘ │
└─────────────┘                                   └─────────────┘
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **React Router DOM** | Client-side Routing |
| **Axios** | HTTP Client for API calls |
| **Tailwind CSS** | Utility-first CSS Framework |
| **Lucide React** | Icon Library |
| **Recharts** | Charting Library (for analytics) |
| **clsx & tailwind-merge** | Conditional CSS class utilities |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

---

## Project Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.jsx     # Main navigation bar
│   │   └── ui/            # Core UI components
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       └── Toast.jsx
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── EncryptionContext.jsx  # Encryption state management
│   │   ├── PrivacyContext.jsx
│   │   └── ThemeContext.jsx
│   ├── lib/               # Utility functions
│   │   ├── utils.js
│   │   └── crypto.js      # RSA+AES encryption utilities
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx
│   │   ├── DeviceManagementPage.jsx
│   │   ├── FileDetailPage.jsx
│   │   ├── HelpCenterPage.jsx
│   │   ├── InboxPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SecureNotePage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── ShareSettingsPage.jsx
│   │   ├── SignupPage.jsx
│   │   └── UploadPage.jsx
│   ├── services/          # API service layer
│   │   ├── api.js         # Standard API (unencrypted)
│   │   └── encryptedApi.js # Encrypted API (RSA+AES)
│   ├── App.jsx            # Main application component
│   ├── App.css            # Global styles
│   ├── index.css          # Tailwind imports
│   └── main.jsx           # React entry point
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Encryption System

Since this application uses **HTTP** (not HTTPS), we implement our own encryption layer to ensure **confidentiality** of all data in transit. We use a **hybrid encryption** approach combining **RSA** and **AES**.

### Why Hybrid Encryption?

| Algorithm | Type | Speed | Key Size | Use Case |
|-----------|------|-------|----------|----------|
| **RSA-2048** | Asymmetric | Slow | 2048 bits | Encrypting small data (keys) |
| **AES-256-GCM** | Symmetric | Fast | 256 bits | Encrypting large data (payloads) |

- **RSA** alone is too slow for encrypting large data
- **AES** alone requires secure key exchange
- **Hybrid** = Best of both worlds!

---

### Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT → SERVER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Client generates random AES-256 key + IV                        │
│                     ↓                                                │
│  2. Client encrypts DATA with AES-256-GCM                           │
│                     ↓                                                │
│  3. Client encrypts AES KEY with Server's RSA Public Key            │
│                     ↓                                                │
│  4. Client sends: { encryptedKey, iv, encryptedData }               │
│                     ↓                                                │
│  5. Server decrypts AES KEY with its RSA Private Key                │
│                     ↓                                                │
│  6. Server decrypts DATA with AES KEY                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER → CLIENT                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Server generates random AES-256 key + IV                        │
│                     ↓                                                │
│  2. Server encrypts RESPONSE with AES-256-GCM                       │
│                     ↓                                                │
│  3. Server encrypts AES KEY with Client's RSA Public Key            │
│                     ↓                                                │
│  4. Server sends: { encryptedKey, iv, encryptedData }               │
│                     ↓                                                │
│  5. Client decrypts AES KEY with its RSA Private Key                │
│                     ↓                                                │
│  6. Client decrypts RESPONSE with AES KEY                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Key Exchange Process

```
┌──────────────────────────────────────────────────────────────────┐
│                    INITIAL KEY EXCHANGE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: Client generates RSA-2048 key pair                      │
│          ├── Public Key  (shared with server)                    │
│          └── Private Key (stored locally)                        │
│                                                                   │
│  Step 2: Client fetches Server's Public Key                      │
│          GET /api/crypto/server-public-key                       │
│                                                                   │
│  Step 3: Client sends its Public Key to Server                   │
│          POST /api/crypto/client-public-key                      │
│                                                                   │
│  Step 4: Both parties now have each other's public keys          │
│          - Client can encrypt requests for Server                │
│          - Server can encrypt responses for Client               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Crypto Library (`src/lib/crypto.js`)

#### AES Functions

| Function | Description |
|----------|-------------|
| `generateAESKey()` | Generate random AES-256 key |
| `generateIV()` | Generate 12-byte IV for GCM mode |
| `encryptAES(plaintext, key, iv)` | Encrypt text with AES-GCM |
| `decryptAES(ciphertext, key, iv)` | Decrypt text with AES-GCM |
| `exportAESKey(key)` | Export key to raw bytes |
| `importAESKey(rawKey)` | Import key from raw bytes |

#### RSA Functions

| Function | Description |
|----------|-------------|
| `generateRSAKeyPair()` | Generate RSA-2048 key pair |
| `exportPublicKeyPEM(publicKey)` | Export public key to PEM format |
| `importPublicKeyPEM(pem)` | Import public key from PEM format |
| `encryptRSA(data, publicKey)` | Encrypt data with RSA public key |
| `decryptRSA(ciphertext, privateKey)` | Decrypt data with RSA private key |

#### Hybrid Encryption Functions

| Function | Description |
|----------|-------------|
| `hybridEncrypt(message, serverPublicKey)` | Encrypt message using RSA+AES |
| `hybridDecrypt(encryptedPackage, clientPrivateKey)` | Decrypt message using RSA+AES |

#### File Encryption Functions

| Function | Description |
|----------|-------------|
| `encryptFile(file, aesKey?)` | Encrypt file with AES-GCM |
| `decryptFile(blob, key, iv, type)` | Decrypt file blob |

#### Key Storage Functions

| Function | Description |
|----------|-------------|
| `initializeClientKeys()` | Initialize or retrieve client RSA keys |
| `storeClientKeyPair(keyPair)` | Store keys in localStorage |
| `getClientKeyPair()` | Retrieve keys from localStorage |
| `clearClientKeys()` | Clear keys from storage |

#### Utility Functions

| Function | Description |
|----------|-------------|
| `sha256(data)` | Compute SHA-256 hash |
| `hashFile(file)` | Compute file hash |
| `arrayBufferToBase64(buffer)` | Convert ArrayBuffer to Base64 |
| `base64ToArrayBuffer(base64)` | Convert Base64 to ArrayBuffer |
| `arrayBufferToHex(buffer)` | Convert ArrayBuffer to Hex string |

---

### Usage Examples

#### Encrypting a Request

```javascript
import { hybridEncrypt } from '@/lib/crypto'

// Encrypt sensitive login data
const loginData = { email: 'user@example.com', password: 'secret123' }
const encrypted = await hybridEncrypt(loginData, serverPublicKey)

// Result:
// {
//   encryptedKey: "base64...",   // AES key encrypted with RSA
//   iv: "base64...",              // Initialization vector
//   encryptedData: "base64..."   // Data encrypted with AES
// }
```

#### Decrypting a Response

```javascript
import { hybridDecrypt } from '@/lib/crypto'

// Decrypt server response
const decrypted = await hybridDecrypt(encryptedResponse, clientPrivateKey)

// Result: original JSON string or object
```

#### Encrypting a File

```javascript
import { encryptFile, decryptFile } from '@/lib/crypto'

// Encrypt
const { encryptedBlob, key, iv } = await encryptFile(file)

// Upload encryptedBlob, store key and iv securely

// Decrypt (when downloading)
const decryptedBlob = await decryptFile(encryptedBlob, key, iv, 'application/pdf')
```

---

### Encrypted API Service (`src/services/encryptedApi.js`)

The encrypted API service wraps axios with automatic encryption/decryption.

#### Initialization

```javascript
import { initializeEncryption } from '@/services/encryptedApi'

// Called on app startup
await initializeEncryption()
// 1. Generates/loads client RSA keys
// 2. Fetches server's public key
// 3. Sends client's public key to server
```

#### Encrypted API Endpoints

```javascript
import { 
    secureAuthApi, 
    secureFileApi, 
    secureShareApi 
} from '@/services/encryptedApi'

// All requests are automatically encrypted
await secureAuthApi.login({ email, password })

// All responses are automatically decrypted
const files = await secureFileApi.getAll()
```

#### Request/Response Format

**Encrypted Request:**
```json
{
    "encrypted": true,
    "payload": {
        "encryptedKey": "RSA-encrypted AES key (base64)",
        "iv": "Initialization Vector (base64)",
        "encryptedData": "AES-encrypted request body (base64)"
    }
}
```

**Encrypted Response:**
```json
{
    "encrypted": true,
    "payload": {
        "encryptedKey": "RSA-encrypted AES key (base64)",
        "iv": "Initialization Vector (base64)",
        "encryptedData": "AES-encrypted response body (base64)"
    }
}
```

---

### EncryptionContext (`src/contexts/EncryptionContext.jsx`)

React context for managing encryption state.

**Provided Values:**

| Value | Type | Description |
|-------|------|-------------|
| `isReady` | boolean | Encryption initialized successfully |
| `isInitializing` | boolean | Initialization in progress |
| `error` | string \| null | Initialization error message |
| `retryInitialization` | function | Retry failed initialization |
| `checkStatus` | function | Check current encryption status |

**Usage:**

```jsx
import { useEncryption } from '@/contexts/EncryptionContext'

const MyComponent = () => {
    const { isReady, isInitializing, error } = useEncryption()

    if (isInitializing) {
        return <div>Initializing secure connection...</div>
    }

    if (error) {
        return <div>Security error: {error}</div>
    }

    if (!isReady) {
        return <div>Encryption not available</div>
    }

    return <div>🔐 Secure connection established</div>
}
```

---

### Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Key Storage** | Client keys stored in localStorage (consider IndexedDB for production) |
| **Key Rotation** | Implement periodic key rotation for enhanced security |
| **Man-in-the-Middle** | Server public key should be verified (consider certificate pinning) |
| **Replay Attacks** | Include timestamps/nonces in requests |
| **Forward Secrecy** | Each request uses a new AES key |

---

### Algorithm Specifications

| Component | Algorithm | Details |
|-----------|-----------|---------|
| Symmetric Encryption | AES-256-GCM | 256-bit key, 12-byte IV, authenticated |
| Asymmetric Encryption | RSA-OAEP | 2048-bit modulus, SHA-256 hash |
| Hashing | SHA-256 | 256-bit digest |
| Random Generation | Web Crypto API | CSPRNG |

---

## Pages

### 1. LandingPage (`/`)

**File**: `src/pages/LandingPage.jsx`

The public-facing homepage for unauthenticated users.

**Features**:
- Hero section with call-to-action buttons
- "How It Works" explanation (3-step process)
- Security features grid (8 feature cards)
- Data breach awareness banner
- Footer with navigation links

**Key Sections**:
| Section | Description |
|---------|-------------|
| Hero | Main headline, tagline, and CTA buttons |
| How It Works | Upload → Set Permissions → Share |
| Security Banner | Data breach awareness message |
| Features Grid | 8 security features with icons |
| Footer | Product, Resources, Legal links |

---

### 2. SignupPage (`/signup`)

**File**: `src/pages/SignupPage.jsx`

User registration page with password strength validation.

**Features**:
- Full name, email, password fields
- Real-time password strength indicator (5 levels)
- Password visibility toggle
- Confirm password validation
- Automatic redirect to dashboard after signup

**Password Strength Levels**:
1. Very Weak (red)
2. Weak (orange)
3. Fair (yellow)
4. Good (blue)
5. Strong (green)

**Validation Rules**:
- Minimum 8 characters
- Mix of uppercase/lowercase
- Contains numbers
- Contains special characters

---

### 3. LoginPage (`/login`)

**File**: `src/pages/LoginPage.jsx`

User authentication page.

**Features**:
- Email and password fields
- Password visibility toggle
- "Remember me" checkbox
- "Forgot password" link (placeholder)
- Session timeout display
- Zero-knowledge encryption badge

---

### 4. Dashboard (`/dashboard`)

**File**: `src/pages/Dashboard.jsx`

Main user dashboard after login. Central hub for file management.

**Features**:
- Security tip banner
- Statistics cards (Total Files, Storage Used, Shared Links, Inbox)
- Drag-and-drop upload area (links to Upload page)
- File listing with search and category filters
- File cards with actions (View, Share, Download, Delete)
- Privacy mode support (blur sensitive content)

**Statistics Cards**:
| Card | Data Source |
|------|-------------|
| Total Files | `fileApi.getAll()` |
| Storage Used | `analyticsApi.getStorage()` |
| Shared Links | `shareApi.getAll()` |
| Inbox | `fileApi.getShared()` |

**File Categories**:
- All Files
- Documents
- Images
- Invoices
- Others

**File Card Actions**:
- **View**: Navigate to file detail page
- **Share**: Navigate to share settings
- **Download**: Download the file
- **Delete**: Move file to trash

---

### 5. UploadPage (`/upload`)

**File**: `src/pages/UploadPage.jsx`

Secure file upload interface with encryption options.

**Features**:
- Client-side encryption toggle (AES-256-GCM)
- Drag-and-drop zone
- File browser button
- Sensitive content detection (SSN, credit cards, etc.)
- Duplicate file detection
- Upload progress with status badges
- Automatic file categorization

**Upload Status Flow**:
1. **Pending** - File selected, waiting to upload
2. **Hashing** - Computing file hash for integrity
3. **Encrypting** - Encrypting file content
4. **Uploading** - Sending to server
5. **Completed** - Upload successful

**Sensitive Content Detection**:
Automatically flags files containing:
- Social Security Numbers (XXX-XX-XXXX)
- Credit Card Numbers
- Keywords: passport, confidential, tax id

---

### 6. FileDetailPage (`/files/:id`)

**File**: `src/pages/FileDetailPage.jsx`

Detailed view of a single file with analytics.

**Features**:
- File metadata display (name, size, upload date, encryption status)
- Privacy blur toggle for preview
- Access analytics charts
- Delete and share actions

**Displayed Information**:
| Field | Description |
|-------|-------------|
| File Name | Original filename |
| File Size | Formatted size (KB, MB, GB) |
| Upload Date | When the file was uploaded |
| Encryption | AES-256 or None |
| Total Views | Number of times accessed |

**Analytics Charts**:
- **Access Timeline**: Line chart showing views over time
- **Access by Region**: Pie chart showing geographic distribution

---

### 7. ShareSettingsPage (`/share/:id`)

**File**: `src/pages/ShareSettingsPage.jsx`

Configure sharing options for a file.

**Features**:
- Generate shareable link
- Password protection toggle
- Link expiration (date and time picker)
- Maximum download limit
- One-time access toggle
- Link tracking toggle
- Email sharing option
- Share summary with applied settings

**Sharing Options**:
| Option | Description |
|--------|-------------|
| Password Protection | Require password to access |
| Link Expiration | Auto-expire after date/time |
| Max Downloads | Limit number of downloads |
| One-Time Access | Expire after first view |
| Link Tracking | Log access events |

---

### 8. InboxPage (`/inbox`)

**File**: `src/pages/InboxPage.jsx`

View files shared with you by other users.

**Features**:
- Filter by sender
- File list with sender info
- View and download actions
- Bulk selection
- Delete expired files button

**Data Source**: `fileApi.getShared()` - Fetches files where current user is in the `sharedWith` array.

---

### 9. SecureNotePage (`/secure-note`)

**File**: `src/pages/SecureNotePage.jsx`

Create and share encrypted text notes.

**Features**:
- Title and content input
- Encryption toggle
- Auto-delete after read toggle
- Generate shareable link
- Copy link to clipboard

**Note Options**:
| Option | Description |
|--------|-------------|
| Encryption | Enable/disable note encryption |
| Auto-Delete | Delete note after first read |
| Max Views | Limit number of views (1 for auto-delete) |

---

### 10. SettingsPage (`/settings`)

**File**: `src/pages/SettingsPage.jsx`

User account and security settings.

**Sections**:

**Profile Information**:
- Name and email editing
- Save profile button

**Change Password**:
- Current password
- New password
- Confirm new password

**Language**:
- Language selection dropdown (English only)

**Security Preferences**:
- Privacy Mode toggle (blur sensitive content)
- Two-Factor Authentication toggle

**Auto-Logout Timer**:
- Session timeout duration (5-120 minutes)

---

### 11. DeviceManagementPage (`/devices`)

**File**: `src/pages/DeviceManagementPage.jsx`

Manage devices with active sessions.

**Features**:
- List all active devices
- Current device indicator
- Device details (browser, location, IP, last active)
- Logout individual devices
- Logout all other devices
- Security tips card

**Device Information**:
| Field | Description |
|-------|-------------|
| Browser | Browser name and version |
| Location | Geographic location |
| IP Address | Device IP address |
| Last Active | Last activity timestamp |
| Is Current | Whether it's the current device |

---

### 12. HelpCenterPage (`/help`)

**File**: `src/pages/HelpCenterPage.jsx`

Help documentation and FAQs.

**Features**:
- Search functionality
- Expandable FAQ accordion
- Security best practices cards
- Contact support section

**FAQ Categories**:
1. **Getting Started** - Upload, file types
2. **Security** - Encryption, zero-knowledge, passwords
3. **Sharing** - Share links, tracking, expiry

**Security Best Practices**:
- Use strong passwords
- Enable two-factor authentication
- Review shared links regularly
- Monitor device access

---

## Components

### Core UI Components (`src/components/ui/`)

#### Button (`Button.jsx`)

A flexible button component with multiple variants and sizes.

```jsx
import { Button } from '@/components/ui/Button'

// Variants
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | 'default' | Visual style |
| size | string | 'default' | Button size |
| className | string | - | Additional CSS classes |
| ...props | - | - | All native button props |

---

#### Card (`Card.jsx`)

A card container with header, content, and footer sections.

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

<Card>
    <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description text</CardDescription>
    </CardHeader>
    <CardContent>
        Main content here
    </CardContent>
    <CardFooter>
        Footer actions
    </CardFooter>
</Card>
```

**Components**:
| Component | Description |
|-----------|-------------|
| Card | Main container with border and shadow |
| CardHeader | Header section with padding |
| CardTitle | Large bold title text |
| CardDescription | Muted description text |
| CardContent | Main content area |
| CardFooter | Footer for actions |

---

#### Input (`Input.jsx`)

A styled text input component.

```jsx
import { Input } from '@/components/ui/Input'

<Input 
    type="email" 
    placeholder="Enter email" 
    value={value}
    onChange={handleChange}
/>
```

**Props**: All native `<input>` props are supported.

---

#### Badge (`Badge.jsx`)

A label component for status indicators and tags.

```jsx
import { Badge } from '@/components/ui/Badge'

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
```

**Variants**:
| Variant | Color | Use Case |
|---------|-------|----------|
| default | Primary blue | Default state |
| secondary | Gray | Neutral info |
| destructive | Red | Errors, deletions |
| outline | Border only | Subtle labels |
| success | Green | Success states |
| warning | Yellow | Warnings |
| info | Blue | Information |

---

#### Toast (`Toast.jsx`)

A notification system with context provider.

```jsx
import { useToast } from '@/components/ui/Toast'

const toast = useToast()

// Usage
toast.success('File uploaded!')
toast.error('Upload failed')
toast.warning('File size too large')
toast.info('Processing...')
```

**Setup**: Wrap your app with `<ToastProvider>`:

```jsx
import { ToastProvider } from '@/components/ui/Toast'

<ToastProvider>
    <App />
</ToastProvider>
```

**Toast Types**:
| Type | Color | Icon |
|------|-------|------|
| success | Green | ✓ |
| error | Red | ✕ |
| warning | Yellow | ⚠ |
| info | Blue | ℹ |

---

### Navbar (`src/components/Navbar.jsx`)

The main navigation bar displayed for authenticated users.

**Features**:
- Logo and brand name
- Navigation links (Dashboard, Upload, Inbox, Devices, Help)
- Theme toggle (light/dark)
- Privacy mode toggle
- Notifications button
- Settings button
- Logout button
- Inbox badge with count

**Navigation Links**:
| Link | Icon | Route |
|------|------|-------|
| Dashboard | Home | /dashboard |
| Upload | Upload | /upload |
| Inbox | Inbox | /inbox |
| Devices | Monitor | /devices |
| Help | HelpCircle | /help |

---

## Contexts

### AuthContext (`src/contexts/AuthContext.jsx`)

Manages user authentication state.

**Provided Values**:
| Value | Type | Description |
|-------|------|-------------|
| user | object \| null | Current user data |
| isAuthenticated | boolean | Whether user is logged in |
| loading | boolean | Auth check in progress |
| login | function | Login with credentials |
| signup | function | Register new user |
| logout | function | Log out current user |

**Usage**:

```jsx
import { useAuth } from '@/contexts/AuthContext'

const { user, isAuthenticated, login, logout } = useAuth()
```

**User Object**:
```javascript
{
    _id: "...",
    email: "user@example.com",
    fullName: "John Doe"
}
```

---

### ThemeContext (`src/contexts/ThemeContext.jsx`)

Manages light/dark theme preference.

**Provided Values**:
| Value | Type | Description |
|-------|------|-------------|
| theme | 'light' \| 'dark' | Current theme |
| setTheme | function | Set specific theme |
| toggleTheme | function | Toggle between themes |

**Usage**:

```jsx
import { useTheme } from '@/contexts/ThemeContext'

const { theme, toggleTheme } = useTheme()
```

**Persistence**: Theme is saved to `localStorage` and restored on reload.

---

### EncryptionContext (`src/contexts/EncryptionContext.jsx`)

Manages the RSA+AES encryption system state.

**Provided Values**:
| Value | Type | Description |
|-------|------|-------------|
| isReady | boolean | Encryption initialized successfully |
| isInitializing | boolean | Key exchange in progress |
| error | string \| null | Initialization error |
| retryInitialization | function | Retry failed initialization |
| checkStatus | function | Check current status |

**Usage**:

```jsx
import { useEncryption } from '@/contexts/EncryptionContext'

const { isReady, isInitializing, error, retryInitialization } = useEncryption()

// Show loading while keys are being exchanged
if (isInitializing) {
    return <div>Establishing secure connection...</div>
}

// Handle errors
if (error) {
    return (
        <div>
            <p>Security Error: {error}</p>
            <button onClick={retryInitialization}>Retry</button>
        </div>
    )
}
```

---

### PrivacyContext (`src/contexts/PrivacyContext.jsx`)

Manages privacy screen mode for blurring sensitive content.

**Provided Values**:
| Value | Type | Description |
|-------|------|-------------|
| privacyMode | boolean | Whether privacy mode is active |
| togglePrivacyMode | function | Toggle privacy mode |

**Usage**:

```jsx
import { usePrivacy } from '@/contexts/PrivacyContext'

const { privacyMode, togglePrivacyMode } = usePrivacy()

// Apply blur conditionally
<div className={privacyMode ? 'blur-md' : ''}>
    Sensitive content
</div>
```

---

## Services

### API Services

The application provides two API service layers:

1. **`api.js`** - Standard unencrypted API (for development/fallback)
2. **`encryptedApi.js`** - RSA+AES encrypted API (for production)

---

### Standard API Service (`src/services/api.js`)

Axios-based API client for backend communication.

**Base Configuration**:
```javascript
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,  // Include cookies for auth
})
```

---

#### authApi

Authentication endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `register(data)` | POST /auth/register | Create new account |
| `login(data)` | POST /auth/login | Authenticate user |
| `logout()` | POST /auth/logout | End session |
| `getMe()` | GET /auth/me | Get current user |

---

#### fileApi

File management endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `upload(data)` | POST /files/upload | Upload file metadata |
| `getAll()` | GET /files | Get user's files |
| `getShared()` | GET /files/shared | Get files shared with user |
| `getOne(id)` | GET /files/:id | Get single file |
| `download(id)` | GET /files/:id/download | Download file |
| `update(id, data)` | PUT /files/:id | Update file metadata |
| `delete(id)` | DELETE /files/:id | Delete file |
| `restore(id)` | POST /files/:id/restore | Restore deleted file |

---

#### shareApi

File sharing endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `create(data)` | POST /shares/create | Create share link |
| `getAll()` | GET /shares | Get user's share links |
| `getPublic(token)` | GET /shares/public/:token | Get public share info |
| `accessPublic(token, data)` | POST /shares/public/:token/access | Access shared file |
| `revoke(id)` | DELETE /shares/:id | Revoke share link |

---

#### noteApi

Secure notes endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `create(data)` | POST /notes | Create secure note |
| `access(id)` | POST /notes/:id/access | Access note (increment view) |

---

#### deviceApi

Device session endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getAll()` | GET /devices | Get all active devices |
| `revoke(id)` | DELETE /devices/:id | Logout specific device |
| `revokeAllOthers()` | DELETE /devices/all-others | Logout all other devices |

---

#### analyticsApi

Analytics and statistics endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getStorage()` | GET /analytics/storage | Get storage usage |
| `getActivity()` | GET /analytics/activity | Get activity log |
| `getFileStats(id)` | GET /analytics/file/:id | Get file access stats |

---

### Encrypted API Service (`src/services/encryptedApi.js`)

Secure API layer with automatic RSA+AES encryption/decryption.

**Initialization:**

```javascript
import { initializeEncryption, isEncryptionReady } from '@/services/encryptedApi'

// Initialize on app startup
const success = await initializeEncryption()
// Returns true if key exchange succeeded

// Check status anytime
const ready = isEncryptionReady()
```

**Encrypted API Endpoints:**

All endpoints mirror the standard API but with automatic encryption:

```javascript
import { 
    secureAuthApi,
    secureFileApi,
    secureShareApi,
    secureNoteApi,
    secureDeviceApi,
    secureAnalyticsApi
} from '@/services/encryptedApi'

// Example: Login with encrypted credentials
await secureAuthApi.login({ email: 'user@example.com', password: 'secret' })

// Example: Get files (response is auto-decrypted)
const { data } = await secureFileApi.getAll()
```

**How It Works:**

| Step | Request Flow | Response Flow |
|------|--------------|---------------|
| 1 | Generate random AES key | Receive encrypted package |
| 2 | Encrypt body with AES | Decrypt AES key with RSA |
| 3 | Encrypt AES key with RSA | Decrypt body with AES |
| 4 | Send encrypted package | Return decrypted data |

**Request Headers:**
```
X-Encrypted-Request: true
```

**Encrypted Payload Structure:**
```json
{
    "encrypted": true,
    "payload": {
        "encryptedKey": "base64(RSA(AESKey))",
        "iv": "base64(IV)",
        "encryptedData": "base64(AES(data))"
    }
}
```

---

## Utilities

### utils.js (`src/lib/utils.js`)

Utility functions used throughout the application.

---

#### `cn(...inputs)`

Merges Tailwind CSS classes with conflict resolution.

```javascript
import { cn } from '@/lib/utils'

cn('p-4 bg-blue-500', 'bg-red-500')  // 'p-4 bg-red-500'
cn('text-sm', isActive && 'font-bold')  // Conditional classes
```

---

#### `formatBytes(bytes, decimals = 2)`

Converts bytes to human-readable format.

```javascript
formatBytes(1024)         // '1 KB'
formatBytes(1048576)      // '1 MB'
formatBytes(1073741824)   // '1 GB'
```

---

#### `formatDate(date)`

Formats a date to a readable string.

```javascript
formatDate(new Date())  // 'Nov 29, 2025, 10:30 AM'
```

---

#### `generateShareLink(fileId)`

Generates a share URL for a file.

```javascript
generateShareLink('abc123')  // 'http://localhost:5173/share/abc123'
```

---

#### `calculatePasswordStrength(password)`

Evaluates password strength.

```javascript
calculatePasswordStrength('password123')
// { score: 2, label: 'Fair' }

calculatePasswordStrength('MyP@ssw0rd!')
// { score: 5, label: 'Strong' }
```

**Scoring Criteria**:
- 8+ characters: +1
- 12+ characters: +1
- Upper and lowercase: +1
- Contains numbers: +1
- Contains special characters: +1

---

#### `detectSensitiveContent(text)`

Checks if text contains sensitive information patterns.

```javascript
detectSensitiveContent('123-45-6789')  // true (SSN pattern)
detectSensitiveContent('confidential document')  // true
detectSensitiveContent('regular text')  // false
```

**Detected Patterns**:
- Social Security Numbers (XXX-XX-XXXX)
- Credit Card Numbers (16 digits)
- Keywords: passport, confidential, tax id

---

#### `hashFile(file)`

Computes SHA-256 hash of a file.

```javascript
const hash = await hashFile(fileObject)
// '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c...'
```

---

#### `categorizefile(filename)`

Auto-categorizes files based on name and extension.

```javascript
categorizefile('Invoice_2025.pdf')  // 'invoice'
categorizefile('photo.jpg')         // 'image'
categorizefile('document.pdf')      // 'document'
categorizefile('unknown.xyz')       // 'other'
```

**Categories**:
| Category | Matched By |
|----------|------------|
| invoice | 'invoice', 'receipt', 'bill' in name |
| passport | 'passport', 'id' in name |
| tax | 'tax', 'w2', '1099' in name |
| legal | 'contract', 'agreement', 'legal' in name |
| confidential | 'confidential', 'private', 'secret' in name |
| document | .pdf, .doc, .docx extension |
| image | .jpg, .jpeg, .png extension |
| video | .mp4 extension |
| audio | .mp3 extension |
| other | Everything else |

---

## Routing

### Route Configuration (`App.jsx`)

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | LandingPage | Public only | Homepage for guests |
| `/signup` | SignupPage | Public only | Registration |
| `/login` | LoginPage | Public only | Authentication |
| `/dashboard` | Dashboard | Protected | Main dashboard |
| `/upload` | UploadPage | Protected | File upload |
| `/files/:id` | FileDetailPage | Protected | File details |
| `/share/:id` | ShareSettingsPage | Protected | Share configuration |
| `/inbox` | InboxPage | Protected | Received files |
| `/secure-note` | SecureNotePage | Protected | Encrypted notes |
| `/settings` | SettingsPage | Protected | User settings |
| `/devices` | DeviceManagementPage | Protected | Session management |
| `/help` | HelpCenterPage | Public | Help documentation |

### Route Guards

**ProtectedRoute**: Redirects to `/login` if not authenticated.

**PublicRoute**: Redirects to `/dashboard` if already authenticated.

---

## Styling

### Tailwind CSS Configuration

The project uses Tailwind CSS with custom CSS variables for theming.

**Theme Colors** (defined in `index.css`):

```css
:root {
    --background: /* Light background */
    --foreground: /* Light text */
    --primary: /* Primary brand color */
    --secondary: /* Secondary color */
    --muted: /* Muted backgrounds */
    --accent: /* Accent color */
    --destructive: /* Error/danger color */
    --card: /* Card backgrounds */
    --border: /* Border color */
    --input: /* Input border */
    --ring: /* Focus ring */
}

.dark {
    /* Dark mode overrides */
}
```

### CSS Classes

**Privacy Screen Mode**:
```css
.privacy-screen {
    filter: blur(8px);
    transition: filter 0.3s;
}
```

---

## License

MIT License - See LICENSE file for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

For support, email support@securetransfer.com or visit the Help Center at `/help`.
