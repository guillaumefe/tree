// Will hold the install prompt event for later use
let deferredPrompt;

// Listen for the 'beforeinstallprompt' event triggered by the browser
window.addEventListener('beforeinstallprompt', (e) => {
// Prevent the automatic prompt
e.preventDefault();

// Store the event so we can trigger it later
deferredPrompt = e;

// Display a custom toast offering installation
showInstallToast();
});

// Displays a custom toast message prompting installation
function showInstallToast() {
// Avoid showing multiple toasts
if (document.getElementById('install-toast')) return;

// Create the toast container
const toast = document.createElement('div');
toast.id = 'install-toast';
toast.style.position = 'fixed';
toast.style.bottom = '1.5rem';
toast.style.left = '50%';
toast.style.transform = 'translateX(-50%)';
toast.style.background = '#fff3cd';              // Light yellow background
toast.style.color = '#856404';                   // Dark yellow text
toast.style.border = '1px solid #ffeeba';
toast.style.padding = '0.75rem 1.25rem';
toast.style.borderRadius = '4px';
toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
toast.style.fontSize = '1rem';
toast.style.zIndex = '2000';
toast.style.display = 'flex';
toast.style.alignItems = 'center';

// Toast inner HTML with install button
toast.innerHTML = `
📱 You can install this app on your home screen.
<button style="
margin-left: 1rem;
background: #4a90e2;
color: white;
border: none;
padding: 0.3rem 0.6rem;
border-radius: 4px;
cursor: pointer;
">Install</button>
`;

// Add click behavior for the install button
toast.querySelector('button').onclick = () => {
if (deferredPrompt) {
// Show the native install prompt
deferredPrompt.prompt();

// Handle user's choice
deferredPrompt.userChoice.then(() => {
  deferredPrompt = null;
  toast.remove();
});
}
};

// Append the toast to the body
document.body.appendChild(toast);

// Auto-hide the toast after 10 seconds
setTimeout(() => {
if (toast.parentNode) toast.remove();
}, 10000);
}
