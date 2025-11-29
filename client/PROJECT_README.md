# SecureFileTransferSystem

A comprehensive secure file transfer web application built with React, TailwindCSS, and modern web technologies. This application provides enterprise-grade security features including end-to-end encryption, privacy-aware UI, and comprehensive file management capabilities.

## 🚀 Features

### Core Features
- **End-to-End Encryption**: Files are encrypted on the client-side before upload
- **Zero-Knowledge Architecture**: Server cannot access your encrypted files
- **Secure File Sharing**: Password protection, expiry dates, and download limits
- **Privacy Screen Mode**: Blur sensitive content on screen
- **Dark/Light Theme**: Toggle between light and dark themes
- **Session Management**: Auto-logout timer with session timeout display

### Pages & Functionality

#### 1. Landing Page (`/`)
- Hero section with platform introduction
- How it works (3-step explanation)
- Security awareness banner
- Features grid showcasing major capabilities
- Responsive footer

#### 2. Authentication
- **Signup Page** (`/signup`)
  - Email and password registration
  - Password strength meter with visual feedback
  - Show/hide password toggle
  - Password confirmation validation

- **Login Page** (`/login`)
  - Email/password authentication
  - Session timeout information display
  - Remember me functionality
  - Show/hide password toggle

#### 3. Dashboard (`/dashboard`)
- **Widgets**:
  - Recent files overview
  - Storage usage graph
  - Quick upload shortcut
  - Security tips banner
  - Inbox preview (files shared with you)
  - Device security warnings
  
- **Features**:
  - File search bar
  - Interactive sorting and filtering
  - File type filters (documents, images, invoices, etc.)
  - Drag and drop upload area
  - File categories (invoice, passport, tax, legal, confidential)

#### 4. Upload Page (`/upload`)
- Drag and drop file upload
- File selection via browse
- Upload progress tracking
- Client-side encryption toggle
- File hashing status
- Sensitive content warning
- Automatic file categorization
- Duplicate file detection

#### 5. File Detail Page (`/files/:id`)
- File preview with blur/reveal toggle
- Confidentiality badges
- File metadata display
- Version history viewer
- Access analytics:
  - Views and downloads count
  - Geographic distribution (pie chart)
  - Access timeline (line chart)
  - Time-based activity
- Download and delete options
- Restore previous versions

#### 6. Share Settings Page (`/share/:id`)
- Generate shareable links
- Password protection toggle
- Expiry date/time selector
- Maximum download limit
- Recipient email entry
- One-time access toggle
- Link tracking enable/disable
- Copy link to clipboard

#### 7. Inbox Page (`/inbox`)
- Received files list
- Group by sender tabs
- Unread badges
- One-click download
- File preview
- Auto-delete expired files
- Bulk operations

#### 8. Secure Note Page (`/secure-note`)
- Rich text editor
- Note encryption toggle
- Auto-delete after read option
- Generate shareable note link
- Copy link functionality

#### 9. Settings Page (`/settings`)
- Profile information update
- Change password
- Language selector (English)
- Privacy mode switch
- Two-factor authentication toggle
- Auto-logout timer configuration

#### 10. Device Management Page (`/devices`)
- Active devices list
- Browser type and OS display
- Last login time
- Geographic location (approximate)
- IP address display
- Logout specific devices
- Logout all devices option

#### 11. Help Center Page (`/help`)
- Comprehensive FAQ section
- Security best practices
- Contact support information
- Searchable help content

## 🛠️ Tech Stack

- **Framework**: React 19.2.0
- **Routing**: React Router DOM
- **Styling**: TailwindCSS with custom theme
- **Icons**: Lucide React
- **Charts**: Recharts
- **Build Tool**: Vite
- **Utilities**: 
  - clsx & tailwind-merge (className management)
  - date-fns (date formatting)

## 📦 Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the displayed URL (e.g., `http://localhost:5173`)

## 🏗️ Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Toast.jsx
│   │   └── Navbar.jsx
│   ├── contexts/
│   │   ├── ThemeContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── PrivacyContext.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UploadPage.jsx
│   │   ├── FileDetailPage.jsx
│   │   ├── ShareSettingsPage.jsx
│   │   ├── InboxPage.jsx
│   │   ├── SecureNotePage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── DeviceManagementPage.jsx
│   │   └── HelpCenterPage.jsx
│   ├── lib/
│   │   └── utils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🔒 Security Features

### Client-Side Security
- **Encryption Badge**: Visual indicator when encryption is enabled
- **Zero-Knowledge Mode Tag**: Shows when zero-knowledge encryption is active
- **File Upload Warning**: Prevents upload until encryption is confirmed
- **Password Strength Meter**: Real-time password strength validation
- **Breach Password Alert**: Warns users about weak passwords
- **Sensitive Data Detection**: Auto-detects sensitive content in filenames
- **Blur on Preview**: Sensitive content blurred by default
- **Warn Before Share**: Confirmation before sharing sensitive files

### Real-World Enhancements
- **Offline Upload Queue**: Files queued when offline, uploaded when connection restored
- **Duplicate File Detection**: Client-side hash comparison to detect duplicates
- **Smart Labels**: Auto-categorization (invoice, passport, confidential, tax, legal)
- **Auto Cleanup**: Automatic deletion of expired files
- **Link Usage Visualization**: Analytics for shared link access

## 🎨 UI Components

All components follow Shadcn UI design patterns:
- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Input**: Form inputs with focus states
- **Card**: Content containers with header, content, and footer sections
- **Badge**: Status indicators with variants (success, warning, error, info)
- **Toast**: Notification system with top-right positioning

## 🌙 Theme Support

- Light theme (default)
- Dark theme
- System preference detection
- Persistent theme selection

## 🔐 Privacy Features

- **Privacy Screen Mode**: Blur sensitive content with hover-to-reveal
- **Confidentiality Badges**: Visual indicators for sensitive files
- **Redaction Toggle**: Show/hide sensitive information
- **Session Timeout**: Auto-logout after inactivity
- **Device Tracking**: Monitor all active sessions

## 📊 Analytics & Insights

- File access statistics
- Geographic distribution of views
- Time-based activity charts
- Download tracking
- View count analytics

## 🚦 Getting Started

1. **Sign Up**: Create an account with email and password
2. **Upload Files**: Use drag-and-drop or browse to upload files
3. **Manage Files**: View, organize, and categorize your files
4. **Share Securely**: Generate secure links with custom settings
5. **Monitor Access**: Track who accesses your shared files
6. **Manage Devices**: Review and control device access

## 📝 Notes

- This is a frontend-only implementation with mock data
- For production use, integrate with a backend API
- All encryption features are simulated for demonstration
- File uploads don't persist (demo mode)

## 🤝 Contributing

This is a demonstration project. For a production implementation:
1. Implement real backend API integration
2. Add actual encryption libraries (e.g., Web Crypto API)
3. Implement real authentication (JWT, OAuth)
4. Add file storage (AWS S3, Google Cloud Storage)
5. Implement real-time notifications
6. Add comprehensive testing

## 📄 License

This project is created for educational and demonstration purposes.

## 🎯 Key Highlights

✅ Complete authentication flow
✅ Comprehensive file management
✅ Advanced sharing capabilities
✅ Privacy-focused design
✅ Responsive UI
✅ Dark/Light theme
✅ Analytics and insights
✅ Device management
✅ Security best practices
✅ Help center and documentation

---

**Built with ❤️ using React, TailwindCSS, and modern web technologies**
