import { Buffer } from 'buffer';
import process from 'process';

// Setup browser globals for Nillion SDK
globalThis.Buffer = Buffer;
globalThis.process = process;
globalThis.global = globalThis;

// Test if background script is loading
console.log('🚀 BACKGROUND SCRIPT LOADED!');

// Import Nillion SDK directly
import { 
  SecretVaultBuilderClient, 
  SecretVaultUserClient 
} from '@nillion/secretvaults';
import { 
  Keypair, 
  NucTokenBuilder, 
  Command 
} from '@nillion/nuc';

const NILLION_CONFIG = {
  BUILDER_PRIVATE_KEY: 'ddaff61e5179663b5dd21616cea3503521b5c165ca3ba8fd0410d38ce65cde22',
  COLLECTION_ID: '8714e211-9e5a-4bb3-8e27-8c44362cafb9',
  NILCHAIN_URL: 'http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz',
  NILAUTH_URL: 'https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz',
  NILDB_NODES: [
    'https://nildb-stg-n1.nillion.network',
    'https://nildb-stg-n2.nillion.network', 
    'https://nildb-stg-n3.nillion.network'
  ]
};

// Enhanced Nillion Manager with website+uuid identification
class EnhancedNillionManager {
  constructor() {
    this.builderClient = null;
    this.collectionId = NILLION_CONFIG.COLLECTION_ID;
    this.passwordsCache = null; // Cache passwords here
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  }

