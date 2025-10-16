# 🗂️ Private Data Manager (PDM) - Nillion Browser Extension

**A browser extension for Nillion's Private Storage that gives non-developers full control over their User Owned Collections.**

This extension provides a complete user-facing interface for managing private data on Nillion Network without requiring developer skills or trusting apps with your keys.

## Private Data Manager

This project is a submission for the **Nillion Private Data Manager**, providing:

✅ **DID & Keypair Management** - Securely generates and stores user DIDs in browser  
✅ **Private Data Dashboard** - Create, view, and delete encrypted passwords in User Owned Collections  
✅ **Permission Management** - Grant and revoke app access with granular read/write/execute controls  
✅ **User-Owned Collections** - Full control over your private data without trusting third parties  
✅ **No Backend Required** - Pure browser-based implementation using Nillion's SecretVaults-ts library
---

### 1. **DID Generation and Storage** ✅
- **Secure Browser Storage**: User's DID and keypair are generated using `@nillion/nuc` Keypair API
- **Chrome Local Storage**: Private keys stored securely in Chrome's local storage (browser-encrypted)
- **No External Dependencies**: No backend servers or third-party key management
- **Automatic DID Creation**: First-time users get a DID automatically on extension install

### 2. **Private Data Dashboard** ✅
- **Create Data**: Save encrypted passwords to Nillion User Owned Collections
- **View Data**: List all stored passwords with decryption on-demand
- **Delete Data**: Remove passwords from Nillion network completely
- **Collection Management**: Uses `SecretVaultUserClient` for all data operations
- **Schema Support**: Custom password schema with `%allot` secret sharing

### 3. **Permission Management UI** ✅
- **Grant Access**: Share password access to other DIDs with granular permissions
- **Revoke Access**: Remove access from previously granted DIDs
- **Permission Types**: Read, Write, and Execute permissions via ACL
- **User Consent Flow**: Modal dialogs for permission actions with DID validation

### 4. **User Owned Collections** ✅
- **Collection ID**: `4c728893-3034-42cd-bdf6-d5bb011daac1`
- **Collection Name**: `nillion-password-manager`
- **User as Owner**: Each user owns their data via their DID
- **No App Control**: Apps cannot access data without explicit user permission
- **Revocable Access**: Users can revoke app permissions anytime
- **Multi-Account Support**: Store multiple passwords per website with labels (Work, Personal, etc.)

---

## 🚀 Key Features

### 🔐 **Secure Identity Management**
- Browser-based DID generation (no server required)
- Keypair stored in Chrome's encrypted local storage
- Support for multiple user profiles
- DID format: `did:nil:[public-key-hex]`

### 📊 **Private Data Dashboard**
- **Password Manager UI**: View all stored passwords in popup with labels
- **Multi-Account Support**: Store multiple passwords per website (Work, Personal, etc.)
- **Label Management**: Organize passwords with custom labels
- **Auto-fill Integration**: Inject password fields on websites
- **Current Site Highlighting**: Shows passwords for active website first
- **Copy to Clipboard**: Decrypt and copy passwords securely

### 🔑 **Permission Management**
- **Grant Access**: Share specific passwords with other DIDs
- **Revoke Access**: Remove permissions with one click
- **ACL Controls**: Read/Write/Execute permission granularity
- **Visual Feedback**: Success/error states for all operations

### 🛡️ **Privacy-First Architecture**
- **No Backend**: Pure browser extension, no server communication
- **User-Controlled Keys**: Extension never sends private keys anywhere
- **Encrypted Storage**: Passwords encrypted with Nillion's secret sharing
- **Decentralized Network**: Data distributed across 3 Nillion DB nodes

---

## ⚙️ Required Technologies 

✅ **Nillion Private Storage** - User Owned Collections for password storage  
✅ **SecretVaults-ts Library** - `@nillion/secretvaults` for all Nillion operations  
✅ **Browser Extension APIs** - Chrome Manifest V3 with service worker  
✅ **Secure Keypair Storage** - Chrome local storage for DID/keypair management  

