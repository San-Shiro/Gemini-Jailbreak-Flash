let currentPresetId = null;

// Saves options to chrome.storage
function save_options() {
  const name = document.getElementById('name').value;
  const prefix = document.getElementById('prefix').value;
  const suffix = document.getElementById('suffix').value;

  if (!name) {
    alert('Preset name cannot be empty.');
    return;
  }

  chrome.storage.sync.get({ presets: [] }, (data) => {
    const presets = data.presets;
    
    if (currentPresetId) {
      // --- Edit Mode ---
      // Find and update the existing preset
      const presetIndex = presets.findIndex(p => p.id === currentPresetId);
      if (presetIndex > -1) {
        presets[presetIndex] = { ...presets[presetIndex], name, prefix, suffix };
      }
    } else {
      // --- New Mode ---
      // Add a new preset
      const newPreset = {
        id: `preset-${Date.now()}`, // Simple unique ID
        name: name,
        prefix: prefix,
        suffix: suffix
      };
      presets.push(newPreset);
    }

    // Save the entire presets array back
    chrome.storage.sync.set({ presets: presets }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Preset saved.';
      // Close the options page after saving
      setTimeout(() => {
        window.close();
      }, 750);
    });
  });
}

// Restores form state
function restore_options() {
  // Check if we are in "edit" mode
  chrome.storage.local.get('editPresetId', (data) => {
    if (data.editPresetId) {
      currentPresetId = data.editPresetId;
      document.getElementById('page-title').textContent = 'Edit Preset';

      // Now load the preset's data
      chrome.storage.sync.get({ presets: [] }, (syncData) => {
        const preset = syncData.presets.find(p => p.id === currentPresetId);
        if (preset) {
          document.getElementById('name').value = preset.name;
          document.getElementById('prefix').value = preset.prefix;
          document.getElementById('suffix').value = preset.suffix;
        }
      });
      
      // Clear the local 'edit' flag
      chrome.storage.local.remove('editPresetId');
    } else {
      // We are in "new" mode
      document.getElementById('page-title').textContent = 'Create New Preset';
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);