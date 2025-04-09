// 立即执行的调试代码
console.log('profile.js 开始加载...');

// 备用API配置
const BACKUP_API_CONFIG = {
    API_KEY: 'sk-eb6c2d8ce56347b8b88bf8f08419f417',
    API_ENDPOINT: 'https://api.deepseek.com/chat/completions',
    MODEL: 'deepseek-chat',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000
};

// 服务器配置
const API_BASE_URL = 'http://localhost:5002';

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

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化...');
    initializeUI();
    setupEventListeners();
});

// 全局状态对象
let currentState = {
    sceneIndex: 0,
    roundIndex: 0,
    isWaitingForResponse: false
};

// 全局DOM元素引用
let elements = {
    startButton: null,
    analysisProgress: null,
    chatContainer: null,
    sceneInfo: null,
    messagesContainer: null,
    sendButton: null,
    messageInput: null,
    progressFill: null,
    analysisStage: null
};

// 初始化UI
function initializeUI() {
    console.log('初始化UI...');
    
    // 初始化DOM元素引用
    elements.startButton = document.querySelector('.start-analysis-btn');
    elements.analysisProgress = document.querySelector('.analysis-progress');
    elements.chatContainer = document.querySelector('.chat-container');
    elements.sceneInfo = document.querySelector('.scene-info');
    elements.messagesContainer = document.querySelector('.chat-messages');
    elements.sendButton = document.querySelector('.send-btn');
    elements.messageInput = document.querySelector('.message-input');
    elements.progressFill = document.querySelector('.progress-fill');
    elements.analysisStage = document.getElementById('analysis-stage');
    
    // 隐藏分析相关的元素
    if (elements.analysisProgress) elements.analysisProgress.style.display = 'none';
    if (elements.chatContainer) elements.chatContainer.style.display = 'none';
    if (elements.sceneInfo) elements.sceneInfo.style.display = 'none';
    
    // 显示开始分析按钮
    if (elements.startButton) {
        elements.startButton.style.display = 'block';
    }
    
    // 加载用户信息
    loadUserProfile();
}

// 设置事件监听器
function setupEventListeners() {
    console.log('设置事件监听器...');
    
    // 开始分析按钮点击事件
    if (elements.startButton) {
        elements.startButton.addEventListener('click', startAnalysis);
    }
    
    // 发送消息按钮点击事件
    if (elements.sendButton) {
        elements.sendButton.addEventListener('click', handleSendButtonClick);
    }
    
    // 消息输入框回车事件
    if (elements.messageInput) {
        elements.messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendButtonClick();
            }
        });
    }

    // 编辑资料按钮点击事件
    const editButton = document.querySelector('.edit-profile-btn');
    if (editButton) {
        editButton.addEventListener('click', showEditProfileModal);
    }

    // 头像上传事件
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
}

// 处理发送按钮点击
function handleSendButtonClick() {
    if (!elements.messageInput) return;
    
    const message = elements.messageInput.value.trim();
    if (message && currentState.isWaitingForResponse) {
        // 清空输入框，但不再这里添加消息到对话区域
        elements.messageInput.value = '';
        
        // 处理用户回答
        handleUserResponse(message);
    } else {
        console.log('无法发送消息：空消息或当前不在等待用户回应状态');
    }
}

// 加载用户信息
function loadUserProfile() {
    const profile = JSON.parse(localStorage.getItem('userProfile')) || {};
    document.getElementById('profile-name').textContent = profile.name || '未设置';
    document.getElementById('profile-gender').textContent = profile.gender || '未设置';
    document.getElementById('profile-age').textContent = profile.age || '未设置';
    document.getElementById('profile-mbti').textContent = profile.mbti || '未设置';
    
    // 加载头像
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        document.getElementById('profile-avatar').src = savedAvatar;
    }
}

