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
    // 获取所有需要的 DOM 元素
    const analysisContent = document.querySelector('.analysis-content');
    const resultConfirmation = document.querySelector('.result-confirmation');
    const startButton = document.querySelector('.start-analysis-btn');
    const sendButton = document.querySelector('.send-btn');
    const messageInput = document.querySelector('.message-input');
    const chatMessages = document.querySelector('.chat-messages');

    // 初始状态设置
    if (analysisContent) {
        analysisContent.style.display = 'none';
    }
    if (resultConfirmation) {
        resultConfirmation.style.display = 'none';
    }

    // 设置事件监听器
    if (startButton) {
        startButton.addEventListener('click', startAnalysis);
        console.log('Start button listener added');
    }

    if (sendButton && messageInput) {
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', handleEnterKey);
    }

    // 初始化聊天区域的滚动
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
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

// 语言风格分析系统
const styleAnalysis = {
    currentStage: 0,
    stages: ['快速选择题', '日常话题', '观点探讨', '情感互动', '压力情境'],
    waitingForResponse: false,
    nextAction: null,
    currentQuestionIndex: 0,
    quickChoices: [
        {
            question: "当你遇到特别开心的事情时（比如升职、中大奖），第一反应是？",
            options: [
                "马上发朋友圈分享喜悦",
                "给最亲近的人打电话",
                "默默记在心里",
                "其他（请描述）"
            ],
            analysisPoints: ['分享倾向', '情感表达方式', '社交范围偏好']
        },
        {
            question: "在工作群里，领导提出的方案你觉得有问题，你会？",
            options: [
                "直接指出问题所在",
                "私下找领导沟通",
                "委婉地提出建议",
                "观察其他同事反应"
            ],
            analysisPoints: ['沟通策略', '处理层级关系方式', '表达立场的方式']
        },
        {
            question: "朋友遇到困难来找你倾诉，你会？",
            options: [
                "先听他/她说完，然后给出建议",
                "分享类似的经历",
                "帮忙分析问题并找解决方案",
                "陪伴和安慰为主"
            ],
            analysisPoints: ['倾听方式', '共情能力', '问题解决倾向']
        },
        {
            question: "在团队合作中，如果进度落后了，你倾向于？",
            options: [
                "召集大家开会讨论解决方案",
                "私下了解每个人的困难",
                "主动承担更多工作",
                "及时向上级反馈"
            ],
            analysisPoints: ['领导力', '团队协作方式', '责任感']
        },
        {
            question: "参加新朋友聚会时，你通常会？",
            options: [
                "主动找话题带动气氛",
                "找到感兴趣的小群体交流",
                "等别人来搭话",
                "专注于已经认识的朋友"
            ],
            analysisPoints: ['社交主动性', '群体融入方式', '社交策略']
        }
    ],
    dailyTopics: [
        {
            context: "你最近一次说服别人接受你的观点是什么情况？具体是怎么说的？",
            sampleAnswer: "上周和团队讨论项目方案时，我建议采用新技术栈。我先列举了三个成功案例，然后分析了可能遇到的困难和解决方案，最后强调了长期收益。整个过程我注意用数据支撑观点，并且多次询问大家的想法。",
            analysisPoints: ['论证方式', '表达策略', '换位思考能力']
        },
        {
            context: "当你需要拒绝他人请求时，你会怎么说？能举个例子吗？",
            sampleAnswer: "上个月一个同事请我周末帮忙做项目，我是这样回复的：'我理解这个项目对你很重要，但这周末我已经答应陪家人了。要不我们看看还有什么其他时间，或者我介绍其他同事给你？'",
            analysisPoints: ['拒绝策略', '情感照顾', '替代方案提供']
        },
        {
            context: "你是如何处理与他人的分歧的？请分享一个具体经历。",
            sampleAnswer: "有一次和同事对产品功能优先级有分歧，我先认可了他关注用户体验的出发点，然后用数据说明当前最紧急的用户需求，最后我们一起制定了兼顾两方面的方案。",
            analysisPoints: ['冲突处理方式', '沟通技巧', '解决问题能力']
        },
        {
            context: "分享一个你觉得沟通很成功的经历，具体是怎么做到的？",
            sampleAnswer: "去年带新人时，我发现直接指出他的问题效果不好。后来我改用提问式引导，比如'你觉得这段代码可能存在什么风险？'让他自己发现问题。这种方式让他学得更快，我们的关系也更好了。",
            analysisPoints: ['沟通方法', '教导方式', '关系建立']
        },
        {
            context: "当你需要传达不好的消息时，你会怎么说？举个例子。",
            sampleAnswer: "有次需要告诉客户项目要延期，我先肯定了团队的努力，然后诚恳地解释了技术难点，最后提出了具体的补救方案和新时间表。整个过程保持透明，并及时回应客户的担忧。",
            analysisPoints: ['坏消息传达方式', '危机处理', '解决方案提供']
        }
    ],
    opinionTopics: [
        {
            topic: "在远程办公越来越普及的情况下，你认为如何保持团队的凝聚力？",
            sampleAnswer: "我觉得可以从三个方面：1. 建立固定的线上团建活动，比如每周五的虚拟咖啡时间；2. 使用项目管理工具保持工作透明度；3. 设立线上表彰制度，及时认可团队成员的贡献。",
            analysisPoints: ['解决方案思维', '团队管理意识', '创新能力']
        },
        {
            topic: "AI技术对你的工作领域会带来什么影响？你打算如何应对？",
            sampleAnswer: "AI会自动化一些基础工作，但也创造新机会。我正在学习AI工具的应用，重点发展创意思维和跨领域合作能力，这些是AI短期内难以替代的。",
            analysisPoints: ['前瞻性思维', '应变能力', '自我提升意识']
        },
        {
            topic: "在追求工作效率和维持工作质量之间，你如何平衡？",
            sampleAnswer: "我的方法是：先制定清晰的质量标准，然后通过自动化工具和标准化流程提高效率。对关键节点重点把控，非关键环节适当简化。",
            analysisPoints: ['平衡能力', '优先级判断', '方法论思维']
        },
        {
            topic: "你认为新人最需要具备什么能力？为什么？",
            sampleAnswer: "除了专业能力，我认为最重要的是学习能力和沟通能力。因为技术更新快，要持续学习；团队协作多，清晰的表达和积极的沟通很关键。",
            analysisPoints: ['价值观', '经验总结能力', '表达逻辑']
        },
        {
            topic: "在团队中遇到强势的同事时，你会怎么处理？",
            sampleAnswer: "我会先理解他的专业优势，在他专业的领域充分尊重他的意见。同时，在其他议题上，通过数据和事实来支持自己的观点，寻求平衡。",
            analysisPoints: ['处事方式', '沟通策略', '情商表现']
        }
    ],
    emotionalTopics: [
        {
            scenario: "团队中有成员总是迟到或错过deadline，作为组长的你会怎么处理？",
            sampleAnswer: "我会先私下了解原因，如果是工作量问题，帮助调整任务分配；如果是个人习惯问题，说明对团队的影响，一起制定改进计划。",
            analysisPoints: ['领导力', '同理心', '问题解决方式']
        },
        {
            scenario: "当你的提议被团队否决时，你会有什么感受和反应？",
            sampleAnswer: "虽然会有些失落，但我会认真听取大家的考虑，理解其中的顾虑。如果觉得自己的想法仍有价值，会在完善后在适当的时机再次提出。",
            analysisPoints: ['情绪管理', '接受意见的态度', '建设性思维']
        },
        {
            scenario: "当同事因为工作压力情绪崩溃时，你会怎么做？",
            sampleAnswer: "首先让他/她把情绪发泄出来，表示理解和支持。然后帮助梳理工作内容，一起找出优先级，必要时我会帮忙分担一部分工作。",
            analysisPoints: ['同理心', '情绪支持方式', '实际行动']
        },
        {
            scenario: "收到表扬时，你会怎么回应？",
            sampleAnswer: "会真诚地表示感谢，分享功劳给团队成员，并表示会继续努力。比如：'谢谢认可，这个项目是团队共同努力的结果，特别是小王在xx方面做了很多工作'。",
            analysisPoints: ['谦逊度', '团队意识', '情感表达方式']
        },
        {
            scenario: "如何看待和处理工作中的竞争关系？",
            sampleAnswer: "我觉得适度的竞争有利于共同进步。我会保持开放和学习的心态，欣赏对方的优点，同时不忘提升自己。重要的是不让竞争影响团队协作。",
            analysisPoints: ['竞争观', '心态成熟度', '职场智慧']
        }
    ],
    stressTopics: [
        {
            scenario: "项目临近截止日期，却发现重大技术问题，你会怎么处理？",
            sampleAnswer: "第一时间评估影响范围，召集核心成员讨论解决方案。向上级汇报情况并提供备选方案，同时及时与客户沟通，调整预期或时间表。",
            analysisPoints: ['危机处理', '沟通能力', '解决问题能力']
        },
        {
            scenario: "你的决策导致了非预期的负面结果，你会怎么面对？",
            sampleAnswer: "首先承担责任，向受影响的人道歉。然后分析原因，制定补救方案。总结经验教训，完善决策流程，避免类似问题再次发生。",
            analysisPoints: ['责任心', '问题处理方式', '成长能力']
        },
        {
            scenario: "团队成员之间发生严重分歧，互不相让，你会怎么协调？",
            sampleAnswer: "先让双方冷静，分别了解各自的考虑和顾虑。找出共同目标，然后基于数据和事实进行讨论，引导大家关注问题本身而不是个人。",
            analysisPoints: ['冲突处理', '协调能力', '领导力']
        },
        {
            scenario: "遇到强势的客户提出不合理要求，你会如何应对？",
            sampleAnswer: "保持专业和冷静，先表示理解客户的需求，然后用数据和行业标准说明其中的困难和风险，提供可行的替代方案。",
            analysisPoints: ['压力应对', '谈判能力', '专业素养']
        },
        {
            scenario: "当你的工作成果被他人占为己有时，你会怎么做？",
            sampleAnswer: "先确认是否是误会，如果确实存在，我会找适当的机会和对方私下沟通，表达我的感受和期望。如果没有改善，会通过正式渠道反映。",
            analysisPoints: ['权益维护', '沟通技巧', '职场智慧']
        }
    ],
    personalityAnalysis: {
        expressionStyle: {
            directness: 0,
            emotionality: 0,
            formality: 0
        },
        communicationPattern: {
            assertiveness: 0,
            empathy: 0,
            adaptability: 0
        },
        emotionalStyle: {
            selfAwareness: 0,
            emotionalControl: 0,
            socialEmotional: 0
        },
        thinkingStyle: {
            analytical: 0,
            creative: 0,
            systematic: 0
        },
        socialStyle: {
            leadership: 0,
            collaboration: 0,
            influence: 0
        }
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
    console.log('Starting analysis...');
    
    // 获取必要的 DOM 元素
    const analysisContent = document.querySelector('.analysis-content');
    const resultConfirmation = document.querySelector('.result-confirmation');
    const chatMessages = document.querySelector('.chat-messages');
    
    // 显示分析内容区域
    if (analysisContent) {
        analysisContent.style.display = 'block';
    }
    
    // 隐藏结果确认区域
    if (resultConfirmation) {
        resultConfirmation.style.display = 'none';
    }
    
    // 清空聊天消息
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 重置进度和状态
    resetAnalysis();
    
    // 添加欢迎消息
    appendMessage('ai', '你好！让我们开始分析你的语言风格。我会通过一系列对话来了解你的表达特点。准备好了吗？');
    
    // 开始第一个场景
    startStage(0);
}

// 重置分析
function resetAnalysis() {
    // 重置进度
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    
    // 重置阶段指示器
    const stages = document.querySelectorAll('.stage');
    stages.forEach(stage => {
        stage.classList.remove('current', 'completed');
    });
    
    // 如果存在第一个阶段，将其标记为当前阶段
    if (stages.length > 0) {
        stages[0].classList.add('current');
    }
    
    // 重置分析数据
    analysisData = {
        currentStage: 0,
        totalStages: 5,
        responses: [],
        analysisPoints: {
            communication: {
                direct: 0,
                indirect: 0,
                formal: 0,
                casual: 0
            },
            emotional: {
                positive: 0,
                negative: 0,
                neutral: 0
            },
            social: {
                proactive: 0,
                reactive: 0,
                collaborative: 0
            }
        }
    };
    
    updateStageIndicators();
}

// 开始指定阶段
function startStage(stageIndex) {
    styleAnalysis.currentStage = stageIndex;
    styleAnalysis.currentQuestionIndex = 0;
    updateStageIndicators();
    
    switch(stageIndex) {
        case 0:
            startQuickChoiceStage();
            break;
        case 1:
            startDailyTopicStage();
            break;
        case 2:
            startOpinionStage();
            break;
        case 3:
            startEmotionalStage();
            break;
        case 4:
            startStressStage();
            break;
        case 5:
            finishAnalysis();
            break;
    }
}

// 开始快速选择题阶段
function startQuickChoiceStage() {
    appendMessage('ai', "首先是一些简单的情境选择题，请选择最符合你习惯的选项：");
    
    setTimeout(() => {
        presentQuickChoice(0);
    }, 1000);
}

// 呈现快速选择题
function presentQuickChoice(index) {
    if (index >= styleAnalysis.quickChoices.length) {
        // 进入下一阶段
        startStage(1);
        return;
    }
    
    const question = styleAnalysis.quickChoices[index];
    
    // 检查是否已经显示过这个问题
    const messages = document.querySelectorAll('.chat-messages .message');
    const isQuestionDuplicate = Array.from(messages).some(msg => 
        msg.textContent === question.question
    );
    
    if (!isQuestionDuplicate) {
        appendMessage('ai', question.question);
        
        // 创建选项
        const options = question.options.map((option, i) => ({
            text: option,
            value: `option${i}`
        }));
        
        // 显示选项
        showOptions(options);
    }
}

// 开始日常话题阶段
function startDailyTopicStage() {
    styleAnalysis.currentStage = 1;
    styleAnalysis.currentQuestionIndex = 0;
    updateStageIndicators();
    
    appendMessage('ai', "接下来，我想了解你在日常交流中的表达方式。请分享你的真实想法和经历：");
    
    setTimeout(() => {
        const topic = styleAnalysis.dailyTopics[0];
        appendMessage('ai', topic.context);
        appendMessage('ai', `参考示例：${topic.sampleAnswer}`, 'example');
    }, 1000);
}

// 开始观点探讨阶段
function startOpinionStage() {
    styleAnalysis.currentStage = 2;
    styleAnalysis.currentQuestionIndex = 0;
    updateStageIndicators();
    
    appendMessage('ai', "现在，我想了解你在讨论观点时的表达特点。请针对以下话题分享你的看法：");
    
    setTimeout(() => {
        const topic = styleAnalysis.opinionTopics[0];
        appendMessage('ai', topic.topic);
        appendMessage('ai', `参考示例：${topic.sampleAnswer}`, 'example');
    }, 1000);
}

// 开始情感互动阶段
function startEmotionalStage() {
    styleAnalysis.currentStage = 3;
    styleAnalysis.currentQuestionIndex = 0;
    updateStageIndicators();
    
    appendMessage('ai', "接下来，我想了解你在情感交流中的表达方式。请想象以下情境，分享你会怎么做：");
    
    setTimeout(() => {
        const scenario = styleAnalysis.emotionalTopics[0];
        appendMessage('ai', scenario.scenario);
        appendMessage('ai', `参考示例：${scenario.sampleAnswer}`, 'example');
    }, 1000);
}

// 开始压力情境阶段
function startStressStage() {
    styleAnalysis.currentStage = 4;
    styleAnalysis.currentQuestionIndex = 0;
    updateStageIndicators();
    
    appendMessage('ai', "最后，我想了解你在压力和挑战情境下的表达方式。请想象以下情况，分享你会怎么应对：");
    
    setTimeout(() => {
        const scenario = styleAnalysis.stressTopics[0];
        appendMessage('ai', scenario.scenario);
        appendMessage('ai', `参考示例：${scenario.sampleAnswer}`, 'example');
    }, 1000);
}

// 进入下一个问题
function moveToNextQuestion(stageId) {
    // 获取当前阶段的问题集
    let questions;
    switch(stageId) {
        case 'quick':
            questions = styleAnalysis.quickChoices;
            break;
        case 'daily':
            questions = styleAnalysis.dailyTopics;
            break;
        case 'opinion':
            questions = styleAnalysis.opinionTopics;
            break;
        case 'emotional':
            questions = styleAnalysis.emotionalTopics;
            break;
        case 'stress':
            questions = styleAnalysis.stressTopics;
            break;
        default:
            questions = [];
    }
    
    // 获取当前索引
    const currentIndex = getCurrentQuestionIndex(stageId);
    const nextIndex = currentIndex + 1;
    
    // 更新索引
    setCurrentQuestionIndex(stageId, nextIndex);
    
    // 检查是否需要进入下一阶段
    if (nextIndex >= questions.length) {
        // 根据当前阶段决定下一步
        switch(stageId) {
            case 'quick':
                startDailyTopicStage();
                break;
            case 'daily':
                // 显示阶段小结
                const dailySummary = generateStageSummary('daily');
                appendMessage('ai', dailySummary);
                
                setTimeout(() => {
                    startOpinionStage();
                }, 1500);
                break;
            case 'opinion':
                // 显示阶段小结
                const opinionSummary = generateStageSummary('opinion');
                appendMessage('ai', opinionSummary);
                
                setTimeout(() => {
                    startEmotionalStage();
                }, 1500);
                break;
            case 'emotional':
                // 显示阶段小结
                const emotionalSummary = generateStageSummary('emotional');
                appendMessage('ai', emotionalSummary);
                
                setTimeout(() => {
                    startStressStage();
                }, 1500);
                break;
            case 'stress':
                // 显示阶段小结
                const stressSummary = generateStageSummary('stress');
                appendMessage('ai', stressSummary);
                
                setTimeout(() => {
                    finishAnalysis();
                }, 1500);
                break;
        }
        return;
    }
    
    // 显示下一个问题
    const nextQuestion = questions[nextIndex];
    switch(stageId) {
        case 'quick':
            presentQuickChoice(nextIndex);
            break;
        case 'daily':
            appendMessage('ai', nextQuestion.context);
            break;
        case 'opinion':
            appendMessage('ai', nextQuestion.topic);
            break;
        case 'emotional':
        case 'stress':
            appendMessage('ai', nextQuestion.scenario);
            break;
    }
}

// 获取当前问题索引
function getCurrentQuestionIndex(stageId) {
    switch(stageId) {
        case 'quick':
            return styleAnalysis.currentQuestionIndex;
        case 'daily':
        case 'opinion':
        case 'emotional':
        case 'stress':
            // 使用本地存储的索引
            const key = `${stageId}Index`;
            const stored = localStorage.getItem(key);
            return stored ? parseInt(stored) : 0;
        default:
            return 0;
    }
}

// 设置当前问题索引
function setCurrentQuestionIndex(stageId, index) {
    switch(stageId) {
        case 'quick':
            styleAnalysis.currentQuestionIndex = index;
            break;
        case 'daily':
        case 'opinion':
        case 'emotional':
        case 'stress':
            // 存储到本地
            const key = `${stageId}Index`;
            localStorage.setItem(key, index.toString());
            break;
    }
}

// 生成阶段小结
function generateStageSummary(stageId) {
    switch(stageId) {
        case 'daily':
            return `根据你的日常话题表达，我发现你的语言风格${
                styleAnalysis.personalityAnalysis.expressionStyle.detailed > 3 ? '偏向详细描述' : '倾向简洁直接'
            }，情感表达${
                styleAnalysis.personalityAnalysis.expressionStyle.emotionality > 3 ? '相对丰富' : '较为克制'
            }。接下来，我们将探讨你在观点表达方面的特点。`;
            
        case 'opinion':
            return `通过观点讨论，我注意到你的思维方式${
                styleAnalysis.personalityAnalysis.logicalStyle.structured > 3 ? '比较结构化' : '较为发散'
            }，论证风格${
                styleAnalysis.personalityAnalysis.logicalStyle.analytical > 3 ? '偏向逻辑分析' : '注重实例和经验'
            }。接下来，我们将了解你在情感交流中的表达特点。`;
            
        case 'emotional':
            return `在情感互动中，你的表达方式${
                styleAnalysis.personalityAnalysis.emotionalStyle.expressive > 3 ? '较为外露' : '相对内敛'
            }，共情能力${
                styleAnalysis.personalityAnalysis.socialStyle.empathetic > 3 ? '比较强' : '有所保留'
            }。让我们继续探索你在压力情境下的沟通风格。`;
            
        case 'stress':
            return `面对压力情境，你的应对方式${
                styleAnalysis.personalityAnalysis.stressStyle.proactive > 3 ? '偏向主动解决' : '注重调整和适应'
            }，表达特点${
                styleAnalysis.personalityAnalysis.stressStyle.assertive > 3 ? '直接坚定' : '灵活变通'
            }。现在我们已经完成了所有交流情境的分析。`;
            
        default:
            return "我们已经完成了这个阶段的分析，让我们继续下一个部分。";
    }
}

// 完成分析
function finishAnalysis() {
    // 生成最终分析结果
    const results = generateResults();
    
    // 更新UI
    updateResultDisplay(results);
    
    // 显示最终消息
    appendMessage('ai', "分析已完成！根据我们的互动，我总结了你的语言风格特点。请查看右侧的分析结果，确认是否准确反映了你的表达习惯。");
    
    // 显示结果确认区域
    document.querySelector('.result-confirmation').style.display = 'block';
}

// 添加消息到聊天区域
function appendMessage(sender, content, className = '') {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender} ${className}`;
    messageDiv.innerHTML = content;
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 更新进度
function updateProgress(increment = 0) {
    // 获取当前进度
    const progressElement = document.querySelector('.progress-fill');
    const currentWidth = parseInt(progressElement.style.width || '0');
    
    // 计算新进度
    let newWidth = currentWidth + increment;
    if (newWidth > 100) newWidth = 100;
    
    // 更新进度条
    progressElement.style.width = `${newWidth}%`;
}

// 更新阶段指示器
function updateStageIndicators() {
    const stages = document.querySelectorAll('.stage');
    
    stages.forEach((stage, index) => {
        // 移除所有状态类
        stage.classList.remove('active', 'completed');
        
        if (index < styleAnalysis.currentStage) {
            stage.classList.add('completed');
        } else if (index === styleAnalysis.currentStage) {
            stage.classList.add('active');
        }
    });
}

// 生成个性化总结
function generatePersonalizedSummary() {
    const { userPreferences, results } = styleAnalysis;
    
    let summary = "通过我们的交谈，我注意到你的表达风格很有特点：\n\n";
    
    if (userPreferences.expressionStyle) {
        summary += `• 在表达方式上，你倾向于${userPreferences.expressionStyle}\n`;
    }
    
    if (userPreferences.punctuationHabit.length > 0) {
        summary += `• 你喜欢使用${userPreferences.punctuationHabit.join('、')}来增添表达的情感色彩\n`;
    }
    
    if (results.sentence) {
        summary += `• 你的句式特点是${results.sentence}\n`;
    }
    
    if (results.organization) {
        summary += `• 在组织语言时，你习惯${results.organization}\n`;
    }
    
    return summary;
}

// 生成上下文相关的问题
function generateContextualQuestion(previousAnswer) {
    const analysis = personalityAnalysis;
    
    // 根据用户回答特点生成具体问题
    if (previousAnswer.length < 30) {
        return "能请你举个具体的例子吗？（比如：上周遇到的一件事，或者最近印象深刻的一次交谈）";
    }
    
    if (previousAnswer.includes('开心') || previousAnswer.includes('喜欢') || 
        previousAnswer.includes('感觉') || previousAnswer.includes('觉得')) {
        return "你提到了这些感受，能分享一下是什么场景让你有这样的感受吗？（比如：是和朋友聊天时，还是工作交流中？当时的具体情况是怎样的？）";
    }
    
    if (previousAnswer.includes('因为') || previousAnswer.includes('所以') ||
        previousAnswer.includes('首先') || previousAnswer.includes('其次')) {
        return "你的思路很清晰。在不同场合，你会怎么调整表达方式呢？（比如：和领导汇报时会更正式，和朋友聊天时会更随意？能具体说说吗？）";
    }
    
    if (previousAnswer.includes('朋友') || previousAnswer.includes('同事') ||
        previousAnswer.includes('别人') || previousAnswer.includes('大家')) {
        return "你提到了和他人互动的经历，能说说最近一次印象深刻的交流吗？（比如：是什么场合？聊了什么话题？你是怎么表达的？）";
    }
    
    return "这个想法很有趣，能分享一个具体的例子吗？（比如：最近遇到的一个类似情况，你是怎么处理的？）";
}

// 获取当前场景
function getCurrentScenario(stageId) {
    const scenarios = styleAnalysis.scenarios[stageId];
    if (Array.isArray(scenarios)) {
        return scenarios[getCurrentScenarioIndex(stageId)];
    }
    return scenarios;
}

// 获取当前场景索引
function getCurrentScenarioIndex(stageId) {
    const messages = document.querySelectorAll('.ai-message');
    const scenarios = styleAnalysis.scenarios[stageId];
    if (!Array.isArray(scenarios)) return 0;
    
    let count = 0;
    for (const message of messages) {
        if (scenarios.some(s => message.textContent.includes(s.context))) {
            count++;
        }
    }
    return count;
}

// 生成分析结果
function generateResults() {
    // 计算风格特征
    const analysis = analyzePersonality();
    
    // 生成结果对象
    const results = {
        expressionStyle: analysis.expressionStyle,
        vocabularyStyle: analysis.vocabularyStyle,
        sentenceStyle: analysis.sentenceStyle,
        communicationStyle: analysis.communicationStyle,
        strengths: generateStrengths(analysis),
        suggestions: generateSuggestions(analysis),
        examples: generateStyleExamples(analysis)
    };
    
    return results;
}

// 分析用户性格
function analyzePersonality() {
    const analysis = {
        expressionStyle: {},
        vocabularyStyle: {},
        sentenceStyle: {},
        communicationStyle: {},
    };
    
    // 表达方式分析
    const expressionStyle = styleAnalysis.personalityAnalysis.expressionStyle;
    
    analysis.expressionStyle.directness = expressionStyle.directness > 3 ? '直接表达' : '委婉表达';
    analysis.expressionStyle.detail = expressionStyle.detailed > 3 ? '详细描述' : '简洁明了';
    analysis.expressionStyle.emotion = expressionStyle.emotionality > 3 ? '情感丰富' : '理性克制';
    
    // 词汇风格分析
    const vocabularyStyle = styleAnalysis.personalityAnalysis.vocabularyStyle;
    
    analysis.vocabularyStyle.formality = vocabularyStyle.formal > vocabularyStyle.casual ? '正式用词' : '日常用词';
    analysis.vocabularyStyle.variety = vocabularyStyle.diverse > 3 ? '词汇丰富' : '用词精简';
    analysis.vocabularyStyle.vividness = vocabularyStyle.vivid > 3 ? '生动形象' : '朴实无华';
    
    // 句式风格分析
    const sentenceStyle = styleAnalysis.personalityAnalysis.sentenceStyle;
    
    analysis.sentenceStyle.length = sentenceStyle.long > sentenceStyle.short ? '长句为主' : '短句为主';
    analysis.sentenceStyle.complexity = sentenceStyle.complex > sentenceStyle.simple ? '结构复杂' : '结构简单';
    analysis.sentenceStyle.rhythm = sentenceStyle.varied > 3 ? '节奏多变' : '节奏统一';
    
    // 沟通风格分析
    const communicationStyle = styleAnalysis.personalityAnalysis.communicationStyle;
    
    analysis.communicationStyle.initiating = communicationStyle.initiating > communicationStyle.responsive ? '主动引导' : '回应为主';
    analysis.communicationStyle.focus = communicationStyle.task > communicationStyle.relationship ? '任务导向' : '关系导向';
    analysis.communicationStyle.persuasion = communicationStyle.logical > communicationStyle.emotional ? '逻辑说服' : '情感共鸣';
    
    return analysis;
}

// 生成优势
function generateStrengths(analysis) {
    const strengths = [];
    
    // 表达方式相关优势
    if (analysis.expressionStyle.directness === '直接表达') {
        strengths.push('表达清晰直接，擅长有效传递信息');
    } else {
        strengths.push('善于委婉表达，能顾及他人感受');
    }
    
    if (analysis.expressionStyle.detail === '详细描述') {
        strengths.push('描述细致全面，能提供丰富信息');
    } else {
        strengths.push('表达简洁明了，突出重点');
    }
    
    // 词汇风格相关优势
    if (analysis.vocabularyStyle.variety === '词汇丰富') {
        strengths.push('词汇量丰富，表达精准多样');
    }
    
    if (analysis.vocabularyStyle.vividness === '生动形象') {
        strengths.push('善用生动词汇，表达形象有趣');
    }
    
    // 沟通风格相关优势
    if (analysis.communicationStyle.initiating === '主动引导') {
        strengths.push('善于引导对话，推动沟通进程');
    } else {
        strengths.push('认真倾听回应，注重互动质量');
    }
    
    if (analysis.communicationStyle.persuasion === '逻辑说服') {
        strengths.push('擅长逻辑论证，说服力强');
    } else {
        strengths.push('善于情感共鸣，建立深度连接');
    }
    
    return strengths;
}

// 生成建议
function generateSuggestions(analysis) {
    const suggestions = [];
    
    // 表达方式相关建议
    if (analysis.expressionStyle.directness === '直接表达') {
        suggestions.push('在敏感话题上，适当增加委婉表达，照顾他人感受');
    } else {
        suggestions.push('在需要效率的场合，可以尝试更直接的表达方式');
    }
    
    if (analysis.expressionStyle.detail === '详细描述') {
        suggestions.push('向不熟悉背景的人解释时，注意控制信息量，突出重点');
    } else {
        suggestions.push('在专业交流或重要说明中，可以适当增加细节描述');
    }
    
    // 词汇风格相关建议
    if (analysis.vocabularyStyle.formality === '正式用词') {
        suggestions.push('在亲友交流中，可以尝试更随意的表达方式，增强亲近感');
    } else {
        suggestions.push('在正式场合，注意提升语言规范性和专业性');
    }
    
    // 沟通风格相关建议
    if (analysis.communicationStyle.focus === '任务导向') {
        suggestions.push('增加对人际关系的关注，平衡效率和团队氛围');
    } else {
        suggestions.push('在时间紧迫时，可以更加聚焦任务和结果');
    }
    
    return suggestions;
}

// 生成风格示例
function generateStyleExamples(analysis) {
    const examples = {
        greeting: '',
        explanation: '',
        disagreement: '',
        persuasion: ''
    };
    
    // 打招呼示例
    if (analysis.expressionStyle.directness === '直接表达' && analysis.expressionStyle.emotion === '情感丰富') {
        examples.greeting = '嘿！最近怎么样？好久不见了，真想听听你的近况！';
    } else if (analysis.expressionStyle.directness === '直接表达' && analysis.expressionStyle.emotion === '理性克制') {
        examples.greeting = '你好，最近工作如何？有进展吗？';
    } else if (analysis.expressionStyle.directness === '委婉表达' && analysis.expressionStyle.emotion === '情感丰富') {
        examples.greeting = '嗨~不知道最近一切都还顺利吗？有机会聊聊吗？';
    } else {
        examples.greeting = '您好，冒昧打扰，不知是否方便交流一下？';
    }
    
    // 解释概念示例
    if (analysis.expressionStyle.detail === '详细描述' && analysis.vocabularyStyle.variety === '词汇丰富') {
        examples.explanation = '这个概念可以从多角度理解：首先，它源于...；其次，在实践中它表现为...；此外，它与...有密切关联。总体来说，它是一个综合性的框架，涵盖了...等多个方面。';
    } else if (analysis.expressionStyle.detail === '详细描述' && analysis.vocabularyStyle.variety !== '词汇丰富') {
        examples.explanation = '这个概念是这样的：它来自...，主要用于...，包含...几个部分。使用它的时候需要注意...，效果通常是...。';
    } else if (analysis.expressionStyle.detail !== '详细描述' && analysis.vocabularyStyle.variety === '词汇丰富') {
        examples.explanation = '简言之，这是整合多元素的创新框架，优化了传统流程，提升系统效能。';
    } else {
        examples.explanation = '简单说，这个方法可以解决问题，节约时间，效果不错。';
    }
    
    // 表达不同意见示例
    if (analysis.expressionStyle.directness === '直接表达') {
        examples.disagreement = '我不太同意这个观点，因为...我认为更合理的方式是...';
    } else {
        examples.disagreement = '这个想法很有创意，不过我在想是否可以考虑另一种可能...也许从...角度看会有不同发现？';
    }
    
    // 说服他人示例
    if (analysis.communicationStyle.persuasion === '逻辑说服') {
        examples.persuasion = '根据三点理由，我建议采用方案A：首先，数据显示它的效率提升了30%；其次，它降低了20%的成本；最后，用户反馈满意度高达85%。';
    } else {
        examples.persuasion = '我之前在项目中尝试过这个方法，团队都很喜欢，感觉工作更有动力了，客户也非常满意最终效果，我相信这次也会一样成功。';
    }
    
    return examples;
}

// 更新结果显示
function updateResultDisplay(results) {
    // 显示结果区域
    document.querySelector('.result-confirmation').style.display = 'block';
    
    // 生成HTML内容
    let html = '<div class="results-container">';
    
    // 表达风格部分
    html += '<div class="result-section"><h4>表达风格特点</h4><ul>';
    html += `<li><strong>表达方式：</strong>${results.expressionStyle.directness}，${results.expressionStyle.detail}</li>`;
    html += `<li><strong>情感表现：</strong>${results.expressionStyle.emotion}</li>`;
    html += `<li><strong>用词风格：</strong>${results.vocabularyStyle.formality}，${results.vocabularyStyle.variety}</li>`;
    html += `<li><strong>句式特点：</strong>${results.sentenceStyle.length}，${results.sentenceStyle.complexity}</li>`;
    html += `<li><strong>沟通倾向：</strong>${results.communicationStyle.initiating}，${results.communicationStyle.focus}</li>`;
    html += '</ul></div>';
    
    // 优势部分
    html += '<div class="result-section"><h4>沟通优势</h4><ul>';
    results.strengths.forEach(strength => {
        html += `<li>${strength}</li>`;
    });
    html += '</ul></div>';
    
    // 建议部分
    html += '<div class="result-section"><h4>优化建议</h4><ul>';
    results.suggestions.forEach(suggestion => {
        html += `<li>${suggestion}</li>`;
    });
    html += '</ul></div>';
    
    // 示例部分
    html += '<div class="result-section"><h4>语言风格模拟示例</h4>';
    html += `<p><strong>打招呼：</strong>"${results.examples.greeting}"</p>`;
    html += `<p><strong>解释概念：</strong>"${results.examples.explanation}"</p>`;
    html += `<p><strong>表达不同意见：</strong>"${results.examples.disagreement}"</p>`;
    html += `<p><strong>说服他人：</strong>"${results.examples.persuasion}"</p>`;
    html += '</div>';
    
    html += '</div>';
    
    // 更新结果内容
    document.querySelector('.result-content').innerHTML = html;
    
    // 更新标签
    updateStyleTags(results);
}

// 更新风格标签
function updateStyleTags(results) {
    document.getElementById('sentence-style').textContent = results.sentenceStyle.length;
    document.getElementById('rhythm-style').textContent = results.expressionStyle.emotion;
    document.getElementById('punctuation-style').textContent = results.expressionStyle.directness;
    document.getElementById('habit-style').textContent = results.communicationStyle.persuasion;
    document.getElementById('organization-style').textContent = results.vocabularyStyle.formality;
}

// 确认结果
function confirmResults() {
    alert('分析结果已确认！您可以在个人资料中查看您的语言风格特征。');
    document.querySelector('.result-confirmation').style.display = 'none';
}

// 修改结果
function modifyResults() {
    alert('您可以重新开始分析，或者直接编辑个人资料中的语言风格标签。');
}

// 发送消息
function sendMessage() {
    const input = document.querySelector('.message-input');
    const message = input.value.trim();
    
    if (message) {
        // 清空输入框
        input.value = '';
        
        // 处理用户回答
        handleUserResponse(message);
    }
}

// 处理回车键
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 在文件末尾添加加载完成信息
console.log('profile.js 加载完成'); 

// 个人信息管理
const profileData = {
    name: '',
    gender: '',
    age: '',
    mbti: '',
    avatar: 'default-avatar.png'
};

// 从localStorage加载数据
function loadProfileData() {
    const savedData = localStorage.getItem('profileData');
    if (savedData) {
        Object.assign(profileData, JSON.parse(savedData));
        updateProfileDisplay();
    }
}

// 更新显示
function updateProfileDisplay() {
    document.getElementById('profile-name').textContent = profileData.name || '未设置';
    document.getElementById('profile-gender').textContent = profileData.gender || '未设置';
    document.getElementById('profile-age').textContent = profileData.age || '未设置';
    document.getElementById('profile-mbti').textContent = profileData.mbti || '未设置';
    document.getElementById('profile-avatar').src = profileData.avatar;
}

// 处理头像上传
document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profileData.avatar = e.target.result;
            document.getElementById('profile-avatar').src = e.target.result;
            saveProfileData();
        };
        reader.readAsDataURL(file);
    }
});

// 处理可编辑字段的点击
document.querySelectorAll('.editable').forEach(element => {
    element.addEventListener('click', function() {
        if (!this.classList.contains('editing')) {
            const field = this.dataset.field;
            const currentValue = this.textContent;
            const input = document.createElement('input');
            input.value = currentValue === '未设置' ? '' : currentValue;
            input.classList.add('editing');
            
            input.onblur = function() {
                const newValue = this.value.trim();
                profileData[field] = newValue;
                element.textContent = newValue || '未设置';
                saveProfileData();
            };

            input.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            };

            this.textContent = '';
            this.appendChild(input);
            input.focus();
        }
    });
});

// 保存数据到localStorage
function saveProfileData() {
    localStorage.setItem('profileData', JSON.stringify(profileData));
}

// AI互动功能
const questions = [
    {
        stage: '开场寒暄',
        questions: [
            '你平时喜欢怎么称呼别人？',
            '和陌生人交谈时，你会用什么样的开场白？',
            '你觉得寒暄时应该聊些什么话题？'
        ]
    },
    {
        stage: '日常话题',
        questions: [
            '谈论日常生活时，你更倾向于描述细节还是直接说重点？',
            '你喜欢用什么样的方式表达自己的想法？',
            '在群聊中，你通常扮演什么样的角色？'
        ]
    },
    {
        stage: '观点探讨',
        questions: [
            '当你需要表达不同意见时，会怎么组织语言？',
            '你更喜欢用什么方式来论证自己的观点？',
            '在讨论问题时，你会先说结论还是先说理由？'
        ]
    }
];

let currentStage = 0;
let currentQuestion = 0;
let analysisStarted = false;

// 开始分析按钮点击事件
document.querySelector('.start-analysis-btn').addEventListener('click', function() {
    if (!analysisStarted) {
        startAnalysis();
    }
});

// 发送按钮点击事件
document.querySelector('.send-btn').addEventListener('click', sendMessage);

// 发送消息
function sendMessage() {
    const input = document.querySelector('.message-input');
    const message = input.value.trim();
    
    if (message) {
        // 添加用户消息到对话框
        addMessage(message, 'user');
        input.value = '';
        
        // 分析用户回答
        analyzeResponse(message);
        
        // AI回复
        setTimeout(() => {
            const aiResponse = generateAIResponse(message);
            addMessage(aiResponse, 'ai');
            
            // 进入下一个问题或阶段
            nextQuestion();
        }, 1000);
    }
}

// 添加消息到对话框
function addMessage(message, type) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);
    messageDiv.innerHTML = message;
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 分析用户回答
function analyzeResponse(message) {
    // 这里可以添加更复杂的分析逻辑
    const analysis = {
        length: message.length,
        hasEmoji: /[\u{1F300}-\u{1F6FF}]/u.test(message),
        punctuationCount: (message.match(/[,.!?;]/g) || []).length,
        // 添加更多分析维度
    };
    
    // 更新进度条
    updateProgress();
}

// 生成AI回复
function generateAIResponse(userMessage) {
    const responses = [
        '这个回答很有意思，能具体说说原因吗？',
        '我注意到你的表达方式很独特，可以举个例子吗？',
        '从你的回答中，我感受到了你的思考方式，能展开说说吗？',
        '这个观点很有见地，你是如何得出这个结论的？'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 更新进度
function updateProgress() {
    const progress = ((currentStage * questions[0].questions.length + currentQuestion + 1) / 
                     (questions.length * questions[0].questions.length)) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;
    document.getElementById('analysis-stage').textContent = questions[currentStage].stage;
}

// 提出问题
function askQuestion() {
    if (currentStage < questions.length) {
        const question = questions[currentStage].questions[currentQuestion];
        addMessage(question, 'ai');
        updateProgress();
            } else {
        showResults();
    }
}

// 下一个问题
function nextQuestion() {
    currentQuestion++;
    if (currentQuestion >= questions[currentStage].questions.length) {
        currentQuestion = 0;
        currentStage++;
    }
    
    if (currentStage < questions.length) {
        setTimeout(askQuestion, 1000);
        } else {
        showResults();
    }
}

// 显示结果
function showResults() {
    document.querySelector('.result-confirmation').style.display = 'block';
    // 这里可以添加结果展示的逻辑
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化UI
    initializeUI();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载用户资料
    loadProfileData();
    
    console.log('profile.js 加载完成');
}); 

// 编辑资料按钮点击事件
document.querySelector('.edit-profile-btn').addEventListener('click', function() {
    showEditModal();
});

// 显示编辑模态框
function showEditModal() {
    // 创建模态框
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>编辑个人资料</h3>
                <div class="form-group">
                    <label>姓名：</label>
                    <input type="text" id="edit-name" value="${profileData.name || ''}" placeholder="请输入姓名">
                </div>
                <div class="form-group">
                    <label>性别：</label>
                    <select id="edit-gender">
                        <option value="">请选择</option>
                        <option value="男" ${profileData.gender === '男' ? 'selected' : ''}>男</option>
                        <option value="女" ${profileData.gender === '女' ? 'selected' : ''}>女</option>
                        <option value="其他" ${profileData.gender === '其他' ? 'selected' : ''}>其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>年龄：</label>
                    <input type="number" id="edit-age" value="${profileData.age || ''}" placeholder="请输入年龄">
                </div>
                <div class="form-group">
                    <label>MBTI：</label>
                    <select id="edit-mbti">
                        <option value="">请选择</option>
                        <option value="INTJ" ${profileData.mbti === 'INTJ' ? 'selected' : ''}>INTJ</option>
                        <option value="INTP" ${profileData.mbti === 'INTP' ? 'selected' : ''}>INTP</option>
                        <option value="ENTJ" ${profileData.mbti === 'ENTJ' ? 'selected' : ''}>ENTJ</option>
                        <option value="ENTP" ${profileData.mbti === 'ENTP' ? 'selected' : ''}>ENTP</option>
                        <option value="INFJ" ${profileData.mbti === 'INFJ' ? 'selected' : ''}>INFJ</option>
                        <option value="INFP" ${profileData.mbti === 'INFP' ? 'selected' : ''}>INFP</option>
                        <option value="ENFJ" ${profileData.mbti === 'ENFJ' ? 'selected' : ''}>ENFJ</option>
                        <option value="ENFP" ${profileData.mbti === 'ENFP' ? 'selected' : ''}>ENFP</option>
                        <option value="ISTJ" ${profileData.mbti === 'ISTJ' ? 'selected' : ''}>ISTJ</option>
                        <option value="ISFJ" ${profileData.mbti === 'ISFJ' ? 'selected' : ''}>ISFJ</option>
                        <option value="ESTJ" ${profileData.mbti === 'ESTJ' ? 'selected' : ''}>ESTJ</option>
                        <option value="ESFJ" ${profileData.mbti === 'ESFJ' ? 'selected' : ''}>ESFJ</option>
                        <option value="ISTP" ${profileData.mbti === 'ISTP' ? 'selected' : ''}>ISTP</option>
                        <option value="ISFP" ${profileData.mbti === 'ISFP' ? 'selected' : ''}>ISFP</option>
                        <option value="ESTP" ${profileData.mbti === 'ESTP' ? 'selected' : ''}>ESTP</option>
                        <option value="ESFP" ${profileData.mbti === 'ESFP' ? 'selected' : ''}>ESFP</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="save-btn">保存</button>
                    <button class="cancel-btn">取消</button>
                </div>
            </div>
        </div>
    `;

    // 添加模态框到页面
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement);

    // 绑定事件
    const modalOverlay = document.querySelector('.modal-overlay');
    const saveBtn = modalOverlay.querySelector('.save-btn');
    const cancelBtn = modalOverlay.querySelector('.cancel-btn');

    // 保存按钮点击事件
    saveBtn.addEventListener('click', function() {
        const newData = {
            name: document.getElementById('edit-name').value.trim(),
            gender: document.getElementById('edit-gender').value,
            age: document.getElementById('edit-age').value,
            mbti: document.getElementById('edit-mbti').value,
            avatar: profileData.avatar // 保持原有头像
        };

        // 验证数据
        if (!newData.name) {
            alert('请输入姓名');
            return;
        }
        if (!newData.gender) {
            alert('请选择性别');
            return;
        }
        if (!newData.age || newData.age < 0 || newData.age > 120) {
            alert('请输入有效的年龄');
            return;
        }

        // 更新数据
        Object.assign(profileData, newData);
        saveProfileData();
        updateProfileDisplay();

        // 关闭模态框
        closeModal();
    });

    // 取消按钮点击事件
    cancelBtn.addEventListener('click', closeModal);

    // 点击遮罩层关闭模态框
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}

