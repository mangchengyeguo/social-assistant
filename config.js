const API_CONFIG = {
    BASE_URL: 'http://localhost:5002',
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