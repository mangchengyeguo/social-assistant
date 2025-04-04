const scenarioData = {
    // 职场生存篇
    workplace: [
        {
            id: 'credit-stealing',
            title: '同事抢功劳',
            preview: '巧妙维护自己的工作成果',
            tags: ['职场', '权益'],
            situation: '同事在汇报中把您的工作成果据为己有',
            responses: {
                '反击版': '这个方案的数据测算部分是我周二加班完成的，需要我演示具体过程吗？',
                '幽默版': '看来我们默契度满分啊，下次可以试试分工更明确~',
                '预防版': '关于XX项目进展，我整理了一份过程记录供您参考'
            },
            tips: [
                '用具体事实维护权益，同时保持专业态度',
                '用轻松方式暗示界限，避免正面冲突',
                '提前留痕，建立职场防御机制'
            ]
        },
        {
            id: 'extra-work',
            title: '领导临时加活',
            preview: '合理应对突发工作安排',
            tags: ['工作', '边界'],
            situation: '领导在下班前临时加派重要任务',
            responses: {
                '拖延战术': '我现在手头有A、B两项紧急任务，您看哪个优先处理？',
                '条件交换': '这个可以接，但需要市场部先提供数据支持',
                '甩锅话术': '这部分涉及财务核算，建议找财务部确认风险'
            },
            tips: [
                '把决策压力返还给领导',
                '设置合理前提，避免无条件接受',
                '合理转移责任，保护自己'
            ]
        },
        {
            id: 'workplace-pua',
            title: '职场PUA应对',
            preview: '化解职场压力与打压',
            tags: ['职场', '防御'],
            situation: '遭遇职场打压或负面评价',
            responses: {
                '数据反击': '过去半年我完成了XX业绩，贡献度占比XX%',
                '价值重申': '我的产出与薪酬匹配度是行业标准的XX倍',
                '降维打击': '您说的对，所以更需要优化管理制度'
            },
            tips: [
                '用客观数据对抗主观评价',
                '强调自身市场价值',
                '将个人问题转化为系统问题'
            ]
        }
    ],

    // 亲友关系篇
    relationships: [
        {
            id: 'marriage-pressure',
            title: '父母催婚催生',
            preview: '优雅应对来自家人的压力',
            tags: ['家庭', '沟通'],
            situation: '家人频繁过问婚恋/生育话题',
            responses: {
                '共情转移': '知道你们着急，我也在积极接触，最近认识了几个不错的',
                '数据防御': '现在平均结婚年龄都32了，我这才哪儿到哪儿',
                '反客为主': '妈，您当年被我姥姥催的时候啥感受？'
            },
            tips: [
                '先安抚情绪，再巧妙转移焦点',
                '用社会数据建立理性防御',
                '引导对方换位思考'
            ]
        },
        {
            id: 'friend-venting',
            title: '朋友频繁诉苦',
            preview: '平衡倾听与自我保护',
            tags: ['友情', '边界'],
            situation: '朋友持续倾诉负面情绪',
            responses: {
                '设定边界': '我很想帮你，但今天我自己状态也不太好',
                '行动导向': '你需要我当听众，还是帮你想解决办法？',
                '专业建议': '这种情况心理咨询师可能更有帮助，我认识靠谱的'
            },
            tips: [
                '明确表达自身限度',
                '将情绪宣泄转化为问题解决',
                '合理转移责任到专业人士'
            ]
        },
        {
            id: 'difficult-request',
            title: '亲友为难请求',
            preview: '婉拒请求不伤感情',
            tags: ['人情', '技巧'],
            situation: '亲友提出难以满足的请求',
            responses: {
                '真诚回应': '我真的很想帮你，但这次确实有点困难',
                '替代方案': '虽然这个忙帮不上，不过我可以帮你问问其他朋友',
                '延迟答复': '让我先了解一下具体情况，晚点给你回复好吗？'
            },
            tips: [
                '保持真诚的同时设立边界',
                '提供次级支持方案',
                '争取思考时间，避免当场妥协'
            ]
        }
    ],

    // 陌生人社交篇
    strangers: [
        {
            id: 'sales-pressure',
            title: '推销纠缠应对',
            preview: '巧妙化解推销困境',
            tags: ['应对', '技巧'],
            situation: '遭遇强势推销难以脱身',
            responses: {
                '魔法打败魔法': '你们这个产品最大的缺点是什么？',
                '假装同类': '巧了，我也是做这行的',
                '物理防御': '我手机没电了，你加我助理微信吧'
            },
            tips: [
                '用专业提问反制推销话术',
                '建立平等地位，削弱推销动力',
                '创造合理脱离场景'
            ]
        },
        {
            id: 'elevator-talk',
            title: '电梯社交',
            preview: '自然展开简短对话',
            tags: ['社交', '礼仪'],
            situation: '电梯等公共场合的短暂社交',
            responses: {
                '轻松破冰': '今天天气真不错，您也是来这栋楼办事的吗？',
                '安全话题': '这栋楼的空调开得真足，您觉得呢？',
                '礼貌收尾': '我到楼层了，祝您今天顺利！'
            },
            tips: [
                '中性安全话题开启对话',
                '环境相关话题，避免隐私',
                '自然结束对话的万能句式'
            ]
        },
        {
            id: 'friend-of-friend',
            title: '朋友的朋友',
            preview: '建立适度社交关系',
            tags: ['社交', '拓展'],
            situation: '与朋友的朋友初次见面',
            responses: {
                '快速破冰': '你是怎么认识XX的呀？',
                '寻找共性': '你也喜欢xx呀',
                '软性承诺': '下次让xx组局再聊？'
            },
            tips: [
                '通过共同朋友建立连接',
                '发现共同兴趣延长对话',
                '保持友好但控制关系深度'
            ]
        }
    ],

    // 网络社交篇
    online: [
        {
            id: 'online-conflict',
            title: '杠精围攻',
            preview: '化解网络争议局面',
            tags: ['网络', '应对'],
            situation: '在网络上遭遇争议或批评',
            responses: {
                '幽默转移': '我们争论的认真程度，堪比学术论文答辩了',
                '捧杀战术': '这么独特的见解建议发篇论文',
                '金蝉脱壳': '突然想起锅里的水烧开了，回聊'
            },
            tips: [
                '用幽默化解对抗氛围',
                '抬高对方以终止讨论',
                '戏剧化脱离消耗性对话'
            ]
        },
        {
            id: 'ex-contact',
            title: '前任突然联系',
            preview: '妥善处理过往关系',
            tags: ['情感', '边界'],
            situation: '前任突然发来消息',
            responses: {
                '防诈模式': '你是本人吗？先回答我们第一次约会吃的什么',
                '话题封印': '过去的事就不提了，祝你顺利',
                '商业互吹': '听说你最近不错啊，我也挺好的，拜拜'
            },
            tips: [
                '验证身份同时设置门槛',
                '友好但坚决地关闭话题',
                '表面客套，实际终结对话'
            ]
        },
        {
            id: 'message-anxiety',
            title: '已读不回焦虑',
            preview: '缓解等待的焦虑感',
            tags: ['社交', '心理'],
            situation: '消息显示已读但对方未回复',
            responses: {
                '主动破冰': '看到消息了，需要时间思考怎么回',
                '场景解释': '刚在开会/开车，现在可以细聊',
                '反制话术': '您这么着急，是有什么特别原因吗？'
            },
            tips: [
                '缓解对方等待焦虑',
                '提供合理延迟理由',
                '将压力返还给对方'
            ]
        }
    ]
};