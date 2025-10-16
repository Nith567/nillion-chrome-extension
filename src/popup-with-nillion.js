// Simple popup - just display website names from Nillion
const passwordsDiv = document.getElementById("passwords-div");

// Display passwords from Nillion
const displayPasswords = async () => {
    try {
        passwordsDiv.innerHTML = '<p>Loading passwords...</p>';
        
        // Get passwords from background script
        const passwords = await chrome.runtime.sendMessage({
            action: 'listAllUserData'
        });
        
        if (!passwords || passwords.length === 0) {
            passwordsDiv.innerHTML = '<p>Just fetch through nillion daashboard for all ids</p>';
            return;
        }
        
        passwordsDiv.innerHTML = '<h2>Saved Passwords:</h2>';
        
        passwords.forEach(pwd => {
            const nameEl = document.createElement("div");
            nameEl.innerText = pwd.websiteName || pwd.name;
            nameEl.style.padding = "5px";
            nameEl.style.borderBottom = "1px solid #ddd";
            passwordsDiv.appendChild(nameEl);
        });
        
    } catch (error) {
        console.error('Failed to load passwords:', error);
        passwordsDiv.innerHTML = '<p>Failed to load passwords</p>';
    }
};

// Load passwords when popup opens
document.addEventListener('DOMContentLoaded', () => {
    displayPasswords();
});
