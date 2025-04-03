const express = require('express');
const path = require('path');
const app = express();

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

// 启动服务器
const port = 7000;
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 