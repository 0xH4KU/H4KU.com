// GitLab Configuration (from Decap CMS config)
const GITLAB_CONFIG = {
  repo: 'lummuu/lum.bio',
  branch: 'main',
  clientId: '6ceeef10ac66ea69ec434988759eaaffe0c6ab020547264c0600b5e8a86e183d',
  authEndpoint: 'https://gitlab.com/oauth/authorize',
  tokenEndpoint: 'https://gitlab.com/oauth/token',
  apiBase: 'https://gitlab.com/api/v4',
  redirectUri: window.location.origin + window.location.pathname,
};

// State
let accessToken = null;
let allContent = [];
let filteredContent = [];
let selectedItems = new Set();

// DOM Elements
const authSection = document.getElementById('authSection');
const mainContent = document.getElementById('mainContent');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const statusAlert = document.getElementById('statusAlert');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const folderFilter = document.getElementById('folderFilter');
const contentItems = document.getElementById('contentItems');
const selectAll = document.getElementById('selectAll');
const selectedCount = document.getElementById('selectedCount');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const deleteBtn = document.getElementById('deleteBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteFileList = document.getElementById('deleteFileList');
const deleteCount = document.getElementById('deleteCount');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const dependencyWarning = document.getElementById('dependencyWarning');
const quickSelectTest = document.getElementById('quickSelectTest');

// Network helpers
const API_RETRY_LIMIT = 3;
const API_RETRY_BASE_DELAY = 500;
const TOKEN_EXPIRY_BUFFER = 60 * 1000; // refresh 1 minute early
let refreshPromise = null;

// Initialize
init();

function init() {
  // Check for OAuth callback
  handleOAuthCallback();

  // Check if already logged in
  const savedToken = localStorage.getItem('gitlab_access_token');
  if (savedToken) {
    accessToken = savedToken;
    showMainContent();
  }

  // Event listeners
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  searchInput.addEventListener('input', handleFilter);
  typeFilter.addEventListener('change', handleFilter);
  folderFilter.addEventListener('change', handleFilter);
  selectAll.addEventListener('change', handleSelectAll);
  clearSelectionBtn.addEventListener('click', clearSelection);
  deleteBtn.addEventListener('click', showDeleteModal);
  cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleDelete);
  quickSelectTest.addEventListener('click', selectTestFiles);
}