// 关闭模态框
function closeModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
}

// 显示选项
function showOptions(options, multiSelect = false) {
    // 创建选项容器
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // 清除原有选项
    document.querySelectorAll('.options-container').forEach(container => {
        container.remove();
    });
    
    // 创建选项卡片
    options.forEach((option, index) => {
        const optionCard = document.createElement('div');
        optionCard.className = `option-card ${multiSelect ? 'multi-select' : ''}`;
        optionCard.textContent = option.text || option;
        optionCard.dataset.index = index;
        optionCard.dataset.value = option.value || option;
        
        optionCard.addEventListener('click', function() {
            handleOptionClick(this, multiSelect);
        });
        
        optionsContainer.appendChild(optionCard);
    });
    
    // 如果是多选，添加确认按钮
    if (multiSelect) {
        const confirmButton = document.createElement('button');
        confirmButton.className = 'custom-option-submit';
        confirmButton.textContent = '确认选择';
        confirmButton.addEventListener('click', function() {
            submitMultipleOptions();
        });
        optionsContainer.appendChild(confirmButton);
    }
    
    // 添加自定义选项
    const customOption = document.createElement('div');
    customOption.className = 'custom-option';
    customOption.style.display = 'none';
    customOption.innerHTML = `
        <input type="text" placeholder="请输入您的自定义回答">
        <button class="custom-option-submit">提交</button>
    `;
    
    customOption.querySelector('.custom-option-submit').addEventListener('click', function() {
        const customText = customOption.querySelector('input').value.trim();
        if (customText) {
            handleCustomOption(customText);
        }
    });
    
    optionsContainer.appendChild(customOption);
    
    // 将选项容器添加到聊天区域
    document.querySelector('.chat-messages').appendChild(optionsContainer);
    document.querySelector('.chat-messages').scrollTop = document.querySelector('.chat-messages').scrollHeight;
    
    return optionsContainer;
}

