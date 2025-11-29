# SecureTransfer Backend Server

A secure file transfer backend built with Express.js, MongoDB, and RSA+AES hybrid encryption.

## Features

- 🔐 **End-to-End Encryption**: RSA-2048 for key exchange, AES-256-GCM for data
- 📁 **Encrypted File Storage**: Files stored encrypted on disk, not in database
- 🔗 **Secure Sharing**: Password-protected share links with expiration
- 📝 **Secure Notes**: Encrypted note storage
- 📱 **Device Management**: Track and manage active sessions
- 📊 **Analytics**: Activity logging and security monitoring

## Prerequisites

- Node.js 18+
- MongoDB 5.0+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Create .env file (see Environment Variables below)

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/securetransfer

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Port
PORT=5000

# File Upload Settings
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600

# Node Environment
NODE_ENV=development
```

## API Endpoints

### Crypto (Key Exchange)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crypto/server-public-key` | Get server's RSA public key |
| POST | `/api/crypto/client-public-key` | Register client's public key |

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |
| POST | `/api/auth/change-password` | Change password | ✅ |

### Files
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/files/upload` | Upload encrypted file | ✅ |
| GET | `/api/files` | List user's files | ✅ |
| GET | `/api/files/:id` | Get file details | ✅ |
| GET | `/api/files/:id/download` | Download & decrypt file | ✅ |
| PUT | `/api/files/:id` | Update file metadata | ✅ |
| DELETE | `/api/files/:id` | Delete file | ✅ |
| GET | `/api/files/stats/summary` | Get file statistics | ✅ |

### Sharing
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/shares/create` | Create share link | ✅ |
| GET | `/api/shares` | List user's share links | ✅ |
| GET | `/api/shares/:token` | Access shared file | Optional |
| GET | `/api/shares/:token/download` | Download via share link | Optional |
| DELETE | `/api/shares/:id` | Delete share link | ✅ |
| PUT | `/api/shares/:id/toggle` | Toggle link active status | ✅ |

### Secure Notes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/notes` | Create encrypted note | ✅ |
| GET | `/api/notes` | List user's notes | ✅ |
| GET | `/api/notes/:id` | Get & decrypt note | ✅ |
| PUT | `/api/notes/:id` | Update note | ✅ |
| DELETE | `/api/notes/:id` | Delete note | ✅ |
| POST | `/api/notes/:id/share` | Share note with user | ✅ |

### Device Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/devices` | List active devices | ✅ |
| DELETE | `/api/devices/:id` | Revoke device session | ✅ |
| POST | `/api/devices/revoke-all` | Revoke all other sessions | ✅ |
| PUT | `/api/devices/:id/trust` | Toggle device trust | ✅ |
| PUT | `/api/devices/:id/rename` | Rename device | ✅ |

### Analytics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/activity` | Get recent activity | ✅ |
| GET | `/api/analytics/summary` | Get activity summary | ✅ |
| GET | `/api/analytics/dashboard` | Get dashboard stats | ✅ |
| GET | `/api/analytics/security` | Get security analytics | ✅ |
| GET | `/api/analytics/files/:id` | Get file activity | ✅ |

## Encryption Flow

### 1. Key Exchange (Initial Setup)
```
Client                          Server
   |                               |
   |-- GET /server-public-key ---->|
   |<---- RSA Public Key ----------|
   |                               |
   |-- POST client-public-key ---->|
   |<---- Confirmation ------------|
```

### 2. Encrypted Request
```
Client:
1. Generate random AES-256 key
2. Encrypt request body with AES-GCM
3. Encrypt AES key with server's RSA public key
4. Send { encryptedKey, iv, encryptedData }

Server:
1. Decrypt AES key with server's RSA private key
2. Decrypt request body with AES key
3. Process request
```

### 3. Encrypted Response
```
Server:
1. Generate random AES-256 key
2. Encrypt response with AES-GCM
3. Encrypt AES key with client's RSA public key
4. Send { encryptedKey, iv, encryptedData }

Client:
1. Decrypt AES key with client's RSA private key
2. Decrypt response with AES key
```

### 4. File Upload (Encrypted at Rest)
```
Client:
1. File is uploaded via multipart/form-data

Server:
1. Receive file in memory
2. Generate unique AES key and IV
3. Encrypt file with AES-256-GCM
4. Save encrypted file to disk
5. Store encryption key and IV in database
```

## Database Models

### User
- `name`, `email`, `password` (hashed)
- `publicKey` (client's RSA key)
- `storageUsed`, `storageLimit`
- `twoFactorEnabled`, `plan`

### File
- `name`, `originalName`, `mimeType`
- `storagePath` (encrypted file location)
- `encryptionKey`, `encryptionIV`
- `size`, `hash`, `category`
- `owner`, `sharedWith[]`

### ShareLink
- `token`, `shortCode`
- `file`, `createdBy`
- `permissions`, `password`
- `maxDownloads`, `downloadCount`
- `expiresAt`, `isActive`

### SecureNote
- `title`, `content` (encrypted)
- `encryptionKey`, `encryptionIV`
- `owner`, `category`, `tags`
- `sharedWith[]`

### DeviceSession
- `user`, `sessionToken`
- `deviceId`, `deviceName`, `deviceType`
- `browser`, `os`, `ip`, `location`
- `isActive`, `isTrusted`
- `lastActivity`, `expiresAt`

### AccessLog
- `user`, `action`, `resourceType`
- `ip`, `userAgent`, `location`
- `success`, `riskLevel`

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: 7-day token expiration
- **Account Lockout**: 5 failed attempts = 15 minute lock
- **Session Management**: Device tracking, revocation
- **Access Logging**: All actions logged for audit
- **File Integrity**: SHA-256 hash verification
- **Secure Storage**: Files encrypted at rest with AES-256-GCM

## Project Structure

```
server/
├── src/
│   ├── index.js              # Express app entry point
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── File.js           # File metadata model
│   │   ├── ShareLink.js      # Share link model
│   │   ├── SecureNote.js     # Encrypted notes model
│   │   ├── DeviceSession.js  # Device session model
│   │   ├── AccessLog.js      # Activity logging model
│   │   └── index.js          # Model exports
│   ├── routes/
│   │   ├── auth.routes.js    # Authentication routes
│   │   ├── file.routes.js    # File management routes
│   │   ├── share.routes.js   # Sharing routes
│   │   ├── note.routes.js    # Secure notes routes
│   │   ├── device.routes.js  # Device management routes
│   │   ├── analytics.routes.js # Analytics routes
│   │   ├── crypto.routes.js  # Key exchange routes
│   │   └── index.js          # Route exports
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT authentication
│   │   ├── encryption.middleware.js # Request/response encryption
│   │   ├── upload.middleware.js    # File upload handling
│   │   └── index.js                # Middleware exports
│   └── utils/
│       └── crypto.js         # Cryptographic utilities
├── keys/                     # RSA keys (auto-generated)
├── uploads/                  # Encrypted file storage
├── .env                      # Environment variables
└── package.json
```

## Running the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server will start at `http://localhost:5000`

## Testing the API

```bash
# Health check
curl http://localhost:5000/api/health

# Get server public key
curl http://localhost:5000/api/crypto/server-public-key

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## License

MIT
