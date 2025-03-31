# Wallpaper App Cleanup Scripts

This directory contains scripts to help you clean up data during testing and development of the wallpaper app.

## Available Scripts

- **cleanup-storage.ts**: Deletes all wallpaper files from Firebase Storage
- **cleanup-firestore.ts**: Deletes all wallpaper documents from Firestore
- **cleanup-all.ts**: Combines both scripts above to clean both storage and Firestore
- **cleanup-admin.ts**: Uses Firebase Admin SDK for more reliable cleanup (recommended)

## How to Run

You can run these scripts using the npm commands defined in package.json:

```bash
# Clean up only Firebase Storage files
npm run cleanup:storage

# Clean up only Firestore documents
npm run cleanup:firestore

# Clean up both Storage and Firestore (using client SDK)
npm run cleanup:all

# Clean up both Storage and Firestore (using Admin SDK - RECOMMENDED)
npm run cleanup:admin
```

## Using the Admin SDK (Recommended)

For the most reliable cleanup, use the Admin SDK script (`cleanup-admin.ts`).

### Prerequisites

1. **Service Account Key**:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the file as `serviceAccountKey.json` in the project root

2. **Environment Variables**:
   - Make sure your `.env.local` file has the `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` variable set

### Running the Admin Cleanup

```bash
npm run cleanup:admin
```

## Safety Features

All scripts include safety measures:

- **Confirmation Prompt**: You must type `DELETE` or `DELETE-ALL` to confirm
- **Progress Indicators**: Shows progress during deletion
- **Error Handling**: Any errors are logged but won't stop the entire process
- **Summary**: Shows a summary of successful and failed operations

## When to Use

These scripts are useful when:

1. Testing the upload feature repeatedly
2. Cleaning up test data before deployment
3. Resetting the database during development
4. Troubleshooting issues with wallpaper uploads 