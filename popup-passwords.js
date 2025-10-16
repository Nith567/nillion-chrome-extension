// Popup script for displaying all passwords with copy functionality
let currentSite = null;
let cachedPasswords = []; // Store decrypted passwords from initial load

// Get current site from active tab
async function getCurrentSite() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            const url = new URL(tab.url);
            return url.hostname.replace('www.', '');
        }
    } catch (error) {
        console.log('Could not get current site:', error);
    }
    return null;
}

// Initialize - show the button
function initialize() {
    console.log('🚀 POPUP: Initializing...');
    
    // Show the show passwords button
    document.getElementById('showPasswordsBtn').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('noPasswords').style.display = 'none';
    
    // Add event listeners (no inline onclick due to CSP)
    const showPasswordsBtn = document.querySelector('.show-passwords-btn');
    if (showPasswordsBtn) {
        showPasswordsBtn.addEventListener('click', () => loadPasswords());
    }
    
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', () => loadPasswords());
    });
}

// Load all passwords from Nillion - LONG-LIVED CONNECTION (no timeout!)
async function loadPasswords() {
    console.log('🚀 POPUP: Loading passwords...');
    
    const passwordsList = document.getElementById('passwordsList');
    
    // Clear passwords list first
    passwordsList.innerHTML = '';
    
    // Hide the show passwords button once clicked
    document.getElementById('showPasswordsBtn').style.display = 'none';
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('noPasswords').style.display = 'none';
    
    try {
        // Get current site first
        currentSite = await getCurrentSite();
        console.log('🌐 POPUP: Current site:', currentSite);
        
        // Use LONG-LIVED CONNECTION instead of sendMessage (no timeout!)
        console.log('📤 POPUP: Creating long-lived connection...');
        
        const passwords = await new Promise((resolve, reject) => {
            // Create a persistent port connection
            const port = chrome.runtime.connect({ name: 'passwordsPort' });
            
            let responseReceived = false;
            
            // Listen for response
            port.onMessage.addListener((msg) => {
                console.log('✅ POPUP: Received message via port:', msg);
                if (msg.type === 'passwords') {
                    responseReceived = true;
                    port.disconnect();
                    resolve(msg.data || []);
                } else if (msg.type === 'error') {
                    responseReceived = true;
                    port.disconnect();
                    reject(new Error(msg.error));
                }
            });
            
            // Handle disconnection
            port.onDisconnect.addListener(() => {
                if (!responseReceived) {
                    console.error('❌ POPUP: Port disconnected before response');
                    reject(new Error('Port disconnected'));
                }
            });
            
            // Send the request
            port.postMessage({
                action: 'getAllPasswordsForPopup',
                data: { currentSite }
            });
            
            console.log('📤 POPUP: Request sent via port');
        });
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        
        console.log('📋 POPUP: Got passwords:', passwords);
        console.log('📋 POPUP: Count:', passwords?.length);
        
        if (!passwords || passwords.length === 0) {
            console.log('⚠️ POPUP: No passwords found');
            document.getElementById('noPasswords').style.display = 'block';
            return;
        }
        
        console.log('✅ POPUP: Displaying', passwords.length, 'passwords');
        
        // Cache the passwords with decrypted data
        cachedPasswords = passwords;
        
        displayPasswords(passwords);
        
    } catch (err) {
        console.error('❌ POPUP: Load passwords error:', err);
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        
        // Show error
        document.getElementById('error').style.display = 'block';
    }
}