// 处理选项点击
function handleOptionClick(optionElement, multiSelect) {
    if (multiSelect) {
        // 多选逻辑
        optionElement.classList.toggle('selected');
        
        // 如果是自定义选项
        if (optionElement.textContent.includes('其他') || optionElement.textContent.includes('自定义')) {
            const customOption = document.querySelector('.custom-option');
            if (customOption) {
                customOption.style.display = optionElement.classList.contains('selected') ? 'flex' : 'none';
                if (customOption.style.display === 'flex') {
                    customOption.querySelector('input').focus();
                }
            }
        }
                } else {
        // 单选逻辑
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('selected');
        });
        optionElement.classList.add('selected');
        
        // 如果是自定义选项
        if (optionElement.textContent.includes('其他') || optionElement.textContent.includes('自定义')) {
            const customOption = document.querySelector('.custom-option');
            if (customOption) {
                customOption.style.display = 'flex';
                customOption.querySelector('input').focus();
                }
            } else {
            // 即时提交单选
            setTimeout(() => {
                submitOption(optionElement.textContent, optionElement.dataset.value);
            }, 300);
        }
    }
}

// 提交多选选项
function submitMultipleOptions() {
    const selectedOptions = Array.from(document.querySelectorAll('.option-card.selected'))
        .map(option => ({
            text: option.textContent,
            value: option.dataset.value
        }));
    
    if (selectedOptions.length > 0) {
        // 获取选中的文本
        const selectedText = selectedOptions.map(option => option.text).join('、');
        // 获取选中的值
        const selectedValues = selectedOptions.map(option => option.value);
        
        // 添加到聊天区域
        appendMessage('user', `我选择了：${selectedText}`);
        
        // 处理选择结果
        handleSelectedOptions(selectedValues, selectedText);
        
        // 移除选项容器
        document.querySelectorAll('.options-container').forEach(container => {
            container.remove();
        });
    }
}

