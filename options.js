let currentPresetId = null;

/**
 * Saves or updates a preset to chrome.storage.sync.
 */
function save_options() {
  const name = document.getElementById('name').value.trim();
  const prefix = document.getElementById('prefix').value;
  const suffix = document.getElementById('suffix').value;

  if (!name) {
    alert('Preset name cannot be empty.');
    return;
  }

  chrome.storage.sync.get({ presets: [], activePresetId: null }, (data) => {
    const presets = data.presets;
    let newActiveId = data.activePresetId;
    
    if (currentPresetId) {
      // --- EDIT MODE ---
      // Find and update the existing preset
      const presetIndex = presets.findIndex(p => p.id === currentPresetId);
      if (presetIndex > -1) {
        presets[presetIndex] = { ...presets[presetIndex], name, prefix, suffix };
      }
    } else {
      // --- NEW MODE ---
      // Add a new preset
      const newPreset = {
        id: `preset-${Date.now()}`, // Simple unique ID
        name: name,
        prefix: prefix,
        suffix: suffix
      };
      presets.push(newPreset);
      
      // If no preset was active before, make the newly created one active
      if (!newActiveId) {
        newActiveId = newPreset.id;
      }
    }

    // Save the entire presets array and potentially the new active ID back
    chrome.storage.sync.set({ presets: presets, activePresetId: newActiveId }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Preset saved.';
      status.style.opacity = '1'; // Make status visible
      
      // Close the options page after saving
      setTimeout(() => {
        status.style.opacity = '0'; 
        window.close();
      }, 750);
    });
  });
}

/**
 * Restores form state based on whether we are editing an existing preset
 * or creating a new one.
 */
function restore_options() {
  // Check local storage for the edit flag passed from the popup
  chrome.storage.local.get('editPresetId', (data) => {
    if (data.editPresetId) {
      currentPresetId = data.editPresetId;
      document.getElementById('page-title').textContent = 'Edit Preset';

      // Load the preset's data from sync storage
      chrome.storage.sync.get({ presets: [] }, (syncData) => {
        const preset = syncData.presets.find(p => p.id === currentPresetId);
        if (preset) {
          document.getElementById('name').value = preset.name;
          document.getElementById('prefix').value = preset.prefix;
          document.getElementById('suffix').value = preset.suffix;
        }
      });
      
      // Clear the local 'edit' flag right after reading it
      chrome.storage.local.remove('editPresetId');
    } else {
      // New Mode: Ensure title is correct
      document.getElementById('page-title').textContent = 'Create New Preset';
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);