// Firebase configuration
// Replace these values with your actual Firebase project configuration
export const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012"
};

// Instructions to get your Firebase config:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project or create a new one
// 3. Go to Project Settings (gear icon)
// 4. Scroll down to "Your apps" section
// 5. Click on the web app icon (</>)
// 6. Copy the config object and replace the values above

// Make sure to enable:
// - Authentication (Email/Password)
// - Firestore Database
// - Set Firestore rules for testing:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/