// 提交单个选项
function submitOption(text, value) {
    // 添加到聊天区域
    appendMessage('user', text);
    
    // 处理选择结果
    handleSelectedOptions([value], text);
    
    // 移除选项容器
    document.querySelectorAll('.options-container').forEach(container => {
        container.remove();
    });
}

// 处理自定义选项
function handleCustomOption(text) {
    // 添加到聊天区域
    appendMessage('user', text);
    
    // 处理用户回答
    handleUserResponse(text);
    
    // 移除选项容器
    document.querySelectorAll('.options-container').forEach(container => {
        container.remove();
    });
}

// 处理选择结果
function handleSelectedOptions(values, text) {
    const currentStage = styleAnalysis.currentStage;
    
    // 更新用户偏好
    updateUserPreferences(values);
    
    // 继续下一步
    switch(currentStage) {
        case 0: // 快速选择题
            // 分析并回应
            const response = generateQuickChoiceResponse(values, text);
            appendMessage('ai', response);
            
            // 下一题或下一阶段
                    setTimeout(() => {
                if (styleAnalysis.currentQuestionIndex < styleAnalysis.quickChoices.length - 1) {
                    styleAnalysis.currentQuestionIndex++;
                    presentQuickChoice(styleAnalysis.currentQuestionIndex);
                } else {
                    // 阶段总结
                    const stageSummary = "基于你的选择，我了解到你的沟通偏好和风格。接下来，让我们通过一些日常话题，进一步了解你的表达方式。";
                    appendMessage('ai', stageSummary);
                    
                    // 进入下一阶段
                    setTimeout(() => {
                        startDailyTopicStage();
                    }, 1500);
                }
            }, 1500);
            break;
            
        case 1: // 日常话题
            handleDailyTopicOptionResult(values[0]);
            break;
            
        case 2: // 观点探讨
            handleOpinionOptionResult(values[0]);
            break;
            
        case 3: // 情感互动
            handleEmotionalOptionResult(values[0]);
            break;
            
        case 4: // 压力情境
            handleStressOptionResult(values[0]);
            break;
    }
}

