// Nillion SDK Integration for Chrome Extension
import { 
  SecretVaultBuilderClient, 
  SecretVaultUserClient 
} from '@nillion/secretvaults';
import { 
  Keypair, 
  NilauthClient, 
  PayerBuilder, 
  NucTokenBuilder, 
  Command 
} from '@nillion/nuc';
import { NILLION_CONFIG, COLLECTION_CONFIG } from './nillion-config.js';

class NillionPasswordManager {
  constructor() {
    this.builderClient = null;
    this.userClient = null;
    this.collectionId = null;
    this.userKeypair = null;
  }

  // Initialize Nillion clients
  async initialize() {
    try {
      console.log('🚀 Initializing Nillion Password Manager...');
      
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

      // Step 3: Use existing collection ID
      this.collectionId = NILLION_CONFIG.COLLECTION_ID;
      console.log('✅ Using existing collection:', this.collectionId);

      // Step 4: Create user keypair (generate new user for each browser)
      this.userKeypair = await this.getOrCreateUserKeypair();
      
      // Step 5: Initialize user client
      this.userClient = await SecretVaultUserClient.from({
        baseUrls: NILLION_CONFIG.NILDB_NODES,
        keypair: this.userKeypair,
        blindfold: {
          operation: 'store',
        }
      });

      console.log('✅ Nillion Password Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Nillion:', error);
      return false;
    }
  }

  // Register builder profile
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

  // Setup password collection
  async setupCollection() {
    try {
      // Check if collection already exists
      const collections = await this.builderClient.readCollections();
      const existingCollection = Object.values(collections)[0]?.data?.collections?.find(
        col => col.name === COLLECTION_CONFIG.name
      );

      if (existingCollection) {
        this.collectionId = existingCollection._id;
        console.log('✅ Using existing collection:', this.collectionId);
      } else {

        this.collectionId = this.generateUUID();
        const collection = {
          _id: this.collectionId,
          ...COLLECTION_CONFIG
        };

        await this.builderClient.createCollection(collection);
        console.log('✅ Password collection created:', this.collectionId);
      }
    } catch (error) {
      console.error('❌ Collection setup failed:', error);
      throw error;
    }
  }

  // Get or create user keypair (stored in chrome.storage)
  async getOrCreateUserKeypair() {
    try {
      // Try to get existing user keypair from Chrome storage
      const result = await chrome.storage.local.get(['nillion_user_key', 'nillion_user_did']);
      
      if (result.nillion_user_key && result.nillion_user_did) {
        console.log('✅ Using existing user keypair');
        const keypair = Keypair.from(result.nillion_user_key);
        // Verify the DID matches
        if (keypair.toDid().toString() === result.nillion_user_did) {
          return keypair;
        } else {
          console.log('⚠️ DID mismatch, generating new keypair');
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

  // Get user DID from storage
  async getUserDid() {
    try {
      const result = await chrome.storage.local.get('nillion_user_did');
      return result.nillion_user_did;
    } catch (error) {
      console.error('❌ Failed to get user DID:', error);
      return null;
    }
  }





  // Generate UUID (browser compatible)
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const nillionManager = new NillionPasswordManager();