// 语言风格分析配置
const styleAnalysis = {
    currentStage: 0,
    totalProgress: 0,
    stages: [
        { id: '开场寒暄', weight: 0.15 },
        { id: '日常话题', weight: 0.2 },
        { id: '观点探讨', weight: 0.2 },
        { id: '情感互动', weight: 0.2 },
        { id: '压力情境', weight: 0.15 },
        { id: '总结反馈', weight: 0.1 }
    ],
    quickChoices: [
        {
            question: "遇到好事，你更喜欢用什么表达？",
            options: [
                "哇！太棒了！",
                "不错不错",
                "还可以吧",
                "其他（请输入）"
            ],
            type: "single"
        },
        {
            question: "跟朋友聊天，你最常用的标点符号是？",
            options: [
                "！！！",
                "～",
                "。",
                "...",
                "其他（请输入）"
            ],
            type: "multiple"
        },
        {
            question: "你更喜欢哪种表达方式？",
            options: [
                "开门见山，直接表达",
                "徐徐道来，循序渐进",
                "先抛出问题，引发思考",
                "其他（请输入）"
            ],
            type: "single"
        },
        {
            question: "在群聊中，你更倾向于：",
            options: [
                "主动带动话题",
                "积极回应他人",
                "选择性参与感兴趣的话题",
                "主要是潜水，偶尔发言"
            ],
            type: "single"
        },
        {
            question: "描述事情时，你习惯：",
            options: [
                "重点突出，简明扼要",
                "细节丰富，生动形象",
                "逻辑清晰，层次分明",
                "随性自然，想到哪说到哪"
            ],
            type: "single"
        }
    ],
    scenarios: {
        '日常话题': [
            {
                context: "朋友心情不好时",
                options: [
                    "直接问'怎么啦？'",
                    "先聊点轻松的话题",
                    "分享自己的经历",
                    "其他方式（请描述）"
                ],
                type: "interactive"
            },
            {
                context: "收到好消息时",
                options: [
                    "立即分享并表达喜悦",
                    "等待合适时机再说",
                    "选择特定的人分享",
                    "自己默默高兴"
                ],
                type: "interactive"
            }
        ],
        '观点探讨': [
            {
                role: "对科技创新感兴趣的新同事",
                topic: "AI技术对未来工作的影响",
                questions: [
                    "你觉得AI会取代人类的工作吗？",
                    "我们应该如何应对AI带来的变革？",
                    "你认为未来最重要的职场技能是什么？"
                ]
            },
            {
                role: "环保主题活动的组织者",
                topic: "日常生活中的环保行动",
                questions: [
                    "你平时会注意环保吗？",
                    "你认为个人行为能影响环境吗？",
                    "如何推广环保理念？"
                ]
            }
        ],
        '情感互动': {
            story: "前几天我遇到一个情况：一位同事总是在会议上打断别人发言，但说的内容又确实有价值。大家都觉得很困扰，但又不好直接指出...",
            prompts: [
                "你遇到过类似的情况吗？",
                "你会怎么处理这种情况？",
                "如何既保持友好又能解决问题？"
            ]
        },
        '压力情境': [
            {
                scenario: "你的观点和大多数人不一样时",
                context: "在一次团队讨论中，大家都倾向于方案A，但你认为方案B更好",
                prompts: [
                    "你会如何表达自己的不同意见？",
                    "如果遭到反对，你会怎么回应？",
                    "什么情况下你会选择妥协？"
                ]
            },
            {
                scenario: "需要拒绝他人请求时",
                context: "一个关系还不错的同事请你周末帮忙搬家，但你已经有其他安排了",
                prompts: [
                    "你会如何委婉地拒绝？",
                    "如果对方继续坚持，你会怎么说？"
                ]
            }
        ]
    },
    results: {
        sentence: '',
        rhythm: '',
        punctuation: '',
        habit: '',
        organization: ''
    },
    userPreferences: {
        expressionStyle: '',
        punctuationHabit: [],
        communicationPattern: '',
        socialStyle: '',
        descriptionPreference: ''
    },
    dialogueScenarios: {
        currentSceneIndex: 0,
        currentRoundIndex: 0,
        scenes: [
            {
                title: '工作压力场景',
                context: '你正在办公室工作，突然主管走过来询问项目进度',
                userRole: '项目组成员',
                aiRole: '项目主管',
                rounds: [
                    {
                        question: '最近项目进度似乎有点延迟，能跟我说说具体情况吗？',
                        analysis: ['压力处理', '沟通方式', '问题解决']
                    },
                    {
                        question: '明白了。那你觉得我们需要采取什么措施来追赶进度呢？',
                        analysis: ['主动性', '解决方案', '团队协作']
                    },
                    {
                        question: '如果其他团队成员对你的方案有不同意见，你会怎么处理？',
                        analysis: ['冲突处理', '团队意识', '灵活性']
                    }
                ]
            },
            {
                title: '社交场合场景',
                context: '你在一个社交活动中遇到了一些新朋友',
                userRole: '参与者',
                aiRole: '新认识的朋友',
                rounds: [
                    {
                        question: '听说你在科技行业工作，能分享一下你的工作经历吗？',
                        analysis: ['开放程度', '表达方式', '社交风格']
                    },
                    {
                        question: '这很有趣！你平时除了工作之外还有什么兴趣爱好？',
                        analysis: ['兴趣分享', '互动深度', '话题延展']
                    },
                    {
                        question: '看来我们有很多共同话题，要不要改天一起参加一个相关的活动？',
                        analysis: ['社交意愿', '边界设定', '关系发展']
                    }
                ]
            }
        ]
    }
};

