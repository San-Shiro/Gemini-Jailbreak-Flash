// Global variable to hold all settings
let settings = {};

// 1. Function to load all settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    isGloballyEnabled: true,
    activePresetId: null,
    presets: []
  }, (items) => {
    settings = items;
  });
}

// 2. Load settings when the script first runs
loadSettings();

// 3. Listen for changes in storage (e.g., user changes preset)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings();
  }
});

// 4. The main function to modify the prompt
function modifyPrompt() {
  // --- NEW CHECKS ---
  // 1. Check if globally enabled
  if (!settings.isGloballyEnabled) {
    return;
  }
  
  // 2. Find the active preset
  if (!settings.activePresetId || !settings.presets || settings.presets.length === 0) {
    return; // No active preset selected or no presets exist
  }
  
  const activePreset = settings.presets.find(p => p.id === settings.activePresetId);
  if (!activePreset) {
    return; // Active preset ID doesn't match any known preset
  }

  // 3. Get prefix/suffix from the *active preset*
  const prefix = activePreset.prefix;
  const suffix = activePreset.suffix;
  // --- END NEW CHECKS ---

  // Find the text box. Gemini uses a contenteditable div.
  const textBox = document.querySelector('div[contenteditable="true"]');
  
  if (!textBox) {
    console.warn("Gemini Injector: Could not find text box.");
    return;
  }

  const currentText = textBox.innerText.trim();

  // Do nothing if the prompt is empty
  if (currentText === '') {
    return;
  }

  // Check if prefix/suffix are already applied
  // Note: We check .trim() in case your preset has trailing newlines
  const alreadyPrefixed = prefix && currentText.startsWith(prefix);
  const alreadySuffixed = suffix && currentText.endsWith(suffix);

  if (alreadyPrefixed && alreadySuffixed) {
    return; // Already done
  }

  // Build the new text. This preserves all newlines from your preset.
  let newText = currentText;
  if (prefix && !alreadyPrefixed) {
    // Add newlines to separate your prefix from the prompt
    newText = `${prefix}\n\n${newText}`; 
  }
  if (suffix && !alreadySuffixed) {
    // Add newlines to separate the prompt from your suffix
    newText = `${newText}\n\n${suffix}`;
  }

  // Directly set the innerText. This correctly handles all newlines.
  textBox.innerText = newText;
}

// 5. Function to find and attach listeners (No change from before)
function attachListeners() {
  const sendButtonSelector = 'button[aria-label="Send message"]';
  const textAreaSelector = 'div[contenteditable="true"]';

  const sendButton = document.querySelector(sendButtonSelector);
  const textArea = document.querySelector(textAreaSelector);

  if (sendButton && textArea) {
    sendButton.addEventListener('mousedown', modifyPrompt, { capture: true });
    textArea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        modifyPrompt();
      }
    }, { capture: true });

    clearInterval(checkInterval);
  }
}

// 6. Start an interval to check for the elements (No change from before)
const checkInterval = setInterval(attachListeners, 500);