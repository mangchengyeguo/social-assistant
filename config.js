// API配置
window.API_CONFIG = {
    API_KEY: 'sk-eb6c2d8ce56347b8b88bf8f08419f417',
    API_ENDPOINT: 'https://api.deepseek.com/chat/completions',
    MODEL: 'deepseek-chat',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
} 