### Tech Stack:
- **Nillion SDK**: `@nillion/secretvaults`, `@nillion/nuc`
- **Extension Platform**: Chrome/Chromium Manifest V3
- **Build Tool**: Webpack 5 with browser polyfills
- **Storage**: Chrome Storage API (local + sync)
- **Communication**: Long-lived port connections for async operations

### Collection Schema:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "_id": {
        "type": "string",
        "description": "Unique identifier (UUID)"
      },
      "website": {
        "type": "string",
        "description": "Website hostname (e.g., 'github.com')"
      },
      "label": {
        "type": "string",
        "description": "User-defined label (e.g., 'Work', 'Personal')"
      },
      "password": {
        "type": "object",
        "properties": {
          "%share": {
            "type": "string",
            "description": "Encrypted password using Nillion secret sharing"
          }
        },
        "required": ["%share"]
      }
    },
    "required": ["_id", "website", "label", "password"]
  }
}
```

**Benefits of This Schema**:
- ✅ **Multi-Account Support**: Store multiple passwords per website with unique labels
- ✅ **User Organization**: Labels help users distinguish between accounts (Work vs Personal)
- ✅ **Query Flexibility**: Can filter by website and label
- ✅ **Privacy**: Only `password` field is encrypted with `%share` (secret sharing)

---


## 🎬 Video Demo & Documentation

### � **Video Walkthrough** (≤5 minutes)
- **DID Generation**: Shows automatic keypair creation on first install
- **Password Storage**: Demonstrates creating encrypted password in Nillion collection
- **Auto-fill Flow**: Shows password field detection and auto-fill feature
- **Permission Granting**: Demonstrates granting read/write access to another DID
- **Permission Revocation**: Shows revoking access from a previously granted DID
- **Data Deletion**: Demonstrates removing passwords from Nillion network

[📹 Watch Demo Video](link-to-demo-video)

### 📚 **Complete Documentation**

#### 1. **DID Generation & Storage**
- **Generation**: Uses `Keypair.generate()` from `@nillion/nuc`
- **Storage**: Private key stored in `chrome.storage.local` (browser-encrypted)
- **Format**: DID follows Nillion standard `did:nil:[64-char-hex-pubkey]`
- **Persistence**: Keypair persists across browser sessions
- **Security**: Private key never leaves the browser, no network transmission

#### 2. **Data Operations (Create, List, View, Delete)**

**Create (Store Password)**:
```javascript
// User visits website, generates password with label
// Extension calls:
userClient.createData({
  owner: userDid,
  collection: COLLECTION_ID,
  data: [{
    _id: uuid,
    website: websiteName,      // e.g., "github.com"
    label: label,              // e.g., "Work", "Personal"
    password: { '%allot': encryptedPassword }
  }]
})
```

**List (View All Passwords)**:
```javascript
// Popup loads, fetches all user data
dataRefs = await userClient.listDataReferences()
// Returns array of {collection, document} references
```

**View (Read Specific Password)**:
```javascript
// User clicks password, extension decrypts
record = await userClient.readData({
  collection: collectionId,
  document: documentId
})
// Returns decrypted password for copying/auto-fill
```

**Delete (Remove Password)**:
```javascript
// User confirms deletion
await userClient.deleteData({
  collection: collectionId,
  document: documentId
})
// Removes data from all Nillion nodes
```

**Note**:Grant access & Revoke Access is limited & working for few did's hoping for the upcoming patch update team will fix it  

#### 3. **Permission Management (Grant/Revoke)**

**Grant Access Flow**:
1. User clicks "🔐 Share" on a password
2. Modal prompts for grantee DID input
3. User enters `did:nil:...` and clicks "Grant Access"
4. Extension validates DID format
5. Calls `userClient.grantAccess()` with ACL:
   ```javascript
   {
     grantee: granteeDid,
     read: true,
     write: true,
     execute: true
   }
   ```
6. Success notification 


**Revoke Access Flow**:
1. User enters same DID in share modal
2. Clicks "Revoke Access"
3. Extension calls `userClient.revokeAccess()`
4. ACL entry removed from all Nillion nodes
5. Grantee loses immediate access to password

**Permission Types**:
- **Read**: Grantee can decrypt and view password
- **Write**: Grantee can update password value
- **Execute**: Grantee can run computations on encrypted data

---

## 🔧 Installation & Setup

### Prerequisites
- Chrome/Chromium browser (v99+)
- Node.js 18+ and npm
- Nillion Builder credentials (API key + Collection ID)

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/Nith567/nillion-chrome-extension.git
   cd nillion-chrome-extension
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Nillion**
   
   Edit `src/nillion-config.js` or `src/background-with-nillion.js`:
   ```javascript
   const NILLION_CONFIG = {
     BUILDER_PRIVATE_KEY: 'your-builder-private-key-here',
     COLLECTION_ID: 'your-collection-id-here',
     // ... rest of config
   };
   ```

4. **Build Extension**
   ```bash
   npm run build
   ```
   This creates the `dist/` folder with all bundled files.

5. **Load in Chrome**
   - Open Chrome: `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **"Load unpacked"**
   - Select the project root folder (or `dist/` if specified)
   - Extension icon (🔐) appears in toolbar