// OAuth Functions
async function handleLogin() {
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(128);

  // Generate code challenge using S256 method
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem('oauth_state', state);
  localStorage.setItem('code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: GITLAB_CONFIG.clientId,
    redirect_uri: GITLAB_CONFIG.redirectUri,
    response_type: 'code',
    state: state,
    scope: 'api',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${GITLAB_CONFIG.authEndpoint}?${params}`;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (!code || !state) return;

  const savedState = localStorage.getItem('oauth_state');
  if (state !== savedState) {
    alert('OAuth state mismatch. Please try again.');
    return;
  }

  // Exchange code for token
  exchangeCodeForToken(code);
}

async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');

  try {
    const response = await fetch(GITLAB_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITLAB_CONFIG.clientId,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GITLAB_CONFIG.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    persistTokenData(data);

    localStorage.removeItem('oauth_state');
    localStorage.removeItem('code_verifier');

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    showMainContent();
  } catch (error) {
    console.error('OAuth error:', error);
    alert('登入失敗。請重試。');
  }
}

function handleLogout() {
  accessToken = null;
  localStorage.removeItem('gitlab_access_token');
  localStorage.removeItem('gitlab_refresh_token');
  localStorage.removeItem('gitlab_token_expiry');
  authSection.style.display = 'block';
  mainContent.classList.remove('active');
  allContent = [];
  filteredContent = [];
  selectedItems.clear();
  clearStatus();
}

// Content Loading Functions
async function showMainContent() {
  authSection.style.display = 'none';
  mainContent.classList.add('active');
  clearStatus();

  await loadContent();
}

async function loadContent() {
  try {
    contentItems.innerHTML = '<div class="loading">載入中...</div>';

    // Load all content files from GitLab
    const [folders, pages, works] = await Promise.all([
      loadFilesFromPath('src/content/folders'),
      loadFilesFromPath('src/content/pages'),
      loadFilesFromPath('src/content/works'),
    ]);

    allContent = [
      ...folders.map(f => ({ ...f, type: 'folder', icon: '📁' })),
      ...pages.map(p => ({ ...p, type: 'page', icon: '📄' })),
      ...works.map(w => ({ ...w, type: 'image', icon: '🖼️' })),
    ];

    // Populate folder filter
    populateFolderFilter();

    // Initial render
    handleFilter();
  } catch (error) {
    console.error('Failed to load content:', error);
    showStatus('error', `內容載入失敗：${formatErrorMessage(error)}`);
    contentItems.innerHTML = '<div class="empty-state">載入失敗。請重試或檢查權限。</div>';
  }
}

async function loadFilesFromPath(path) {
  try {
    const files = await gitlabJson(
      `${GITLAB_CONFIG.apiBase}/projects/${encodeURIComponent(GITLAB_CONFIG.repo)}/repository/tree?path=${path}&ref=${GITLAB_CONFIG.branch}&per_page=100`
    );

    // Load file contents to get metadata
    const contentPromises = files.map(async (file) => {
      try {
        const fileData = await gitlabJson(
          `${GITLAB_CONFIG.apiBase}/projects/${encodeURIComponent(GITLAB_CONFIG.repo)}/repository/files/${encodeURIComponent(file.path)}?ref=${GITLAB_CONFIG.branch}`
        );
        const content = atob(fileData.content);

        let metadata = {};
        let filename = file.name;
        let folderId = null;

        // Parse JSON files
        if (file.name.endsWith('.json')) {
          try {
            metadata = JSON.parse(content);
            filename = metadata.filename || metadata.name || file.name;
            folderId = metadata.folderId || null;
          } catch (e) {
            console.error('Failed to parse JSON:', file.name, e);
          }
        }

        // Parse markdown frontmatter
        if (file.name.endsWith('.md')) {
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            frontmatter.split('\n').forEach(line => {
              const [key, ...valueParts] = line.split(':');
              if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                metadata[key.trim()] = value;
              }
            });
            filename = metadata.name || file.name;
            folderId = metadata.folderId || null;
          }
        }

        return {
          path: file.path,
          name: filename,
          folderId: folderId,
          metadata: metadata,
        };
      } catch (error) {
        console.error('Failed to load file:', file.path, error);
        return null;
      }
    });

    const results = await Promise.all(contentPromises);
    return results.filter(r => r !== null);
  } catch (error) {
    console.error('Failed to load files from path:', path, error);
    if (error.message && error.message.includes('404')) {
      showStatus('warning', `${path} 未找到，已跳過。`);
      return [];
    }
    throw new Error(`${path} 載入失敗：${error.message}`);
  }
}

function populateFolderFilter() {
  const folders = allContent
    .filter(item => item.type === 'folder')
    .map(folder => folder.metadata.id || folder.name)
    .sort();

  // Get unique folder IDs from all items
  const usedFolders = new Set();
  allContent.forEach(item => {
    if (item.folderId) {
      usedFolders.add(item.folderId);
    }
  });

  // Combine and deduplicate
  const allFolders = [...new Set([...folders, ...usedFolders])].sort();

  folderFilter.innerHTML = `
    <option value="all">所有文件夾</option>
    <option value="home">🏠 首頁</option>
    ${allFolders.map(folder => `<option value="${folder}">${folder}</option>`).join('')}
  `;
}

// Filter Functions
function handleFilter() {
  const searchTerm = searchInput.value.toLowerCase();
  const typeValue = typeFilter.value;
  const folderValue = folderFilter.value;

  filteredContent = allContent.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm) ||
      (item.folderId && item.folderId.toLowerCase().includes(searchTerm));

    // Type filter
    const matchesType = typeValue === 'all' || item.type === typeValue;

    // Folder filter
    let matchesFolder = true;
    if (folderValue === 'home') {
      matchesFolder = !item.folderId || item.folderId === '';
    } else if (folderValue !== 'all') {
      matchesFolder = item.folderId === folderValue ||
                      (item.type === 'folder' && (item.metadata.id === folderValue || item.name === folderValue));
    }

    return matchesSearch && matchesType && matchesFolder;
  });

  renderContent();
}

function renderContent() {
  if (filteredContent.length === 0) {
    contentItems.innerHTML = '<div class="empty-state">沒有找到符合條件的內容</div>';
    return;
  }

  // Sort by folder, then by name
  const sorted = [...filteredContent].sort((a, b) => {
    const folderA = a.folderId || '';
    const folderB = b.folderId || '';
    if (folderA !== folderB) {
      return folderA.localeCompare(folderB);
    }
    return a.name.localeCompare(b.name);
  });

  contentItems.innerHTML = sorted.map(item => {
    const isSelected = selectedItems.has(item.path);
    return `
      <div class="list-item" data-path="${item.path}">
        <input type="checkbox" class="item-checkbox" ${isSelected ? 'checked' : ''}>
        <span class="item-icon">${item.icon}</span>
        <span class="item-name">${item.name}</span>
        <span class="item-folder">${item.folderId || '[Home]'}</span>
        <span class="item-type type-${item.type}">${getTypeLabel(item.type)}</span>
      </div>
    `;
  }).join('');

  // Add event listeners to checkboxes
  document.querySelectorAll('.list-item .item-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleItemSelect);
  });

  updateSelectionUI();
}

function getTypeLabel(type) {
  const labels = {
    folder: '文件夾',
    page: '頁面',
    image: '圖片',
  };
  return labels[type] || type;
}

// Selection Functions
function handleItemSelect(event) {
  const listItem = event.target.closest('.list-item');
  const path = listItem.dataset.path;

  if (event.target.checked) {
    selectedItems.add(path);
  } else {
    selectedItems.delete(path);
  }

  updateSelectionUI();
}

function handleSelectAll(event) {
  if (event.target.checked) {
    filteredContent.forEach(item => selectedItems.add(item.path));
  } else {
    filteredContent.forEach(item => selectedItems.delete(item.path));
  }

  renderContent();
}

function clearSelection() {
  selectedItems.clear();
  selectAll.checked = false;
  renderContent();
}

function selectTestFiles() {
  selectedItems.clear();

  allContent.forEach(item => {
    const isTest = item.name.toLowerCase().includes('test') ||
                   (item.folderId && item.folderId.toLowerCase().includes('test')) ||
                   (item.metadata && item.metadata.id && item.metadata.id.toLowerCase().includes('test'));

    if (isTest) {
      selectedItems.add(item.path);
    }
  });

  renderContent();
}

function updateSelectionUI() {
  selectedCount.textContent = selectedItems.size;
  deleteBtn.disabled = selectedItems.size === 0;

  // Update select all checkbox
  const visiblePaths = filteredContent.map(item => item.path);
  const allVisible = visiblePaths.every(path => selectedItems.has(path));
  const someVisible = visiblePaths.some(path => selectedItems.has(path));

  selectAll.checked = allVisible && visiblePaths.length > 0;
  selectAll.indeterminate = someVisible && !allVisible;
}

// Delete Functions
function showDeleteModal() {
  const itemsToDelete = allContent.filter(item => selectedItems.has(item.path));

  deleteFileList.innerHTML = itemsToDelete
    .map(item => `
      <div class="file-list-item">
        ${item.icon} ${item.name} ${item.folderId ? `(${item.folderId})` : ''}
      </div>
    `)
    .join('');

  deleteCount.textContent = itemsToDelete.length;
  updateDependencyWarnings(itemsToDelete);
  deleteModal.classList.add('active');
}

function hideDeleteModal() {
  deleteModal.classList.remove('active');
  resetDependencyWarning();
}

function updateDependencyWarnings(itemsToDelete) {
  if (!dependencyWarning) return;

  const warnings = [];
  const selectedPaths = new Set(itemsToDelete.map(item => item.path));

  itemsToDelete
    .filter(item => item.type === 'folder')
    .forEach(folderItem => {
      const identifiers = getFolderIdentifiers(folderItem);
      if (identifiers.size === 0) return;

      const dependents = allContent.filter(item => {
        if (selectedPaths.has(item.path) || !item.folderId) return false;
        return identifiers.has(normalizeFolderId(item.folderId));
      });

      if (dependents.length > 0) {
        warnings.push({
          folderName: folderItem.name,
          dependents: dependents,
        });
      }
    });

  if (warnings.length === 0) {
    resetDependencyWarning();
    return;
  }

  const warningHtml = warnings.map(warning => {
    const visibleDependents = warning.dependents.slice(0, 5)
      .map(dep => `<li>${dep.icon} ${dep.name}</li>`)
      .join('');
    const extraCount = warning.dependents.length > 5
      ? `<li>... 以及其他 ${warning.dependents.length - 5} 個項目</li>`
      : '';

    return `
      <div style="margin-bottom: 12px;">
        <strong>${warning.folderName}</strong> 仍被以下內容引用：
        <ul style="margin: 8px 0 0 20px; list-style: disc;">
          ${visibleDependents}${extraCount}
        </ul>
      </div>
    `;
  }).join('');

  dependencyWarning.innerHTML = `
    <p style="margin-bottom: 8px;">以下文件夾尚有內容引用，建議刪除前確認：</p>
    ${warningHtml}
  `;
  dependencyWarning.style.display = 'block';
}

function resetDependencyWarning() {
  if (!dependencyWarning) return;
  dependencyWarning.style.display = 'none';
  dependencyWarning.innerHTML = '';
}

async function handleDelete() {
  const itemsToDelete = allContent.filter(item => selectedItems.has(item.path));

  if (itemsToDelete.length === 0) {
    hideDeleteModal();
    return;
  }

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = '刪除中...';

  try {
    // Create a commit with all deletions
    const actions = itemsToDelete.map(item => ({
      action: 'delete',
      file_path: item.path,
    }));

    const commitMessage = `Delete ${itemsToDelete.length} items via Bulk Manager\n\n` +
      itemsToDelete.map(item => `- ${item.name}`).join('\n');

    await gitlabJson(
      `${GITLAB_CONFIG.apiBase}/projects/${encodeURIComponent(GITLAB_CONFIG.repo)}/repository/commits`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: GITLAB_CONFIG.branch,
          commit_message: commitMessage,
          actions: actions,
        }),
      }
    );

    // Success!
    alert(`✅ 成功刪除 ${itemsToDelete.length} 個項目！`);
    showStatus('success', `已刪除 ${itemsToDelete.length} 個項目，並建立 1 個 commit。`);

    // Clear selection and reload
    selectedItems.clear();
    hideDeleteModal();
    await loadContent();
  } catch (error) {
    handleApiError(error, '刪除失敗');
    alert(`❌ 刪除失敗：${formatErrorMessage(error)}`);
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = '確認刪除';
  }
}

// Utility Functions
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

function normalizeFolderId(value) {
  return (value || '').toString().trim().toLowerCase();
}

function getFolderIdentifiers(folderItem) {
  const identifiers = new Set();
  if (folderItem.metadata && folderItem.metadata.id) {
    identifiers.add(normalizeFolderId(folderItem.metadata.id));
  }
  if (folderItem.folderId) {
    identifiers.add(normalizeFolderId(folderItem.folderId));
  }
  if (folderItem.name) {
    identifiers.add(normalizeFolderId(folderItem.name));
  }
  identifiers.delete('');
  return identifiers;
}

function showStatus(type, message) {
  if (!statusAlert || !message) return;
  const typeClassMap = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
    info: 'alert-warning',
  };
  statusAlert.className = `alert ${typeClassMap[type] || 'alert-warning'}`;
  statusAlert.textContent = message;
  statusAlert.style.display = 'block';
}

function clearStatus() {
  if (!statusAlert) return;
  statusAlert.style.display = 'none';
  statusAlert.textContent = '';
  statusAlert.className = 'alert';
}

function formatErrorMessage(error, fallback = '操作失敗') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return fallback;
}

function handleApiError(error, context = '操作失敗', options = {}) {
  const { silent = false } = options;
  console.error(context, error);
  if (!silent) {
    showStatus('error', `${context}：${formatErrorMessage(error)}`);
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetryStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function getRetryDelay(attempt) {
  return API_RETRY_BASE_DELAY * Math.pow(2, attempt);
}

async function extractGitlabError(response, fallback = 'GitLab API 錯誤') {
  if (!response) return fallback;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const data = await response.json();
      if (typeof data === 'string') return data;
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }
      if (data.message) {
        return typeof data.message === 'string'
          ? data.message
          : JSON.stringify(data.message);
      }
      if (data.error_description) return data.error_description;
      if (data.error) return data.error;
    } catch (parseError) {
      console.debug('Failed to parse GitLab error JSON', parseError);
    }
  }

  try {
    const text = await response.text();
    if (text) return text;
  } catch (textError) {
    console.debug('Failed to read GitLab error text', textError);
  }

  return `${fallback} (${response.status})`;
}

async function gitlabJson(url, options = {}) {
  const response = await gitlabFetch(url, options);
  if (!response.ok) {
    const message = await extractGitlabError(response);
    throw new Error(message);
  }
  return response.json();
}

async function gitlabFetch(url, options = {}) {
  await ensureValidToken();

  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${accessToken}`,
  };

  const fetchOptions = {
    ...options,
    headers,
  };

  let lastError = null;

  for (let attempt = 0; attempt < API_RETRY_LIMIT; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (response.status === 401) {
        try {
          await refreshAccessToken();
          headers['Authorization'] = `Bearer ${accessToken}`;
          continue;
        } catch (refreshError) {
          throw refreshError;
        }
      }

      if (shouldRetryStatus(response.status) && attempt < API_RETRY_LIMIT - 1) {
        await wait(getRetryDelay(attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt === API_RETRY_LIMIT - 1) {
        throw error;
      }
      await wait(getRetryDelay(attempt));
    }
  }

  throw lastError || new Error('GitLab 請求失敗');
}

async function ensureValidToken() {
  if (!accessToken) {
    const storedToken = localStorage.getItem('gitlab_access_token');
    if (storedToken) {
      accessToken = storedToken;
    }
  }

  if (!accessToken) {
    throw new Error('尚未登入 GitLab');
  }

  const expiry = parseInt(localStorage.getItem('gitlab_token_expiry') || '0', 10);
  if (expiry && Date.now() > expiry - TOKEN_EXPIRY_BUFFER) {
    await refreshAccessToken();
  }
}

async function refreshAccessToken() {
  const storedRefreshToken = localStorage.getItem('gitlab_refresh_token');
  if (!storedRefreshToken) {
    throw new Error('登入已過期，請重新登入。');
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(GITLAB_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITLAB_CONFIG.clientId,
          grant_type: 'refresh_token',
          refresh_token: storedRefreshToken,
        }),
      });

      if (!response.ok) {
        const message = await extractGitlabError(response, '刷新 token 失敗');
        throw new Error(message);
      }

      const data = await response.json();
      persistTokenData(data);
      return data;
    })();
  }

  try {
    return await refreshPromise;
  } catch (error) {
    console.error('Token refresh failed:', error);
    handleLogout();
    throw new Error('登入已過期，請重新登入。');
  } finally {
    refreshPromise = null;
  }
}

function persistTokenData(data) {
  if (!data || !data.access_token) {
    throw new Error('Token 回應不完整，請重新登入。');
  }

  accessToken = data.access_token;
  localStorage.setItem('gitlab_access_token', data.access_token);

  if (data.refresh_token) {
    localStorage.setItem('gitlab_refresh_token', data.refresh_token);
  }

  if (data.expires_in) {
    const bufferSeconds = 30;
    const expiresAt = Date.now() + Math.max(data.expires_in - bufferSeconds, 5) * 1000;
    localStorage.setItem('gitlab_token_expiry', expiresAt.toString());
  } else {
    localStorage.removeItem('gitlab_token_expiry');
  }
}