  async initialize() {
    try {
      console.log(' Initializing Enhanced Nillion Password Manager...');
      
      // Step 1: Create builder client
      const builderKeypair = Keypair.from(NILLION_CONFIG.BUILDER_PRIVATE_KEY);
      
      this.builderClient = await SecretVaultBuilderClient.from({
        keypair: builderKeypair,
        urls: {
          chain: NILLION_CONFIG.NILCHAIN_URL,
          auth: NILLION_CONFIG.NILAUTH_URL,
          dbs: NILLION_CONFIG.NILDB_NODES,
        },
        blindfold: {
          operation: 'store',
        }
      });

      await this.builderClient.refreshRootToken();
      console.log('✅ Builder client initialized');

      // Step 2: Register builder if needed
      await this.registerBuilder(builderKeypair);

      // Step 3: Create user keypair with enhanced storage
      await this.getOrCreateUserKeypair();

      // Step 4: User client will be created dynamically from storage when needed

      console.log('✅ Enhanced Nillion Password Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Nillion:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  }

  async registerBuilder(builderKeypair) {
    try {
      const existingProfile = await this.builderClient.readProfile();
      console.log('✅ Builder already registered:', existingProfile.data.name);
    } catch (profileError) {
      try {
        await this.builderClient.register({
          did: builderKeypair.toDid().toString(),
          name: 'Chrome Password Manager Builder',
        });
        console.log('✅ Builder registered successfully');
      } catch (registerError) {
        if (registerError.message.includes('duplicate key')) {
          console.log('✅ Builder already registered (duplicate key)');
        } else {
          throw registerError;
        }
      }
    }
  }

  async getOrCreateUserKeypair() {
    try {
      const result = await chrome.storage.local.get(['nillion_user_key', 'nillion_user_did']);
      
      if (result.nillion_user_key && result.nillion_user_did) {
        console.log('✅ Using existing user keypair');
        console.log('🔍 Stored private key:', result.nillion_user_key);
        console.log('🔍 Stored DID:', result.nillion_user_did);
        
        // Try with 0x prefix first
        let keypair;
        try {
          const keyWithPrefix = result.nillion_user_key.startsWith('0x') ? result.nillion_user_key : '0x' + result.nillion_user_key;
          console.log('🔍 Trying with 0x prefix:', keyWithPrefix);
          keypair = Keypair.from(keyWithPrefix);
        } catch (error) {
          console.log('⚠️ Failed with 0x prefix, trying without:', error.message);
          keypair = Keypair.from(result.nillion_user_key);
        }
        
        const generatedDid = keypair.toDid().toString();
        console.log('🔍 Generated DID from keypair:', generatedDid);
        console.log('🔍 Stored DID:', result.nillion_user_did);
        
        // Verify the DID matches
        if (generatedDid === result.nillion_user_did) {
          console.log('✅ DID matches, using existing keypair');
          return keypair;
        } else {
          console.log('⚠️ DID mismatch, generating new keypair');
          console.log('⚠️ Generated:', generatedDid);
          console.log('⚠️ Stored:', result.nillion_user_did);
        }
      }
      
      // Generate new user keypair
      const newKeypair = Keypair.generate();
      const privateKey = newKeypair.privateKey('hex');
      const userDid = newKeypair.toDid().toString();
      
      // Store both private key and DID in Chrome storage
      await chrome.storage.local.set({ 
        nillion_user_key: privateKey,
        nillion_user_did: userDid
      });
      console.log('✅ New user keypair created and stored');
      console.log('✅ User DID:', userDid);
      return newKeypair;
    } catch (error) {
      console.error('❌ User keypair setup failed:', error);
      throw error;
    }
  }



  async savePassword(websiteName, password) {
    try {
      if (!this.builderClient) {
        throw new Error('Builder client not initialized');
      }

      // Get user client from Chrome storage (supports multiple users)
      const userData = await this.getUserClientFromStorage();
      if (!userData) {
        console.log('❌ Failed to get user client from storage');
        throw new Error('Failed to get user client from storage');
      }

      const { userClient, userKeypair, userDid } = userData;
      
      console.log('🔥 CALLING ENHANCED NILLION SAVE TO COLLECTION:', this.collectionId);
      console.log('🔍 User DID from storage:', userDid);
      console.log('🏗️ Builder DID:', this.builderClient.keypair.toDid().toString());
      console.log('📦 Collection ID:', this.collectionId);

      // Create delegation token for user
      const delegation = NucTokenBuilder.extending(this.builderClient.rootToken)
        .command(new Command(['nil', 'db', 'data', 'create']))
        .audience(userKeypair.toDid())
        .expiresAt(Math.floor(Date.now() / 1000) + 3600) // 1 hour
        .build(this.builderClient.keypair.privateKey());

      // Create password data with deterministic id and name for querying
      // Create simplified password data structure
      const docId = `${userDid}_${websiteName}`;
      const passwordData = {
  _id: this.generateUUID(), 
        name: docId, 
        password: {
          '%allot': password, 
        }
      };

      console.log('📤 Sending passworddata anta :', passwordData);


      const uploadResults = await userClient.createData(delegation, {
        owner: userKeypair.toDid().toString(),
        acl: {
          grantee: this.builderClient.keypair.toDid().toString(),
          read: true,  
          write: false,
          execute: true,
        },
        collection: this.collectionId,
        data: [passwordData],
      });

      console.log('🎯 ENHANCED NILLION SAVE SUCCESS:', uploadResults);
      console.log('✅ Password ACTUALLY saved to Nillion collection:', passwordData._id);
      console.log('✅ User DID:', userDid);
      console.log('📊 Upload Results Details:', JSON.stringify(uploadResults, null, 2));
      
      // Extract the actual document ID from upload results
      let actualDocId = passwordData._id; // fallback to our generated ID
      console.log('🎯 Actual Document ID from Nillion:', actualDocId);

      // Clear the cache so next popup load fetches fresh data
      this.clearCache();
      console.log('🗑️ Cache cleared after saving new password');
      
      return actualDocId;
    } catch (error) {
      console.error('💥 ENHANCED NILLION SAVE FAILED:', JSON.stringify(error, null, 2));
      console.error('💥 Error Details:', error.message);
      console.error('💥 Error Stack:', error.stack);
      throw error;
    }
  }

  // Get user client from Chrome storage (for multiple users support)
  async getUserClientFromStorage() {
    try {
      const result = await chrome.storage.local.get(['nillion_user_key', 'nillion_user_did']);
      
      if (!result.nillion_user_key || !result.nillion_user_did) {
        console.log('❌ No user keys found in Chrome storage');
        return null;
      }

      console.log('🔍 Creating user client from stored keys...');
      console.log('🔍 Stored User DID:', result.nillion_user_did);
      
      // Create keypair from stored private key
      let userKeypair;
      try {
        const keyWithPrefix = result.nillion_user_key.startsWith('0x') ? result.nillion_user_key : '0x' + result.nillion_user_key;
        userKeypair = Keypair.from(keyWithPrefix);
      } catch (error) {
        console.log('⚠️ Failed with 0x prefix, trying without:', error.message);
        userKeypair = Keypair.from(result.nillion_user_key);
      }
      
      // Verify DID matches
      const generatedDid = userKeypair.toDid().toString();
      if (generatedDid !== result.nillion_user_did) {
        console.log('❌ DID mismatch in getUserClientFromStorage');
        return null;
      }

      // Create user client
      const userClient = await SecretVaultUserClient.from({
        baseUrls: NILLION_CONFIG.NILDB_NODES,
        keypair: userKeypair,
        blindfold: {
          operation: 'store',
        }
      });

      console.log('✅ User client created from stored keys');
      return { userClient, userKeypair, userDid: result.nillion_user_did };
      } catch (error) {
        console.error('❌ Failed to create user client from storage:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        return null;
      }
  }

  // Read password by querying name field (userDid + '_' + websiteName)
  async readPasswordByName(websiteName) {
    try {
      console.log('🚀 === READ PASSWORD BY NAME STARTED ===');
      console.log('🌐 Website name:', websiteName);
  
      // Step 1: Get user client from Chrome storage
      console.log('🔍 Step 1: Getting user client from storage...');
      let userData;
      try {
        userData = await this.getUserClientFromStorage();
        if (!userData) {
          console.log(' Step 1 FAILED: No user client found in storage');
          return null;
        }
        console.log(' Step 1 SUCCESS: User client retrieved from storage');
      } catch (storageError) {
        console.error(' Step 1 FAILED: getUserClientFromStorage error:', storageError);
        console.error(' Error message:', storageError.message);
        return null;
      }
  
      const { userClient, userKeypair, userDid } = userData;
  
      console.log('🔍 === PASSWORD QUERY DETAILS ===');
      console.log('👤 User DID:', userDid);
      console.log('🔑 Has keypair:', !!userKeypair);
      console.log('🧠 Collection ID:', this.collectionId);
  
      // Step 2: Construct unique name identifier
      const searchName = `${userDid}_${websiteName}`;
      console.log('🧩 Step 2: Constructed search name:', searchName);
  
      // Step 3: Fetch all data references
      console.log('📡 Step 3: Listing user data references...');
      let dataRefs;
      try {
        dataRefs = await userClient.listDataReferences();
        console.log('📋 Raw data references:', JSON.stringify(dataRefs, null, 2));
      } catch (listError) {
        console.error('❌ Step 3 FAILED: listDataReferences error:', listError);
        return null;
      }
  
      // Step 3.1: Process dataRefs properly
      console.log(' Step 3.1: Processing data references...');
      let userDataArray = [];
  
      try {
        userDataArray = dataRefs?.data || [];
        console.log('📊 User data count:', userDataArray.length);
        console.log('📊 User data array:', JSON.stringify(userDataArray, null, 2));
      } catch (processError) {
        console.error(' Step 3.1 FAILED: Could not process dataRefs:', processError);
        return null;
      }
  
      if (userDataArray.length === 0) {
        console.log(' No data references found for user');
        return null;
      }
  
      // Step 4: Read each document & check for matching name
      console.log('🔍 Step 4: Searching documents for matching name...');
      for (const ref of userDataArray) {
        const params = {
          collection: ref.collection,
          document: ref.document,
        };
  
        try {
          const recordResponse = await userClient.readData(params);
          const record = recordResponse?.data;
  
          console.log('📖 Read record anta:', JSON.stringify(record, null, 2));
          
          // Extract website name from the name field: userDid_websiteName
          if (record?.name) {
            const extractedWebsite = record.name.split('_').slice(1).join('_');
            console.log('🌐 Extracted website from record:', extractedWebsite);
            console.log('🔑 Password from record:', record.password);
          }

          if (record?.name === searchName && record?.password) {
            console.log('🎉 PASSWORD FOUND!');
            return {
              id: record._id,
              websiteName,
              password: record.password,
            };
          }
        } catch (readError) {
          console.error('❌ Failed to read data for ref:', JSON.stringify(ref, null, 2));
          console.error('🧾 Error message:', readError.message);
          continue;
        }
      }
  
      // No match found
      console.log('❌ === NO PASSWORD FOUND ===');
      console.log('🔎 Searched for:', searchName);
      return null;
  
    } catch (error) {
      console.error('💥 === USER CLIENT QUERY FAILED ===');
      return null;
    }
  }
  

  // Debug function to list all data references for current user
  async listAllUserData() {
    try {
      // Get user client from Chrome storage
      const userData = await this.getUserClientFromStorage();
      if (!userData) {
        throw new Error('No user client found in storage');
      }

      const { userClient } = userData;
      console.log('🔍 Listing all user data references...');
      const dataRefs = await userClient.listDataReferences();
      console.log('📋 All user data references:', JSON.stringify(dataRefs, null, 2));
      return dataRefs;
    } catch (error) {
      console.error('❌ Failed to list user data:', error);
      return null;
    }
  }

  // Delete a password from Nillion
  async deletePassword(collection, document) {
    try {
      console.log('🗑️ === DELETE PASSWORD STARTED ===');
      console.log('📁 Collection:', collection);
      console.log('📄 Document:', document);

      // Get user client from Chrome storage
      const userData = await this.getUserClientFromStorage();
      if (!userData) {
        throw new Error('No user client found in storage');
      }

      const { userClient } = userData;

      // Delete the document
      const deleteParams = {
        collection: collection,
        document: document,
      };

      console.log('🗑️ Deleting document with params:', deleteParams);
      const deleteResponse = await userClient.deleteData(deleteParams);
      console.log('✅ Delete response:', deleteResponse);

      // Clear cache after deletion
      this.passwordsCache = null;
      this.cacheTimestamp = null;
      console.log('🔄 Cache cleared after deletion');

      return { success: true, response: deleteResponse };
    } catch (error) {
      console.error('❌ Failed to delete password:', error);
      throw error;
    }
  }

  // Grant access to a password
  async grantAccess(collection, document, granteeDid) {
    try {
      console.log('🔐 === GRANT ACCESS STARTED ===');
      console.log('📁 Collection:', collection);
      console.log('📄 Document:', document);
      console.log('👤 Grantee DID:', granteeDid);

      // Get user client from Chrome storage
      const userData = await this.getUserClientFromStorage();
      if (!userData) {
        throw new Error('No user client found in storage');
      }

      const { userClient } = userData;

      // Create ACL for the grantee
      const acl = {
        grantee: granteeDid,
        read: true,
        write: true,
        execute: true,
      };

      const grantRequest = {
        collection: collection,
        document: document,
        acl: acl,
      };

      console.log('🔐 Granting access with params:', grantRequest);
      const grantResponse = await userClient.grantAccess(grantRequest);
      console.log('✅ Grant access response:', grantResponse);

      return { success: true, response: grantResponse };
    } catch (error) {
      console.error('❌ Failed to grant access:', error);
      
      // Check if DID doesn't exist error
      if (error.message && (error.message.includes('not found') || error.message.includes('does not exist'))) {
        throw new Error('DID not found in Nillion network');
      }
      
      throw error;
    }
  }

  // Revoke access to a password
  async revokeAccess(collection, document, granteeDid) {
    try {
      console.log('🚫 === REVOKE ACCESS STARTED ===');
      console.log('📁 Collection:', collection);
      console.log('📄 Document:', document);
      console.log('👤 Grantee DID:', granteeDid);

      // Get user client from Chrome storage
      const userData = await this.getUserClientFromStorage();
      if (!userData) {
        throw new Error('No user client found in storage');
      }

      const { userClient } = userData;

      const revokeRequest = {
        collection: collection,
        document: document,
        grantee: granteeDid,
      };

      console.log('🚫 Revoking access with params:', revokeRequest);
      const revokeResponse = await userClient.revokeAccess(revokeRequest);
      console.log('✅ Revoke access response:', revokeResponse);

      return { success: true, response: revokeResponse };
    } catch (error) {
      console.error('❌ Failed to revoke access:', error);
      
      // Check if access was never granted
      if (error.message && (error.message.includes('not found') || error.message.includes('No access granted') || error.message.includes('does not exist'))) {
        throw new Error('No access granted to this DID');
      }
      
      throw error;
    }
  }

  // Get all passwords for popup display with current site first (WITH CACHE!)
  async getAllPasswordsForPopup(currentSite = null, forceRefresh = false) {
    try {
      console.log('🚀 === GET ALL PASSWORDS FOR POPUP ===');
      console.log('🌐 Current site:', currentSite);
      console.log('🔄 Force refresh:', forceRefresh);

      // Check if cache is valid
      const now = Date.now();
      const cacheAge = this.cacheTimestamp ? now - this.cacheTimestamp : null;
      const cacheValid = this.passwordsCache && cacheAge && cacheAge < this.CACHE_DURATION;
      
      if (cacheValid && !forceRefresh) {
        console.log('✨ USING CACHED PASSWORDS! Cache age:', Math.floor(cacheAge / 1000), 'seconds');
        console.log('✨ Cached passwords count:', this.passwordsCache.length);
        
        // Sort cached passwords with current site first
        const sortedPasswords = [...this.passwordsCache];
        sortedPasswords.sort((a, b) => {
          if (currentSite) {
            if (a.websiteName === currentSite && b.websiteName !== currentSite) return -1;
            if (b.websiteName === currentSite && a.websiteName !== currentSite) return 1;
          }
          return a.websiteName.localeCompare(b.websiteName);
        });
        
        return sortedPasswords;
      }

      console.log('📡 FETCHING FROM NILLION (no cache or expired)...');

      // Get user client from Chrome storage
      const userData = await this.getUserClientFromStorage();
      if (!userData) {
        console.log('❌ No user client found in storage');
        return [];
      }

      const { userClient, userDid } = userData;
      
      // Fetch all data references
      const dataRefs = await userClient.listDataReferences();
      const userDataArray = dataRefs?.data || [];
      
      if (userDataArray.length === 0) {
        console.log('📭 No passwords found');
        this.passwordsCache = [];
        this.cacheTimestamp = Date.now();
        return [];
      }

      const passwords = [];
      
      // Read each document and extract website + password
      for (const ref of userDataArray) {
        try {
          const recordResponse = await userClient.readData({
            collection: ref.collection,
            document: ref.document,
          });
          
          const record = recordResponse?.data;
          
          if (record?.name && record?.password) {
            // Extract website name from the format: userDid_websiteName
            const websiteName = record.name.split('_').slice(1).join('_');
            
            console.log('🔍 Processing record:', {
              fullName: record.name,
              extractedWebsite: websiteName,
              password: record.password,
              collection: ref.collection,
              document: ref.document
            });
            
            passwords.push({
              id: record._id,
              websiteName: websiteName,
              password: record.password,
              fullName: record.name,
              collection: ref.collection,  // Add collection ID for deletion
              document: ref.document        // Add document ID for deletion
            });
          }
        } catch (readError) {
          console.error('❌ Failed to read password record:', readError);
          continue;
        }
      }

      // Store in cache
      this.passwordsCache = passwords;
      this.cacheTimestamp = Date.now();
      console.log('💾 PASSWORDS CACHED! Count:', passwords.length);

      // Sort passwords: current site first, then alphabetically
      passwords.sort((a, b) => {
        if (currentSite) {
          if (a.websiteName === currentSite && b.websiteName !== currentSite) return -1;
          if (b.websiteName === currentSite && a.websiteName !== currentSite) return 1;
        }
        return a.websiteName.localeCompare(b.websiteName);
      });

      console.log('✅ Found passwords for popup:', passwords.length);
      return passwords;
      
    } catch (error) {
      console.error('💥 Failed to get passwords for popup:', error);
      return [];
    }
  }

  // Clear the passwords cache (call after saving new password)
  clearCache() {
    console.log('🗑️ Clearing passwords cache');
    this.passwordsCache = null;
    this.cacheTimestamp = null;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Create the Enhanced manager instance
const enhancedNillionManager = new EnhancedNillionManager();

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ passwords: [] });
    // Initialize Enhanced Nillion
    initializeNillion();
});

// Handle extension context invalidation
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension startup - reinitializing Nillion...');
    initializeNillion();
});