6. **Test the Extension**
   - Visit any website with password fields (e.g., github.com/login)
   - Click password field → see auto-fill icon (🔑) and lock icon (🔐)
   - Click extension icon → see password dashboard
   - Save a password → verify in popup

---

## 🎯 How It Works (End-to-End Flow)

### 🔑 **First-Time User Flow**

1. **Extension Install**
   - User installs extension from Chrome Web Store (or loads unpacked)
   - Background service worker initializes

2. **DID Generation** (Automatic)
   - `Keypair.generate()` creates new Ed25519 keypair
   - Private key stored in `chrome.storage.local` (encrypted by browser)
   - DID derived: `did:nil:[public-key-hex]`
   - User never sees private key (handled automatically)

3. **Builder Registration**
   - Extension connects to Nillion using builder credentials
   - Creates `SecretVaultUserClient` for user's DID

### 💾 **Storing a Password**

1. User visits website (e.g., `github.com`)
2. Content script detects password field
3. Injects two icons:
   - 🔑 **Auto-fill icon** (if password exists)
   - � **Lock icon** (to save new password)
4. User enters password and clicks lock icon
5. Extension generates UUID for document
6. Creates data with schema:
   ```javascript
   {
     _id: "uuid",
     website: "github.com",
     label: "Work",              // User-provided label
     password: {
       '%allot': "user-password-here"  // Secret shared
     }
   }
   ```
7. Calls `userClient.createData()` → stored in Nillion collection
8. Success notification shown

### 🔍 **Viewing Passwords**

1. User clicks extension icon → popup opens
2. Popup connects to background via long-lived port
3. Background calls `userClient.listDataReferences()`
4. For each reference, calls `userClient.readData()` to decrypt
5. Passwords displayed in list (current site first)
6. User can:
   - **Copy** password to clipboard
   - **Share** access with another DID
   - **Delete** password permanently

### 🔓 **Auto-filling a Password**

1. User revisits website (e.g., `github.com`)
2. Content script detects password field
3. Shows 🔑 auto-fill icon
4. User clicks icon
5. Content script sends message to background
6. Background queries: `readPasswordByName('github.com')`
7. Decrypts password from Nillion
8. Returns to content script
9. Auto-fills password field

### 🤝 **Granting Access to Another User**

1. **User A** (Owner) opens password dashboard
2. Clicks "🔐 Share" on a password
3. Modal prompts: "Enter Grantee DID"
4. **User A** enters **User B's DID**: `did:nil:030de5dc...`
5. Selects permissions (Read ✅ Write ✅ Execute ✅)
6. Clicks "Grant Access"
7. Extension calls:
   ```javascript
   userClient.grantAccess({
     collection: collectionId,
     document: documentId,
     acl: {
       grantee: "did:nil:030de5dc...",
       read: true,
       write: true,
       execute: true
     }
   })
   ```
8. Nillion nodes process ACL update
9. **User B** can now access the password using their own `userClient`

### 🚫 **Revoking Access**