// 生成快速选择题回应
function generateQuickChoiceResponse(values, text) {
    const currentQuestion = styleAnalysis.quickChoices[styleAnalysis.currentQuestionIndex];
    const selectedIndex = parseInt(values[0].replace('option', ''));
    
    const responses = [
        [
            "选择立即分享喜悦，表明你在情感表达上比较外向，喜欢与更广泛的社交圈分享体验。",
            "优先告诉亲近的人，说明你重视深度关系，情感表达有一定的选择性。",
            "选择默默记在心里，反映了你在情感表达上可能较为内敛，更注重个人体验。",
            "你有自己独特的表达方式，这体现了你的个性化思考模式。"
        ],
        [
            "直接指出问题体现了你的坦率和自信，在沟通中注重效率和清晰度。",
            "选择私下沟通显示了你的策略思考和人际敏感度，注重关系维护。",
            "委婉提建议反映了你在表达中注重措辞和他人感受，善于寻找平衡点。",
            "观察他人反应说明你在沟通前会收集更多信息，思考更全面。"
        ],
        [
            "先倾听再建议体现了你的共情能力和分析思维的平衡。",
            "分享类似经历表明你倾向于通过自身经验建立联系和共鸣。",
            "帮忙分析问题展示了你的逻辑思维和解决问题导向。",
            "以陪伴和安慰为主反映了你的情感支持能力和关系优先特质。"
        ],
        [
            "召集会议体现了你的团队导向和公开透明的领导风格。",
            "私下了解困难显示了你的人际敏感度和个性化解决方案的倾向。",
            "主动承担工作反映了你的责任感和行动导向的特点。",
            "向上级反馈说明你注重层级沟通和系统性解决问题。"
        ],
        [
            "主动带动气氛展示了你的外向特质和社交主动性。",
            "寻找小群体交流反映了你平衡社交需求和舒适度的能力。",
            "等待他人搭话表明你在新环境中可能更为谨慎和观察导向。",
            "专注于已认识的朋友显示你重视已有关系的深化而非扩展。"
        ]
    ];
    
    // 返回对应的回应
    if (selectedIndex >= 0 && selectedIndex < responses[styleAnalysis.currentQuestionIndex].length) {
        return responses[styleAnalysis.currentQuestionIndex][selectedIndex];
    }
    
    // 默认回应
    return "你的选择很有趣，这反映了你独特的思考方式和行为偏好。";
}

// 更新分析点数据
function updateAnalysisPoints(message) {
    // 词汇分析
    const words = message.split(/\s+/);
    const wordCount = words.length;
    
    // 详细程度分析
    if (wordCount > 50) {
        dialogueScenarios.analysisPoints.communicationStyle.detailed++;
    } else if (wordCount < 20) {
        dialogueScenarios.analysisPoints.communicationStyle.concise++;
    }
    
    // 逻辑性分析
    if (message.includes('因为') || message.includes('所以') || message.includes('如果') || message.includes('那么')) {
        dialogueScenarios.analysisPoints.communicationStyle.logical++;
    }
    
    // 情感表达分析
    if (message.includes('感觉') || message.includes('觉得') || message.includes('希望') || message.includes('担心')) {
        dialogueScenarios.analysisPoints.communicationStyle.emotional++;
    }
    
    // 主动性分析
    if (message.includes('建议') || message.includes('不如') || message.includes('我来') || message.includes('我想')) {
        dialogueScenarios.analysisPoints.responsePattern.proactive++;
    }
    
    // 协作性分析
    if (message.includes('一起') || message.includes('我们') || message.includes('大家') || message.includes('配合')) {
        dialogueScenarios.analysisPoints.responsePattern.collaborative++;
    }
}

// 生成最终总结
function generateFinalSummary() {
    const analysis = dialogueScenarios.analysisPoints;
    
    // 计算主要特征
    const dominantStyle = getDominantStyle(analysis);
    const communicationPattern = getCommunicationPattern(analysis);
    const emotionalStyle = getEmotionalStyle(analysis);
    
    // 生成个性化建议
    const suggestions = generatePersonalizedSuggestions(analysis);
    
    // 生成示例回复
    const examples = generateResponseExamples(analysis);
    
    return `
🎯 语言风格分析报告

通过我们的对话，我发现你的语言风格有以下特点：

1. 表达方式：${dominantStyle}
2. 沟通模式：${communicationPattern}
3. 情感特征：${emotionalStyle}

💡 个性化建议：
${suggestions}

🌟 你在不同场景下可能的回应示例：
${examples}

这些特点构成了你独特的语言个性。在未来的交流中，我会基于这些特点来模仿你的表达方式。
`;
}

