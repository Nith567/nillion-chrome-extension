// Script to read all website names from your Nillion collection as builder
import { 
  SecretVaultBuilderClient 
} from '@nillion/secretvaults';
import { 
  Keypair 
} from '@nillion/nuc';

// Your configuration
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

async function readCollectionNames() {
  try {
    console.log('🚀 Initializing builder client to read collection names...');
    
    // Step 1: Create builder client
    const builderKeypair = Keypair.from(NILLION_CONFIG.BUILDER_PRIVATE_KEY);
    
    const builderClient = await SecretVaultBuilderClient.from({
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

    await builderClient.refreshRootToken();
    console.log('✅ Builder client initialized');
    console.log('🔍 Reading collection:', NILLION_CONFIG.COLLECTION_ID);

    // Step 2: Read collection info and data
    console.log('\n📖 Reading collection information...');
    
    // First, get collection details
    const collections = await builderClient.readCollections();
    console.log('📝 Collections response:', JSON.stringify(collections, null, 2));

    // Look for your specific collection
    const targetCollection = Object.values(collections)[0]?.data?.collections?.find(
      col => col._id === NILLION_CONFIG.COLLECTION_ID
    );

    if (targetCollection) {
      console.log('✅ Found your collection:', targetCollection.name);
      console.log('📊 Collection details:', JSON.stringify(targetCollection, null, 2));
    } else {
      console.log('⚠️ Your collection not found in builder collections');
    }

    // Try to read data using collection methods
    console.log('\n🔍 Attempting to read data from collection...');
    
    // Method 1: Try to read collection data directly
    try {
      const collectionInfo = await builderClient.readCollection(NILLION_CONFIG.COLLECTION_ID);
      console.log('📋 Collection info:', JSON.stringify(collectionInfo, null, 2));
      
      if (collectionInfo.data && collectionInfo.data.length > 0) {
        console.log('\n🌐 Found records in collection:');
        collectionInfo.data.forEach((record, index) => {
          console.log(`   ${index + 1}. Website: ${record.name || 'Unknown'}`);
          console.log(`      - Record ID: ${record._id}`);
          console.log(`      - Has encrypted password: ${record.password ? '✅' : '❌'}`);
        });
        return collectionInfo.data;
      }
    } catch (readError) {
      console.log('⚠️ Could not read collection data:', readError.message);
    }

    console.log('\n� No data found or collection is empty');

  } catch (error) {
    console.error('❌ Error reading collection names:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
readCollectionNames()
  .then((results) => {
    if (results && results.length > 0) {
      console.log(`\n🎉 Successfully found ${results.length} website(s) in your collection!`);
    } else {
      console.log('\n💭 Collection appears to be empty or inaccessible');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
