# Sandbagger Golf App - Critical Issues Resolution Agent Prompts

## 🚨 **Agent 1: Security & Infrastructure**

### **Primary Mission**: Fix critical security vulnerabilities and production readiness issues

You are Agent 1 responsible for securing the Sandbagger golf app and making it production-ready. A code review has identified CRITICAL security vulnerabilities that must be fixed immediately.

**IMPORTANT**: Read the updated AGENT_COORDINATION.md file to understand the current state and critical issues.

### **🔥 CRITICAL TASKS (Fix Immediately)**

#### **1. Secure Firebase Configuration**
- **CURRENT ISSUE**: Firebase API keys are exposed in `src/firebase.js` lines 36-44
- **ACTION REQUIRED**: 
  - Create `.env` and `.env.example` files
  - Move all Firebase config to environment variables
  - Update `src/firebase.js` to use `import.meta.env` variables
  - Add `.env` to `.gitignore`
  - Document environment setup in README

#### **2. Fix Production Build Configuration**
- **CURRENT ISSUE**: `vite.config.js` forces development mode (line 18)
- **ACTION REQUIRED**:
  - Fix the `define` section to properly detect production vs development
  - Enable proper React production optimizations
  - Test build process works correctly
  - Verify minification and optimization work in production

#### **3. Implement Error Boundaries**
- **CURRENT ISSUE**: No error boundaries exist - app crashes completely on errors
- **ACTION REQUIRED**:
  - Create `src/components/common/ErrorBoundary.jsx`
  - Create `src/components/common/ErrorFallback.jsx`
  - Wrap key app sections (Scorecard, Dashboard, Authentication)
  - Add error reporting/logging
  - Test error scenarios

### **📋 HIGH PRIORITY TASKS**

#### **4. Add Security Headers and Validation**
- Add input validation for all Firebase operations
- Implement rate limiting for API calls
- Add CSRF protection where needed
- Review and secure all Firebase security rules

#### **5. Production Deployment Setup**
- Configure proper build scripts for production
- Set up environment-specific configurations
- Add build verification steps
- Document deployment process

### **Key Files You'll Modify:**
- `src/firebase.js` (CRITICAL - security fix)
- `vite.config.js` (CRITICAL - production config)
- `.env` and `.env.example` (NEW - environment variables)
- `src/components/common/ErrorBoundary.jsx` (NEW)
- `src/components/common/ErrorFallback.jsx` (NEW)
- `.gitignore` (update)
- `package.json` (scripts)

### **Success Criteria:**
- ✅ No API keys visible in source code
- ✅ Production builds work correctly with optimizations
- ✅ Error boundaries prevent app crashes
- ✅ All sensitive data moved to environment variables
- ✅ Build process includes security verification

### **Testing Requirements:**
- Test that app works with environment variables
- Verify production build creates optimized bundles
- Test error boundaries catch and display errors gracefully
- Confirm no sensitive data in built files

---

## 📋 **Agent 2: Testing & Code Quality**

### **Primary Mission**: Establish testing framework and code quality standards

You are Agent 2 responsible for implementing a comprehensive testing strategy and code quality tools for the Sandbagger golf app. Currently, there are ZERO tests and no code quality enforcement.

**IMPORTANT**: Read the updated AGENT_COORDINATION.md file to understand the current state and testing needs.

### **🔥 CRITICAL TASKS (Implement Immediately)**

#### **1. Set Up Testing Framework**
- **CURRENT ISSUE**: Zero test coverage, no testing infrastructure
- **ACTION REQUIRED**:
  - Install Vitest + React Testing Library + Jest DOM
  - Configure `vitest.config.js`
  - Create test utilities and setup files
  - Add test scripts to `package.json`

#### **2. Write Critical Path Tests**
- **TARGET**: Minimum 60% test coverage for critical functionality
- **PRIORITY TESTS**:
  - Authentication flows (`src/contexts/AuthContext.jsx`)
  - Round state management (`src/hooks/useRoundState.js`)
  - Betting calculations (`src/hooks/useBettingCalculations.js`)
  - Score input validation (`src/components/ScoreInput.jsx`)
  - Firebase operations (`src/firebase.js`)

#### **3. Component Testing Strategy**
- **ACTION REQUIRED**:
  - Test all custom hooks with realistic scenarios
  - Test component rendering and user interactions
  - Test error states and edge cases
  - Mock Firebase operations for testing
  - Test mobile-specific functionality

### **📋 HIGH PRIORITY TASKS**

#### **4. Code Quality Tools Setup**
- **ESLint Configuration**:
  - Install and configure ESLint for React
  - Set up rules for hooks, accessibility, and best practices
  - Configure import sorting and unused variable detection

- **Prettier Setup**:
  - Install and configure Prettier
  - Set up format-on-save and pre-commit formatting
  - Ensure consistent code style across the project

- **Pre-commit Hooks**:
  - Install Husky for Git hooks
  - Set up pre-commit linting and testing
  - Add commit message validation

#### **5. Test Coverage and Reporting**
- Configure coverage reporting with Vitest
- Set up coverage thresholds (60% minimum)
- Add visual coverage reports
- Integrate with CI/CD pipeline (future)

### **Key Files You'll Create/Modify:**
- `vitest.config.js` (NEW - test configuration)
- `src/tests/setup.js` (NEW - test setup)
- `src/tests/utils.js` (NEW - test utilities)
- `src/tests/mocks/firebase.js` (NEW - Firebase mocks)
- `src/**/*.test.jsx` (NEW - component tests)
- `src/hooks/*.test.js` (NEW - hook tests)
- `.eslintrc.js` (NEW - linting rules)
- `.prettierrc` (NEW - formatting rules)
- `package.json` (update scripts and dependencies)

