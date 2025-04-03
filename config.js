const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5002'  // 本地开发环境
        : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`,  // 生产环境
    ENDPOINTS: {
        CHAT: '/api/chat',
        TEST: '/api/test',
        GENERATE_TAGS: '/api/generate-tags'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} 