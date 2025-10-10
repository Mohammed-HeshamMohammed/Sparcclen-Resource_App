// Mock vm module for browser/Electron renderer compatibility
// The vm module is typically not needed in renderer processes
// and asn1.js doesn't actually use it at runtime in browser environments

export function runInContext() {
    // Return empty object - asn1.js doesn't actually call this in browser mode
    return {}
  }
  
  export function createContext(context) {
    // Return the context as-is
    return context || {}
  }
  
  export function runInNewContext() {
    // Return empty object - not used at runtime
    return {}
  }
  
  export function runInThisContext() {
    // Return empty object - not used at runtime
    return {}
  }
  
  export function isContext() {
    return false
  }
  
  export function compileFunction() {
    throw new Error('vm.compileFunction is not supported in browser environments')
  }
  
  export default {
    runInContext,
    createContext,
    runInNewContext,
    runInThisContext,
    isContext,
    compileFunction,
  }