// Initialize Enhanced Nillion Password Manager
async function initializeNillion() {
    try {
        console.log('🚀 Starting Enhanced Nillion initialization...');
        const initialized = await enhancedNillionManager.initialize();
        if (initialized) {
            console.log('✅ Enhanced Nillion Password Manager ready for collection:', NILLION_CONFIG.COLLECTION_ID);
        } else {
            console.log('⚠️ Nillion initialization failed');
        }
    } catch (error) {
        console.error('❌ Nillion initialization error:', error);
    }
}

// Handle LONG-LIVED CONNECTIONS for popup and autofill (no timeout!)
chrome.runtime.onConnect.addListener((port) => {
    console.log('🔌 BACKGROUND: Port connected:', port.name);
    
    if (port.name === 'passwordsPort') {
        port.onMessage.addListener(async (msg) => {
            console.log('📥 BACKGROUND: Port message received:', msg);
            
            if (msg.action === 'getAllPasswordsForPopup') {
                try {
                    const currentSite = msg.data?.currentSite;
                    console.log('🎯 BACKGROUND: Fetching passwords for site:', currentSite);
                    
                    // This can take as long as needed - no timeout!
                    const result = await enhancedNillionManager.getAllPasswordsForPopup(currentSite);
                    
                    console.log('✅ BACKGROUND: Got', result?.length, 'passwords');
                    
                    // Send response via port
                    port.postMessage({
                        type: 'passwords',
                        data: result || []
                    });
                } catch (error) {
                    console.error('❌ BACKGROUND: Error:', error);
                    port.postMessage({
                        type: 'error',
                        error: error.message
                    });
                }
            }
        });
    } else if (port.name === 'autofillPort') {
        port.onMessage.addListener(async (msg) => {
            console.log('📥 BACKGROUND: Autofill port message received:', msg);
            
            if (msg.action === 'getPasswordForSite') {
                try {
                    const websiteName = msg.data?.websiteName;
                    console.log('🎯 BACKGROUND: Fetching password for autofill:', websiteName);
                    
                    // This can take as long as needed - no timeout!
                    const result = await enhancedNillionManager.readPasswordByName(websiteName);
                    
                    const password = result ? result.password : null;
                    console.log('✅ BACKGROUND: Got password for autofill:', !!password);
                    
                    // Send response via port
                    port.postMessage({
                        type: 'password',
                        data: password
                    });
                } catch (error) {
                    console.error('❌ BACKGROUND: Autofill error:', error);
                    port.postMessage({
                        type: 'error',
                        error: error.message
                    });
                }
            }
        });
    } else if (port.name === 'deletePort') {
        port.onMessage.addListener(async (msg) => {
            console.log('📥 BACKGROUND: Delete port message received:', msg);
            
            if (msg.action === 'deletePassword') {
                try {
                    const { collection, document } = msg.data;
                    console.log('🗑️ BACKGROUND: Deleting password:', { collection, document });
                    
                    // Delete the password
                    const result = await enhancedNillionManager.deletePassword(collection, document);
                    
                    console.log('✅ BACKGROUND: Password deleted successfully');
                    
                    // Send success response via port
                    port.postMessage({
                        type: 'deleted',
                        data: { success: true }
                    });
                } catch (error) {
                    console.error('❌ BACKGROUND: Delete error:', error);
                    port.postMessage({
                        type: 'error',
                        error: error.message
                    });
                }
            }
        });
    } else if (port.name === 'accessPort') {
        port.onMessage.addListener(async (msg) => {
            console.log('📥 BACKGROUND: Access port message received:', msg);
            
            if (msg.action === 'grantAccess') {
                try {
                    const { collection, document, granteeDid } = msg.data;
                    console.log('🔐 BACKGROUND: Granting access:', { collection, document, granteeDid });
                    
                    // Grant access
                    const result = await enhancedNillionManager.grantAccess(collection, document, granteeDid);
                    
                    console.log('✅ BACKGROUND: Access granted successfully');
                    
                    // Send success response via port
                    port.postMessage({
                        type: 'granted',
                        data: { success: true }
                    });
                } catch (error) {
                    console.error('❌ BACKGROUND: Grant access error:', error);
                    port.postMessage({
                        type: 'error',
                        error: error.message
                    });
                }
            } else if (msg.action === 'revokeAccess') {
                try {
                    const { collection, document, granteeDid } = msg.data;
                    console.log('🚫 BACKGROUND: Revoking access:', { collection, document, granteeDid });
                    
                    // Revoke access
                    const result = await enhancedNillionManager.revokeAccess(collection, document, granteeDid);
                    
                    console.log('✅ BACKGROUND: Access revoked successfully');
                    
                    // Send success response via port
                    port.postMessage({
                        type: 'revoked',
                        data: { success: true }
                    });
                } catch (error) {
                    console.error('❌ BACKGROUND: Revoke access error:', error);
                    port.postMessage({
                        type: 'error',
                        error: error.message
                    });
                }
            }
        });
    } else if (port.name === 'readPasswordPort') {
        port.onMessage.addListener(async (msg) => {
            console.log('📥 BACKGROUND: Read password port message received:', msg);
            
            if (msg.action === 'readPasswordForCopy') {
                try {
                    const { collection, document } = msg.data;
                    console.log('🔍 BACKGROUND: Reading password with userClient for copy:', { collection, document });
                    
                    // Get user client from storage
                    const userData = await enhancedNillionManager.getUserClientFromStorage();
                    if (!userData) {
                        throw new Error('Failed to get user client from storage');
                    }
                    
                    const { userClient } = userData;
                    
                    // Read password using userClient to get fresh decrypted data
                    const recordResponse = await userClient.readData({
                        collection: collection,
                        document: document,
                    });
                    
                    const record = recordResponse?.data;
                    const password = record?.password;
                    
                    if (!password) {
                        throw new Error('Password not found in record');
                    }
                    
                    console.log('✅ BACKGROUND: Fresh decrypted password read successfully');
                    
                    // Send decrypted password via port
                    port.postMessage({
                        type: 'password',
                        data: password
                    });
                } catch (error) {
                    console.error('❌ BACKGROUND: Read password error:', error);
                    port.postMessage({
                        type: 'error',
                        error: error.message
                    });
                }
            }
        });
    }
});