// Display passwords with copy buttons (CSP-compliant)
function displayPasswords(passwords) {
    console.log('🎨 POPUP: Displaying passwords:', passwords);
    const passwordsList = document.getElementById('passwordsList');
    passwordsList.innerHTML = '';
    
    passwords.forEach((pwd, index) => {
        const passwordItem = document.createElement('div');
        passwordItem.className = 'password-item';
        if (pwd.websiteName === currentSite) {
            passwordItem.classList.add('current-site');
        }
        
        passwordItem.innerHTML = `
            <div class="website-name">
                <span class="site-icon">🌐</span>
                ${pwd.websiteName}
                ${pwd.websiteName === currentSite ? '<span class="current-badge">Current Site</span>' : ''}
            </div>
            <div class="password-display">
                <span class="password-text">••••••••</span>
                <button class="copy-btn" data-index="${index}" title="Copy password">
                    📋 Copy
                </button>
                <button class="share-btn" data-index="${index}" title="Share access">
                    🔐 Share
                </button>
                <button class="delete-btn" data-index="${index}" title="Delete password">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        passwordsList.appendChild(passwordItem);
    });
    
    // Add event listeners to all copy buttons (CSP-compliant way)
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            const pwd = passwords[index];
            
            // Use cached decrypted password (already from readData)
            await copyPassword(pwd, e.target);
        });
    });

    // Add event listeners to all share buttons (CSP-compliant way)
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            const pwd = passwords[index];
            openShareDialog(pwd);
        });
    });

    // Add event listeners to all delete buttons (CSP-compliant way)
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            const pwd = passwords[index];
            deletePassword(pwd, e.target);
        });
    });
    
    console.log('✅ POPUP: Passwords displayed with event listeners');
}

// Copy password using cached decrypted data (no need to read again)
async function copyPassword(pwd, buttonElement) {
    try {
        console.log('� POPUP: Copying password from cache:', pwd.websiteName);
        
        // Disable button and show loading
        buttonElement.disabled = true;
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '📋 Copying...';
        
        // Password is already decrypted from getAllPasswordsForPopup
        const decryptedPassword = pwd.password;
        
        if (!decryptedPassword) {
            throw new Error('No password data available');
        }
        
        // Copy to clipboard
        await navigator.clipboard.writeText(decryptedPassword);
        console.log('✅ POPUP: Password copied to clipboard');
        
        // Visual feedback
        buttonElement.textContent = '✅ Copied!';
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('copied');
            buttonElement.disabled = false;
        }, 2000);
        
    } catch (err) {
        console.error('❌ POPUP: Failed to copy password:', err);
        
        // Re-enable button
        buttonElement.disabled = false;
        buttonElement.textContent = '❌ Failed';
        
        setTimeout(() => {
            buttonElement.textContent = '📋 Copy';
        }, 2000);
    }
}

// Copy password to clipboard (legacy function - kept for compatibility)
async function copyToClipboard(password, buttonElement) {
    try {
        await navigator.clipboard.writeText(password);
        console.log('✅ Password copied to clipboard');
        
        // Visual feedback
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '✅ Copied!';
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('❌ Failed to copy:', err);
        buttonElement.textContent = '❌ Failed';
        setTimeout(() => {
            buttonElement.textContent = '📋 Copy';
        }, 2000);
    }
}

// Delete password from Nillion
async function deletePassword(pwd, buttonElement) {
    try {
        // Confirm deletion
        const confirmDelete = confirm(`Are you sure you want to delete the password for "${pwd.websiteName}"?`);
        if (!confirmDelete) {
            return;
        }

        console.log('🗑️ POPUP: Deleting password:', pwd);
        
        // Disable button and show loading state
        buttonElement.disabled = true;
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Deleting...';
        
        // Use long-lived connection for delete
        await new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: 'deletePort' });
            
            let responseReceived = false;
            
            port.onMessage.addListener((msg) => {
                console.log('✅ POPUP: Delete response:', msg);
                if (msg.type === 'deleted') {
                    responseReceived = true;
                    port.disconnect();
                    resolve(msg.data);
                } else if (msg.type === 'error') {
                    responseReceived = true;
                    port.disconnect();
                    reject(new Error(msg.error));
                }
            });
            
            port.onDisconnect.addListener(() => {
                if (!responseReceived) {
                    console.error('❌ POPUP: Delete port disconnected before response');
                    reject(new Error('Port disconnected'));
                }
            });
            
            // Send delete request
            port.postMessage({
                action: 'deletePassword',
                data: {
                    collection: pwd.collection,
                    document: pwd.document
                }
            });
        });
        
        console.log('✅ Password deleted successfully');
        
        // Show success message
        buttonElement.textContent = '✅ Deleted!';
        buttonElement.classList.add('deleted');
        
        // Reload passwords after 1 second
        setTimeout(() => {
            loadPasswords();
        }, 1000);
        
    } catch (err) {
        console.error('❌ Failed to delete password:', err);
        alert('Failed to delete password. Please try again.');
        buttonElement.disabled = false;
        buttonElement.textContent = '🗑️ Delete';
    }
}

// Open share dialog for managing access
function openShareDialog(pwd) {
    console.log('🔐 POPUP: Opening share dialog for:', pwd);
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'share-dialog';
    
    dialog.innerHTML = `
        <div class="share-header">
            <h3>🔐 Manage Access: ${pwd.websiteName}</h3>
            <button class="close-dialog-btn">✕</button>
        </div>
        <div class="share-content">
            <label for="grantee-did">Grantee DID:</label>
            <input type="text" id="grantee-did" placeholder="did:nil:..." class="grantee-input">
            
            <div class="share-actions">
                <button class="grant-btn">✅ Grant Access</button>
                <button class="revoke-btn">❌ Revoke Access</button>
            </div>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Add event listeners
    const closeBtn = dialog.querySelector('.close-dialog-btn');
    const grantBtn = dialog.querySelector('.grant-btn');
    const revokeBtn = dialog.querySelector('.revoke-btn');
    const granteeInput = dialog.querySelector('#grantee-did');
    
    // Close dialog
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Grant access
    grantBtn.addEventListener('click', async () => {
        const granteeDid = granteeInput.value.trim();
        if (!granteeDid) {
            alert('Please enter a Grantee DID');
            return;
        }
        
        if (!granteeDid.startsWith('did:nil:')) {
            alert('Invalid DID format. Must start with "did:nil:"');
            return;
        }
        
        await grantAccess(pwd, granteeDid, grantBtn);
    });
    
    // Revoke access
    revokeBtn.addEventListener('click', async () => {
        const granteeDid = granteeInput.value.trim();
        if (!granteeDid) {
            alert('Please enter a Grantee DID');
            return;
        }
        
        if (!granteeDid.startsWith('did:nil:')) {
            alert('Invalid DID format. Must start with "did:nil:"');
            return;
        }
        
        await revokeAccess(pwd, granteeDid, revokeBtn);
    });
}

// Grant access to a password
async function grantAccess(pwd, granteeDid, buttonElement) {
    try {
        console.log('🔐 POPUP: Granting access:', { pwd, granteeDid });
        
        buttonElement.disabled = true;
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Granting...';
        
        await new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: 'accessPort' });
            
            let responseReceived = false;
            
            port.onMessage.addListener((msg) => {
                console.log('✅ POPUP: Grant response:', msg);
                if (msg.type === 'granted') {
                    responseReceived = true;
                    port.disconnect();
                    resolve(msg.data);
                } else if (msg.type === 'error') {
                    responseReceived = true;
                    port.disconnect();
                    reject(new Error(msg.error));
                }
            });
            
            port.onDisconnect.addListener(() => {
                if (!responseReceived) {
                    reject(new Error('Port disconnected'));
                }
            });
            
            port.postMessage({
                action: 'grantAccess',
                data: {
                    collection: pwd.collection,
                    document: pwd.document,
                    granteeDid: granteeDid
                }
            });
        });
        
        console.log('✅ Access granted successfully');
        alert(`✅ Access granted to ${granteeDid.substring(0, 20)}...`);
        
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        
    } catch (err) {
        console.error('❌ Failed to grant access:', err);
        
        // Better error messages
        let errorMsg = 'Failed to grant access';
        if (err.message.includes('not found') || err.message.includes('does not exist')) {
            errorMsg = `DID not found in Nillion network. Please verify the DID exists.`;
        } else if (err.message) {
            errorMsg = `Failed to grant access: ${err.message}`;
        }
        
        alert('❌ ' + errorMsg);
        buttonElement.textContent = '✅ Grant Access';
        buttonElement.disabled = false;
    }
}