// 获取主导表达风格
function getDominantStyle(analysis) {
    const { expressionStyle } = analysis;
    if (expressionStyle.direct > expressionStyle.indirect) {
        return "你倾向于直接明确的表达，善于表达自己的观点和立场";
    } else {
        return "你习惯用委婉的方式表达，善于照顾他人感受";
    }
}

// 获取沟通模式
function getCommunicationPattern(analysis) {
    const { responsePattern } = analysis;
    if (responsePattern.proactive > responsePattern.reactive) {
        return "你是一个主动型的沟通者，善于引导话题和提出建议";
    } else if (responsePattern.collaborative > responsePattern.proactive) {
        return "你很注重团队协作，善于寻求共识和集体解决方案";
    } else {
        return "你是一个深思熟虑的倾听者，善于回应和补充他人的观点";
    }
}

// 获取情感表达特征
function getEmotionalStyle(analysis) {
    const { emotionalTone } = analysis;
    if (emotionalTone.positive > emotionalTone.negative) {
        return "你的表达总体偏向积极乐观，善于营造正面的沟通氛围";
    } else if (emotionalTone.neutral > emotionalTone.positive) {
        return "你的表达比较理性客观，善于保持情绪的平衡";
    } else {
        return "你的表达比较谨慎，善于指出问题和潜在风险";
    }
}

// 生成个性化建议
function generatePersonalizedSuggestions(analysis) {
    const suggestions = [];
    const { communicationStyle, expressionStyle } = analysis;
    
    if (communicationStyle.concise > communicationStyle.detailed) {
        suggestions.push("• 在某些重要场合，可以适当增加细节描述，帮助他人更好理解");
    }
    
    if (expressionStyle.indirect > expressionStyle.direct * 2) {
        suggestions.push("• 在紧急情况下，可以尝试更直接的表达方式，提高沟通效率");
    }
    
    if (communicationStyle.logical > communicationStyle.emotional * 2) {
        suggestions.push("• 在处理人际关系时，可以适当增加情感表达，增强共情");
    }
    
    return suggestions.join('\n');
}

// 生成回应示例
function generateResponseExamples(analysis) {
    const { expressionStyle, communicationStyle } = analysis;
    const examples = [];
    
    // 根据用户的表达特点生成示例
    if (expressionStyle.direct > expressionStyle.indirect) {
        examples.push("工作汇报：「这个问题的原因我已经找到了，解决方案是...」");
    } else {
        examples.push("工作汇报：「关于这个问题，我们可以考虑从这几个方面入手...」");
    }
    
    if (communicationStyle.detailed > communicationStyle.concise) {
        examples.push("处理冲突：「让我们先梳理一下问题的来龙去脉，然后分析可能的解决方案...」");
    } else {
        examples.push("处理冲突：「我理解你的顾虑，我们可以这样解决...」");
    }
    
    return examples.join('\n');
}

// 保存分析结果
function saveAnalysisResults() {
    const results = {
        timestamp: new Date().toISOString(),
        analysisPoints: dialogueScenarios.analysisPoints,
        summary: generateFinalSummary()
    };
    
    localStorage.setItem('languageStyleAnalysis', JSON.stringify(results));
    console.log('分析结果已保存');
}

// 对话场景配置
const dialogueScenarios = {
    currentScenario: 0,
    currentRound: 0,
    scenarios: [
        {
            title: "社交场景：朋友聚会",
            context: "你刚到一个新的城市工作，参加了一个朋友组织的家庭聚会，准备认识新朋友。这是一个轻松的周末下午，大家在一个温馨的家庭环境中交流。",
            role: "新来的朋友",
            otherRole: "热情的本地朋友小林",
            rounds: [
                {
                    ai: "嗨，听说你也是最近来这边的？我也是去年才搬来的。你对这边的生活适应得怎么样？",
                    expectedFocus: ["开场方式", "社交态度", "表达方式"],
                    followUps: {
                        positive: "真的吗？{key_point}确实很有意思！对了，你平时周末喜欢做些什么？",
                        neutral: "刚来确实需要时间适应。诶，你有没有发现这边有什么特别有意思的地方？",
                        negative: "搬到新地方确实不容易，我当初也经历过。要不要分享一下你的感受？"
                    }
                },
                {
                    ai: "我也很喜欢{prev_topic}！这边有个地方特别适合，改天要不要一起去看看？",
                    expectedFocus: ["社交意愿", "兴趣表达", "互动深度"],
                    followUps: {
                        positive: "太好了！你平时一般什么时候有空？我们可以约个具体时间。",
                        neutral: "当然，你要是有空的话随时告诉我。对了，你还喜欢什么别的活动吗？",
                        negative: "没关系，我理解你可能还需要时间安顿。以后有兴趣随时可以找我。"
                    }
                },
                {
                    ai: "刚才听你提到{prev_point}，我也有类似的经历！{share_experience}，你觉得呢？",
                    expectedFocus: ["共情能力", "经验分享", "互动深度"],
                    followUps: {
                        positive: "是啊，看来我们有很多共同话题！你是怎么看待这种经历的？",
                        neutral: "这种经历确实很特别。你后来是怎么处理的？",
                        negative: "每个人的经历都是独特的，很高兴你愿意分享。"
                    }
                },
                {
                    ai: "你刚说到的{key_insight}很有意思，让我想到一个问题：如果遇到{specific_situation}，你会怎么处理？",
                    expectedFocus: ["思维方式", "问题解决", "价值观"],
                    followUps: {
                        positive: "你的想法真独特！能具体说说背后的考虑吗？",
                        neutral: "这确实是个值得思考的问题，你的处理方式很理性。",
                        negative: "理解，这种情况确实需要具体情况具体分析。"
                    }
                },
                {
                    ai: "时间过得真快啊，今天聊得很开心！改天一起{suggested_activity}怎么样？",
                    expectedFocus: ["关系维护", "后续互动", "告别方式"],
                    followUps: {
                        positive: "太好了！我们加个联系方式吧，到时候好约时间。",
                        neutral: "好啊，有空可以联系。今天认识你很高兴！",
                        negative: "没关系，你考虑考虑，随时可以联系我。"
                    }
                }
            ]
        },
        {
            title: "压力场景：生活危机",
            context: "你最近遇到了一些生活压力，和一个知心好友小美聊天。她注意到你最近的状态不太好，主动找你谈心。",
            role: "正在经历压力的朋友",
            otherRole: "知心好友小美",
            rounds: [
                {
                    ai: "最近看你朋友圈都没怎么更新，感觉你可能有心事？如果愿意的话，可以和我聊聊。",
                    expectedFocus: ["情绪表达", "压力应对", "开放程度"],
                    followUps: {
                        positive: "谢谢你愿意分享。确实，{key_point}听起来很不容易，你现在感觉怎么样？",
                        neutral: "我能感觉到你在努力调适。需要我做些什么吗？",
                        negative: "没关系，我就是担心你。要是什么时候想聊，随时找我，好吗？"
                    }
                },
                {
                    ai: "面对这种情况，你现在最担心的是什么？",
                    expectedFocus: ["具体困扰", "情绪深度", "表达方式"],
                    followUps: {
                        positive: "我完全理解这种感受。你有想过要怎么解决吗？",
                        neutral: "这确实让人很困扰。要不要我们一起想想办法？",
                        negative: "这种感受很正常，不用给自己太大压力。要不要先做些让自己开心的事？"
                    }
                },
                {
                    ai: "听你这么说，我也想起我之前遇到的类似经历。当时我...{share_experience}。不知道这对你有没有帮助？",
                    expectedFocus: ["接受建议", "情感共鸣", "解决意愿"],
                    followUps: {
                        positive: "很高兴这些建议对你有帮助。还有什么我可以帮你的吗？",
                        neutral: "每个人的情况确实不太一样，你觉得哪些建议可能适合你？",
                        negative: "抱歉如果我的建议不太适合。你心里有什么想法吗？"
                    }
                },
                {
                    ai: "你说得对，{validate_point}。不过你也不用太勉强自己，要学会好好休息。最近有什么让你感到开心的事吗？",
                    expectedFocus: ["自我关爱", "积极面", "调节能力"],
                    followUps: {
                        positive: "听到你还能保持这样的心态真好！要继续保持啊。",
                        neutral: "生活中的小确幸确实很重要。你平时还会怎么放松自己？",
                        negative: "没关系，情绪需要时间消化。我陪着你。"
                    }
                },
                {
                    ai: "我相信你一定能渡过这个难关。要不要这周末一起去{suggested_activity}散散心？",
                    expectedFocus: ["恢复意愿", "社交需求", "未来规划"],
                    followUps: {
                        positive: "就这么说定了！到时候我来安排，你只要开心就好。",
                        neutral: "你考虑考虑，不用急着答复我。最重要的是你觉得舒服。",
                        negative: "好的，你先休息调整，需要我的时候随时找我。"
                    }
                }
            ]
        },
        {
            title: "日常生活：邻里互动",
            context: "你最近搬进了一个新小区，发现楼上住户经常在深夜发出较大的声响，影响到你的休息。你决定和邻居沟通这个问题。",
            role: "受影响的住户",
            otherRole: "楼上的王先生",
            rounds: [
                {
                    ai: "您好，我是住在楼下的邻居。冒昧打扰，是想和您聊聊最近晚上的声音问题...",
                    expectedFocus: ["开场方式", "礼貌程度", "问题表达"],
                    followUps: {
                        positive: "谢谢您的理解。您平时作息是怎样的？也许我们可以互相配合一下。",
                        neutral: "我理解可能有特殊情况，您觉得我们可以怎么互相照顾一下呢？",
                        negative: "抱歉可能我表达得不够清楚。主要是想看看我们能不能找到双方都适合的解决方案。"
                    }
                },
                {
                    ai: "这样的安排您觉得可以吗？我也会注意{compromise_point}。",
                    expectedFocus: ["协商能力", "互相理解", "解决方案"],
                    followUps: {
                        positive: "太好了，感谢您的配合。对了，您在这边住了多久了？",
                        neutral: "您提的建议也很好，我们可以互相体谅。",
                        negative: "要不我们再想想其他办法？主要是希望大家都住得舒心。"
                    }
                },
                {
                    ai: "说起来，我觉得咱们小区的环境还不错，您平时会参加小区的活动吗？",
                    expectedFocus: ["话题转换", "社区融入", "关系建立"],
                    followUps: {
                        positive: "原来您也喜欢{activity}啊！下次活动我们可以一起参加。",
                        neutral: "是的，邻里之间多交流确实很重要。",
                        negative: "理解，现代生活确实挺忙的。不过有需要帮忙的话随时可以找我。"
                    }
                },
                {
                    ai: "既然我们都是邻居，平时有什么需要帮忙的也可以互相照应。您觉得呢？",
                    expectedFocus: ["关系维护", "互助意愿", "社区意识"],
                    followUps: {
                        positive: "这样最好了，和谐的邻里关系确实很重要。",
                        neutral: "对的，大家互相帮助生活会更方便。",
                        negative: "没关系，您觉得合适的时候再说。"
                    }
                },
                {
                    ai: "那就这么说定了。对了，听说周末小区有个{community_event}，您知道吗？",
                    expectedFocus: ["社交延展", "参与度", "告别方式"],
                    followUps: {
                        positive: "太好了！到时候见。今天谢谢您的理解和配合。",
                        neutral: "您考虑考虑，有兴趣的话可以一起参加。",
                        negative: "好的，不打扰您了。有什么事随时联系。"
                    }
                }
            ]
        },
        {
            title: "情感场景：关系修复",
            context: "你最近和一个好朋友因为一些误会产生了隔阂，对方主动找你谈谈。",
            role: "需要修复关系的朋友",
            otherRole: "主动沟通的好友小华",
            rounds: [
                {
                    ai: "最近感觉你好像在躲着我...是不是我哪里做得不好？可以跟我说说吗？",
                    expectedFocus: ["情感表达", "沟通开放度", "问题处理"],
                    followUps: {
                        positive: "谢谢你愿意说出来。{key_point}确实是我考虑不周，你能详细说说吗？",
                        neutral: "我明白了。可能我们之间有些误会，要不要好好聊聊？",
                        negative: "我很珍惜我们的友谊，如果我有做得不对的地方，希望你能告诉我。"
                    }
                },
                {
                    ai: "听你这么说，我更明白自己的问题了。{reflection_point}，你觉得呢？",
                    expectedFocus: ["情感共鸣", "问题认知", "和解意愿"],
                    followUps: {
                        positive: "很感谢你愿意这么坦诚地跟我说。我们之间最宝贵的就是这种信任。",
                        neutral: "这件事确实让我们都学到了很多。以后要更注意沟通。",
                        negative: "我理解你可能还需要一些时间。等你准备好了，随时可以继续聊。"
                    }
                },
                {
                    ai: "记得我们之前{share_memory}吗？真希望我们能一直这样无话不谈。",
                    expectedFocus: ["情感连接", "记忆共鸣", "关系期待"],
                    followUps: {
                        positive: "是啊，那些都是很珍贵的回忆。我们要一直这样下去。",
                        neutral: "朋友之间难免有摩擦，重要的是我们愿意沟通。",
                        negative: "我知道重建信任需要时间，我会努力的。"
                    }
                },
                {
                    ai: "其实这件事也让我学到了很多，以后我会{improvement_point}。你觉得这样可以吗？",
                    expectedFocus: ["改进意愿", "解决方案", "未来期望"],
                    followUps: {
                        positive: "很高兴我们能这样坦诚地交流。要一起努力维护我们的友谊！",
                        neutral: "是的，相互理解和包容很重要。",
                        negative: "我会给你时间和空间，但请记住我一直都在。"
                    }
                },
                {
                    ai: "要不要一起去{suggested_activity}？就像以前一样。",
                    expectedFocus: ["关系修复", "实际行动", "未来规划"],
                    followUps: {
                        positive: "太好了！就这么说定了。我们的友谊一定会越来越好的！",
                        neutral: "好啊，慢慢来，重要的是我们都在努力。",
                        negative: "没关系，你考虑考虑。我随时都在。"
                    }
                }
            ]
        },
        {
            title: "兴趣爱好：共同话题",
            context: "你在一个摄影社群中看到了一些很棒的作品，想和作者交流。",
            role: "摄影爱好者",
            otherRole: "社群达人阿杰",
            rounds: [
                {
                    ai: "你分享的{artwork_type}照片真的很棒！特别是{specific_point}的处理很独特。你是什么时候开始接触摄影的？",
                    expectedFocus: ["兴趣起源", "专业度", "分享意愿"],
                    followUps: {
                        positive: "真有意思！能具体说说{technical_aspect}这方面是怎么处理的吗？",
                        neutral: "摄影确实很有魅力。你最喜欢拍摄什么题材？",
                        negative: "每个人都有自己的摄影风格，很期待看到你更多的作品。"
                    }
                },
                {
                    ai: "我也很喜欢{photo_style}风格，特别是在{specific_condition}的时候。你觉得现在摄影圈有什么新的趋势吗？",
                    expectedFocus: ["专业见解", "行业认知", "观点表达"],
                    followUps: {
                        positive: "你说的{trend_point}确实很有见地！你是怎么看待这个变化的？",
                        neutral: "确实，技术在不断进步，但创意才是核心。",
                        negative: "每个人对摄影的理解都不同，这才让这个领域如此丰富。"
                    }
                },
                {
                    ai: "说到这个，你有没有遇到过{technical_challenge}的问题？我最近就在研究这个。",
                    expectedFocus: ["问题解决", "经验分享", "技术探讨"],
                    followUps: {
                        positive: "你的解决方法很专业！要不要线下一起实践一下？",
                        neutral: "这确实是个常见问题，大家可以多交流经验。",
                        negative: "摄影就是在不断尝试中进步的，慢慢来。"
                    }
                },
                {
                    ai: "最近有个{photo_event}活动，感觉很适合我们一起参加，你有兴趣吗？",
                    expectedFocus: ["合作意愿", "社交倾向", "专业提升"],
                    followUps: {
                        positive: "太好了！我们可以一起准备，互相交流心得。",
                        neutral: "好啊，到时候看看具体安排。",
                        negative: "没关系，你考虑考虑，随时告诉我。"
                    }
                },
                {
                    ai: "今天聊得很开心！我们改天可以一起去{shooting_location}拍摄，你觉得呢？",
                    expectedFocus: ["后续互动", "关系发展", "专业规划"],
                    followUps: {
                        positive: "好主意！我们加个联系方式，好约时间。",
                        neutral: "可以啊，有机会一起切磋。",
                        negative: "好的，你有空了随时联系我。"
                    }
                }
            ]
        }
    ],
    
    // 分析维度
    analysisPoints: {
        communicationStyle: {
            direct: 0,      // 直接表达
            indirect: 0,    // 委婉表达
            formal: 0,      // 正式
            casual: 0,      // 随意
            detailed: 0,    // 详细
            concise: 0      // 简洁
        },
        emotionalExpression: {
            positive: 0,    // 积极
            negative: 0,    // 消极
            neutral: 0,     // 中性
            empathetic: 0,  // 共情
            reserved: 0     // 保守
        },
        socialTendency: {
            proactive: 0,   // 主动
            reactive: 0,    // 被动
            engaging: 0,    // 投入
            distant: 0,     // 疏离
            collaborative: 0 // 合作
        },
        problemSolving: {
            analytical: 0,  // 分析性
            intuitive: 0,   // 直觉性
            practical: 0,   // 实用性
            creative: 0,    // 创造性
            systematic: 0   // 系统性
        },
        personalityTraits: {
            confident: 0,   // 自信
            cautious: 0,    // 谨慎
            flexible: 0,    // 灵活
            persistent: 0,  // 坚持
            adaptable: 0    // 适应性
        }
    }
};