// 用户性格特征分析系统
const personalityAnalysis = {
    expressionStyle: {
        enthusiastic: 0,
        reserved: 0,
        direct: 0,
        indirect: 0
    },
    communicationPattern: {
        proactive: 0,
        reactive: 0,
        detailed: 0,
        concise: 0
    },
    emotionalStyle: {
        expressive: 0,
        controlled: 0,
        empathetic: 0,
        objective: 0
    },
    thinkingStyle: {
        logical: 0,
        intuitive: 0,
        analytical: 0,
        practical: 0
    },
    socialStyle: {
        outgoing: 0,
        selective: 0,
        supportive: 0,
        independent: 0
    }
};

// 更新用户偏好
function updateUserPreferences(question, answer) {
    const { userPreferences } = styleAnalysis;
    
    if (question.includes("表达")) {
        if (answer.includes("哇！") || answer.includes("太棒了")) {
            userPreferences.expressionStyle = "热情直接";
        } else if (answer.includes("不错")) {
            userPreferences.expressionStyle = "平和稳重";
        } else if (answer.includes("还可以")) {
            userPreferences.expressionStyle = "含蓄委婉";
        }
    } else if (question.includes("标点")) {
        userPreferences.punctuationHabit = answer.split(/[,，、]/);
    } else if (question.includes("方式")) {
        if (answer.includes("开门见山")) {
            userPreferences.communicationPattern = "直接明快";
        } else if (answer.includes("徐徐道来")) {
            userPreferences.communicationPattern = "循序渐进";
        } else if (answer.includes("先抛出问题")) {
            userPreferences.communicationPattern = "引导思考";
        }
    } else if (question.includes("群聊")) {
        if (answer.includes("主动带动")) {
            userPreferences.socialStyle = "主动活跃";
        } else if (answer.includes("积极回应")) {
            userPreferences.socialStyle = "积极配合";
        } else if (answer.includes("选择性参与")) {
            userPreferences.socialStyle = "选择性参与";
        } else if (answer.includes("潜水")) {
            userPreferences.socialStyle = "安静观察";
        }
    } else if (question.includes("描述")) {
        if (answer.includes("重点突出")) {
            userPreferences.descriptionPreference = "重点突出";
        } else if (answer.includes("细节丰富")) {
            userPreferences.descriptionPreference = "细节丰富";
        } else if (answer.includes("逻辑清晰")) {
            userPreferences.descriptionPreference = "逻辑清晰";
        } else if (answer.includes("随性")) {
            userPreferences.descriptionPreference = "自然随性";
        }
    }
}

// 更新用户偏好分析
function updatePersonalityAnalysis(question, answer) {
    const analysis = personalityAnalysis;
    
    // 根据问题和回答更新性格特征分数
    if (question.includes("表达")) {
        if (answer.includes("哇！") || answer.includes("太棒了")) {
            analysis.expressionStyle.enthusiastic += 2;
            analysis.emotionalStyle.expressive += 1;
        } else if (answer.includes("不错")) {
            analysis.expressionStyle.reserved += 1;
            analysis.emotionalStyle.controlled += 1;
        } else if (answer.includes("还可以")) {
            analysis.expressionStyle.reserved += 2;
            analysis.communicationPattern.concise += 1;
        }
    }
    
    if (question.includes("标点")) {
        if (answer.includes("！")) {
            analysis.emotionalStyle.expressive += 2;
            analysis.expressionStyle.enthusiastic += 1;
        } else if (answer.includes("～")) {
            analysis.emotionalStyle.expressive += 1;
            analysis.socialStyle.outgoing += 1;
        } else if (answer.includes("。")) {
            analysis.emotionalStyle.controlled += 2;
            analysis.expressionStyle.reserved += 1;
        }
    }
    
    if (question.includes("方式")) {
        if (answer.includes("开门见山")) {
            analysis.expressionStyle.direct += 2;
            analysis.communicationPattern.concise += 1;
        } else if (answer.includes("徐徐道来")) {
            analysis.communicationPattern.detailed += 2;
            analysis.thinkingStyle.analytical += 1;
        } else if (answer.includes("先抛出问题")) {
            analysis.thinkingStyle.analytical += 2;
            analysis.communicationPattern.proactive += 1;
        }
    }
    
    if (question.includes("群聊")) {
        if (answer.includes("主动带动")) {
            analysis.socialStyle.outgoing += 2;
            analysis.communicationPattern.proactive += 2;
        } else if (answer.includes("积极回应")) {
            analysis.socialStyle.supportive += 2;
            analysis.communicationPattern.reactive += 1;
        } else if (answer.includes("选择性参与")) {
            analysis.socialStyle.selective += 2;
            analysis.thinkingStyle.analytical += 1;
        } else if (answer.includes("潜水")) {
            analysis.socialStyle.independent += 2;
            analysis.expressionStyle.reserved += 1;
        }
    }
    
    if (question.includes("描述")) {
        if (answer.includes("重点突出")) {
            analysis.thinkingStyle.logical += 2;
            analysis.communicationPattern.concise += 1;
        } else if (answer.includes("细节丰富")) {
            analysis.communicationPattern.detailed += 2;
            analysis.thinkingStyle.analytical += 1;
        } else if (answer.includes("逻辑清晰")) {
            analysis.thinkingStyle.logical += 2;
            analysis.thinkingStyle.analytical += 1;
        } else if (answer.includes("随性自然")) {
            analysis.thinkingStyle.intuitive += 2;
            analysis.expressionStyle.direct += 1;
        }
    }
}

