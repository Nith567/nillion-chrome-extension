// Nillion Configuration for Chrome Password Manager Extension

export const NILLION_CONFIG = {
  // Your API key
  BUILDER_PRIVATE_KEY: 'ddaff61e5179663b5dd21616cea3503521b5c165ca3ba8fd0410d38ce65cde22',
  
  // Your existing collection ID for password storage
  COLLECTION_ID: '8714e211-9e5a-4bb3-8e27-8c44362cafb9',
  
  // Testnet URLs (from Nillion docs)
  NILCHAIN_URL: 'http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz',
  NILAUTH_URL: 'https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz',
  NILDB_NODES: [
    'https://nildb-stg-n1.nillion.network',
    'https://nildb-stg-n2.nillion.network', 
    'https://nildb-stg-n3.nillion.network'
  ]
};

// Password Manager Collection Schema (matches your "pcollection" schema)
export const PASSWORD_COLLECTION_SCHEMA = 

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "_id": {
        "type": "string",
        "description": "Unique identifier"
      },
      "name": {
        "type": "string"
      },
      "password": {
        "type": "object",
        "properties": {
          "%share": {
            "type": "string"
          }
        },
        "required": [
          "%share"
        ]
      }
    },
    "required": [
      "_id"
    ]
  }
}


// Collection configuration
export const COLLECTION_CONFIG = {
  type: 'owned', // User-owned data with access control
  name: 'pcollection', // Your actual collection name
  schema: PASSWORD_COLLECTION_SCHEMA
};
