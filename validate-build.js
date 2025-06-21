#!/usr/bin/env node

/**
 * Production Build Validation Script
 * Validates that the production build meets security and performance requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const issues = [];
const warnings = [];

console.log('🔍 Validating production build...\n');

// Check 1: Environment variables validation
console.log('1. Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  issues.push('❌ .env file is missing');
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check for placeholder values
  if (envContent.includes('your_api_key_here') || envContent.includes('your_project_id')) {
    issues.push('❌ .env file contains placeholder values');
  }

  // Check for required variables
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  requiredVars.forEach(envVar => {
    if (!envContent.includes(envVar)) {
      issues.push(`❌ Missing required environment variable: ${envVar}`);
    }
  });

  console.log('✅ Environment file exists and appears configured');
}

if (!fs.existsSync(envExamplePath)) {
  warnings.push('⚠️  .env.example file is missing (recommended for documentation)');
}

// Check 2: GitIgnore validation
console.log('2. Checking .gitignore configuration...');
const gitignorePath = path.join(__dirname, '.gitignore');

if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

  const requiredIgnores = ['.env', 'dist/', 'build/', '*.log'];

  requiredIgnores.forEach(pattern => {
    if (!gitignoreContent.includes(pattern)) {
      issues.push(`❌ .gitignore missing important pattern: ${pattern}`);
    }
  });

  console.log('✅ .gitignore file properly configured');
} else {
  issues.push('❌ .gitignore file is missing');
}

// Check 3: Firebase configuration
console.log('3. Checking Firebase configuration...');
const firebasePath = path.join(__dirname, 'src', 'firebase.js');

if (fs.existsSync(firebasePath)) {
  const firebaseContent = fs.readFileSync(firebasePath, 'utf8');

  // Check for hardcoded API keys
  if (firebaseContent.includes('AIzaSy') && !firebaseContent.includes('import.meta.env')) {
    issues.push('❌ Firebase contains hardcoded API keys - security risk!');
  }

  // Check for environment variable usage
  if (firebaseContent.includes('import.meta.env.VITE_FIREBASE')) {
    console.log('✅ Firebase using environment variables');
  } else {
    issues.push('❌ Firebase not using environment variables');
  }

  // Check for error handling
  if (firebaseContent.includes('handleFirebaseError')) {
    console.log('✅ Firebase has enhanced error handling');
  } else {
    warnings.push('⚠️  Firebase could benefit from enhanced error handling');
  }
} else {
  issues.push('❌ Firebase configuration file not found');
}

// Check 4: Build configuration
console.log('4. Checking build configuration...');
const viteConfigPath = path.join(__dirname, 'vite.config.js');

if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');

  // Check for production optimizations
  if (viteContent.includes('isProduction') && viteContent.includes('minify')) {
    console.log('✅ Vite config has production optimizations');
  } else {
    warnings.push('⚠️  Vite config could be optimized for production');
  }

  // Check for proper NODE_ENV handling
  if (viteContent.includes("'process.env.NODE_ENV': JSON.stringify(mode)")) {
    console.log('✅ NODE_ENV properly configured');
  } else {
    issues.push('❌ NODE_ENV not properly configured in Vite');
  }
} else {
  issues.push('❌ Vite configuration file not found');
}

// Check 5: Error boundaries
console.log('5. Checking error handling...');
const errorBoundaryPath = path.join(__dirname, 'src', 'components', 'common', 'ErrorBoundary.jsx');

if (fs.existsSync(errorBoundaryPath)) {
  console.log('✅ Error boundary component exists');

  const appPath = path.join(__dirname, 'src', 'App.jsx');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    if (appContent.includes('ErrorBoundary')) {
      console.log('✅ Error boundary integrated in App component');
    } else {
      issues.push('❌ Error boundary not integrated in App component');
    }
  }
} else {
  issues.push('❌ Error boundary component not found');
}

// Check 6: Security headers (if applicable)
console.log('6. Checking for security considerations...');
const indexHtmlPath = path.join(__dirname, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

  if (indexContent.includes('Content-Security-Policy')) {
    console.log('✅ CSP headers found');
  } else {
    warnings.push('⚠️  Consider adding Content-Security-Policy headers');
  }
}

// Results
console.log(`\n${'='.repeat(50)}`);
console.log('🎯 VALIDATION RESULTS');
console.log('='.repeat(50));

if (issues.length === 0) {
  console.log('✅ ALL CRITICAL CHECKS PASSED!');
  console.log('🚀 Build is ready for production deployment');
} else {
  console.log('❌ CRITICAL ISSUES FOUND:');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n🚨 These issues must be fixed before deployment!');
}

if (warnings.length > 0) {
  console.log('\n⚠️  RECOMMENDATIONS:');
  warnings.forEach(warning => console.log(`   ${warning}`));
}

console.log(`\n${'='.repeat(50)}`);

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);
