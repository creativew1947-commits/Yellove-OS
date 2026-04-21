import { firebaseConfig } from './src/services/firebase.js';
console.log("Firebase Config Keys:", Object.keys(firebaseConfig));
console.log("API Key present:", !!firebaseConfig.apiKey);
console.log("App ID present:", !!firebaseConfig.appId);
