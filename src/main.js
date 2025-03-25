// Constants
const DIRECT_API_URL = 'https://catbox.moe/user/api.php';
const PROXY_API_URL = '/proxy/catbox';
const STORAGE_KEY = 'catbox-uploader-history';

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const uploadResults = document.getElementById('upload-results');
const resultLinks = document.getElementById('result-links');
const uploadHistory = document.getElementById('upload-history');
const historyItems = document.getElementById('history-items');
const noHistory = document.getElementById('no-history');
const clearHistoryBtn = document.getElementById('clear-history');

// State
let uploadedFiles = [];
let history = loadHistory();

// Initialize
renderHistory();

// Event Listeners
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('active');
});

uploadArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('active');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('active');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFiles(files);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
});

clearHistoryBtn.addEventListener('click', () => {
  clearHistory();
});

// Functions
function handleFiles(files) {
  uploadedFiles = Array.from(files);
  uploadFiles(uploadedFiles);
}

async function uploadFiles(files) {
  uploadProgress.classList.remove('hidden');
  uploadResults.classList.add('hidden');
  resultLinks.innerHTML = '';
  
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Update progress text
    progressPercentage.textContent = `Preparing ${file.name} (${i + 1}/${files.length})`;
    
    // Start progress simulation
    simulateProgress();
    
    const result = await uploadFile(file, i, files.length);
    
    if (result) {
      results.push(result);
    }
  }
  
  uploadProgress.classList.add('hidden');
  
  if (results.length > 0) {
    displayResults(results);
    addToHistory(results);
  }
}

async function uploadFile(file, index, total) {
  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);
    
    // Update progress UI to show which file is being uploaded
    progressPercentage.textContent = `Uploading ${index + 1}/${total}: ${file.name}`;
    
    console.log(`Attempting to upload file: ${file.name} (${file.size} bytes)`);
    
    // Try direct API first
    try {
      console.log('Trying direct API...');
      const directResponse = await fetch(DIRECT_API_URL, {
        method: 'POST',
        body: formData,
      });
      
      console.log(`Direct API response status: ${directResponse.status}`);
      
      if (directResponse.ok) {
        const url = await directResponse.text();
        console.log(`Direct API response text: ${url}`);
        
        // Check if the response is an error message from catbox
        if (url.includes('error') || url.includes('Error')) {
          throw new Error(url);
        }
        
        return {
          name: file.name,
          url: url.trim(),
          type: file.type,
          size: file.size,
          date: new Date().toISOString()
        };
      }
      
      // If direct API fails, throw an error to trigger the proxy fallback
      throw new Error(`Direct API failed with status: ${directResponse.status}`);
    } catch (directError) {
      console.log(`Direct API error: ${directError.message}. Falling back to proxy...`);
      
      // Create a new FormData object for the proxy request
      // This is necessary because the original FormData might have been consumed
      const proxyFormData = new FormData();
      proxyFormData.append('reqtype', 'fileupload');
      proxyFormData.append('fileToUpload', file);
      
      // Try proxy API as fallback
      const proxyResponse = await fetch(PROXY_API_URL, {
        method: 'POST',
        body: proxyFormData,
      });
      
      console.log(`Proxy API response status: ${proxyResponse.status}`);
      
      if (!proxyResponse.ok) {
        throw new Error(`HTTP error! status: ${proxyResponse.status}`);
      }
      
      const url = await proxyResponse.text();
      console.log(`Proxy API response text: ${url}`);
      
      // Check if the response is an error message from catbox
      if (url.includes('error') || url.includes('Error')) {
        throw new Error(url);
      }
      
      return {
        name: file.name,
        url: url.trim(),
        type: file.type,
        size: file.size,
        date: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert(`Failed to upload ${file.name}: ${error.message}`);
    return null;
  }
}

// Update the progress manually since we can't use onUploadProgress with fetch
function simulateProgress(duration = 2000) {
  let progress = 0;
  const interval = 100;
  const increment = 5;
  
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        clearInterval(timer);
        updateProgress(100);
        resolve();
      } else {
        updateProgress(progress);
      }
    }, interval);
  });
}

function updateProgress(percent) {
  progressBar.style.width = `${percent}%`;
  progressPercentage.textContent = `${percent}%`;
}