1. **User A** opens share modal again
2. Enters same **User B's DID**
3. Clicks "Revoke Access"
4. Extension calls:
   ```javascript
   userClient.revokeAccess({
     collection: collectionId,
     document: documentId,
     grantee: "did:nil:030de5dc..."
   })
   ```
5. ACL entry removed
6. **User B** immediately loses access

### 🗑️ **Deleting a Password**

1. User clicks "🗑️ Delete" on a password
2. Confirmation dialog: "Delete password for github.com?"
3. User confirms
4. Extension calls:
   ```javascript
   userClient.deleteData({
     collection: collectionId,
     document: documentId
   })
   ```
5. Data removed from all 3 Nillion nodes
6. Password list refreshes automatically

---

## 🏗️ Architecture & Design

### Extension Components

```
┌─────────────────────────────────────────────────────┐
│                  Chrome Extension                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌────────────────────────────┐   │
│  │   Popup UI   │  │   Background Service       │   │
│  │              │  │   Worker                   │   │
│  │ - Dashboard  │◄─┤                           │   │
│  │ - Copy       │  │ - NillionManager          │   │
│  │ - Share      │  │ - UserClient              │   │
│  │ - Delete     │  │ - BuilderClient           │   │
│  └──────────────┘  │ - DID Management          │   │
│                    └────────────────────────────┘   │
│                             ▲                        │
│  ┌──────────────────────────┘                        │
│  │                                                    │
│  │  ┌────────────────────────────────┐               │
│  │  │   Content Script               │               │
│  └─►│                                │               │
│     │ - Detects password fields      │               │
│     │ - Injects auto-fill icons      │               │
│     │ - Fills passwords              │               │
│     └────────────────────────────────┘               │
│                                                       │
└─────────────────────────────────────────────────────┘
                         │
                         │ Nillion SDK
                         ▼
┌─────────────────────────────────────────────────────┐
│            Nillion Network (Testnet)                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ DB Node  │  │ DB Node  │  │ DB Node  │           │
│  │   #1     │  │   #2     │  │   #3     │           │
│  │          │  │          │  │          │           │
│  │ nildb-   │  │ nildb-   │  │ nildb-   │           │
│  │ stg-n1   │  │ stg-n2   │  │ stg-n3   │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                       │
│  Collection: 4c728893-3034-42cd-bdf6-d5bb011daac1    │
│  Name: nillion-password-manager                      │
│  Schema: { website, label, password: { %allot } }    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

**1. User-Owned Collections**
- Each user's data is owned by their DID (not the builder)
- Apps cannot access data without explicit user grant
- Users can revoke access anytime

**2. Browser-Only Implementation**
- No backend servers required
- All cryptographic operations in browser
- Private keys never transmitted

**3. Long-Lived Connections**
- Uses Chrome's `port` API for async operations
- No timeout issues with slow Nillion network calls
- Better error handling and user feedback

**4. Caching Strategy**
- Passwords cached for 5 minutes after first load
- Reduces Nillion network calls
- Cache invalidated on create/delete operations

**5. Security Considerations**
- ⚠️ **Builder Private Key Visible**: Browser extensions can't hide keys from users
- ✅ **User Keys Protected**: User's private keys in browser-encrypted storage
- ✅ **No Server Trust**: No third-party servers to compromise
- ⚠️ **Production Needs**: Backend proxy for builder key in production

---

## � File Structure

```
chrome-password-manager-extension/
├── src/
│   ├── background-with-nillion.js    # Main service worker with Nillion logic
│   │                                  # - DID generation & storage
│   │                                  # - SecretVaultUserClient operations
│   │                                  # - CRUD operations (create, read, delete)
│   │                                  # - Grant/Revoke access management
│   │                                  # - Long-lived port message handlers
│   │
│   ├── nillion-config.js              # Nillion network configuration
│   │                                  # - Builder credentials
│   │                                  # - Collection ID
│   │                                  # - Network URLs (nilchain, nilauth, nildb)
│   │
│   ├── nillion-manager.js             # Nillion client wrapper (if separate)
│   │
│   ├── popup-with-nillion.js          # Popup interface logic
│   │                                  # - Password list display
│   │                                  # - Copy to clipboard
│   │                                  # - Share/Delete actions
│   │
│   └── stubs.js                       # Browser polyfill stubs
│                                       # - Buffer, process, crypto globals
│
├── dist/                              # Built extension (generated by webpack)
│   ├── background.js                  # Bundled background script (3+ MB)
│   ├── popup.js                       # Bundled popup script
│   ├── content-script.js              # Content script (copied)
│   ├── popup-passwords.html           # Popup HTML
│   ├── popup-passwords.js             # Popup dashboard script
│   ├── manifest.json                  # Extension manifest (copied)
│   └── pdm.png                        # Extension icon
│
├── content-script.js                  # Injected into web pages
│                                       # - Detects password fields
│                                       # - Adds auto-fill & save icons
│                                       # - Communicates with background
│
├── popup-passwords.html               # Main popup UI
│                                       # - Password dashboard
│                                       # - Share modal
│                                       # - Delete confirmations
│
├── popup-passwords.js                 # Popup dashboard logic
│                                       # - Load passwords via port
│                                       # - Copy password functionality
│                                       # - Grant/Revoke UI handlers
│
├── manifest.json                      # Chrome extension manifest
│                                       # - Manifest V3
│                                       # - Service worker config
│                                       # - CSP with wasm-unsafe-eval
│                                       # - Permissions (storage, tabs)
│
├── webpack.config.js                  # Build configuration
│                                       # - Browser polyfills (crypto, buffer, etc.)
│                                       # - CopyPlugin for static files
│
├── package.json                       # Dependencies
│                                       # - @nillion/secretvaults
│                                      
│                                       # - Webpack & plugins
│
├── NILLION_SETUP.md                   # Nillion configuration guide
├── README.md                          # documentation and explanation
└── setup.sh                           # Setup script (if applicable)
```

### Key Files Explained

**`background-with-nillion.js`** 
- Heart of the extension
- Manages `SecretVaultBuilderClient` and `SecretVaultUserClient`
- DID generation: `Keypair.generate()` → stored in `chrome.storage.local`
- CRUD operations:
  - `savePassword()` → `userClient.createData()`
  - `readPasswordByName()` → `userClient.readData()`
  - `deletePassword()` → `userClient.deleteData()`
  - `getAllPasswordsForPopup()` → lists & decrypts all passwords
- Access control:
  - `grantAccess()` → `userClient.grantAccess(acl)`
  - `revokeAccess()` → `userClient.revokeAccess()`

**`content-script.js`** (671 lines)
- Injects into every webpage
- Detects password input fields
- Adds clickable icons (auto-fill 🔑, save 🔐)
- Sends messages to background for password operations

**`popup-passwords.js`** (559 lines)
- Password dashboard UI logic
- Long-lived port connections (no timeout!)
- Copy password: reads from cache, copies to clipboard
- Share modal: grants/revokes access to DIDs
- Delete confirmation: removes from Nillion network

**`manifest.json`**
- Manifest V3 (required for Chrome)
- Service worker: `dist/background.js`
- CSP: `script-src 'self' 'wasm-unsafe-eval'` (for Nillion WASM)
- Permissions: `storage`, `tabs`, `activeTab`
- Content scripts: injected into all HTTP(S) pages

---

## 🧪 Testing & Usage

### Testing the Extension

1. **Load Extension**
   ```bash
   # After building
   npm run build
   
   # Load in Chrome
   # chrome://extensions/ → "Load unpacked" → select project folder
   ```

2. **Test DID Generation**
   - Open Chrome DevTools → Console
   - Check background service worker logs
   - Should see: `✅ User DID: did:nil:03f314640c...`

3. **Test Password Storage**
   - Visit: `https://github.com/login`
   - Click password field
   - See � lock icon appear
   - Enter password "test123"
   - Click lock icon → saves to Nillion
   - Check logs: `✅ Password ACTUALLY saved to Nillion collection`

