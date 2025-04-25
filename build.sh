#!/bin/bash

# 安装依赖
npm install

# 构建项目
npm run build

# 创建发布目录
mkdir -p release
cp -r dist/* release/

# 创建 ZIP 文件
cd release
zip -r ../simple-proxy-switcher.zip *
cd ..

echo "构建完成！发布文件已保存为 simple-proxy-switcher.zip" 