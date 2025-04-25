# Changelog

## [0.1.0] - 2024-03-xx

### Added
- 初始版本发布
- 基本代理切换功能
  - 支持 SOCKS4、SOCKS5、HTTP 和 PAC 代理类型
  - 支持代理认证（用户名/密码）
  - 支持自定义过滤规则
- 用户界面
  - 弹出窗口（Popup）界面，用于快速切换代理
  - 设置页面，用于管理代理配置
- 代理配置管理
  - 添加、编辑、删除代理配置
  - 导入/导出代理配置功能
  - 默认过滤列表（127.0.0.1、::1、localhost）
- 多语言支持
  - 支持中文（简体）和英文
  - 语言设置自动保存
  - 根据浏览器语言自动选择默认语言
- 用户体验优化
  - 代理状态可视化显示
  - 不同代理类型使用不同颜色标识
  - 操作结果反馈提示
  - 简洁直观的界面设计

### Changed
- 优化代理列表显示样式
- 改进代理配置表单布局
- 调整代理类型颜色方案
- 优化弹出窗口大小和布局

### Fixed
- 修复代理配置更新后不生效的问题
- 修复导入配置时的错误处理
- 修复配置页面挂载点 ID 不匹配问题
- 移除 Google Fonts 远程依赖，改用本地资源

### Security
- 实现安全的代理认证处理
- 确保敏感信息（如密码）安全存储
- 使用 Chrome 存储 API 安全保存配置

### Technical
- 使用 React 和 Material-UI 构建界面
- 实现 Chrome 扩展消息通信机制
- 添加 webpack 构建配置
- 配置 ESLint 进行代码规范检查
- 添加 .gitignore 配置
- 完善项目文档

### Documentation
- 创建 README.md 文件
- 添加隐私权政策说明
- 编写 Chrome Web Store 发布说明
- 添加多语言翻译文档

### Dependencies
- React 19.0.0
- React DOM 19.0.0
- Material-UI 6.4.8
- Material Icons 6.4.8
- Webpack 5.85.0
- Babel 7.22.0
- webextension-polyfill 0.10.0

### Development
- 设置开发环境配置
- 添加开发模式热重载
- 配置生产环境构建流程
- 添加代码格式化规则