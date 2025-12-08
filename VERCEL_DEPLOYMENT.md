# Vercel Deployment Guide

This guide will help you deploy your React shopping app to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure Environment Variables**
   - In the Vercel project settings, go to "Environment Variables"
   - Add the following variables:
     ```
     REACT_APP_FIREBASE_API_KEY=AIzaSyCMk--PVQJj1kUeolElaK1y-Rgf0DGUx2U
     REACT_APP_FIREBASE_AUTH_DOMAIN=shoppin-9af74.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=shoppin-9af74
     REACT_APP_FIREBASE_STORAGE_BUCKET=shoppin-9af74.firebasestorage.app
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=616136920604
     REACT_APP_FIREBASE_APP_ID=1:616136920604:web:1894fe3dc84f130ff4d9d9
     REACT_APP_IMGBB_API_KEY=cfe7185111917029d548b5462fb64d51
     REACT_APP_FASTLIPA_API_BASE_URL=https://api.fastlipa.com/api
     REACT_APP_FASTLIPA_API_TOKEN=FastLipa_JRyIKYbzS9ZdCQRN3cUtEQ
     ```
   - Make sure to add them for all environments (Production, Preview, Development)

4. **Configure Build Settings**
   - Framework Preset: **Create React App**
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `build` (should be auto-detected)
   - Install Command: `npm install` (should be auto-detected)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (for first deployment)
   - Project name? Enter a name or press Enter for default
   - Directory? Press Enter (current directory)
   - Override settings? **No**

4. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_FIREBASE_API_KEY
   vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN
   vercel env add REACT_APP_FIREBASE_PROJECT_ID
   vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET
   vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   vercel env add REACT_APP_FIREBASE_APP_ID
   vercel env add REACT_APP_IMGBB_API_KEY
   vercel env add REACT_APP_FASTLIPA_API_BASE_URL
   vercel env add REACT_APP_FASTLIPA_API_TOKEN
   ```
   
   For each variable, enter the value when prompted and select the environments (Production, Preview, Development).

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Post-Deployment

### Update Firebase Authentication Settings

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Add your Vercel domain (e.g., `your-project.vercel.app`)

### Update CORS Settings (if needed)

If you encounter CORS issues with external APIs:
- Check FastLipa API CORS settings
- Check ImgBB API CORS settings
- Update Firebase Security Rules if needed

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **Settings** > **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### Environment Variables Not Working
- Make sure variables start with `REACT_APP_` prefix
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Routing Issues
- The `vercel.json` file handles SPA routing
- All routes redirect to `index.html` for client-side routing

### API Errors
- Verify API keys are correct in environment variables
- Check API endpoints allow requests from your Vercel domain
- Review browser console for specific error messages

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch triggers production deployment
- Pull requests trigger preview deployments
- All deployments are automatically built and deployed

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