// 分析用户性格特征
function analyzePersonality() {
    const analysis = personalityAnalysis;
    let traits = [];
    
    // 分析表达风格
    if (analysis.expressionStyle.enthusiastic > analysis.expressionStyle.reserved) {
        traits.push("热情活泼");
    } else {
        traits.push("沉稳内敛");
    }
    
    // 分析沟通模式
    if (analysis.communicationPattern.proactive > analysis.communicationPattern.reactive) {
        traits.push("善于主动");
    } else {
        traits.push("倾向回应");
    }
    
    // 分析思维方式
    if (analysis.thinkingStyle.logical > analysis.thinkingStyle.intuitive) {
        traits.push("理性思考");
    } else {
        traits.push("感性直觉");
    }
    
    // 分析社交风格
    if (analysis.socialStyle.outgoing > analysis.socialStyle.selective) {
        traits.push("乐于社交");
    } else {
        traits.push("注重质量");
    }
    
    // 返回最显著的两个特征
    return traits.slice(0, 2).join("、");
}

// 生成针对性的后续问题
function generateFollowUpQuestion() {
    const analysis = personalityAnalysis;
    
    if (analysis.expressionStyle.enthusiastic > analysis.expressionStyle.reserved) {
        return "你似乎很善于表达热情，能分享一下你最常用的表达方式吗？（比如：会用什么样的语气词、表情或者特定用语？在什么场合会这样表达？）";
    } else if (analysis.expressionStyle.reserved > analysis.expressionStyle.enthusiastic) {
        return "你看起来比较含蓄，在需要表达重要观点时，你会用什么方式确保对方理解你的意思呢？（比如：会先组织好语言再说，还是会用具体例子来说明？）";
    }
    
    if (analysis.thinkingStyle.logical > analysis.thinkingStyle.intuitive) {
        return "你很注重逻辑思维，能分享一下你最近一次说服他人的经历吗？（比如：你是怎么组织语言的？用了哪些论据？）";
    } else {
        return "你似乎更倾向于感性表达，能举个例子说说你是怎么分享个人经历的吗？（比如：最近和朋友分享了什么有趣的事？你是怎么描述的？）";
    }
}

// 生成场景问题
function generateScenarioQuestion() {
    const analysis = personalityAnalysis;
    
    // 根据用户特征选择合适的场景
    if (analysis.socialStyle.outgoing > analysis.socialStyle.selective) {
        return {
            context: "假设你在一个新的社交场合",
            question: "你通常会用什么方式开启对话？能分享一个最近的例子吗？"
        };
    } else {
        return {
            context: "在一个需要深入交流的场合",
            question: "你会如何选择合适的话题和表达方式？"
        };
    }
}

// 开始分析
function startAnalysis() {
    console.log('开始分析...');
    
    // 重置状态
    currentState = {
        sceneIndex: 0,
        roundIndex: 0,
        isWaitingForResponse: false
    };
    
    // 完全清空聊天区域
    if (elements.messagesContainer) {
        elements.messagesContainer.innerHTML = '';
    }
    
    // 显示必要的UI元素
    if (elements.analysisProgress) elements.analysisProgress.style.display = 'block';
    if (elements.chatContainer) elements.chatContainer.style.display = 'block';
    if (elements.sceneInfo) elements.sceneInfo.style.display = 'block';
    
    // 隐藏开始按钮
    if (elements.startButton) {
        elements.startButton.style.display = 'none';
    }
    
    // 发送欢迎消息 - 使用assistant类型
    appendMessage('assistant', `欢迎来到AI语言风格分析！我是你的分析助手。接下来我们将通过轻松的对话来了解你的语言风格特点。

我们会经历几个不同的场景，每个场景都会有几轮对话。请你像平常一样自然地回答就好。

准备好了吗？让我们从第一个场景开始！`);
    
    // 延迟后开始第一个场景
    setTimeout(() => {
        startScene(0);
    }, 2000);
}

