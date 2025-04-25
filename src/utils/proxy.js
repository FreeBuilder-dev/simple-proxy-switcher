import browser from 'webextension-polyfill';

class ProxyManager {
  constructor() {
    this.currentProxy = null;
    this.proxyConfigs = [];
  }

  // 初始化代理配置
  async init() {
    try {
      // 加载代理配置列表
      const result = await browser.storage.local.get(['proxyConfigs', 'currentProxy']);
      this.proxyConfigs = result.proxyConfigs || [];
      
      // 恢复当前代理状态
      if (result.currentProxy) {
        this.currentProxy = result.currentProxy;
        await this.applyProxyConfig(result.currentProxy);
      }
      
      return this.proxyConfigs;
    } catch (error) {
      console.error('初始化代理配置失败:', error);
      return [];
    }
  }

  // 添加新的代理配置
  async addProxyConfig(config) {
    const newConfig = {
      id: Date.now().toString(),
      name: config.name,
      type: config.type,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      pacScript: config.pacScript,
      bypassList: config.bypassList || [],
      rules: config.rules || []
    };

    this.proxyConfigs.push(newConfig);
    await this.saveProxyConfigs();
    return newConfig;
  }

  // 更新代理配置
  async updateProxyConfig(id, config) {
    const index = this.proxyConfigs.findIndex(c => c.id === id);
    if (index !== -1) {
      this.proxyConfigs[index] = { ...this.proxyConfigs[index], ...config };
      await this.saveProxyConfigs();
      
      // 如果更新的是当前使用的代理，也更新当前代理状态
      if (this.currentProxy && this.currentProxy.id === id) {
        this.currentProxy = this.proxyConfigs[index];
        await this.saveCurrentProxy();
      }
      
      return this.proxyConfigs[index];
    }
    return null;
  }

  // 删除代理配置
  async deleteProxyConfig(id) {
    this.proxyConfigs = this.proxyConfigs.filter(c => c.id !== id);
    await this.saveProxyConfigs();
    
    // 如果删除的是当前使用的代理，清除当前代理状态
    if (this.currentProxy && this.currentProxy.id === id) {
      await this.clearProxy();
    }
  }

  // 保存代理配置到存储
  async saveProxyConfigs() {
    await browser.storage.local.set({ proxyConfigs: this.proxyConfigs });
  }

  // 保存当前代理状态
  async saveCurrentProxy() {
    await browser.storage.local.set({ currentProxy: this.currentProxy });
  }

  // 应用代理配置
  async applyProxyConfig(config) {
    const proxyConfig = {
      mode: 'fixed_servers',
      rules: {
        singleProxy: {
          scheme: config.type,
          host: config.host,
          port: parseInt(config.port)
        },
        bypassList: config.bypassList
      }
    };

    if (config.type === 'pac_script' && config.pacScript) {
      proxyConfig.mode = 'pac_script';
      proxyConfig.pacScript = { data: config.pacScript };
    }

    try {
      await browser.proxy.settings.set({
        value: proxyConfig,
        scope: 'regular'
      });
      this.currentProxy = config;
      await this.saveCurrentProxy();
      return true;
    } catch (error) {
      console.error('Failed to apply proxy config:', error);
      return false;
    }
  }

  // 清除代理设置
  async clearProxy() {
    try {
      await browser.proxy.settings.clear({
        scope: 'regular'
      });
      this.currentProxy = null;
      await browser.storage.local.remove('currentProxy');
      return true;
    } catch (error) {
      console.error('Failed to clear proxy:', error);
      return false;
    }
  }

  // 获取当前代理配置
  getCurrentProxy() {
    return this.currentProxy;
  }

  // 获取所有代理配置
  getAllProxyConfigs() {
    return this.proxyConfigs;
  }

  // 导入代理配置
  async importProxyConfigs(configs) {
    try {
      // 验证配置格式
      if (!Array.isArray(configs)) {
        throw new Error('配置格式错误：必须是数组');
      }

      // 验证每个配置的必填字段
      configs.forEach(config => {
        if (!config.name || !config.type || !config.host || !config.port) {
          throw new Error('配置格式错误：缺少必填字段');
        }
      });

      // 更新配置列表
      this.proxyConfigs = configs;
      await this.saveProxyConfigs();
      return true;
    } catch (error) {
      console.error('导入代理配置失败:', error);
      throw error;
    }
  }
}

export const proxyManager = new ProxyManager(); 