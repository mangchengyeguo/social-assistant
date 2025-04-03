// 立即执行的调试代码
console.log('profile.js 开始加载...');

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

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
});

// 初始化UI
function initializeUI() {
    console.log('初始化UI...');
    
    // 隐藏分析相关的元素
    document.querySelector('.analysis-progress').classList.remove('active');
    document.querySelector('.chat-container').classList.remove('active');
    document.querySelector('.result-confirmation').classList.remove('active');
    
    // 显示开始分析按钮
    const startButton = document.querySelector('.start-analysis-btn');
    if (startButton) {
        startButton.style.display = 'block';
    }
    
    // 加载用户信息
    loadUserProfile();
}

// 设置事件监听器
function setupEventListeners() {
    const startButton = document.querySelector('.start-analysis-btn');
    const sendButton = document.querySelector('.send-btn');
    const messageInput = document.querySelector('.message-input');
    const confirmButton = document.querySelector('.confirm-btn');
    const modifyButton = document.querySelector('.modify-btn');
    const reanalyzeButton = document.querySelector('.reanalyze-btn');

    startButton.addEventListener('click', startAnalysis);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleEnterKey);
    confirmButton.addEventListener('click', confirmResults);
    modifyButton.addEventListener('click', modifyResults);
    reanalyzeButton.addEventListener('click', startAnalysis);
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
        scenes: [
            {
                title: "职场沟通",
                context: "你最近在带领一个重要项目，需要与团队成员和其他部门协调",
                role: "项目负责人",
                rounds: [
                    {
                        ai: "最近我们的项目进度似乎有点延迟，你觉得主要的原因是什么？我们该如何调整？",
                        followUps: {
                            analysis: "你提到{point}这个问题很关键，能详细说说这个问题是如何影响项目进度的吗？",
                            solution: "关于{point}的解决方案很有见地，你准备如何具体实施？",
                            team: "你提到需要{point}，如何确保团队每个成员都能理解并配合这个调整？"
                        }
                    },
                    {
                        ai: "有两个部门对项目的技术方案存在分歧，作为项目负责人，你会如何协调？",
                        followUps: {
                            approach: "你选择先{point}的方式很专业，能说说为什么会这样考虑吗？",
                            balance: "在平衡{point}时，你会特别注意哪些细节？",
                            communication: "你提到要通过{point}来达成共识，能分享一下具体的沟通技巧吗？"
                        }
                    },
                    {
                        ai: "客户突然要求增加新功能，但这可能影响原定的交付时间，你会如何处理？",
                        followUps: {
                            negotiate: "你提出的{point}建议很有建设性，如何向客户解释这个方案？",
                            priority: "关于{point}的优先级安排很合理，能详细说说评估标准吗？",
                            timeline: "你说到要{point}来调整时间线，具体要考虑哪些因素？"
                        }
                    },
                    {
                        ai: "团队中有成员经常加班但产出效率不高，你会怎么帮助他改善？",
                        followUps: {
                            mentor: "你提到要通过{point}来提升效率，能分享一些具体的指导方法吗？",
                            support: "关于{point}的支持方式很贴心，如何确保不影响他的积极性？",
                            balance: "在平衡{point}时，你会如何避免可能的负面影响？"
                        }
                    },
                    {
                        ai: "项目即将结项，你打算如何总结经验教训并激励团队？",
                        followUps: {
                            review: "你提到要总结{point}这些方面，能具体说说每个点的启发吗？",
                            celebrate: "关于{point}的庆祝方式很有意思，如何让每个成员都感受到认可？",
                            future: "对于{point}的规划很有前瞻性，能详细说说你的想法吗？"
                        }
                    }
                ]
            },
            {
                title: "生活压力",
                context: "你正在经历工作与生活的平衡挑战，需要调整和规划",
                role: "倾诉者",
                rounds: [
                    {
                        ai: "最近感觉工作压力很大，经常带回家，影响到生活质量，你是怎么处理这种情况的？",
                        followUps: {
                            method: "你提到通过{point}来缓解压力，能具体说说这个方法是怎么帮助你的吗？",
                            balance: "关于{point}的平衡方式很独特，你是如何坚持下来的？",
                            effect: "这种{point}的改变给你带来了什么具体的变化？"
                        }
                    },
                    {
                        ai: "有时候会觉得生活很单调，每天都是工作-家庭两点一线，你会怎么调剂生活？",
                        followUps: {
                            hobby: "你提到{point}这个兴趣爱好很有趣，能分享一些具体的经历吗？",
                            social: "通过{point}来扩展社交圈子的想法很好，你是怎么开始的？",
                            growth: "在{point}的过程中，你有什么特别的收获吗？"
                        }
                    },
                    {
                        ai: "面对家人对工作时间的抱怨，你会如何沟通和改善这个问题？",
                        followUps: {
                            communicate: "你选择用{point}的方式来沟通很智慧，能分享更多细节吗？",
                            arrange: "关于{point}的时间安排很有创意，是如何想到的？",
                            quality: "你提到要注重{point}，具体是通过什么方式实现的？"
                        }
                    },
                    {
                        ai: "经常熬夜工作影响了身体状况，你有什么好的作息调整建议吗？",
                        followUps: {
                            health: "你提到{point}对健康很重要，能分享一下具体的作息安排吗？",
                            habit: "养成{point}这个习惯确实不容易，你是怎么克服困难的？",
                            benefit: "实践这些改变后，你感受到了哪些明显的好处？"
                        }
                    },
                    {
                        ai: "面对职业发展和个人生活的选择，你是如何做决定的？",
                        followUps: {
                            value: "你提到{point}这个价值观很重要，是什么经历让你有这样的认识？",
                            choice: "在{point}的选择上，你考虑了哪些关键因素？",
                            plan: "对于{point}的规划很清晰，能详细说说未来的目标吗？"
                        }
                    }
                ]
            },
            {
                title: "社交网络",
                context: "探讨在社交媒体时代如何建立和维护人际关系",
                role: "社交达人",
                rounds: [
                    {
                        ai: "现在很多人都在社交媒体上展示生活，你觉得这种分享方式会影响真实的人际关系吗？",
                        followUps: {
                            opinion: "你对{point}的观点很有深度，能举个具体的例子吗？",
                            experience: "你提到{point}的经历很有趣，能详细说说当时的情况吗？",
                            balance: "在{point}的平衡上，你是如何把握的？"
                        }
                    },
                    {
                        ai: "在社交媒体上经常看到朋友的生活，有时会产生焦虑感，你会怎么调适这种心理？",
                        followUps: {
                            mindset: "你说到要{point}这种心态很健康，是如何培养的？",
                            focus: "关注{point}确实很重要，你是怎么做到不被外界干扰的？",
                            growth: "通过{point}来成长的方式很棒，能分享一些具体的改变吗？"
                        }
                    },
                    {
                        ai: "如何在保持线上活跃的同时，也维护好线下的友谊关系？",
                        followUps: {
                            method: "你通过{point}来维系友谊的方式很有效，能详细说说吗？",
                            time: "在{point}的时间分配上，你是如何安排的？",
                            quality: "提升{point}的建议很实用，你是怎么实践的？"
                        }
                    },
                    {
                        ai: "遇到朋友在社交媒体上发布负面情绪，你会怎么回应和支持？",
                        followUps: {
                            support: "你选择{point}的方式来支持朋友很温暖，能分享更多细节吗？",
                            care: "关于{point}的关心方式很贴心，是基于什么考虑？",
                            follow: "后续通过{point}来跟进很重要，你一般会怎么做？"
                        }
                    },
                    {
                        ai: "如何在社交媒体上展现真实的自己，同时又保持适当的界限？",
                        followUps: {
                            authentic: "你提到要{point}来保持真实，这种平衡是怎么找到的？",
                            boundary: "设置{point}的界限很必要，你是如何判断的？",
                            share: "关于{point}的分享原则很好，能具体说说考虑因素吗？"
                        }
                    }
                ]
            },
            {
                title: "情感沟通",
                context: "处理亲密关系中的情感表达和矛盾处理",
                role: "感情顾问",
                rounds: [
                    {
                        ai: "在亲密关系中，当对方情绪低落时，你会用什么方式去安慰和支持？",
                        followUps: {
                            approach: "你选择{point}的方式很温暖，能分享一个具体的例子吗？",
                            reason: "为什么会想到用{point}这种方式？有什么特别的考虑吗？",
                            effect: "这种方式带来了什么样的效果？对方是如何回应的？"
                        }
                    },
                    {
                        ai: "遇到意见分歧时，你是如何表达自己的想法，同时也倾听对方的声音？",
                        followUps: {
                            express: "你通过{point}来表达的方式很有智慧，能详细说说吗？",
                            listen: "在{point}的过程中，你会特别注意什么？",
                            resolve: "如何通过{point}来达成共识？能分享一些技巧吗？"
                        }
                    },
                    {
                        ai: "长期关系中可能会出现倦怠期，你会用什么方式来保持感情的新鲜感？",
                        followUps: {
                            maintain: "你提到{point}的方法很有创意，是如何想到的？",
                            surprise: "关于{point}的小惊喜很贴心，能举些例子吗？",
                            grow: "在{point}的过程中，你们是如何一起成长的？"
                        }
                    },
                    {
                        ai: "当对方需要独处空间时，你会如何理解和处理这种状况？",
                        followUps: {
                            understand: "你对{point}的理解很深刻，是什么让你有这样的认识？",
                            space: "在给予{point}的同时，如何维持联系？",
                            balance: "如何平衡{point}和亲密度？能分享一些经验吗？"
                        }
                    },
                    {
                        ai: "如何在忙碌的生活中，保持感情的温度和关注度？",
                        followUps: {
                            time: "你通过{point}来创造时间的方式很棒，能详细说说吗？",
                            quality: "关于提升{point}的建议很实用，是如何执行的？",
                            ritual: "建立{point}的仪式感很重要，你们有什么特别的习惯吗？"
                        }
                    }
                ]
            },
            {
                title: "兴趣发展",
                context: "探讨如何在工作之余发展个人兴趣爱好",
                role: "兴趣指导",
                rounds: [
                    {
                        ai: "你是如何发现并培养自己的兴趣爱好的？能分享一下这个过程吗？",
                        followUps: {
                            discover: "通过{point}发现兴趣的经历很有趣，能详细说说吗？",
                            develop: "在发展{point}的过程中，遇到过什么挑战？",
                            benefit: "这个兴趣给你带来了哪些意想不到的收获？"
                        }
                    },
                    {
                        ai: "在工作繁忙的情况下，你是如何坚持兴趣爱好的？",
                        followUps: {
                            arrange: "你通过{point}来安排时间的方法很实用，能具体说说吗？",
                            persist: "在坚持{point}的过程中，是什么让你没有放弃？",
                            balance: "如何平衡{point}和其他生活重心？有什么心得？"
                        }
                    },
                    {
                        ai: "通过兴趣爱好认识了新朋友，你是如何发展和维护这些友谊的？",
                        followUps: {
                            connect: "通过{point}建立联系的方式很好，能分享更多细节吗？",
                            share: "在{point}的分享过程中，有什么特别的经历？",
                            grow: "这些友谊如何促进了你在兴趣上的进步？"
                        }
                    },
                    {
                        ai: "你的兴趣是否影响了你的生活或工作方式？能具体说说吗？",
                        followUps: {
                            impact: "你提到{point}带来的改变很有意思，能举个例子吗？",
                            transfer: "将{point}的经验运用到其他领域的想法很棒，如何实践的？",
                            value: "这些经历给你带来了什么新的认识？"
                        }
                    },
                    {
                        ai: "对于想要发展兴趣爱好但不知从何开始的人，你有什么建议？",
                        followUps: {
                            start: "从{point}开始的建议很实用，能详细说说原因吗？",
                            explore: "关于{point}的探索方式很有启发，是基于什么经验？",
                            encourage: "你是如何克服{point}的困难的？能分享一些经验吗？"
                        }
                    }
                ]
            },
            {
                title: "学习成长",
                context: "讨论终身学习和个人成长的经验",
                role: "学习顾问",
                rounds: [
                    {
                        ai: "在工作后坚持学习新知识，你是如何保持学习动力的？",
                        followUps: {
                            motivation: "你通过{point}来保持动力的方式很特别，能详细说说吗？",
                            method: "关于{point}的学习方法很有效，是如何发现的？",
                            challenge: "在克服{point}的困难时，你是怎么做的？"
                        }
                    },
                    {
                        ai: "面对快速变化的技术和知识更新，你是如何选择学习方向的？",
                        followUps: {
                            choice: "你选择{point}作为方向的考虑很全面，能分享决策过程吗？",
                            plan: "关于{point}的学习规划很系统，是如何制定的？",
                            adapt: "在适应{point}的变化时，你用了什么策略？"
                        }
                    },
                    {
                        ai: "你是如何将学习到的知识转化为实际应用的？能分享一些经验吗？",
                        followUps: {
                            apply: "通过{point}来实践的方式很智慧，能具体说说吗？",
                            integrate: "将{point}整合到工作中的过程很有趣，遇到过什么挑战？",
                            result: "这种应用带来了什么具体的改变或收获？"
                        }
                    },
                    {
                        ai: "在学习过程中遇到瓶颈时，你会用什么方法来突破？",
                        followUps: {
                            break: "你通过{point}来突破瓶颈的方法很有创意，能详细说说吗？",
                            support: "寻求{point}的支持很重要，你是如何找到资源的？",
                            persist: "在坚持{point}的过程中，是什么让你没有放弃？"
                        }
                    },
                    {
                        ai: "你是如何评估学习效果，并根据反馈调整学习方式的？",
                        followUps: {
                            evaluate: "你通过{point}来评估的方法很系统，能分享更多细节吗？",
                            adjust: "根据{point}来调整的过程很有启发，是如何决定的？",
                            improve: "这些调整带来了什么样的提升？"
                        }
                    }
                ]
            },
            {
                title: "压力管理",
                context: "探讨如何应对和管理生活中的各种压力",
                role: "心理顾问",
                rounds: [
                    {
                        ai: "当面对多重压力时，你会如何识别和处理最紧迫的问题？",
                        followUps: {
                            identify: "你通过{point}来分析问题的方法很清晰，能详细说说吗？",
                            prioritize: "关于{point}的优先级排序很有条理，是基于什么考虑？",
                            handle: "处理{point}的方式很有效，能分享具体步骤吗？"
                        }
                    },
                    {
                        ai: "工作压力可能会影响情绪和身体状态，你有什么好的调节方法吗？",
                        followUps: {
                            relax: "你提到的{point}放松方式很独特，能具体说说效果吗？",
                            balance: "在保持{point}平衡的过程中，有什么特别的心得？",
                            health: "关注{point}的健康方式很重要，你是如何坚持的？"
                        }
                    },
                    {
                        ai: "在压力大的时候，你会向谁倾诉？如何选择倾诉对象？",
                        followUps: {
                            share: "你选择{point}作为倾诉对象的原因很有趣，能详细说说吗？",
                            trust: "建立{point}的信任关系很重要，是如何维护的？",
                            support: "获得{point}的支持对你有什么帮助？"
                        }
                    },
                    {
                        ai: "你是否有过压力导致的消极经历？是如何走出来的？",
                        followUps: {
                            experience: "你通过{point}走出困境的经历很鼓舞人，能分享更多细节吗？",
                            learn: "从{point}中学到的经验很宝贵，对你有什么改变？",
                            grow: "这段经历如何帮助你在处理压力方面成长？"
                        }
                    },
                    {
                        ai: "面对长期的压力，你会如何调整心态和生活方式？",
                        followUps: {
                            mindset: "你培养{point}的心态很积极，是如何做到的？",
                            change: "关于{point}的改变很有启发，能分享具体的转变过程吗？",
                            maintain: "如何保持{point}的长期效果？有什么建议？"
                        }
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
    
    // 隐藏开始按钮
    const startButton = document.querySelector('.start-analysis-btn');
    if (startButton) {
        startButton.style.display = 'none';
    }
    
    // 显示必要的UI元素
    document.querySelector('.analysis-progress').classList.add('active');
    document.querySelector('.chat-container').classList.add('active');
    
    // 重置分析状态
    styleAnalysis.currentSceneIndex = 0;
    styleAnalysis.currentRoundIndex = 0;
    styleAnalysis.waitingForResponse = false;
    
    // 清空聊天记录
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 开始第一个场景
    const firstScene = dialogueScenarios.scenes[0];
    if (firstScene) {
        appendMessage('ai', `让我们开始第一个场景：${firstScene.title}\n${firstScene.context}`);
                setTimeout(() => {
            const firstRound = firstScene.rounds[0];
            if (firstRound) {
                appendMessage('ai', firstRound.ai);
                styleAnalysis.waitingForResponse = true;
            }
        }, 1500);
    }
    
    // 更新进度条
    updateProgress();
}

// 发送消息
function sendMessage() {
    const messageInput = document.querySelector('.message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
        console.log('消息为空，忽略发送');
        return;
    }
    
    // 清空输入框
    messageInput.value = '';
    
    // 处理用户回答
    handleUserResponse(message);
}

// 处理用户回答
function handleUserResponse(message) {
    console.log('处理用户回答:', message);
    
    // 显示用户消息
    appendMessage('user', message);
    
    // 获取当前场景和回合
    const currentScene = dialogueScenarios.scenes[styleAnalysis.currentSceneIndex];
    const currentRound = currentScene?.rounds[styleAnalysis.currentRoundIndex];
    
    if (!currentScene || !currentRound) {
        console.error('无法获取当前场景或回合');
        return;
    }
    
    // 生成AI回应
    const followUpKey = Object.keys(currentRound.followUps)[Math.floor(Math.random() * Object.keys(currentRound.followUps).length)];
    const followUpTemplate = currentRound.followUps[followUpKey];
    const aiResponse = followUpTemplate.replace('{point}', extractMainPoint(message));
    
    // 显示AI回应
    setTimeout(() => {
        appendMessage('ai', aiResponse);
        
        // 准备下一轮对话
        setTimeout(() => {
            styleAnalysis.currentRoundIndex++;
            
            // 检查是否需要进入下一个场景
            if (styleAnalysis.currentRoundIndex >= currentScene.rounds.length) {
                styleAnalysis.currentSceneIndex++;
                styleAnalysis.currentRoundIndex = 0;
                
                // 检查是否所有场景都完成
                if (styleAnalysis.currentSceneIndex >= dialogueScenarios.scenes.length) {
                    finishAnalysis();
                    return;
                }
                
                // 开始新场景
                const nextScene = dialogueScenarios.scenes[styleAnalysis.currentSceneIndex];
                appendMessage('ai', `让我们进入下一个场景：${nextScene.title}\n${nextScene.context}`);
                setTimeout(() => {
                    appendMessage('ai', nextScene.rounds[0].ai);
                }, 1500);
            } else {
                // 继续当前场景的下一轮
                appendMessage('ai', currentScene.rounds[styleAnalysis.currentRoundIndex].ai);
            }
            
            // 更新进度条
            updateProgress();
        }, 1500);
    }, 1000);
}

// 提取用户回答中的主要观点
function extractMainPoint(message) {
    const sentences = message.split(/[。！？.!?]/);
    return sentences[0] || message.substring(0, 20);
}

// 更新进度条
function updateProgress() {
    console.log('更新进度条...');
    
    const totalScenes = dialogueScenarios.scenes.length;
    const totalRounds = dialogueScenarios.scenes.reduce((total, scene) => total + scene.rounds.length, 0);
    const currentScene = styleAnalysis.currentSceneIndex || 0;
    const currentRound = styleAnalysis.currentRoundIndex || 0;
    
    // 计算当前完成的轮次总数
    const completedRounds = dialogueScenarios.scenes.slice(0, currentScene).reduce((total, scene) => total + scene.rounds.length, 0) + currentRound;
    
    // 计算进度百分比
    const progress = (completedRounds / totalRounds) * 100;
    
    // 更新进度条
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('#analysis-stage');
    
    if (progressBar && progressText) {
        progressBar.style.width = `${progress}%`;
        const currentSceneTitle = dialogueScenarios.scenes[currentScene]?.title || '分析完成';
        progressText.textContent = `${currentSceneTitle} (${Math.round(progress)}%)`;
                } else {
        console.error('未找到进度条元素');
    }
}

// 完成分析
function finishAnalysis() {
    console.log('完成分析...');
    
    // 隐藏对话区域
    document.querySelector('.chat-container').classList.remove('active');
    
    // 生成分析结果
    const results = generateResults();
    
    // 更新结果显示
    updateResultDisplay(results);
    
    // 显示结果确认区域
    document.querySelector('.result-confirmation').classList.add('active');
    
    // 更新个人名片中的语言风格标签
    updateStyleTags(results);
}

// 生成分析结果
function generateResults() {
    return {
        sentence: styleAnalysis.results.sentence || '简洁明了',
        rhythm: styleAnalysis.results.rhythm || '平稳有序',
        punctuation: styleAnalysis.results.punctuation || '规范使用',
        habit: styleAnalysis.results.habit || '客观理性',
        organization: styleAnalysis.results.organization || '逻辑清晰'
    };
}

// 更新结果显示
function updateResultDisplay(results) {
    const resultContent = document.querySelector('.result-content');
    resultContent.innerHTML = `
        <div class="result-item">
            <label>句式特点：</label>
            <span class="result-value">${results.sentence}</span>
        </div>
        <div class="result-item">
            <label>表达节奏：</label>
            <span class="result-value">${results.rhythm}</span>
        </div>
        <div class="result-item">
            <label>标点使用：</label>
            <span class="result-value">${results.punctuation}</span>
        </div>
        <div class="result-item">
            <label>语言习惯：</label>
            <span class="result-value">${results.habit}</span>
        </div>
        <div class="result-item">
            <label>组织结构：</label>
            <span class="result-value">${results.organization}</span>
        </div>
    `;
}

// 更新语言风格标签
function updateStyleTags(results) {
    document.getElementById('sentence-style').textContent = results.sentence;
    document.getElementById('rhythm-style').textContent = results.rhythm;
    document.getElementById('punctuation-style').textContent = results.punctuation;
    document.getElementById('habit-style').textContent = results.habit;
    document.getElementById('organization-style').textContent = results.organization;
}

// 确认结果
function confirmResults() {
    console.log('确认结果...');
    
    // 隐藏分析相关的元素
    document.querySelector('.analysis-progress').classList.remove('active');
    document.querySelector('.result-confirmation').classList.remove('active');
    
    // 显示开始按钮
    const startButton = document.querySelector('.start-analysis-btn');
    if (startButton) {
        startButton.style.display = 'block';
    }
}

// 修改结果
function modifyResults() {
    console.log('修改结果...');
    
    // 隐藏结果确认区域
    document.querySelector('.result-confirmation').classList.remove('active');
    
    // 显示对话区域
    document.querySelector('.chat-container').classList.add('active');
    
    // 重新开始最后一个场景
    if (styleAnalysis.currentSceneIndex > 0) {
        styleAnalysis.currentSceneIndex--;
    }
    styleAnalysis.currentRoundIndex = 0;
    
    const currentScene = dialogueScenarios.scenes[styleAnalysis.currentSceneIndex];
    if (currentScene) {
        appendMessage('ai', `让我们重新开始这个场景：${currentScene.title}\n${currentScene.context}`);
        setTimeout(() => {
            appendMessage('ai', currentScene.rounds[0].ai);
        }, 1500);
    }
}

// 添加消息到聊天区域
function appendMessage(sender, content) {
    console.log('添加消息:', sender, content);
    
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        console.error('未找到聊天消息容器');
        return;
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