function displayResults(results) {
  uploadResults.classList.remove('hidden');
  
  results.forEach(result => {
    const resultItem = createResultItem(result);
    resultLinks.appendChild(resultItem);
  });
  
  // Animate results
  uploadResults.classList.add('animate-slide-up');
  setTimeout(() => {
    uploadResults.classList.remove('animate-slide-up');
  }, 500);
}

function createResultItem(result) {
  const item = document.createElement('div');
  item.className = 'result-item';
  
  const isImage = result.type.startsWith('image/');
  
  const leftContent = document.createElement('div');
  leftContent.className = 'flex items-center';
  
  if (isImage) {
    const thumbnail = document.createElement('img');
    thumbnail.src = result.url;
    thumbnail.className = 'w-12 h-12 object-cover rounded mr-3';
    leftContent.appendChild(thumbnail);
  } else {
    const fileIcon = document.createElement('div');
    fileIcon.className = 'w-12 h-12 flex items-center justify-center bg-primary bg-opacity-10 rounded mr-3';
    fileIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
    leftContent.appendChild(fileIcon);
  }
  
  const fileInfo = document.createElement('div');
  fileInfo.className = 'overflow-hidden';
  
  const fileName = document.createElement('p');
  fileName.className = 'font-medium text-gray-800 truncate';
  fileName.textContent = result.name;
  
  const fileUrl = document.createElement('p');
  fileUrl.className = 'text-sm text-gray-500 truncate';
  fileUrl.textContent = result.url;
  
  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileUrl);
  leftContent.appendChild(fileInfo);
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-sm btn-primary text-white ml-3';
  copyBtn.textContent = 'Copy Link';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(result.url)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  });
  
  item.appendChild(leftContent);
  item.appendChild(copyBtn);
  
  return item;
}

function addToHistory(results) {
  history = [...results, ...history];
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyItems.innerHTML = '';
  
  if (history.length === 0) {
    noHistory.classList.remove('hidden');
    return;
  }
  
  noHistory.classList.add('hidden');
  
  history.slice(0, 12).forEach(item => {
    const historyItem = createHistoryItem(item);
    historyItems.appendChild(historyItem);
  });
}

function createHistoryItem(item) {
  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  
  const isImage = item.type.startsWith('image/');
  
  if (isImage) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'history-thumbnail';
    
    const img = document.createElement('img');
    img.src = item.url;
    img.className = 'w-full h-full object-cover';
    
    thumbnail.appendChild(img);
    historyItem.appendChild(thumbnail);
  } else {
    const fileIcon = document.createElement('div');
    fileIcon.className = 'history-thumbnail flex items-center justify-center bg-primary bg-opacity-10';
    fileIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
    historyItem.appendChild(fileIcon);
  }
  
  const itemInfo = document.createElement('div');
  itemInfo.className = 'p-3';
  
  const fileName = document.createElement('p');
  fileName.className = 'font-medium text-gray-800 truncate';
  fileName.textContent = item.name;
  
  const fileDate = document.createElement('p');
  fileDate.className = 'text-xs text-gray-500 mt-1';
  fileDate.textContent = new Date(item.date).toLocaleString();
  
  const actions = document.createElement('div');
  actions.className = 'flex mt-2 space-x-2';
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-xs btn-primary text-white flex-1';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(item.url)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      });
  });
  
  const openBtn = document.createElement('a');
  openBtn.href = item.url;
  openBtn.target = '_blank';
  openBtn.className = 'btn btn-xs btn-outline flex-1';
  openBtn.textContent = 'Open';
  
  actions.appendChild(copyBtn);
  actions.appendChild(openBtn);
  
  itemInfo.appendChild(fileName);
  itemInfo.appendChild(fileDate);
  itemInfo.appendChild(actions);
  
  historyItem.appendChild(itemInfo);
  
  return historyItem;
}

function loadHistory() {
  const savedHistory = localStorage.getItem(STORAGE_KEY);
  return savedHistory ? JSON.parse(savedHistory) : [];
}

function saveHistory() {
  // Limit history to 50 items
  if (history.length > 50) {
    history = history.slice(0, 50);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
}
