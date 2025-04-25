import browser from 'webextension-polyfill';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const locales = {
  'zh-CN': zhCN,
  'en-US': enUS
};

let currentLocale = 'zh-CN';

// 初始化语言设置
async function init() {
  const result = await browser.storage.local.get('locale');
  if (result.locale) {
    currentLocale = result.locale;
  } else {
    // 根据浏览器语言设置默认语言
    const browserLang = navigator.language;
    currentLocale = browserLang.startsWith('zh') ? 'zh-CN' : 'en-US';
    await browser.storage.local.set({ locale: currentLocale });
  }
}

// 切换语言
async function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale;
    await browser.storage.local.set({ locale });
    return true;
  }
  return false;
}

// 获取当前语言
function getLocale() {
  return currentLocale;
}

// 获取翻译
function t(key) {
  const keys = key.split('.');
  let value = locales[currentLocale];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return value || key;
}

export { init, setLocale, getLocale, t }; 