// ... existing code ... 

// 处理用户回答
function handleUserResponse(message) {
    // 添加用户消息到对话框
    appendMessage('user', message);
    
    // 分析用户回答
    analyzeResponse(message);
    
    const currentScenario = dialogueScenarios.scenarios[dialogueScenarios.currentScenario];
    const currentRound = currentScenario.rounds[dialogueScenarios.currentRound];
    
    // 生成AI回应
    setTimeout(() => {
        // 确定回应类型
        const responseType = determineResponseType(message);
        const followUp = currentRound.followUps[responseType];
        
        // 替换关键词
        const processedFollowUp = processFollowUp(followUp, message);
        
        // 如果还有后续对话
        if (dialogueScenarios.currentRound < currentScenario.rounds.length - 1) {
            // 先显示跟进回应
            appendMessage('ai', processedFollowUp);
            
            // 延迟显示下一个主要问题
            setTimeout(() => {
                dialogueScenarios.currentRound++;
                const nextRound = currentScenario.rounds[dialogueScenarios.currentRound];
                appendMessage('ai', processNextQuestion(nextRound.ai, message));
            }, 1500);
        } else {
            // 当前场景结束，给出小结
            const summary = generateScenarioSummary(currentScenario);
            appendMessage('ai', summary);
            
            // 更新进度
            updateProgress();
            
            // 转入下一个场景或结束分析
            setTimeout(() => {
                if (dialogueScenarios.currentScenario < dialogueScenarios.scenarios.length - 1) {
                    dialogueScenarios.currentScenario++;
                    dialogueScenarios.currentRound = 0;
                    startNextScenario();
                } else {
                    finishAnalysis();
                }
            }, 2000);
        }
    }, 1000);
}

// 分析用户回答
function analyzeResponse(message) {
    const analysis = dialogueScenarios.analysisPoints;
    
    // 分析沟通风格
    if (isDirectCommunication(message)) {
        analysis.communicationStyle.direct++;
    } else {
        analysis.communicationStyle.indirect++;
    }
    
    if (isFormalTone(message)) {
        analysis.communicationStyle.formal++;
    } else {
        analysis.communicationStyle.casual++;
    }
    
    if (isDetailedResponse(message)) {
        analysis.communicationStyle.detailed++;
    } else {
        analysis.communicationStyle.concise++;
    }
    
    // 分析情感表达
    const emotionalTone = analyzeEmotionalTone(message);
    analysis.emotionalExpression[emotionalTone]++;
    
    // 分析社交倾向
    const socialTraits = analyzeSocialTendency(message);
    for (const trait of socialTraits) {
        analysis.socialTendency[trait]++;
    }
    
    // 分析问题解决方式
    const problemSolvingTraits = analyzeProblemSolving(message);
    for (const trait of problemSolvingTraits) {
        analysis.problemSolving[trait]++;
    }
    
    // 分析性格特征
    const personalityTraits = analyzePersonalityTraits(message);
    for (const trait of personalityTraits) {
        analysis.personalityTraits[trait]++;
    }
}

// 判断回应类型
function determineResponseType(message) {
    const sentiment = analyzeSentiment(message);
    const engagement = analyzeEngagement(message);
    
    if (sentiment > 0.7 && engagement > 0.7) {
        return 'positive';
    } else if (sentiment < 0.3 || engagement < 0.3) {
        return 'negative';
    } else {
        return 'neutral';
    }
}

// 处理跟进回应
function processFollowUp(followUp, message) {
    // 提取关键信息
    const keyPoints = extractKeyPoints(message);
    
    // 替换模板中的变量
    return followUp.replace(/{key_point}/, keyPoints[0] || '')
                  .replace(/{prev_topic}/, extractTopic(message) || '')
                  .replace(/{specific_point}/, keyPoints[1] || '')
                  .replace(/{share_experience}/, generateRelatedExperience(message))
                  .replace(/{suggested_activity}/, suggestActivity(message));
}

// 处理下一个问题
function processNextQuestion(question, prevMessage) {
    // 提取上下文信息
    const context = extractContext(prevMessage);
    
    // 替换问题中的变量
    return question.replace(/{prev_point}/, context.mainPoint || '')
                  .replace(/{specific_situation}/, generateSituation(context))
                  .replace(/{key_insight}/, context.insight || '');
}

