#!/bin/bash

# 切换到项目目录
cd /Users/huyuan/my-new-project

# 检查并安装必要的Python包
echo "检查必要的Python包..."
pip install -r requirements.txt

# 检查服务器是否已经运行
if lsof -i:5002 > /dev/null; then
    echo "端口5002已经在使用中，无需重新启动服务器"
    echo "您可以访问 http://localhost:5002 使用应用"
else
    echo "启动服务器..."
    python3 server.py
fi 