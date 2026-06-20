# SecureTransfe

A full-stack secure file transfer application with end-to-end RSA+AES hybrid encryption.

## 🔐 Security Features

- **RSA-2048-OAEP**: Asymmetric encryption for key exchange
- **AES-256-GCM**: Symmetric encryption for data (authenticated encryption)
- **Hybrid Encryption**: Best of both worlds - security of RSA, speed of AES
- **Encrypted Storage**: Files stored encrypted on server filesystem
- **Password Protection**: Optional password on share links
- **Device Management**: Track and revoke active sessions
- **Access Logging**: Complete audit trail of all actions

## 📁 Project Structure

```
is project/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Encryption, Theme)
│   │   ├── lib/           # Utilities (crypto.js)
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── package.json
│
├── server/                 # Express.js Backend
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, encryption, upload
│   │   └── utils/         # Crypto utilities
│   ├── keys/              # RSA keys (auto-generated)
│   ├── uploads/           # Encrypted file storage
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/securetransfer
JWT_SECRET=your-secret-key-here
PORT=5000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600
```

### 3. Start MongoDB

```bash
# Make sure MongoDB is running
mongod
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 5. Access the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔒 Encryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    KEY EXCHANGE                              │
├─────────────────────────────────────────────────────────────┤
│  Client                              Server                  │
│    │                                   │                     │
│    │── GET /server-public-key ────────>│                    │
│    │<──── Server RSA Public Key ───────│                    │
│    │                                   │                     │
│    │── POST /client-public-key ───────>│                    │
│    │<──── Confirmation ────────────────│                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ENCRYPTED REQUEST                         │
├─────────────────────────────────────────────────────────────┤
│  Client:                                                     │
│    1. Generate random AES-256 key                           │
│    2. Encrypt request body with AES-GCM                     │
│    3. Encrypt AES key with Server's RSA public key          │
│    4. Send { encryptedKey, iv, encryptedData }              │
│                                                              │
│  Server:                                                     │
│    1. Decrypt AES key with Server's RSA private key         │
│    2. Decrypt request body with AES key                     │
│    3. Process request                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FILE STORAGE                              │
├─────────────────────────────────────────────────────────────┤
│  Upload:                                                     │
│    1. Receive file from client                              │
│    2. Generate unique AES key + IV                          │
│    3. Encrypt file with AES-256-GCM                         │
│    4. Save encrypted file to disk                           │
│    5. Store key/IV in database                              │
│                                                              │
│  Download:                                                   │
│    1. Retrieve encryption key/IV from database              │
│    2. Read encrypted file from disk                         │
│    3. Decrypt with AES-256-GCM                              │
│    4. Send decrypted file to client                         │
└─────────────────────────────────────────────────────────────┘
```

## 📋 API Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| **Crypto** | `GET /api/crypto/server-public-key` | Get server's RSA key |
| **Auth** | `POST /api/auth/register` | Register user |
| **Auth** | `POST /api/auth/login` | Login user |
| **Files** | `POST /api/files/upload` | Upload file |
| **Files** | `GET /api/files` | List files |
| **Files** | `GET /api/files/:id/download` | Download file |
| **Shares** | `POST /api/shares/create` | Create share link |
| **Shares** | `GET /api/shares/:token` | Access shared file |
| **Notes** | `POST /api/notes` | Create encrypted note |
| **Devices** | `GET /api/devices` | List active sessions |
| **Analytics** | `GET /api/analytics/dashboard` | Get statistics |

## 🛠️ Technology Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Web Crypto API (RSA/AES)
- Axios

### Backend
- Node.js / Express
- MongoDB / Mongoose
- Node.js Crypto (RSA/AES)
- JWT Authentication
- Multer (file uploads)

## 📄 License

MIT