4. **Test Password Retrieval**
   - Revisit `https://github.com/login`
   - See 🔑 auto-fill icon
   - Click icon → password fills automatically

5. **Test Dashboard**
   - Click extension icon in toolbar
   - Click "Show My Passwords" button
   - See list of all saved passwords with labels
   - Each password shows: Website + Label (e.g., "github.com 🏷️ Work")
   - Current site (github.com) should be highlighted at top

6. **Test Copy Functionality**
   - In dashboard, click "📋 Copy" on any password
   - Password copied to clipboard (decrypted)
   - Button changes to "✅ Copied!" briefly

7. **Test Grant Access**
   - Click "🔐 Share" on a password
   - Enter another DID: `did:nil:030de5dc1ef86d95c3c9660302552fe28458596bf076d8cadab406e0effbb0d9b6`
   - Click "✅ Grant Access"
   - Check logs for ACL creation
   - See success alert

8. **Test Revoke Access**
   - In same share modal, enter same DID
   - Click "❌ Revoke Access"
   - Access removed from Nillion nodes
   - See success alert

9. **Test Delete**
   - Click "🗑️ Delete" on a password
   - Confirm deletion
   - Password removed from Nillion
   - Dashboard refreshes automatically


---

## 🔐 Security Considerations

### ✅ What's Secure

