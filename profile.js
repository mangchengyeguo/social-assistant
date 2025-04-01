// 立即执行的调试代码
console.log('profile.js 开始加载...');

// 服务器配置
const API_BASE_URL = API_CONFIG.BASE_URL;

// 添加全局错误处理
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('全局错误:', {
        message: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error
    });
    return false;
};

// 添加未捕获的Promise错误处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise错误:', event.reason);
    // 显示友好的错误提示
    if (event.reason.message.includes('Failed to fetch') || 
        event.reason.message.includes('NetworkError')) {
        alert('无法连接到服务器，请确保服务器已启动并运行在正确的端口(5002)上');
    } else {
        alert('操作失败，请稍后重试');
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    console.log('正在初始化页面...');
    try {
        const isServerConnected = await checkServerConnection();
        if (!isServerConnected) {
            alert('无法连接到后端服务器，请确保服务器已启动');
            return;
        }
        
        // 初始化页面
        initializePage();
        
    } catch (error) {
        console.error('初始化失败:', error);
        alert('页面初始化失败，请刷新重试');
    }
});

// 页面初始化函数
function initializePage() {
    // 检查必要的DOM元素是否存在
    const requiredElements = {
        'edit-profile-btn': document.querySelector('.edit-profile-btn'),
        'edit-modal': document.getElementById('edit-modal'),
        'profile-form': document.getElementById('profile-form'),
        'avatar-container': document.querySelector('.avatar-container'),
        'avatar-img': document.querySelector('.avatar-container img'),
        'chat-modal': document.getElementById('chat-modal'),
        'chat-messages': document.querySelector('.chat-messages'),
        'message-input': document.querySelector('.message-input'),
        'send-btn': document.querySelector('.send-btn')
    };

    // 检查并报告缺失的元素
    const missingElements = [];
    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            missingElements.push(name);
            console.error(`缺失必要的DOM元素: ${name}`);
        }
    }

    if (missingElements.length > 0) {
        throw new Error(`页面缺失必要的DOM元素: ${missingElements.join(', ')}`);
    }

    // DOM元素
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    console.log('编辑按钮:', editProfileBtn);
    
    const editModal = document.getElementById('edit-modal');
    console.log('编辑模态框:', editModal);
    
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = editModal ? editModal.querySelector('.cancel-btn') : null;
    const avatarContainer = document.querySelector('.avatar-container');
    const avatarImg = document.querySelector('.avatar-container img');
    const startChatBtn = document.querySelector('.start-chat-btn');
    const chatModal = document.getElementById('chat-modal');
    const chatMessages = document.querySelector('.chat-messages');
    const messageInput = document.querySelector('.message-input');
    const sendBtn = document.querySelector('.send-btn');
    const closeChatBtn = document.querySelector('.close-chat-btn');

    // 文件上传分析功能
    const chatUpload = document.getElementById('chat-upload');
    const momentsUpload = document.getElementById('moments-upload');
    const traitChart = document.querySelector('.trait-chart');
    const tagsCloud = document.querySelector('.tags-cloud');
    const suggestionList = document.querySelector('.suggestion-list');

    // 社交应急助手选项数据
    const emergencyOptions = {
        sceneTypes: [
            "社交聚会",
            "工作会议",
            "家庭聚餐",
            "约会场合",
            "学术交流",
            "商务谈判",
            "朋友聚会",
            "陌生人社交",
            "网络社交",
            "公共演讲",
            "团队协作",
            "面试场合",
            "社交媒体互动",
            "文化交流",
            "邻里交往"
        ],
        relationships: [
            "同事",
            "上级领导",
            "下属",
            "朋友",
            "家人",
            "恋人",
            "陌生人",
            "客户",
            "合作伙伴",
            "老师",
            "学生",
            "邻居",
            "网友",
            "服务人员",
            "社交圈新人"
        ],
        roles: [
            "倾听者",
            "建议者",
            "协调者",
            "主导者",
            "支持者",
            "观察者",
            "调解者",
            "组织者",
            "参与者",
            "引导者",
            "学习者",
            "分享者",
            "决策者",
            "创新者",
            "关系维护者"
        ],
        coreNeeds: [
            "化解冲突",
            "建立信任",
            "表达诉求",
            "获取认同",
            "维护关系",
            "寻求支持",
            "解决误会",
            "增进理解",
            "改善沟通",
            "处理压力",
            "建立边界",
            "寻求合作",
            "表达感谢",
            "处理拒绝",
            "寻求反馈"
        ]
    };

    // 添加全局变量存储特征数据
    let traitHistory = new Map(); // 存储历史特征数据
    let traitRealtime = new Map(); // 存储实时特征数据

    // 添加一个变量来跟踪已使用的场景
    let usedSceneIndexes = new Set();

    // 初始化下拉框并支持手动输入
    function initializeEmergencySelects() {
        const selects = {
            sceneType: document.querySelector('select[name="sceneType"]'),
            relationship: document.querySelector('select[name="relationship"]'),
            role: document.querySelector('select[name="role"]'),
            coreNeed: document.querySelector('select[name="coreNeed"]')
        };

        // 为每个下拉框添加选项和功能
        Object.entries(selects).forEach(([key, select]) => {
            if (select) {
                // 添加选项
                const options = emergencyOptions[key + 's']; // 注意复数形式
                select.innerHTML = `
                    <option value="">请选择${select.previousElementSibling?.textContent || ''}</option>
                    ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    <option value="custom">自定义...</option>
                `;

                // 添加事件监听
                select.addEventListener('change', function() {
                    if (this.value === 'custom') {
                        const customValue = prompt('请输入自定义选项：');
                        if (customValue && customValue.trim()) {
                            // 添加新选项
                            const newOption = new Option(customValue, customValue, true, true);
                            this.add(newOption, this.options[this.options.length - 1]);
                            this.value = customValue;
                        } else {
                            this.value = ''; // 如果用户取消，重置为默认选项
                        }
                    }
                });

                // 支持输入搜索
                select.addEventListener('keyup', function(e) {
                    const input = this.value.toLowerCase();
                    const matchingOption = options.find(opt => 
                        opt.toLowerCase().includes(input)
                    );
                    if (matchingOption) {
                        this.value = matchingOption;
                    }
                });
            }
        });
    }

    // 显示编辑模态框
    editProfileBtn.addEventListener('click', () => {
        console.log('打开模态框');
        editModal.classList.add('active');
        // 填充现有数据
        const profile = JSON.parse(localStorage.getItem('userProfile')) || {};
        document.getElementById('edit-name').value = profile.name || '';
        document.getElementById('edit-age').value = profile.age || '';
        document.getElementById('edit-occupation').value = profile.occupation || '';
        document.getElementById('edit-mbti').value = profile.mbti || '';
    });

    // 关闭模态框函数
    const closeModal = () => {
        console.log('关闭模态框');
        if (editModal) {
            editModal.classList.remove('active');
        }
    };

    // 注册取消按钮事件
    if (cancelBtn) {
        console.log('注册取消按钮事件');
        cancelBtn.addEventListener('click', closeModal);
    } else {
        console.error('未找到取消按钮，将使用备用关闭方法');
        // 备用关闭方法：为所有具有 close-modal 类的元素添加关闭事件
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
    }

    // 点击模态框外部关闭
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            console.log('点击外部关闭模态框');
            closeModal();
        }
    });

    // 处理头像上传
    if (avatarContainer && avatarImg) {
        avatarContainer.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        avatarImg.src = e.target.result;
                        localStorage.setItem('userAvatar', e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }

    // 文件上传和分析相关功能
    const fileUpload = document.getElementById('file-upload');
    const fileList = document.querySelector('.file-list');
    const clearFilesBtn = document.querySelector('.clear-files-btn');
    const textInput = document.querySelector('.text-input');
    const analyzeBtn = document.querySelector('.analyze-btn');

    // 处理文件上传
    fileUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            fileList.innerHTML = '';
            Array.from(files).forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span class="remove-file">×</span>
                `;
                
                fileItem.querySelector('.remove-file').addEventListener('click', () => {
                    fileItem.remove();
                    if (fileList.children.length === 0) {
                        clearFilesBtn.style.display = 'none';
                    }
                });
                
                fileList.appendChild(fileItem);
            });
            clearFilesBtn.style.display = 'inline-block';
        }
    });

    // 清空文件选择
    clearFilesBtn.addEventListener('click', () => {
        fileList.innerHTML = '';
        fileUpload.value = '';
        clearFilesBtn.style.display = 'none';
    });

    // 全局变量存储分析结果
    let globalAnalysisData = {
        traits: [],
        socialStyles: [],
        suggestions: [],
        feedbacks: {} // 存储用户反馈
    };

    // 从localStorage加载分析结果
    function loadAnalysisResults() {
        try {
            const savedData = localStorage.getItem('analysisResults');
            if (savedData) {
                globalAnalysisData = JSON.parse(savedData);
                updateAnalysisResults(globalAnalysisData);
            }
        } catch (error) {
            console.error('加载分析结果失败:', error);
        }
    }

    // 保存分析结果到localStorage
    function saveAnalysisResults() {
        try {
            localStorage.setItem('analysisResults', JSON.stringify(globalAnalysisData));
        } catch (error) {
            console.error('保存分析结果失败:', error);
        }
    }

    // 更新分析按钮的处理函数
    analyzeBtn.addEventListener('click', async () => {
        const files = fileUpload.files;
        const text = textInput.value.trim();
        
        if (!files.length && !text) {
            alert('请上传文件或输入文字内容');
            return;
        }

        try {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '分析中...';
            
            let analysisContent = '';
            
            // 处理文本输入
            if (text) {
                analysisContent += `用户输入的文本：${text}\n`;
            }

            // 处理文件
            if (files.length > 0) {
                for (const file of files) {
                    if (file.type.startsWith('text/')) {
                        const content = await file.text();
                        analysisContent += `文件内容：${content}\n`;
                    } else if (file.type.startsWith('image/')) {
                        analysisContent += `[图片文件：${file.name}]\n`;
                    }
                }
            }

            const response = await fetch(API_BASE_URL + '/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{
                        role: "system",
                        content: `作为一位专业的社交心理分析师，请分析以下内容并生成详细的社交性格报告。内容：${analysisContent}

请按照以下JSON格式返回分析结果：
{
    "traits": [
        {"name": "社交倾向", "value": 85, "description": "具体描述..."},
        {"name": "表达能力", "value": 75, "description": "具体描述..."},
        {"name": "同理心", "value": 80, "description": "具体描述..."},
        {"name": "领导力", "value": 70, "description": "具体描述..."},
        {"name": "适应性", "value": 90, "description": "具体描述..."}
    ],
    "socialStyles": [
        {"tag": "善于沟通", "confidence": 0.85},
        {"tag": "乐于分享", "confidence": 0.75},
        {"tag": "积极主动", "confidence": 0.80},
        {"tag": "富有同理心", "confidence": 0.70},
        {"tag": "善于倾听", "confidence": 0.90}
    ],
    "suggestions": [
        {"type": "优势发挥", "content": "具体建议..."},
        {"type": "改进方向", "content": "具体建议..."},
        {"type": "发展建议", "content": "具体建议..."}
    ],
    "languageStyle": {
        "formality": 0.8,
        "emotionality": 0.6,
        "directness": 0.7,
        "complexity": 0.65
    }
}`
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('分析请求失败');
            }

            const result = await response.json();
            const content = result.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                throw new Error('无法解析分析结果');
            }
            
            const analysisResult = JSON.parse(jsonMatch[0]);
            
            // 更新全局数据
            globalAnalysisData = {
                ...globalAnalysisData,
                ...analysisResult,
                source: 'fileAnalysis'
            };
            
            // 更新显示
            updateAnalysisResults(globalAnalysisData);
            
        } catch (error) {
            console.error('分析错误:', error);
            alert('分析过程中出现错误，请重试');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '开始分析';
        }
    });

    // 更新分析结果显示
    function updateAnalysisResults(data) {
        try {
            console.log('接收到的分析数据:', data);
            
            // 更新全局数据
            if (data.traits) {
            if (data.source === 'fileAnalysis') {
                    // 来自历史消息分析的特征
                    data.traits.forEach(trait => {
                        const traitName = typeof trait === 'object' ? trait.name : trait;
                        traitHistory.set(traitName, {
                            name: traitName,
                            value: typeof trait === 'object' ? trait.value : 80
                        });
                    });
                } else if (data.source === 'aiAnalysis') {
                    // 来自实时场景互动的特征
                    data.traits.forEach(trait => {
                        const traitName = typeof trait === 'object' ? trait.name : trait;
                        traitRealtime.set(traitName, {
                            name: traitName,
                            value: typeof trait === 'object' ? trait.value : 80
                        });
                    });
                }
                globalAnalysisData.traits = data.traits;
            }
            if (data.socialStyles) globalAnalysisData.socialStyles = data.socialStyles;
            if (data.suggestions) globalAnalysisData.suggestions = data.suggestions;
            if (data.languageStyle) globalAnalysisData.languageStyle = data.languageStyle;
            
            // 保留现有的反馈数据
            globalAnalysisData.feedbacks = { ...globalAnalysisData.feedbacks, ...(data.feedbacks || {}) };
            
            // 保存更新后的数据
            saveAnalysisResults();
            
            // 更新性格特征词云图
            const traitChart = document.querySelector('.trait-chart');
            if (traitChart) {
                const allTraits = new Map();
                
                // 合并历史和实时特征
                traitHistory.forEach((trait, name) => {
                    allTraits.set(name, {
                        name: name,
                        value: trait.value,
                        source: 'history'
                    });
                });
                
                traitRealtime.forEach((trait, name) => {
                    if (allTraits.has(name)) {
                        // 如果特征在两边都存在，标记为both
                        allTraits.get(name).source = 'both';
                                } else {
                        allTraits.set(name, {
                            name: name,
                            value: trait.value,
                            source: 'realtime'
                        });
                    }
                });
                
                traitChart.innerHTML = `
                    <div class="word-cloud-container">
                        <div class="word-cloud">
                            ${Array.from(allTraits.values()).map(trait => {
                                const size = trait.value;
                                const fontSize = Math.max(14, Math.min(30, size / 3));
                                let color;
                                switch(trait.source) {
                                    case 'history':
                                        color = '#4A90E2'; // 蓝色
                                        break;
                                    case 'realtime':
                                        color = '#2ECC71'; // 绿色
                                        break;
                                    case 'both':
                                        color = 'linear-gradient(45deg, #4A90E2, #2ECC71)'; // 渐变色
                                        break;
                                }
                                return `<span class="trait-word" style="font-size: ${fontSize}px; ${trait.source === 'both' ? 'background-image:' : 'color:'} ${color}">
                                    ${trait.name}
                                </span>`;
                            }).join('')}
                        </div>
                        <div class="word-cloud-legend">
                            <div class="legend-item">
                                <span class="legend-color" style="background-color: #4A90E2"></span>
                                <span class="legend-text">历史消息分析</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color" style="background-color: #2ECC71"></span>
                                <span class="legend-text">实时场景互动</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color" style="background: linear-gradient(45deg, #4A90E2, #2ECC71)"></span>
                                <span class="legend-text">两者共有</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // 更新语言习惯展示
            const tagsCloud = document.querySelector('.tags-cloud');
            if (tagsCloud && data.languageStyle) {
                const languageHabits = [
                    {tag: "偏好短句", confidence: data.languageStyle.complexity < 0.5 ? 0.9 : 0.3},
                    {tag: "多用句号", confidence: data.languageStyle.formality > 0.7 ? 0.85 : 0.4},
                    {tag: "感叹号频繁", confidence: data.languageStyle.emotionality > 0.7 ? 0.8 : 0.3},
                    {tag: "简洁表达", confidence: data.languageStyle.complexity < 0.4 ? 0.9 : 0.4},
                    {tag: "口语化", confidence: data.languageStyle.formality < 0.3 ? 0.85 : 0.3},
                    {tag: "表情符号多", confidence: data.languageStyle.emotionality > 0.8 ? 0.9 : 0.3},
                    {tag: "逗号连接", confidence: data.languageStyle.complexity > 0.7 ? 0.85 : 0.4},
                    {tag: "精准用词", confidence: data.languageStyle.formality > 0.8 ? 0.9 : 0.4}
                ];

                tagsCloud.innerHTML = `
                    <div class="language-habits-grid">
                        ${languageHabits.map(habit => {
                            const isHidden = globalAnalysisData.feedbacks[habit.tag] === 'dislike';
                            return isHidden ? '' : `
                    <div class="social-tag-container">
                                    <div class="social-tag-wrapper">
                                        <span class="social-tag" data-tag="${habit.tag}">
                                            ${habit.tag}
                                            <span class="confidence">${Math.round(habit.confidence * 100)}%</span>
                        </span>
                        <div class="tag-feedback">
                                            <button class="feedback-btn like ${globalAnalysisData.feedbacks[habit.tag] === 'like' ? 'active' : ''}" 
                                                    onclick="handleTagFeedback('${habit.tag}', 'like')">
                                👍 是我
                            </button>
                                            <button class="feedback-btn dislike ${globalAnalysisData.feedbacks[habit.tag] === 'dislike' ? 'active' : ''}" 
                                                    onclick="handleTagFeedback('${habit.tag}', 'dislike')">
                                👎 不像我
                            </button>
                        </div>
                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            // 更新建议列表
            const suggestionList = document.querySelector('.suggestion-list');
            if (suggestionList && globalAnalysisData.suggestions) {
                suggestionList.innerHTML = globalAnalysisData.suggestions.map(suggestion => `
                    <li class="suggestion-item">
                        <span class="suggestion-type">${typeof suggestion === 'string' ? '建议' : suggestion.type}</span>
                        <p class="suggestion-content">${typeof suggestion === 'string' ? suggestion : suggestion.content}</p>
                    </li>
                `).join('');
            }

            // 更新语言风格分析
            const languageStyle = document.querySelector('.language-style');
            if (languageStyle && globalAnalysisData.languageStyle) {
                languageStyle.innerHTML = `
                    <h3>语言风格分析</h3>
                    <div class="style-metrics">
                        <div class="style-metric">
                            <span>正式程度</span>
                            <div class="metric-bar">
                                <div class="metric-value" style="width: ${globalAnalysisData.languageStyle.formality * 100}%"></div>
                            </div>
                        </div>
                        <div class="style-metric">
                            <span>情感表达</span>
                            <div class="metric-bar">
                                <div class="metric-value" style="width: ${globalAnalysisData.languageStyle.emotionality * 100}%"></div>
                            </div>
                        </div>
                        <div class="style-metric">
                            <span>直接程度</span>
                            <div class="metric-bar">
                                <div class="metric-value" style="width: ${globalAnalysisData.languageStyle.directness * 100}%"></div>
                            </div>
                        </div>
                        <div class="style-metric">
                            <span>表达复杂度</span>
                            <div class="metric-bar">
                                <div class="metric-value" style="width: ${globalAnalysisData.languageStyle.complexity * 100}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('更新分析结果时出错:', error);
            alert('更新分析结果时出现错误，请重试');
        }
    }

    // 处理标签反馈
    window.handleTagFeedback = function(tag, type) {
        const tagElement = document.querySelector(`[data-tag="${tag}"]`).closest('.social-tag-container');
        
        if (type === 'dislike') {
            // 如果点击"不像我"，隐藏整个标签容器
            tagElement.style.display = 'none';
            delete globalAnalysisData.feedbacks[tag];
        } else if (type === 'like') {
            // 如果点击"是我了"，保存标签
        globalAnalysisData.feedbacks[tag] = type;
        }
        
        // 保存更新后的反馈数据
        saveAnalysisResults();
        
        // 可以在这里发送反馈到服务器
        fetch(API_BASE_URL + '/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tag: tag,
                feedback: type
            })
        }).catch(console.error);
    };

    // 注册文件上传事件
    if (chatUpload) {
        chatUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file, 'chat');
            }
        });
    }

    if (momentsUpload) {
        momentsUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file, 'moments');
            }
        });
    }

    // 社交问题数据
    const socialQuestions = [
        // 习惯题
        "你道歉时更常说'抱歉'还是'是我的问题'？为什么？",
        "当别人夸奖你时，你最常用的回应是什么？",
        "在群聊中，你更倾向于主动发起话题还是跟随话题？",
        "遇到分歧时，你是更倾向于坚持己见还是寻求共识？",
        "你习惯在社交媒体上分享生活细节吗？为什么？",
        "你更喜欢私下沟通还是在群里讨论问题？",
        "你一般多久回复一次消息？为什么这样安排？",
        "你如何看待工作和生活之间的社交界限？",
        "你更倾向于线上还是线下社交？为什么？",
        "你如何处理与他人的意见分歧？"
    ];

    const randomScenes = [
        "同事剽窃你的创意还在会议上邀功",
        "领导临时改变项目方向但不给更多资源",
        "团队成员在群里公开质疑你的决策",
        "客户深夜要求修改已确认的方案",
        "合作伙伴拖延交付影响整体进度",
        "会议中发现汇报数据存在重大错误",
        "下属消极抵抗你布置的任务",
        "跨部门同事给你甩锅推责",
        "重要客户威胁要投诉你",
        "新同事在背后散布不实言论"
    ];

    // AI对话功能变量
    let currentQuestionIndex = 0;
    let sceneCount = 0;
    let sceneAnswers = [];
    let userAnswers = [];
    let currentMode = '';

    // 打开场景模式
    window.openSceneMode = function() {
        currentMode = 'scene';
        const chatModal = document.getElementById('chat-modal');
        const chatMessages = document.querySelector('.chat-messages');
        const messageInput = document.querySelector('.message-input');
        
        chatModal.classList.add('active');
        chatMessages.innerHTML = '';
        currentQuestionIndex = 0;
        sceneCount = 0;
        sceneAnswers = [];
        
        // 开始第一个场景
        startNewScene();
    }

    // 打开问答模式
    window.openQAMode = function() {
        currentMode = 'qa';
        const chatModal = document.getElementById('chat-modal');
        const chatMessages = document.querySelector('.chat-messages');
        const messageInput = document.querySelector('.message-input');
        
        chatModal.classList.add('active');
        chatMessages.innerHTML = '';
        currentQuestionIndex = 0;
        userAnswers = [];
        
        // 开始问答
        addAIMessage('欢迎来到模拟问答室！接下来我会问你10个问题，包括情境题和习惯题，请认真回答每一个问题。');
        setTimeout(() => {
            addAIMessage(socialQuestions[currentQuestionIndex]);
        }, 1000);
    }

    // 关闭聊天模态框
    window.closeChatModal = function() {
        const chatModal = document.getElementById('chat-modal');
        chatModal.classList.remove('active');
        currentMode = '';
    }

    // 添加消息到聊天界面
    function addUserMessage(message) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addAIMessage(message) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 开始新场景
    function startNewScene() {
        if (sceneCount < 5) {
            let randomIndex;
            // 确保选择未使用过的场景
            do {
                randomIndex = Math.floor(Math.random() * randomScenes.length);
            } while (usedSceneIndexes.has(randomIndex));
            
            // 记录已使用的场景索引
            usedSceneIndexes.add(randomIndex);
            const scene = randomScenes[randomIndex];
            
            if (sceneCount === 0) {
                addAIMessage('欢迎来到场景任意门！接下来我会随机给出5个社交场景，请告诉我你会如何应对。');
                setTimeout(() => {
                    addAIMessage(`场景 ${sceneCount + 1}/5：${scene}\n请问你会如何应对这个情况？`);
                }, 1000);
            } else {
                addAIMessage(`场景 ${sceneCount + 1}/5：${scene}\n请问你会如何应对这个情况？`);
            }
        } else {
            // 所有场景完成，进行统一分析
            analyzeAllScenes();
            // 重置已使用场景集合，为下一轮准备
            usedSceneIndexes.clear();
        }
    }

    // 分析所有场景回答
    async function analyzeAllScenes() {
        try {
            addAIMessage('感谢你的回答！我正在综合分析你在所有场景中的表现...');
            console.log('开始分析场景回答:', sceneAnswers);
            
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{
                            role: "system",
                        content: `作为一个专业的语言表达分析师，请分析用户在以下场景中的语言表达特点：

${sceneAnswers.map((answer, index) => 
`场景${index + 1}：${answer.scene}
用户回应：${answer.response}`).join('\n\n')}

请从以下几个维度进行综合分析：
1. 语言风格（用词特点、句式结构、表达方式等）
2. 表达习惯（语气词使用、标点符号、表情符号等）
3. 沟通模式（对话节奏、回应方式等）
4. 语言策略（说服技巧、缓和语气、强调重点等）
5. 表达倾向（直接/间接、正式/随意、简洁/详细等）

请提供以下格式的JSON分析结果：
{
    "traits": [
        "语言精练",
        "逻辑清晰",
        "善用比喻",
        "重视细节",
        "结构完整"
    ],
    "socialStyles": [
        {"tag": "用词精准", "confidence": 0.85},
        {"tag": "句式简洁", "confidence": 0.80},
        {"tag": "善用反问", "confidence": 0.75},
        {"tag": "语气温和", "confidence": 0.82},
        {"tag": "重点突出", "confidence": 0.78}
    ],
    "suggestions": [
        "可以适当增加生动的比喻",
        "注意调整语气的轻重",
        "保持现有的逻辑性",
        "可以尝试更多互动性表达",
        "继续保持清晰的层次感"
    ],
    "languageStyle": {
        "formality": 0.8,
        "emotionality": 0.6,
        "directness": 0.7,
        "complexity": 0.65
    }
}`
                    }]
                })
            });

            if (!response.ok) {
                console.error('API响应错误:', response.status, response.statusText);
                throw new Error(`分析请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API响应数据:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('API响应格式错误:', data);
                throw new Error('API响应格式不正确');
            }

                const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.error('无法解析JSON结果:', content);
                throw new Error('无法解析分析结果');
            }
            
            try {
                const result = JSON.parse(jsonMatch[0]);
            result.source = 'aiAnalysis';
            
            // 更新分析结果显示
            updateAnalysisResults(result);
            
            // 显示完成消息
                addAIMessage('分析完成！我已经更新了你的社交画像。你可以查看"性格特征"来了解你的核心特质，查看"社交风格"来了解你的表达习惯。记得给那些符合你特点的标签点赞哦！');
                
                // 添加查看结果的提示
                setTimeout(() => {
                    addAIMessage('温馨提示：向上滚动页面就能看到完整的分析结果啦！');
                }, 1500);
            } catch (parseError) {
                console.error('JSON解析错误:', parseError, jsonMatch[0]);
                throw new Error('解析分析结果时出错');
            }
            
        } catch (error) {
            console.error('场景分析失败:', error);
            addAIMessage('抱歉，分析过程出现错误：' + error.message);
            addExitButton();
        }
    }

    // 处理问答模式的最后分析
    async function analyzeQAResponses() {
        try {
            addAIMessage('感谢你的回答！我正在分析你的语言表达风格...');
            console.log('开始分析问答回答:', userAnswers);
            
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{
                        role: "system",
                        content: `作为一个专业的语言表达分析师，请分析用户在以下问答中的语言表达特点：

${socialQuestions.map((q, i) => 
`问题${i + 1}：${q}
回答：${userAnswers[i] || '未回答'}`).join('\n\n')}

请从以下几个维度分析：
1. 语言风格（用词选择、句式特点、表达方式等）
2. 表达习惯（语气词、标点符号、表情符号等）
3. 沟通模式（对话节奏、回应方式等）
4. 语言策略（说服技巧、缓和语气、强调重点等）
5. 表达倾向（直接/间接、正式/随意、简洁/详细等）

请提供以下格式的JSON分析结果：
{
    "traits": [
        "表达流畅",
        "用词准确",
        "结构清晰",
        "语气平和",
        "重点明确"
    ],
    "socialStyles": [
        {"tag": "善用类比", "confidence": 0.85},
        {"tag": "语气舒缓", "confidence": 0.80},
        {"tag": "逻辑分明", "confidence": 0.75},
        {"tag": "细节丰富", "confidence": 0.82},
        {"tag": "层次分明", "confidence": 0.78}
    ],
    "suggestions": [
        "可以尝试更多修辞手法",
        "保持现有的逻辑性",
        "适当增加互动性表达",
        "继续保持语言的准确性",
        "注意调整表达的节奏感"
    ],
    "languageStyle": {
        "formality": 0.7,
        "emotionality": 0.6,
        "directness": 0.8,
        "complexity": 0.65
    }
}`
                    }]
                })
            });

            if (!response.ok) {
                console.error('API响应错误:', response.status, response.statusText);
                throw new Error(`分析请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API响应数据:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('API响应格式错误:', data);
                throw new Error('API响应格式不正确');
            }

            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.error('无法解析JSON结果:', content);
                throw new Error('无法解析分析结果');
            }
            
            try {
                const result = JSON.parse(jsonMatch[0]);
                result.source = 'aiAnalysis';
                
                // 更新分析结果显示
                updateAnalysisResults(result);
                
                // 显示完成消息
                addAIMessage('分析完成！我已经在社交画像分析中展示了分析结果。');
            } catch (parseError) {
                console.error('JSON解析错误:', parseError, jsonMatch[0]);
                throw new Error('解析分析结果时出错');
            }
            
        } catch (error) {
            console.error('问答分析失败:', error);
            addAIMessage('抱歉，分析过程出现错误：' + error.message);
            addExitButton();
        }
    }

    // 添加退出按钮
    function addExitButton() {
        const chatMessages = document.querySelector('.chat-messages');
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'exit-buttons';
        buttonsDiv.innerHTML = `
            <button class="chat-btn exit-btn" onclick="closeChatModal()">退出</button>
        `;
        chatMessages.appendChild(buttonsDiv);
    }

    // 发送消息处理
    document.querySelector('.send-btn').addEventListener('click', async () => {
        const messageInput = document.querySelector('.message-input');
            const message = messageInput.value.trim();
            if (!message) return;

            addUserMessage(message);
            messageInput.value = '';

            if (currentMode === 'scene') {
                // 保存场景回答
                sceneAnswers.push({
                    scene: randomScenes[currentQuestionIndex],
                    response: message
                });
                
                sceneCount++;
                
                // 检查是否还有更多场景
            if (sceneCount < 5) {
                    setTimeout(() => {
                        startNewScene();
                    }, 1000);
                } else {
                    analyzeAllScenes();
                }
        } else if (currentMode === 'qa') {
                // 社交问答室模式
                userAnswers.push(message);
                
                if (currentQuestionIndex < socialQuestions.length - 1) {
                    currentQuestionIndex++;
                    setTimeout(() => {
                        addAIMessage(socialQuestions[currentQuestionIndex]);
                    }, 1000);
                } else {
                analyzeQAResponses();
            }
        }
    });

    // 消息输入框回车发送
    document.querySelector('.message-input').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.querySelector('.send-btn').click();
        }
    });

    // 关闭按钮事件
    document.querySelector('.close-chat-btn').addEventListener('click', closeChatModal);

    // 保存个人信息
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const profileData = {
            name: document.getElementById('edit-name').value,
            age: document.getElementById('edit-age').value,
            occupation: document.getElementById('edit-occupation').value,
            mbti: document.getElementById('edit-mbti').value
        };
        
        // 保存到localStorage
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // 更新显示
        document.getElementById('user-name').textContent = profileData.name || '未设置';
        document.getElementById('user-age').textContent = profileData.age || '未设置';
        document.getElementById('user-occupation').textContent = profileData.occupation || '未设置';
        document.getElementById('user-mbti').textContent = profileData.mbti || '未设置';
        
        // 关闭模态框
        closeModal();
    });

    // 加载保存的数据
    function loadProfile() {
        const profile = JSON.parse(localStorage.getItem('userProfile')) || {};
        document.getElementById('user-name').textContent = profile.name || '未设置';
        document.getElementById('user-age').textContent = profile.age || '未设置';
        document.getElementById('user-occupation').textContent = profile.occupation || '未设置';
        document.getElementById('user-mbti').textContent = profile.mbti || '未设置';

        // 加载头像
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            avatarImg.src = savedAvatar;
        }
    }

    // 初始化加载
    loadProfile();

    // 在页面初始化时调用
    initializeEmergencySelects();

    // 在页面加载时初始化数据
    loadAnalysisResults();
}

// 检查服务器连接
async function checkServerConnection() {
    console.log('开始检查服务器连接...');
    try {
        const response = await fetch(API_BASE_URL + '/api/test', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('服务器响应异常');
        }
        
        const data = await response.json();
        return data.status === 'ok';
    } catch (error) {
        console.error('服务器连接失败:', error);
        return false;
    }
}

// 在文件末尾添加加载完成信息
console.log('profile.js 加载完成'); 