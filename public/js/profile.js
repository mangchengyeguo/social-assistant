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
    const confirmButton = document.querySelector('.confirm-btn');
    const modifyButton = document.querySelector('.modify-btn');
    const reanalyzeButton = document.querySelector('.reanalyze-btn');

    if (confirmButton) {
    confirmButton.addEventListener('click', confirmResults);
    }
    if (modifyButton) {
    modifyButton.addEventListener('click', modifyResults);
    }
    if (reanalyzeButton) {
    reanalyzeButton.addEventListener('click', startAnalysis);
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

// 编辑资料按钮点击事件 - 移到setupEventListeners函数中
// document.querySelector('.edit-profile-btn').addEventListener('click', function() {
//    showEditModal();
// });

// ... existing code ... 

// 处理用户回答
async function handleUserResponse(userMessage) {
    try {
        // 添加用户消息到对话区域
        appendMessage('user', userMessage);
        
        // 构建对话上下文
        const currentScene = dialogueScenarios[currentScenarioIndex];
        const currentQuestion = currentScene.questions[currentQuestionIndex];
        
        const dialogueContext = {
            sceneInfo: currentScene.description,
            userRole: currentScene.userRole,
            aiRole: currentScene.aiRole,
            currentQuestion: currentQuestion.question,
            analysisPoints: currentQuestion.analysisPoints,
            userReply: userMessage,
            dialogueHistory: messageHistory
        };

        // 准备API请求
        const requestBody = {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的对话助手。请基于以下场景信息和分析要求，对用户的回复进行分析并给出恰当的回应：
                    
                    场景信息：${dialogueContext.sceneInfo}
                    用户角色：${dialogueContext.userRole}
                    AI角色：${dialogueContext.aiRole}
                    当前问题：${dialogueContext.currentQuestion}
                    分析要点：${dialogueContext.analysisPoints}
                    
                    请分析用户回复的：
                    1. 核心态度（接受/犹豫/拒绝）
                    2. 情感倾向（积极/消极/中性）
                    3. 表达特点（直接/间接）
                    
                    根据分析结果给出回应，要求：
                    1. 回应必须紧密结合用户的实际回复内容
                    2. 保持对话自然流畅，避免机械化回复
                    3. 符合场景角色设定
                    
                    输出格式：
                    {
                        "analysis": {
                            "attitude": "string",
                            "emotion": "string",
                            "expression": "string"
                        },
                        "reply": "string"
                    }`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: false
        };

        // 发送API请求
        const response = await fetch('https://api.deepseek.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-b73a5e2e66534dad805459f5c59a4a13'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        const aiResponse = JSON.parse(data.choices[0].message.content);
        
        // 记录分析结果
        console.log('分析结果:', aiResponse.analysis);
        
        // 添加AI回复到对话区域
        appendMessage('assistant', aiResponse.reply);
        
        // 更新对话历史
        messageHistory.push({
            role: 'user',
            content: userMessage
        });
        messageHistory.push({
            role: 'assistant',
            content: aiResponse.reply
        });

        // 处理对话进度
        if (currentQuestionIndex < currentScene.questions.length - 1) {
            currentQuestionIndex++;
                    setTimeout(() => {
                displayNextQuestion();
            }, 1000);
        } else if (currentScenarioIndex < dialogueScenarios.length - 1) {
            currentScenarioIndex++;
            currentQuestionIndex = 0;
                    setTimeout(() => {
                startNewScene();
            }, 1000);
    } else {
            appendMessage('system', '分析完成！');
        }

    } catch (error) {
        console.error('处理用户回复时出错:', error);
        appendMessage('system', '抱歉，处理您的回复时出现了问题。');
    }
}

// ... existing code ... 

// 对话场景定义
const dialogueScenarios = {
    currentScenarioIndex: 0,
    currentQuestionIndex: 0,
    messageHistory: [],
    scenes: [
        {
            title: "工作场景",
            description: "模拟工作中的各种沟通场景",
            userRole: "员工",
            aiRole: "同事/上级",
            questions: []
        },
        {
            title: "社交场景",
            description: "模拟日常社交中的沟通场景",
            userRole: "社交者",
            aiRole: "朋友/熟人",
            questions: []
        },
        {
            title: "服务场景",
            description: "模拟服务行业中的沟通场景",
            userRole: "服务者",
            aiRole: "客户",
            questions: []
        }
    ]
}; 