1. **DID Generation**
   - Uses `@nillion/nuc` Keypair.generate() (cryptographically secure)
   - Ed25519 keypair (industry standard)
   - Private key stored in Chrome's encrypted local storage

2. **Data Encryption**
   - Passwords encrypted with Nillion's `%allot` secret sharing
   - Distributed across 3 DB nodes
   - Decryption requires user's private key

3. **No Server Communication**
   - Pure browser extension
   - Private keys never transmitted
   - All operations client-side

4. **User-Controlled Access**
   - Explicit grant/revoke flows
   - Users see exactly what they're sharing
   - No automatic app permissions

### 🛡️ Production Recommendations

For production deployment:

1. **Backend Proxy for Builder Key**
   ```
   Browser Extension → Backend API → Nillion Network
                       (holds builder key)
   ```

2. **Hardware Wallet Integration**
   - Store user's private key in hardware wallet
   - Sign operations without exposing key

3. **Multi-Signature Schemes**
   - Require multiple approvals for sensitive operations
   - Threshold encryption for data access

4. **Audit Logging**
   - Log all grant/revoke operations
   - Show activity history to users

---


## 📚 Additional Resources

### Nillion Documentation
- **Private Storage Guide**: https://docs.nillion.com/build/private-storage
- **SecretVaults-ts Library**: https://docs.nillion.com/build/private-storage/secretvaults-ts
- **User Owned Collections**: https://docs.nillion.com/build/private-storage/user-owned-collections
- **ACL & Permissions**: https://docs.nillion.com/build/private-storage/access-control

### Browser Extension Development
- **Chrome Extensions Docs**: https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/mv3/intro/
- **Service Workers**: https://developer.chrome.com/docs/extensions/mv3/service_workers/
- **Content Scripts**: https://developer.chrome.com/docs/extensions/mv3/content_scripts/

### Nillion Network
- **Testnet RPC**: http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz
- **NilAuth**: https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz
- **NilDB Nodes**:
  - https://nildb-stg-n1.nillion.network
  - https://nildb-stg-n2.nillion.network
  - https://nildb-stg-n3.nillion.network




## 🤝 Contributing & Development

### Local Development

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run build -- --watch

# Or production build
npm run build
```

### Testing Changes

1. Make code changes in `src/`
2. Run build: `npm run build`
3. Reload extension: `chrome://extensions/` → Click "Reload"
4. Test in browser


**Nillion Integration**: Enhanced with Nillion Private Storage for decentralized, encrypted data management
---

## 🎉 Summary

This **Private Data Manager** extension demonstrates:

✅ **User-Friendly Privacy**: Non-developers can manage encrypted data on Nillion  
✅ **Full Data Control**: Users own their DIDs, keys, and data completely  
✅ **No Trusted Apps**: Explicit permission grants, revocable anytime  
✅ **Browser-Only**: No backend, no servers, no external dependencies  
✅ **Production-Ready Architecture**: Clean separation of concerns, extensible design  

