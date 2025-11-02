document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('global-toggle');
    const presetListDiv = document.getElementById('preset-list');
    const addNewButton = document.getElementById('add-new');
  
    // Load all settings and render the UI
    function loadAndRender() {
      chrome.storage.sync.get({
        isGloballyEnabled: true,
        activePresetId: null,
        presets: []
      }, (settings) => {
        // 1. Set the toggle state
        globalToggle.checked = settings.isGloballyEnabled;
  
        // 2. Clear and render the preset list
        presetListDiv.innerHTML = ''; // Clear old list
        settings.presets.forEach(preset => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'preset-item';
          if (preset.id === settings.activePresetId) {
            itemDiv.classList.add('active');
          }
  
          const nameSpan = document.createElement('span');
          nameSpan.className = 'preset-name';
          nameSpan.textContent = preset.name;
          // Click name to select as active
          nameSpan.addEventListener('click', () => {
            setActivePreset(preset.id);
          });
  
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'preset-actions';
  
          const editButton = document.createElement('button');
          editButton.textContent = '✏️'; // Pencil icon
          editButton.title = 'Edit';
          editButton.addEventListener('click', () => {
            // Open options page with this preset's ID
            chrome.runtime.openOptionsPage(() => {
              // A bit of a hack: pass the ID via a short-lived storage item
              // as openOptionsPage() doesn't support query params.
              chrome.storage.local.set({ editPresetId: preset.id });
            });
          });
  
          const deleteButton = document.createElement('button');
          deleteButton.textContent = '❌'; // Delete icon
          deleteButton.title = 'Delete';
          deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
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
  
    // ---- Event Handlers ----
  
    // Save global toggle state
    globalToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ isGloballyEnabled: globalToggle.checked });
    });
  
    // Open options page to add a new preset
    addNewButton.addEventListener('click', () => {
      // Clear any "edit" ID before opening
      chrome.storage.local.set({ editPresetId: null }, () => {
        chrome.runtime.openOptionsPage();
      });
    });
  
    // ---- Data Functions ----
  
    function setActivePreset(presetId) {
      chrome.storage.sync.set({ activePresetId: presetId }, () => {
        loadAndRender(); // Re-render to show active state
      });
    }
  
    function deletePreset(presetId) {
      if (!confirm('Are you sure you want to delete this preset?')) {
        return;
      }
      chrome.storage.sync.get({ presets: [], activePresetId: null }, (settings) => {
        const newPresets = settings.presets.filter(p => p.id !== presetId);
        let newActiveId = settings.activePresetId;
        // If we deleted the active preset, reset activeId
        if (settings.activePresetId === presetId) {
          newActiveId = null;
        }
        chrome.storage.sync.set({ presets: newPresets, activePresetId: newActiveId }, () => {
          loadAndRender(); // Re-render the list
        });
      });
    }
  
    // ---- Initial Load ----
    loadAndRender();
  
    // Also re-render if storage changes (e.g., after an edit in options page)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        loadAndRender();
      }
    });
  });