// Revoke access to a password
async function revokeAccess(pwd, granteeDid, buttonElement) {
    try {
        console.log('🚫 POPUP: Revoking access:', { pwd, granteeDid });
        
        buttonElement.disabled = true;
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Revoking...';
        
        await new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: 'accessPort' });
            
            let responseReceived = false;
            
            port.onMessage.addListener((msg) => {
                console.log('✅ POPUP: Revoke response:', msg);
                if (msg.type === 'revoked') {
                    responseReceived = true;
                    port.disconnect();
                    resolve(msg.data);
                } else if (msg.type === 'error') {
                    responseReceived = true;
                    port.disconnect();
                    reject(new Error(msg.error));
                }
            });
            
            port.onDisconnect.addListener(() => {
                if (!responseReceived) {
                    reject(new Error('Port disconnected'));
                }
            });
            
            port.postMessage({
                action: 'revokeAccess',
                data: {
                    collection: pwd.collection,
                    document: pwd.document,
                    granteeDid: granteeDid
                }
            });
        });
        
        console.log('✅ Access revoked successfully');
        alert(`✅ Access revoked from ${granteeDid.substring(0, 20)}...`);
        
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        
    } catch (err) {
        console.error('❌ Failed to revoke access:', err);
        
        // Better error messages
        let errorMsg = 'Failed to revoke access';
        if (err.message.includes('not found') || err.message.includes('No access granted') || err.message.includes('does not exist')) {
            errorMsg = `Cannot revoke: No access was granted to this DID. Please grant access first.`;
        } else if (err.message) {
            errorMsg = `Failed to revoke access: ${err.message}`;
        }
        
        alert('❌ ' + errorMsg);
        buttonElement.textContent = '❌ Revoke Access';
        buttonElement.disabled = false;
    }
}

// Run initialization when popup loads
document.addEventListener('DOMContentLoaded', initialize);
