document.addEventListener('DOMContentLoaded', () => {
  const globalToggle = document.getElementById('global-toggle');
  const presetListDiv = document.getElementById('preset-list');
  const addNewButton = document.getElementById('add-new');

  /**
   * Loads all settings from storage and renders the UI elements (toggle state, preset list).
   */
  function loadAndRender() {
    chrome.storage.sync.get({
      isGloballyEnabled: true,
      activePresetId: null,
      presets: []
    }, (settings) => {
      // 1. Set the global toggle state
      globalToggle.checked = settings.isGloballyEnabled;

      // 2. Clear and render the preset list
      presetListDiv.innerHTML = ''; // Clear old list

      if (settings.presets.length === 0) {
        presetListDiv.innerHTML = '<div style="padding: 10px; color: #aaa; text-align: center;">No presets found. Click "Add New Preset" to create one.</div>';
      }

      settings.presets.forEach(preset => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'preset-item';
        
        // Highlight the active preset
        if (preset.id === settings.activePresetId) {
          itemDiv.classList.add('active');
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'preset-name';
        nameSpan.textContent = preset.name;
        
        // Click on the name to set it as the active preset
        nameSpan.addEventListener('click', () => {
          setActivePreset(preset.id);
        });

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'preset-actions';

        // --- Edit Button ---
        const editButton = document.createElement('button');
        editButton.textContent = '✏️'; // Pencil icon
        editButton.title = 'Edit Preset';
        editButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent the item from being selected when clicking edit
          // Use local storage to pass the ID to the options page
          chrome.storage.local.set({ editPresetId: preset.id }, () => {
             chrome.runtime.openOptionsPage();
          });
        });

        // --- Delete Button ---
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '❌'; // Delete icon
        deleteButton.title = 'Delete Preset';
        deleteButton.classList.add('delete-button'); // For dark theme styling
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent the item from being selected when clicking delete
          deletePreset(preset.id);
        });

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        itemDiv.appendChild(nameSpan);
        itemDiv.appendChild(actionsDiv);
        presetListDiv.appendChild(itemDiv);
      });
    });
  }

  // ===================================
  //           EVENT HANDLERS
  // ===================================

  // Save global toggle state when it changes
  globalToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ isGloballyEnabled: globalToggle.checked });
  });

  // Open options page to add a new preset (New Mode)
  addNewButton.addEventListener('click', () => {
    // Clear any existing 'editPresetId' flag to force New Mode in options.js
    chrome.storage.local.set({ editPresetId: null }, () => {
      chrome.runtime.openOptionsPage();
    });
  });

  // ===================================
  //           DATA FUNCTIONS
  // ===================================

  /**
   * Sets the specified preset as active and re-renders the list.
   * @param {string} presetId - The ID of the preset to activate.
   */
  function setActivePreset(presetId) {
    chrome.storage.sync.set({ activePresetId: presetId }, () => {
      loadAndRender(); // Re-render to show active state highlight
    });
  }

  /**
   * Deletes a preset by ID and handles resetting the active ID if needed.
   * @param {string} presetId - The ID of the preset to delete.
   */
  function deletePreset(presetId) {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }
    chrome.storage.sync.get({ presets: [], activePresetId: null }, (settings) => {
      const newPresets = settings.presets.filter(p => p.id !== presetId);
      let newActiveId = settings.activePresetId;
      
      // If we deleted the currently active preset, clear the active ID
      if (settings.activePresetId === presetId) {
        newActiveId = (newPresets.length > 0) ? newPresets[0].id : null; // Optionally set first preset as new active
      }
      
      chrome.storage.sync.set({ presets: newPresets, activePresetId: newActiveId }, () => {
        loadAndRender(); // Re-render the list to reflect deletion
      });
    });
  }

  // ===================================
  //           INITIALIZATION
  // ===================================
  
  // Load UI on panel open
  loadAndRender();

  // Listen for storage changes from the options page (editor) to update the list immediately
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      // Check if presets changed, which indicates a save/delete event occurred
      if (changes.presets || changes.activePresetId) {
        loadAndRender();
      }
    }
  });
});