// Handle messages from content script - Enhanced Nillion save
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('🔍 BACKGROUND: Message received:', request.action, request.data);
    console.log('🔍 BACKGROUND: Message listener is working!');
    try {
        if (request.action === 'saveToEnhancedNillion') {
            (async () => {
                try {
                    console.log('🔥 BACKGROUND: CALLING ENHANCED NILLION SAVE PASSWORD');
                    
                    // Check if manager is initialized
                    if (!enhancedNillionManager.userClient || !enhancedNillionManager.builderClient) {
                        console.log('⚠️ Nillion not initialized, reinitializing...');
                        await initializeNillion();
                    }
                    
                    const recordId = await enhancedNillionManager.savePassword(
                        request.data.websiteName,
                        request.data.password
                    );
                    
                    // After saving, list all user data to debug
                    await enhancedNillionManager.listAllUserData();
                    
                    sendResponse(recordId);
                } catch (error) {
                    console.error('💥 BACKGROUND: ENHANCED NILLION SAVE FAILED:', error);
                    console.error('💥 Error message:', error.message);
                    sendResponse(null);
                }
            })();
            return true;
        } else if (request.action === 'listAllUserData') {
            (async () => {
                try {
                    const result = await enhancedNillionManager.listAllUserData();
                    sendResponse(result);
                } catch (error) {
                    console.error('💥 listAllUserData failed:', error.message);
                    sendResponse(null);
                }
            })();
            return true;
        }
        // Note: getAllPasswordsForPopup now handled via long-lived port connection above
    } catch (error) {
        console.error('💥 Message handler failed:', error.message);
        sendResponse(null);
    }
    return true; // Keep message channel open for async response
});
