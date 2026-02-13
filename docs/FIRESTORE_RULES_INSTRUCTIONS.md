# Firestore Security Rules Setup Instructions

## How to Apply the Rules

1. **Open Firebase Console**
   - Go to [https://console.firebase.google.com](https://console.firebase.google.com)
   - Select your Flowbooks project

2. **Navigate to Firestore Rules**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Copy the Rules**
   - Open the file `firestore-rules.txt` in this directory
   - Copy all the content

4. **Paste and Publish**
   - Delete all existing rules in the Firebase console
   - Paste the new rules from `firestore-rules.txt`
   - Click "Publish" button

## What These Rules Do

### Users Collection
- Users can only read and write their own user document
- Each user has access to their own `/users/{userId}/drafts/` subcollection
- This allows the onboarding draft saving feature to work

### Companies Collection
- Users can only see companies they own (`ownerId` field)
- Users can create new companies
- Users can only update/delete their own companies
- All subcollections (accounts, transactions, customers, vendors, invoices, bills, products) inherit the same permissions

### Draft Permissions
The rules allow users to:
- **Read** their own drafts: `users/{userId}/drafts/{draftId}`
- **Write** their own drafts: Save form progress automatically
- **Delete** their own drafts: After completing onboarding

## Testing

After publishing the rules, test by:
1. Sign in to your app
2. Start filling the onboarding form
3. Check the browser console - there should be no "insufficient permissions" errors
4. Refresh the page - your draft should load automatically

## Troubleshooting

If you still see permission errors:
1. Make sure you're signed in (check `useAuth` hook)
2. Verify the document path matches: `users/{userId}/drafts/onboarding`
3. Check that `request.auth.uid` matches the userId in the path
4. Wait 1-2 minutes for rules to propagate after publishing