// 开始新场景
function startScene(sceneIndex) {
    const scene = dialogueScenarios.scenes[sceneIndex];
    if (!scene) return;

    // 清空聊天区域，确保没有重复消息
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 更新场景信息
    const sceneTitle = document.querySelector('.scene-title');
    const sceneContext = document.querySelector('.scene-context');
    const myRole = document.querySelector('.my-role strong');
    const aiRole = document.querySelector('.ai-role strong');

    if (sceneTitle) sceneTitle.textContent = scene.title;
    if (sceneContext) sceneContext.textContent = scene.context;
    if (myRole) myRole.textContent = scene.userRole;
    if (aiRole) aiRole.textContent = scene.aiRole;

    // 发送场景介绍，使用assistant类型而非ai类型
    appendMessage('assistant', `【${scene.title}】

${scene.context}

你的角色是：${scene.userRole}
我的角色是：${scene.aiRole}`);

    // 延迟后发送第一个问题
                setTimeout(() => {
        // 只显示第一个问题，不再自动显示后续问题
        // 使用assistant类型而非ai类型
        appendMessage('assistant', scene.rounds[0].question);
        
        // 设置状态为等待用户回应
        currentState.isWaitingForResponse = true;
        
        // 确保输入和发送按钮是启用状态
        if (elements.sendButton) elements.sendButton.disabled = false;
        if (elements.messageInput) elements.messageInput.disabled = false;
        }, 1500);

    // 更新当前状态
    currentState.sceneIndex = sceneIndex;
    currentState.roundIndex = 0;
    
    // 更新进度
    updateProgress();
}

// 更新进度
function updateProgress() {
    if (!elements.progressFill || !elements.analysisStage) return;
    
    const totalScenes = dialogueScenarios.scenes.length;
    const totalRounds = dialogueScenarios.scenes.reduce((total, scene) => total + scene.rounds.length, 0);
    const completedRounds = dialogueScenarios.scenes.slice(0, currentState.sceneIndex).reduce((total, scene) => total + scene.rounds.length, 0) + currentState.roundIndex;
    
    // 更新进度条
    const progress = (completedRounds / totalRounds) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // 更新进度文本
    const currentScene = dialogueScenarios.scenes[currentState.sceneIndex];
    elements.analysisStage.textContent = `${currentScene.title} - 第 ${currentState.roundIndex + 1}/${currentScene.rounds.length} 轮对话`;
}