### **Testing Priority Order:**
1. **Authentication** - Login/logout flows, auth state management
2. **Round Management** - Creating rounds, loading saved rounds
3. **Score Input** - Score validation, Firebase sync
4. **Betting Calculations** - All betting game logic
5. **Component Rendering** - Key UI components render correctly
6. **Error Handling** - Error states and fallbacks

### **Success Criteria:**
- ✅ Testing framework runs successfully
- ✅ Minimum 60% test coverage achieved
- ✅ All critical user flows have test coverage
- ✅ ESLint and Prettier configured and working
- ✅ Pre-commit hooks prevent bad code from being committed
- ✅ Documentation for running and writing tests

---

## ⚡ **Agent 3: Performance & Data Optimization**

### **Primary Mission**: Optimize Firebase operations and enhance app performance

You are Agent 3 responsible for optimizing the Sandbagger golf app's performance, particularly Firebase operations and data management. Code review identified missing debouncing and potential performance bottlenecks.

**IMPORTANT**: Read the updated AGENT_COORDINATION.md file to understand the current state and performance issues.

### **🔥 CRITICAL TASKS (Implement Immediately)**

#### **1. Implement Debounced Firebase Writes**
- **CURRENT ISSUE**: Every score input triggers immediate Firebase write
- **ACTION REQUIRED**:
  - Create `src/hooks/useFirebaseSync.js` with debouncing
  - Implement smart batching for multiple score updates
  - Add offline queue for when network is unavailable
  - Optimize real-time subscriptions to prevent excessive re-renders

#### **2. Optimize Betting Calculations Performance**
- **CURRENT ISSUE**: Heavy calculations run on every render
- **ACTION REQUIRED**:
  - Refine dependency arrays in `useBettingCalculations.js`
  - Implement memoization for expensive calculations
  - Add lazy evaluation for betting results
  - Optimize component re-rendering with React.memo

#### **3. Enhance Data Validation and Error Handling**
- **CURRENT ISSUE**: Inconsistent data validation across Firebase operations
- **ACTION REQUIRED**:
  - Add comprehensive input validation for all Firebase writes
  - Implement data sanitization and type checking
  - Add retry logic for failed operations
  - Create robust error recovery mechanisms

### **📋 HIGH PRIORITY TASKS**

#### **4. Firebase Operation Optimization**
- **Batch Operations**: Implement batch writes for multiple score updates
- **Connection Management**: Optimize real-time listeners and subscriptions
- **Caching Strategy**: Add intelligent caching for frequently accessed data
- **Query Optimization**: Review and optimize Firestore queries

#### **5. Performance Monitoring Setup**
- **Metrics Collection**: Add performance timing for critical operations
- **Bundle Analysis**: Analyze and optimize bundle size
- **Memory Management**: Identify and fix memory leaks
- **Loading States**: Improve perceived performance with better loading indicators

#### **6. Advanced Data Features**
- **Offline Support**: Enhance offline functionality and sync
- **Data Migration**: Add version management for data structure changes
- **Backup/Export**: Implement data export and backup features
- **Statistics**: Add advanced statistics calculation and caching

### **Key Files You'll Create/Modify:**
- `src/hooks/useFirebaseSync.js` (NEW - debounced Firebase operations)
- `src/hooks/useBettingCalculations.js` (OPTIMIZE - performance improvements)
- `src/hooks/usePerformance.js` (NEW - performance monitoring)
- `src/utils/dataValidation.js` (NEW - input validation utilities)
- `src/utils/batchOperations.js` (NEW - Firebase batch operations)
- `src/firebase.js` (OPTIMIZE - query optimization)
- `src/components/ScoreInput.jsx` (OPTIMIZE - debounced input)

### **Performance Optimization Priority:**
1. **Score Input Debouncing** - Prevent excessive Firebase writes
2. **Betting Calculation Optimization** - Reduce computational overhead
3. **Firebase Query Optimization** - Minimize network requests
4. **Component Re-render Optimization** - Add strategic memoization
5. **Bundle Size Optimization** - Code splitting and lazy loading
6. **Memory Leak Prevention** - Proper cleanup and garbage collection

### **Success Criteria:**
- ✅ Score inputs debounced with 500ms delay
- ✅ Betting calculations optimized with proper memoization
- ✅ Firebase writes reduced by 80% through batching
- ✅ App remains responsive during heavy operations
- ✅ Offline functionality works reliably
- ✅ Performance metrics tracking implemented
- ✅ Bundle size reduced and optimized

### **Testing Requirements:**
- Test debouncing works correctly with rapid score inputs
- Verify betting calculations remain accurate after optimization
- Test offline functionality and sync behavior
- Performance testing for large datasets
- Memory usage monitoring during extended use

---

## 🤝 **Inter-Agent Coordination**

### **Shared Responsibilities:**
- **Agent 1 & 2**: Ensure security fixes don't break tests
- **Agent 1 & 3**: Coordinate Firebase security with performance optimizations
- **Agent 2 & 3**: Test performance optimizations and debouncing logic

### **Communication Protocol:**
1. **Before starting**: Review current state in AGENT_COORDINATION.md
2. **During work**: Update progress in coordination document
3. **After completion**: Document changes and impacts for other agents
4. **Testing**: Each agent tests that their changes don't break existing functionality

### **Success Definition:**
The app achieves production readiness with:
- 🔒 **Security**: No exposed secrets, proper error handling
- 📋 **Quality**: 60%+ test coverage, linting/formatting enforced
- ⚡ **Performance**: Optimized Firebase operations, responsive UI
- 🏗️ **Architecture**: Maintained clean component structure from Phase 1