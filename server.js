const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const port = 7000;

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // 跳过内部IP和非IPv4地址
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // 如果没找到，返回localhost
}

// 配置CORS
app.use(cors());

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 配置静态文件服务
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path, stat) => {
        // 禁用缓存，确保始终获取最新文件
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        ip: getLocalIP()
    });
});

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

// 启动服务器
const server = app.listen(port, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('服务器已启动，可通过以下地址访问：');
    console.log(`局域网: http://${localIP}:${port}`);
    console.log(`本地: http://localhost:${port}`);
    console.log('---');
    console.log('提示：如果无法访问，请检查：');
    console.log('1. 防火墙设置是否允许端口7000');
    console.log('2. 是否在同一个局域网内');
    console.log('3. 服务器IP地址是否正确');
    console.log('---');
    console.log('可以访问 /health 端点检查服务器状态');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已安全关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已安全关闭');
        process.exit(0);
    });
}); 