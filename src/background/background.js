import browser from 'webextension-polyfill';
import { proxyManager } from '../utils/proxy';

// 更新扩展图标
async function updateExtensionIcon(isActive) {
  const iconPath = isActive ? 'assets/icons/active.png' : 'assets/icons/inactive.png';
  try {
    await browser.action.setIcon({
      path: {
        128: iconPath
      }
    });
    console.log('图标更新成功:', iconPath);
  } catch (error) {
    console.error('更新图标失败:', error);
  }
}

// 初始化代理管理器和图标状态
async function initialize() {
  try {
    await proxyManager.init();
    const currentProxy = proxyManager.getCurrentProxy();
    await updateExtensionIcon(!!currentProxy);
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 执行初始化
initialize();

// 处理代理认证
browser.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    const currentProxy = proxyManager.getCurrentProxy();
    
    if (currentProxy && currentProxy.username && currentProxy.password) {
      callback({
        authCredentials: {
          username: currentProxy.username,
          password: currentProxy.password
        }
      });
    } else {
      callback();
    }
  },
  { urls: ['<all_urls>'] },
  ['asyncBlocking']
);

// 监听来自 popup 和 options 页面的消息
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PROXY_CONFIGS':
      sendResponse(proxyManager.getAllProxyConfigs());
      break;
      
    case 'GET_CURRENT_PROXY':
      sendResponse(proxyManager.getCurrentProxy());
      break;
      
    case 'APPLY_PROXY':
      proxyManager.applyProxyConfig(message.config)
        .then(() => {
          updateExtensionIcon(true);
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('Failed to apply proxy:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'CLEAR_PROXY':
      proxyManager.clearProxy()
        .then(() => {
          updateExtensionIcon(false);
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('Failed to clear proxy:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'ADD_PROXY_CONFIG':
      proxyManager.addProxyConfig(message.config)
        .then(config => sendResponse({ success: true, config }))
        .catch(error => sendResponse({ success: false, error }));
      return true;
      
    case 'UPDATE_PROXY_CONFIG':
      proxyManager.updateProxyConfig(message.id, message.config)
        .then(config => sendResponse({ success: true, config }))
        .catch(error => sendResponse({ success: false, error }));
      return true;
      
    case 'DELETE_PROXY_CONFIG':
      proxyManager.deleteProxyConfig(message.id)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error }));
      return true;
      
    case 'IMPORT_PROXY_CONFIGS':
      proxyManager.importProxyConfigs(message.configs)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error }));
      return true;
      
    case 'UPDATE_ICON':
      updateExtensionIcon(message.isActive);
      sendResponse({ success: true });
      break;
  }
}); 