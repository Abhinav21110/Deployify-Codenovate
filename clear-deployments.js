// Simple script to clear deployments from localStorage
// Run this in browser console or as a one-time script

if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('deployify-deployments');
  console.log('✅ Cleared all previous deployments from localStorage');
} else {
  console.log('❌ localStorage not available');
}