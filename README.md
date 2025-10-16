# Chrome Password Manager with Nillion Integration

A secure Chrome extension that generates and stores passwords using Nillion's decentralized storage network.

### NOTE: 
This project evolved from a **prove of concept** / **sample application** for a chromium based web-browser and originated from the youtube video: https://www.youtube.com/watch?v=bpuomoEUbgQ

Now enhanced with **Nillion Network integration** for decentralized, encrypted password storage.

This extension **does not provide a secure password storage** (as of now 18th March 2022) and therefor it is not recomeded to be used for other than educational purposes.


# Embed app into chromium based web-browsers
Tested Version: [Chromium v99.0.4844.74 (Official Build)]

> cd "PATH TO LOCALLY SAVE PROJECT INTO"

> git clone https://github.com/conaticus/chrome-password-manager-extension


> Enable extension developer mode in your browser on: 
>
> chrome://extensions/

> Now load the project as "unpacked extension":
>
> Click "Load unpacked"
>
> Navigate and select the git cloned folder "chrome-password-manager-extension"
> 
> Password Manager should now be displayed as an installed extension

> Test if the application is working by accessing e.g.:
>
> https://facebook.com/login
>
> A window should display above the login page stating "Enter password for this page"


## 🚀 Features

- **Secure Password Generation**: Uses browser's crypto API for cryptographically secure passwords
- **Nillion Integration**: Store passwords encrypted on Nillion's decentralized network
- **Auto-fill**: Automatically detects password fields and fills saved passwords
- **Local Fallback**: Works locally when Nillion is unavailable
- **User-friendly**: Clean popup interface with password management

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Nillion API Key

1. Visit [Nillion Network API Access](https://docs.nillion.com/build/network-api-access)
2. Create an account and get your API key
3. Subscribe to nilDB services

### 3. Configure API Key

Edit `src/background-with-nillion.js` and replace:

```javascript
const NILLION_CONFIG = {
  API_KEY: 'your-nillion-api-key-here', // Replace with your actual API key
  // ... rest of config
};
```

### 4. Build Extension

```bash
npm run build
```

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this project folder
5. The extension should now appear in your extensions list

## 🎯 How It Works

### Password Generation
- Detects password fields on web pages
- Offers two options:
  - **🔒 Generate with Nillion**: Stores encrypted password on Nillion network
  - **Generate Local**: Stores password in Chrome's local storage

### Password Storage
- **Nillion Storage**: Passwords encrypted with `%share` fields, stored across distributed nodes
- **Local Storage**: Fallback using Chrome's sync storage
- **Auto-fill**: Automatically fills passwords on return visits

### Security Features
- Cryptographically secure password generation
- Decentralized encryption through Nillion
- No passwords stored in plain text
- Browser-only implementation (no external servers)

## 🛠 Development

### File Structure
```
├── src/
│   ├── background-with-nillion.js  # Main extension logic with Nillion
│   ├── popup-with-nillion.js       # Popup interface
│   └── stubs.js                    # Browser compatibility stubs
├── dist/                           # Built files (generated)
├── webpack.config.js               # Browser polyfill configuration
├── package.json                    # Dependencies
└── manifest.json                   # Chrome extension manifest
```

### Build Commands
```bash
npm run build     # Production build
npm run dev       # Development build with watch mode
```

### Browser Compatibility
The extension uses webpack with polyfills to make Nillion's Node.js SDK work in browsers:
- **crypto-browserify**: For cryptographic operations
- **buffer**: For Buffer support
- **process**: For process global
- **stream-browserify**: For stream operations

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Exposure**: API keys in browser extensions are visible to users
2. **Production Setup**: For production use, implement:
   - Server-side API key management
   - Proxy services for sensitive operations
   - Additional authentication layers

3. **Current Implementation**: This is a development/demo setup showing Nillion integration

## 🚨 Troubleshooting

### Common Issues

**"Failed to initialize Nillion"**
- Check your API key is correct
- Ensure you have an active nilDB subscription
- Verify network connectivity

**"Module not found" errors**
- Run `npm install` to install dependencies
- Run `npm run build` to rebuild with polyfills

**Extension won't load**
- Make sure you've built the extension (`npm run build`)
- Check Chrome Developer Tools for console errors
- Verify manifest.json is valid

**Webpack build errors**
- Delete `node_modules` and run `npm install` again
- Check that all polyfill dependencies are installed

### Debug Mode
1. Open Chrome DevTools in the extension popup
2. Check console for Nillion connection status
3. Use "Test Nillion Connection" button in popup

## 📚 Learn More

- [Nillion Documentation](https://docs.nillion.com/)
- [Nillion React Integration](https://docs.nillion.com/build/private-storage/platform-react)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project as a starting point for your own Nillion-powered applications!