// 生成场景小结
function generateScenarioSummary(scenario) {
    const analysis = dialogueScenarios.analysisPoints;
    
    let summary = `在${scenario.title}的场景中，我观察到：\n\n`;
    
    // 分析沟通风格
    const communicationStyle = determineCommunicationStyle(analysis);
    summary += `1. ${communicationStyle}\n`;
    
    // 分析情感表达
    const emotionalStyle = determineEmotionalStyle(analysis);
    summary += `2. ${emotionalStyle}\n`;
    
    // 分析社交特点
    const socialStyle = determineSocialStyle(analysis);
    summary += `3. ${socialStyle}\n`;
    
    // 分析问题解决方式
    const problemSolvingStyle = determineProblemSolvingStyle(analysis);
    summary += `4. ${problemSolvingStyle}\n`;
    
    return summary + "\n让我们继续下一个场景...";
}

// 辅助分析函数
function isDirectCommunication(message) {
    const directPatterns = [
        /我认为/,
        /我觉得/,
        /我想/,
        /应该/,
        /必须/,
        /直接/
    ];
    return directPatterns.some(pattern => pattern.test(message));
}

function isFormalTone(message) {
    const formalPatterns = [
        /您/,
        /请问/,
        /麻烦/,
        /感谢/,
        /建议/
    ];
    return formalPatterns.some(pattern => pattern.test(message));
}

function isDetailedResponse(message) {
    return message.length > 50 || message.includes('因为') || message.includes('所以');
}

function analyzeEmotionalTone(message) {
    const positiveWords = ['喜欢', '好', '棒', '开心', '感谢', '希望'];
    const negativeWords = ['不', '没', '难', '糟', '担心', '害怕'];
    
    let positiveCount = positiveWords.filter(word => message.includes(word)).length;
    let negativeCount = negativeWords.filter(word => message.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
}

function analyzeSocialTendency(message) {
    const traits = [];
    
    if (message.includes('一起') || message.includes('我们')) {
        traits.push('collaborative');
    }
    if (message.length > 100 || message.includes('?') || message.includes('？')) {
        traits.push('engaging');
    }
    if (message.includes('建议') || message.includes('不如')) {
        traits.push('proactive');
    }
    
    return traits;
}

function analyzeProblemSolving(message) {
    const traits = [];
    
    if (message.includes('分析') || message.includes('原因')) {
        traits.push('analytical');
    }
    if (message.includes('尝试') || message.includes('可以')) {
        traits.push('practical');
    }
    if (message.includes('创新') || message.includes('新的')) {
        traits.push('creative');
    }
    
    return traits;
}

function analyzePersonalityTraits(message) {
    const traits = [];
    
    if (message.includes('一定') || message.includes('肯定')) {
        traits.push('confident');
    }
    if (message.includes('也许') || message.includes('可能')) {
        traits.push('cautious');
    }
    if (message.includes('适应') || message.includes('改变')) {
        traits.push('adaptable');
    }
    
    return traits;
}

// 生成相关经验
function generateRelatedExperience(message) {
    const topics = extractTopics(message);
    const experiences = {
        work: "我之前也遇到过类似的工作压力",
        social: "我也经历过适应新环境的过程",
        hobby: "我在学习新技能时也经常遇到瓶颈",
        emotion: "我也曾经历过类似的情感困扰"
    };
    
    return experiences[topics[0]] || "我也有过类似的经历";
}

// 提取话题
function extractTopics(message) {
    const topics = [];
    
    if (message.includes('工作') || message.includes('项目')) {
        topics.push('work');
    }
    if (message.includes('朋友') || message.includes('社交')) {
        topics.push('social');
    }
    if (message.includes('爱好') || message.includes('兴趣')) {
        topics.push('hobby');
    }
    if (message.includes('感情') || message.includes('情绪')) {
        topics.push('emotion');
    }
    
    return topics;
}

// 提取关键信息
function extractKeyPoints(message) {
    const sentences = message.split(/[。！？.!?]/);
    return sentences.filter(s => s.length > 0).slice(0, 2);
}

// 建议活动
function suggestActivity(message) {
    const topics = extractTopics(message);
    const activities = {
        work: "一起参加一个工作坊",
        social: "找个周末一起喝咖啡",
        hobby: "参加一个兴趣小组活动",
        emotion: "一起去散步聊聊天"
    };
    
    return activities[topics[0]] || "改天一起出来玩";
}

// 确定沟通风格
function determineCommunicationStyle(analysis) {
    if (analysis.communicationStyle.direct > analysis.communicationStyle.indirect) {
        return "你倾向于直接清晰的表达方式，善于表达自己的观点";
    } else {
        return "你擅长运用委婉的方式表达，注重维护他人感受";
    }
}

// 确定情感风格
function determineEmotionalStyle(analysis) {
    if (analysis.emotionalExpression.positive > analysis.emotionalExpression.negative) {
        return "你的情感表达偏向积极正面，善于传递正能量";
    } else if (analysis.emotionalExpression.neutral > analysis.emotionalExpression.positive) {
        return "你的情感表达较为理性平和，善于保持客观";
    } else {
        return "你的情感表达比较谨慎，倾向于深思熟虑";
    }
}

// 确定社交风格
function determineSocialStyle(analysis) {
    if (analysis.socialTendency.proactive > analysis.socialTendency.reactive) {
        return "你在社交中表现主动，善于引导话题和互动";
    } else {
        return "你在社交中比较从容，善于倾听和回应";
    }
}

// 确定问题解决风格
function determineProblemSolvingStyle(analysis) {
    if (analysis.problemSolving.analytical > analysis.problemSolving.intuitive) {
        return "你解决问题的方式偏向理性分析，善于思考细节";
    } else {
        return "你解决问题的方式偏向直觉，善于把握整体";
    }
}

// ... existing code ... 

// 分析情感倾向
function analyzeSentiment(message) {
    const positiveWords = [
        '喜欢', '好', '棒', '开心', '感谢', '希望', '愿意', '期待',
        '有趣', '快乐', '温暖', '享受', '满意', '赞同', '支持'
    ];
    
    const negativeWords = [
        '不', '没', '难', '糟', '担心', '害怕', '困难', '问题',
        '麻烦', '讨厌', '烦恼', '痛苦', '失望', '焦虑', '拒绝'
    ];
    
    let positiveScore = positiveWords.filter(word => message.includes(word)).length;
    let negativeScore = negativeWords.filter(word => message.includes(word)).length;
    
    const totalWords = message.length;
    return (positiveScore * 2 - negativeScore) / Math.max(totalWords / 10, 1);
}

// 分析参与度
function analyzeEngagement(message) {
    let score = 0;
    
    // 长度分析
    score += Math.min(message.length / 100, 1);
    
    // 互动标记
    if (message.includes('?') || message.includes('？')) score += 0.2;
    if (message.includes('!') || message.includes('！')) score += 0.2;
    
    // 关键词分析
    const engagementWords = [
        '我觉得', '我想', '可以', '建议', '要不', '不如',
        '一起', '我们', '怎么样', '什么', '为什么'
    ];
    
    score += engagementWords.filter(word => message.includes(word)).length * 0.1;
    
    return Math.min(score, 1);
}

// 提取上下文
function extractContext(message) {
    const context = {
        mainPoint: '',
        insight: '',
        topics: [],
        sentiment: 0
    };
    
    // 提取主要观点
    const sentences = message.split(/[。！？.!?]/);
    if (sentences.length > 0) {
        context.mainPoint = sentences[0].trim();
    }
    
    // 提取见解
    const insightPatterns = [
        /我认为(.*?)(?:[。！？.!?]|$)/,
        /我觉得(.*?)(?:[。！？.!?]|$)/,
        /我想(.*?)(?:[。！？.!?]|$)/
    ];
    
    for (const pattern of insightPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            context.insight = match[1].trim();
            break;
        }
    }
    
    // 提取话题
    context.topics = extractTopics(message);
    
    // 分析情感
    context.sentiment = analyzeSentiment(message);
    
    return context;
}

// 生成情境
function generateSituation(context) {
    const situations = {
        work: [
            "团队成员对你的提议有不同意见",
            "项目遇到意外延期",
            "需要在短时间内完成重要任务"
        ],
        social: [
            "在聚会中遇到意见不合的情况",
            "需要融入新的社交圈",
            "与朋友产生误会"
        ],
        hobby: [
            "遇到技能瓶颈",
            "需要与他人合作完成项目",
            "面临创作灵感枯竭"
        ],
        emotion: [
            "朋友心情低落需要安慰",
            "需要处理人际关系矛盾",
            "面对压力和焦虑"
        ]
    };
    
    const topic = context.topics[0] || 'social';
    const situations_list = situations[topic];
    return situations_list[Math.floor(Math.random() * situations_list.length)];
}

// 提取话题关键词
function extractTopic(message) {
    const topics = {
        work: ['工作', '项目', '任务', '团队', '公司'],
        life: ['生活', '日常', '休息', '爱好', '兴趣'],
        social: ['朋友', '社交', '聚会', '交流', '认识'],
        emotion: ['感受', '心情', '压力', '开心', '烦恼']
    };
    
    for (const [category, keywords] of Object.entries(topics)) {
        if (keywords.some(word => message.includes(word))) {
            return keywords[0];
        }
    }
    
    return '';
}

// 更新进度条
function updateProgress() {
    const totalScenarios = dialogueScenarios.scenarios.length;
    const currentProgress = ((dialogueScenarios.currentScenario + 1) / totalScenarios) * 100;
    
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${currentProgress}%`;
        progressBar.setAttribute('aria-valuenow', currentProgress);
    }
    
    // 更新阶段指示器
    updateStageIndicators();
}

// 更新阶段指示器
function updateStageIndicators() {
    const indicators = document.querySelectorAll('.stage-indicator');
    const currentScenario = dialogueScenarios.currentScenario;
    
    indicators.forEach((indicator, index) => {
        if (index < currentScenario) {
            indicator.classList.add('completed');
            indicator.classList.remove('current');
        } else if (index === currentScenario) {
            indicator.classList.add('current');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('completed', 'current');
        }
    });
}

// 开始分析
function startAnalysis() {
    // 重置分析状态
    dialogueScenarios.currentScenario = 0;
    dialogueScenarios.currentRound = 0;
    
    // 重置分析点数
    Object.keys(dialogueScenarios.analysisPoints).forEach(category => {
        Object.keys(dialogueScenarios.analysisPoints[category]).forEach(point => {
            dialogueScenarios.analysisPoints[category][point] = 0;
        });
    });
    
    // 清空聊天区域
    const chatArea = document.querySelector('.chat-messages');
    if (chatArea) {
        chatArea.innerHTML = '';
    }
    
    // 显示欢迎信息
    appendMessage('ai', `欢迎参加语言风格分析！

在接下来的对话中，我们会通过几个不同的场景来了解你的表达特点。每个场景都模拟真实的社交情境，希望你能以最自然的方式来回应。

记住，这里没有标准答案，重要的是展现真实的你。

让我们开始第一个场景：`);
    
    // 更新UI显示
    document.querySelector('.analysis-container').style.display = 'block';
    document.querySelector('.result-confirmation').style.display = 'none';
    
    // 初始化进度条和阶段指示器
    updateProgress();
    
    // 开始第一个场景
    setTimeout(() => {
        startNextScenario();
    }, 2000);
}

// ... existing code ... 