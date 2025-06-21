# Firebase Auth Domain Fix Instructions

## For Testing While Fixing OAuth:

1. **Use Email/Password Authentication**:
   - Click "Sign Up" instead of Google Sign-in
   - Create a test account with email/password
   - This bypasses OAuth domain restrictions

2. **Use Anonymous Sign-in** (if enabled):
   - Look for "Continue as Guest" option
   - This allows testing without authentication

## Permanent Fix - Add These Domains:

### In Firebase Console (Authentication → Settings → Authorized domains):
- sandbagger-d6c1f.web.app
- sandbagger-d6c1f.firebaseapp.com
- localhost (for local testing)

### In Google Cloud Console (APIs & Services → Credentials → OAuth 2.0 Client):

**Authorized JavaScript origins:**
- https://sandbagger-d6c1f.web.app
- https://sandbagger-d6c1f.firebaseapp.com
- http://localhost:5173
- http://localhost:5174

**Authorized redirect URIs:**
- https://sandbagger-d6c1f.web.app/__/auth/handler
- https://sandbagger-d6c1f.firebaseapp.com/__/auth/handler

## Common Issues:

1. **Changes take 5-10 minutes to propagate** - Be patient after making changes
2. **Clear browser cache** - Use incognito mode for testing
3. **Check browser console** for specific error messages

## Testing After Fix:
1. Wait 5-10 minutes for changes to propagate
2. Clear browser cache or use incognito mode
3. Try Google sign-in again at https://sandbagger-d6c1f.web.app