// 处理用户回答
async function handleUserResponse(userMessage) {
    if (!userMessage.trim()) return;

    // 禁用输入和发送按钮，防止重复发送
    if (elements.sendButton) elements.sendButton.disabled = true;
    if (elements.messageInput) elements.messageInput.disabled = true;
    
    // 避免重复，只在等待用户回应时处理
    if (!currentState.isWaitingForResponse) {
        console.log('当前不在等待用户回应状态，忽略消息');
        
        // 重新启用输入和按钮
        if (elements.sendButton) elements.sendButton.disabled = false;
        if (elements.messageInput) elements.messageInput.disabled = false;
        return;
    }
    
    // 设置为非等待状态，避免重复处理
    currentState.isWaitingForResponse = false;

    // 添加用户消息到对话区域（移动到这里，确保只添加一次）
    appendMessage('user', userMessage);

    try {
        // 获取API配置 - 优先使用window.API_CONFIG，如果不可用则使用备用配置
        const apiConfig = window.API_CONFIG || BACKUP_API_CONFIG;
        console.log('使用API配置:', apiConfig);

        const currentScene = dialogueScenarios.scenes[currentState.sceneIndex];
        const currentRound = currentScene.rounds[currentState.roundIndex];
        
        // 构建完整的对话上下文
        const dialogueContext = {
            scene: currentScene.title,
            background: currentScene.context,
            userRole: currentScene.userRole,
            aiRole: currentScene.aiRole,
            currentQuestion: currentRound.question,
            analysisPoints: currentRound.analysis,
            userReply: userMessage
        };

        // 准备 API 请求
        const requestBody = {
            model: apiConfig.MODEL,
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的对话助手，擅长理解用户意图并给出恰当的回应。当前场景：${dialogueContext.scene}，你扮演${dialogueContext.aiRole}的角色，用户扮演${dialogueContext.userRole}的角色。请根据用户的回答给出恰当的回应。回应要自然、符合角色身份，不要机械化。`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            temperature: apiConfig.TEMPERATURE,
            max_tokens: apiConfig.MAX_TOKENS,
            stream: false
        };

        console.log('发送API请求:', {
            endpoint: apiConfig.API_ENDPOINT,
            model: apiConfig.MODEL,
            temperature: apiConfig.TEMPERATURE,
            currentSceneIndex: currentState.sceneIndex,
            currentRoundIndex: currentState.roundIndex
        });

        // 发送 API 请求
        const response = await fetch(apiConfig.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API 请求失败');
        }

        const data = await response.json();
        
        // 获取AI回复
        const aiResponse = data.choices[0].message.content;

        // 添加 AI 回复到对话区域
        appendMessage('assistant', aiResponse);
        
        // 更新进度
        updateProgress();

        // 自动准备下一轮对话，延迟2秒以便用户阅读当前回复
        setTimeout(() => {
            prepareNextRound();
        }, 2000);

    } catch (error) {
        console.error('处理用户回复时出错:', error);
        appendMessage('system', '抱歉，处理您的回复时出现了问题。可能是由于：\n1. API 密钥无效\n2. 网络连接问题\n3. 服务器响应超时\n\n请稍后再试或联系管理员。');
        currentState.isWaitingForResponse = true;
        
        // 出错时重新启用输入和按钮
        if (elements.sendButton) elements.sendButton.disabled = false;
        if (elements.messageInput) elements.messageInput.disabled = false;
    }
}

// 自动准备下一轮对话，替代显示"继续对话"按钮
function prepareNextRound() {
    // 获取当前场景和回合
    const currentScene = dialogueScenarios.scenes[currentState.sceneIndex];
    
    // 检查是否还有下一个问题
    if (currentState.roundIndex < currentScene.rounds.length - 1) {
        // 进入下一轮对话
        currentState.roundIndex++;
        
        // 获取下一个问题
        const nextQuestion = currentScene.rounds[currentState.roundIndex].question;
        
        // 确保聊天区域中没有相同的问题
        const chatMessages = document.querySelector('.chat-messages');
        let isDuplicate = false;
        
        if (chatMessages) {
            const allMessages = chatMessages.querySelectorAll('.message');
            // 检查最后几条消息是否包含要发送的问题
            for (let i = Math.max(0, allMessages.length - 5); i < allMessages.length; i++) {
                const messageText = allMessages[i].querySelector('.message-text')?.textContent;
                if (messageText === nextQuestion) {
                    isDuplicate = true;
                    break;
                }
            }
        }
        
        // 如果不是重复的问题才添加到聊天区域
        if (!isDuplicate) {
            // 使用assistant类型（API回复类型）而非ai类型（模板回复类型）
            appendMessage('assistant', nextQuestion);
        }
        
        // 设置为等待用户响应状态
        currentState.isWaitingForResponse = true;
        
        // 重新启用输入和按钮
        if (elements.sendButton) elements.sendButton.disabled = false;
        if (elements.messageInput) elements.messageInput.disabled = false;
        
        // 更新进度
        updateProgress();
    } else if (currentState.sceneIndex < dialogueScenarios.scenes.length - 1) {
        // 进入下一个场景
        currentState.sceneIndex++;
        currentState.roundIndex = 0;
        startScene(currentState.sceneIndex);
    } else {
        // 所有场景完成
        appendMessage('system', '🎉 恭喜！你已完成所有对话场景的分析。');
    }
}

// 分析用户回答
function analyzeResponse(message, analysisPoints) {
    analysisPoints.forEach(point => {
        console.log(`分析维度: ${point}, 用户回答: ${message}`);
    });
}

// 完成分析
function finishAnalysis() {
    appendMessage('ai', '太好了！我们已经完成了所有场景的对话。让我为你生成分析报告...');
    if (elements.analysisStage) elements.analysisStage.textContent = '生成分析报告';
    if (elements.progressFill) elements.progressFill.style.width = '100%';
    currentState.isWaitingForResponse = false;
    
    // 这里可以添加生成最终分析报告的逻辑
        setTimeout(() => {
        generateFinalReport();
    }, 2000);
    }

// 生成最终报告
function generateFinalReport() {
    // 这里添加生成报告的逻辑
    console.log('生成最终分析报告...');
}

// 添加对话历史数组
let dialogueHistory = [];

// 添加消息到聊天区域
function appendMessage(sender, content) {
    console.log('添加消息:', sender, content);
    
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        console.error('未找到聊天消息容器');
        return;
    }
    
    // 检查最后一条消息是否与当前消息相同（防止重复）
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage) {
        const lastMessageText = lastMessage.querySelector('.message-text')?.textContent;
        const lastMessageClass = lastMessage.className;
        
        // 如果最后一条消息的内容和发送者与当前要添加的相同，则不添加
        if (lastMessageText === content && lastMessageClass.includes(`${sender}-message`)) {
            console.log('检测到重复消息，已忽略:', content);
            return;
        }
        
        // 当添加assistant消息（API生成的自然回复）时，检查是否有模板回复（ai消息）
        if (sender === 'assistant') {
            const allMessages = chatMessages.querySelectorAll('.message');
            if (allMessages.length >= 2) {
                const lastMessageElement = allMessages[allMessages.length - 1];
                const secondLastMessageElement = allMessages[allMessages.length - 2];
                
                // 如果最后一条是模板回复(ai消息)，倒数第二条是用户消息，则移除模板回复并添加API回复
                if (lastMessageElement.className.includes('ai-message') && 
                    secondLastMessageElement.className.includes('user-message')) {
                    console.log('移除模板回复，保留API生成的自然回复');
                    lastMessageElement.remove();
                }
            }
        }
        
        // 如果是添加模板回复(ai消息)，且最后一条已经是API回复(assistant消息)，则不添加模板回复
        if (sender === 'ai') {
            const allMessages = chatMessages.querySelectorAll('.message');
            if (allMessages.length >= 1) {
                const lastMessageElement = allMessages[allMessages.length - 1];
                
                // 如果最后一条是API回复，则不添加模板回复
                if (lastMessageElement.className.includes('assistant-message')) {
                    console.log('已有API回复，忽略模板回复');
                    return;
                }
            }
        }
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = content;
    messageDiv.appendChild(textDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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

// 分析用户回答
function analyzeAspect(aspect, message) {
    // 这里需要实现根据不同分析维度更新用户画像的逻辑
    console.log(`分析用户回答：${aspect} - ${message}`);
}

// 对话场景定义
const dialogueScenarios = {
    scenes: [
        {
            title: "工作群聊场景",
            context: "你正在一个项目组的工作群里，突然收到了项目经理的紧急消息。",
            userRole: "团队成员",
            aiRole: "项目经理",
            rounds: [
                {
                    question: "@所有人 刚刚客户反馈首页有bug，线上用户反映很大，需要今晚加班处理一下，谁能负责一下？",
                    analysis: ["工作态度", "责任感", "表达方式"]
                },
                {
                    question: "好的，那麻烦你看一下。这个问题挺急的，大概什么时候能搞定？客户那边一直在催😓",
                    analysis: ["时间把控", "压力处理", "沟通技巧"]
                },
                {
                    question: "辛苦了！这么晚还在处理。对了，你觉得是什么原因导致的呢？后面要怎么避免？",
                    analysis: ["问题分析", "解决方案", "总结能力"]
                },
                {
                    question: "明白了。那你觉得我们是不是需要调整一下测试流程？或者有其他建议吗？",
                    analysis: ["流程优化", "创新思维", "建议表达"]
                },
                {
                    question: "这些建议都很好。最后问一下，你觉得团队在项目管理上还有什么需要改进的地方吗？",
                    analysis: ["团队意识", "管理思维", "建设性反馈"]
                }
            ]
        },
        {
            title: "相亲场景",
            context: "你正在和一个经朋友介绍认识的相亲对象第一次见面。",
            userRole: "被相亲者",
            aiRole: "相亲对象",
            rounds: [
                {
                    question: "听说你在互联网公司工作？我对这个行业挺感兴趣的，不过听说经常需要加班诶...",
                    analysis: ["开放程度", "价值观", "表达方式"]
                },
                {
                    question: "原来是这样啊。那平时周末喜欢做些什么呢？",
                    analysis: ["生活态度", "兴趣爱好", "表达活力"]
                },
                {
                    question: "我也很喜欢这些！对了，你平时怎么看待工作和生活的平衡呢？",
                    analysis: ["价值取向", "生活理念", "思维方式"]
                },
                {
                    question: "说到未来规划，你会考虑换一个压力小一点的工作吗？或者有其他想法？",
                    analysis: ["职业规划", "决策倾向", "目标导向"]
                },
                {
                    question: "感觉和你聊天很愉快呢。要不要加个微信，以后可以多交流？",
                    analysis: ["社交意愿", "边界感", "委婉程度"]
                }
            ]
        },
        {
            title: "工作面谈场景",
            context: "你被部门主管叫到办公室谈话，话题关于最近的工作表现。",
            userRole: "员工",
            aiRole: "部门主管",
            rounds: [
                {
                    question: "最近团队反映说你经常迟到，这个情况我们需要谈一谈。",
                    analysis: ["责任心", "应变能力", "态度"]
                },
                {
                    question: "我理解你的情况。不过作为团队的一员，你觉得应该怎么改善这个问题？",
                    analysis: ["解决方案", "团队意识", "主动性"]
                },
                {
                    question: "好的。另外，我注意到你最近的工作状态似乎不太理想，是遇到什么困难了吗？",
                    analysis: ["坦诚度", "压力应对", "沟通意愿"]
                },
                {
                    question: "明白了。那关于下个月新项目的核心开发工作，你觉得自己能胜任吗？",
                    analysis: ["自信程度", "职业规划", "表达技巧"]
                },
                {
                    question: "最后，你对自己未来在团队中的发展有什么想法或期望吗？",
                    analysis: ["职业规划", "团队定位", "目标表达"]
                }
            ]
        },
        {
            title: "朋友圈互动场景",
            context: "你最近发了一条度假照片的朋友圈，收到了许久未联系的初中同学的互动。",
            userRole: "发朋友圈的人",
            aiRole: "初中同学",
            rounds: [
                {
                    question: "[点赞了你的朋友圈] 哇！看到你去了马尔代夫！风景太美了！什么时候去的呀？😍",
                    analysis: ["社交热情", "表情使用", "回应方式"]
                },
                {
                    question: "真好呀！羡慕死了～话说你现在在哪个城市发展啊？有机会我们要一起聚聚！",
                    analysis: ["社交意愿", "寒暄方式", "亲和度"]
                },
                {
                    question: "我也在这边！太巧了，要不要改天约个饭叙叙旧啊？好久没见了！",
                    analysis: ["社交边界", "约会意愿", "关系维护"]
                },
                {
                    question: "对了，记得你之前是做设计的？现在还在做相关工作吗？",
                    analysis: ["话题延展", "记忆分享", "关系连接"]
                },
                {
                    question: "那太好了！我下个月正好要去你那个城市出差，要不要约个饭？😊",
                    analysis: ["社交边界", "应对技巧", "委婉程度"]
                }
            ]
        },
        {
            title: "客户投诉场景",
            context: "你是客服人员，正在处理一位非常不满的客户的投诉。",
            userRole: "客服人员",
            aiRole: "愤怒的客户",
            rounds: [
                {
                    question: "我等了整整两个小时外卖还没到！！！这是什么服务态度？我要投诉！😠",
                    analysis: ["情绪处理", "专业度", "安抚能力"]
                },
                {
                    question: "你们就知道说对不起！我现在要求：第一，立即安排送餐；第二，全额退款；第三，补偿我的时间损失！",
                    analysis: ["危机处理", "谈判技巧", "解决方案"]
                },
                {
                    question: "这个补偿方案我不满意！你们觉得我的时间这么不值钱吗？",
                    analysis: ["情绪管理", "谈判策略", "解决能力"]
                },
                {
                    question: "好吧，但是我要求你们必须严肃处理这个送餐员，这种服务态度太差了！",
                    analysis: ["安抚技巧", "处理承诺", "专业表现"]
                },
                {
                    question: "哼，这次就算了，不过你们必须改进！投诉我还是会写的！",
                    analysis: ["总结能力", "后续跟进", "关系维护"]
                }
            ]
        }
    ]
};

// 显示编辑个人资料的模态框
function showEditProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>编辑个人资料</h3>
            <div class="form-group">
                <label>姓名：</label>
                <input type="text" id="edit-name" value="${document.getElementById('profile-name').textContent}">
            </div>
            <div class="form-group">
                <label>性别：</label>
                <select id="edit-gender">
                    <option value="男" ${document.getElementById('profile-gender').textContent === '男' ? 'selected' : ''}>男</option>
                    <option value="女" ${document.getElementById('profile-gender').textContent === '女' ? 'selected' : ''}>女</option>
                    <option value="其他" ${document.getElementById('profile-gender').textContent === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group">
                <label>年龄：</label>
                <input type="number" id="edit-age" value="${document.getElementById('profile-age').textContent}" min="1" max="120">
            </div>
            <div class="form-group">
                <label>MBTI：</label>
                <select id="edit-mbti">
                    <option value="">请选择</option>
                    <option value="INTJ">INTJ</option>
                    <option value="INTP">INTP</option>
                    <option value="ENTJ">ENTJ</option>
                    <option value="ENTP">ENTP</option>
                    <option value="INFJ">INFJ</option>
                    <option value="INFP">INFP</option>
                    <option value="ENFJ">ENFJ</option>
                    <option value="ENFP">ENFP</option>
                    <option value="ISTJ">ISTJ</option>
                    <option value="ISFJ">ISFJ</option>
                    <option value="ESTJ">ESTJ</option>
                    <option value="ESFJ">ESFJ</option>
                    <option value="ISTP">ISTP</option>
                    <option value="ISFP">ISFP</option>
                    <option value="ESTP">ESTP</option>
                    <option value="ESFP">ESFP</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="save-btn" onclick="saveProfile()">保存</button>
                <button class="cancel-btn" onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 设置当前MBTI值
    const mbtiSelect = document.getElementById('edit-mbti');
    const currentMbti = document.getElementById('profile-mbti').textContent;
    if (currentMbti && currentMbti !== '未设置') {
        mbtiSelect.value = currentMbti;
    }
}

// 关闭模态框
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// 保存个人资料
function saveProfile() {
    const name = document.getElementById('edit-name').value.trim();
    const gender = document.getElementById('edit-gender').value;
    const age = document.getElementById('edit-age').value;
    const mbti = document.getElementById('edit-mbti').value;

    // 验证输入
    if (!name) {
        alert('请输入姓名');
        return;
    }
    if (!age || age < 1 || age > 120) {
        alert('请输入有效的年龄');
        return;
    }

    // 更新显示
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-gender').textContent = gender;
    document.getElementById('profile-age').textContent = age;
    document.getElementById('profile-mbti').textContent = mbti || '未设置';

    // 保存到localStorage
    const profile = {
        name,
        gender,
        age,
        mbti
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));

    // 关闭模态框
    closeModal();
}

// 处理头像上传
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.getElementById('profile-avatar');
            if (avatar) {
                avatar.src = e.target.result;
                // 保存头像到localStorage
                localStorage.setItem('userAvatar', e.target.result);
            }
        };
        reader.readAsDataURL(file);
    }
} 