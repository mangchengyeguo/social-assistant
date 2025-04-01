document.addEventListener('DOMContentLoaded', function() {
    // 添加API配置检查
    const API_CONFIG = {
        BASE_URL: 'https://api.aisocialassistant.com'  // 修改为公网可访问的API地址
    };

    console.log('初始化应用...', {
        API_URL: API_CONFIG.BASE_URL,
        时间: new Date().toISOString()
    });

    // 在开始时测试服务器连接
    async function testServerConnection() {
        try {
            console.log('测试服务器连接...');
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/test`);
            if (!response.ok) {
                throw new Error(`服务器响应异常: ${response.status}`);
            }
            console.log('服务器连接正常');
            return true;
        } catch (error) {
            console.error('服务器连接失败:', error);
            alert('无法连接到服务器，请确保服务器已启动。错误信息：' + error.message);
            return false;
        }
    }

    // 在页面加载时测试连接
    testServerConnection().then(isConnected => {
        if (!isConnected) {
            console.log('服务器连接失败，某些功能可能无法使用');
        }
    });

    // 获取URL参数中的联系人ID
    const urlParams = new URLSearchParams(window.location.search);
    const contactId = urlParams.get('id');
    
    if (!contactId) {
        alert('未找到联系人ID');
        window.location.href = 'chat.html';
        return;
    }
    
    // DOM元素
    const contactName = document.getElementById('contact-name');
    const contactAvatar = document.getElementById('contact-avatar');
    const avatarUpload = document.getElementById('avatar-upload');
    const editModal = document.getElementById('edit-modal');
    const tagModal = document.getElementById('tag-modal');
    const editForm = document.getElementById('edit-form');
    const editMbti = document.getElementById('edit-mbti');
    const editAge = document.getElementById('edit-age');
    const editGender = document.getElementById('edit-gender');
    const editRelationship = document.getElementById('edit-relationship');
    const unifiedEditBtn = document.querySelector('.unified-edit-btn');
    const tagsScroll = document.querySelector('.tags-scroll');
    const tagInput = document.querySelector('.tag-input');
    const generateBtn = document.querySelector('.generate-btn');
    const generatedTagsContainer = document.querySelector('.generated-tags');
    const messageInput = document.querySelector('.message-input');
    const chatMessages = document.querySelector('.chat-messages');
    const customTagInput = document.querySelector('.custom-tag-input');
    const manualTagsContainer = document.querySelector('.manual-tags-container');
    const generateManualBtn = document.querySelector('.generate-manual-btn');
    const saveTagsBtn = document.querySelector('.save-tags-btn');
    
    console.log('保存标签按钮元素:', saveTagsBtn);
    
    if (saveTagsBtn) {
        saveTagsBtn.addEventListener('click', function() {
            console.log('保存标签按钮被点击');
            saveSelectedTags();
        });
    } else {
        console.error('找不到保存标签按钮');
    }
    
    let currentContact = null;
    let currentEditField = '';
    let selectedTags = new Set();
    let currentChannel = 'how-to';
    let messageHistory = [];
    let manualTags = new Set();

    // 标签相关功能
    const methodTabs = document.querySelectorAll('.method-tab');
    const methodContents = document.querySelectorAll('.method-content');

    // 加载联系人数据
    function loadContact() {
        try {
            const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
            currentContact = contacts.find(contact => contact.id === contactId);
            
            if (!currentContact) {
                throw new Error('未找到联系人信息');
            }

            // 更新页面标题
            document.title = `${currentContact.name} - AI社交助手`;
            
            // 更新基本信息
            contactName.textContent = currentContact.name;
            contactAvatar.src = currentContact.avatar;
            document.getElementById('contact-mbti').textContent = currentContact.mbti || '未设置';
            document.getElementById('contact-age').textContent = getAge(currentContact.birthday) || '未设置';
            document.getElementById('contact-gender').textContent = getGenderText(currentContact.gender);
            document.getElementById('contact-relationship').textContent = currentContact.relationship || '未设置';
            
            // 初始化标签
            if (!currentContact.tags) {
                currentContact.tags = [];
                saveContact(); // 保存初始化的标签数组
            }
            renderTags();
            
        } catch (error) {
            console.error('加载联系人数据失败:', error);
            alert(error.message);
            window.location.href = 'chat.html';
        }
    }

    // 计算年龄
    function getAge(birthday) {
        if (!birthday) return null;
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    // 获取性别显示文本
    function getGenderText(gender) {
        return gender === 'male' ? '男' : gender === 'female' ? '女' : '未设置';
    }

    // 渲染标签
    function renderTags() {
        if (!currentContact.tags) currentContact.tags = [];
        tagsScroll.innerHTML = currentContact.tags.map(tag =>
            `<span class="tag">
                ${tag}
                <span class="delete-tag" data-tag="${tag}">×</span>
            </span>`
        ).join('');

        // 添加删除事件监听
        document.querySelectorAll('.tags-scroll .delete-tag').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const tagToDelete = deleteBtn.dataset.tag;
                const confirmDelete = confirm('确定要删除这个标签吗？');
                
                if (confirmDelete) {
                    currentContact.tags = currentContact.tags.filter(tag => tag !== tagToDelete);
                    saveContact();
                    renderTags();
                }
            });
        });
    }

    // 保存联系人数据
    function saveContact() {
        try {
            const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
            const index = contacts.findIndex(c => c.id === contactId);
            if (index === -1) {
                throw new Error('未找到联系人信息');
            }
            contacts[index] = currentContact;
            localStorage.setItem('contacts', JSON.stringify(contacts));
        } catch (error) {
            console.error('保存联系人数据失败:', error);
            alert('保存失败，请刷新页面重试');
        }
    }

    // 头像上传处理
    contactAvatar.parentElement.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                contactAvatar.src = e.target.result;
                currentContact.avatar = e.target.result;
                saveContact();
            };
            reader.readAsDataURL(file);
        }
    });

    // 统一编辑按钮功能
    document.querySelector('.unified-edit-btn').addEventListener('click', () => {
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-form');
        
        // 填充当前值到表单
        form.querySelector('#edit-mbti').value = document.getElementById('contact-mbti').textContent || '';
        form.querySelector('#edit-age').value = document.getElementById('contact-age').textContent || '';
        form.querySelector('#edit-gender').value = document.getElementById('contact-gender').textContent === '男' ? 'male' : 
            (document.getElementById('contact-gender').textContent === '女' ? 'female' : '');
        form.querySelector('#edit-relationship').value = document.getElementById('contact-relationship').textContent || '';
        
        // 显示模态框
        modal.style.display = 'block';
    });

    // 取消按钮功能
    document.querySelector('#edit-modal .cancel-btn').addEventListener('click', () => {
        document.getElementById('edit-modal').style.display = 'none';
    });

    // 表单提交处理
    document.getElementById('edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const form = e.target;
        const mbti = form.querySelector('#edit-mbti').value;
        const age = form.querySelector('#edit-age').value;
        const gender = form.querySelector('#edit-gender').value;
        const relationship = form.querySelector('#edit-relationship').value;
        
        // 更新显示的值
        document.getElementById('contact-mbti').textContent = mbti || '未知';
        document.getElementById('contact-age').textContent = age || '未知';
        document.getElementById('contact-gender').textContent = gender === 'male' ? '男' : 
            (gender === 'female' ? '女' : '未知');
        document.getElementById('contact-relationship').textContent = relationship || '未知';
        
        // 关闭模态框
        document.getElementById('edit-modal').style.display = 'none';
    });

    // 添加标签按钮点击处理
    document.querySelector('.add-tag-btn').addEventListener('click', () => {
        tagModal.classList.add('active');
        selectedTags.clear();
        generatedTagsContainer.innerHTML = '';
        tagInput.value = '';
    });

    // 处理文件上传
    function handleFileUpload(event, type) {
        const files = event.target.files;
        const container = document.getElementById('image-files');
        const clearFilesBtn = document.querySelector('.clear-files-btn');
        
        if (files.length > 0) {
            container.innerHTML = '';
            Array.from(files).forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span class="remove-file">×</span>
                `;
                
                fileItem.querySelector('.remove-file').addEventListener('click', () => {
                    fileItem.remove();
                    if (container.children.length === 0) {
                        clearFilesBtn.style.display = 'none';
                    }
                });
                
                container.appendChild(fileItem);
            });
            clearFilesBtn.style.display = 'inline-block';
        }
    }

    // 添加清空文件选择的功能
    document.querySelector('.clear-files-btn').addEventListener('click', () => {
        const container = document.getElementById('image-files');
        const imageUpload = document.getElementById('image-upload');
        container.innerHTML = '';
        imageUpload.value = '';
        document.querySelector('.clear-files-btn').style.display = 'none';
    });

    // 切换标签输入方式
    document.querySelectorAll('.method-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有active类
            document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.method-content').forEach(c => c.classList.remove('active'));
            
            // 添加active类到当前选中的标签
            this.classList.add('active');
            const method = this.dataset.method;
            document.getElementById(`${method}-method`).classList.add('active');
        });
    });

    // 添加标签按钮点击事件
    document.querySelector('.add-tags-btn').addEventListener('click', function() {
        // 获取所有选中的标签
        const aiSelectedTags = Array.from(document.querySelectorAll('.generated-tags .tag.selected'))
            .map(tag => tag.textContent.trim());
        const manualSelectedTags = Array.from(document.querySelectorAll('.manual-tags-container .tag.selected'))
            .map(tag => tag.textContent.trim().replace('×', ''));
            
        const allSelectedTags = [...aiSelectedTags, ...manualSelectedTags];
            
        if (allSelectedTags.length === 0) {
            showError('请至少选择一个标签');
            return;
        }

        // 更新当前联系人的标签
        if (!currentContact) {
            showError('未找到联系人信息');
            return;
        }

        currentContact.tags = currentContact.tags || [];
        currentContact.tags = [...new Set([...currentContact.tags, ...allSelectedTags])];
        
        saveContact();
        renderTags();
        
        // 关闭模态框并清空
        tagModal.classList.remove('active');
        document.querySelector('.tag-input').value = '';
        document.getElementById('image-files').innerHTML = '';
        document.querySelector('.clear-files-btn').style.display = 'none';
    });

    // 生成AI标签
    async function generateAITags() {
        const textContent = document.querySelector('.tag-input').value.trim();
        const imageFiles = document.querySelectorAll('#image-files .file-item');
        
        if (!textContent && imageFiles.length === 0) {
            showError('请至少上传图片或输入文字内容');
            return;
        }
        
        const loadingEl = document.querySelector('.loading');
        const errorEl = document.querySelector('.error');
        const tagsContainer = document.querySelector('.generated-tags');
        
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        
        try {
            // 首先测试服务器连接
            try {
                const testResponse = await fetch(`${API_CONFIG.BASE_URL}/api/test`);
                if (!testResponse.ok) {
                    throw new Error('后端服务器未响应，请确保服务器已启动');
                }
            } catch (error) {
                throw new Error('无法连接到后端服务器，请确保服务器已启动');
            }

            // 调用后端API生成标签
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/generate-tags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    textContent,
                    imageFiles: Array.from(imageFiles).map(f => f.querySelector('span').textContent)
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '生成标签失败');
            }
            
            const data = await response.json();
            
            if (!data || !Array.isArray(data)) {
                throw new Error('服务器返回数据格式错误');
            }
            
            // 渲染生成的标签
            data.forEach(tag => {
                const tagEl = document.createElement('div');
                tagEl.className = 'tag';
                tagEl.textContent = tag;
                tagEl.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
                tagsContainer.appendChild(tagEl);
            });
            
        } catch (error) {
            console.error('生成标签失败:', error);
            showError(error.message);
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    // 处理手动输入标签
    if (customTagInput) {
        customTagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tagText = this.value.trim();
                if (tagText) {
                    const tags = tagText.split(/[,，、\s]+/).filter(tag => tag.length > 0);
                    tags.forEach(tag => {
                        if (tag.length <= 4) {  // 限制标签长度为4个字符
                            manualTags.add(tag);
                        }
                    });
                    renderManualTags();
                    this.value = '';
                }
            }
        });
    }

    // 渲染手动输入的标签
    function renderManualTags() {
        if (!manualTagsContainer) {
            console.error('找不到标签容器元素');
            return;
        }
        
        manualTagsContainer.innerHTML = Array.from(manualTags).map(tag => `
            <span class="tag" data-tag="${tag}">
                ${tag}
                <span class="remove-tag">×</span>
            </span>
        `).join('');

        // 添加删除标签的事件监听
        manualTagsContainer.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagElement = e.target.closest('.tag');
                const tag = tagElement.dataset.tag;
                manualTags.delete(tag);
                renderManualTags();
            });
        });

        // 添加标签选择事件
        manualTagsContainer.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('selected');
            });
        });
    }

    // 显示错误信息
    function showError(message) {
        const errorEl = document.querySelector('.error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    // 保存选中的标签
    function saveSelectedTags() {
        try {
            console.log('开始保存标签...');
            // 获取所有选中的标签文本
            const selectedTags = [
                ...document.querySelectorAll('.generated-tags .tag.selected'),
                ...document.querySelectorAll('.manual-tags-container .tag.selected')
            ].map(tag => tag.textContent.trim());
            
            console.log('选中的标签:', selectedTags);
            
            if (selectedTags.length === 0) {
                console.log('没有选中任何标签');
                showError('请至少选择一个标签');
                return;
            }
            
            // 更新当前联系人的标签
            if (!currentContact) {
                console.error('未找到当前联系人信息');
                showError('未找到联系人信息');
                return;
            }
            
            currentContact.tags = currentContact.tags || [];
            currentContact.tags = [...new Set([...currentContact.tags, ...selectedTags])];
            console.log('更新后的标签列表:', currentContact.tags);
            
            saveContact();
            renderTags();
            
            // 关闭模态框
            const tagModal = document.getElementById('tag-modal');
            if (tagModal) {
                tagModal.classList.remove('active');
            }
            
            // 清空选中状态和输入
            const tagInput = document.querySelector('.tag-input');
            const generatedTags = document.querySelector('.generated-tags');
            const manualTagsContainer = document.querySelector('.manual-tags-container');
            const imageFiles = document.getElementById('image-files');
            
            if (tagInput) tagInput.value = '';
            if (generatedTags) generatedTags.innerHTML = '';
            if (manualTagsContainer) manualTagsContainer.innerHTML = '';
            if (imageFiles) imageFiles.innerHTML = '';
            
            console.log('标签保存成功');
        } catch (error) {
            console.error('保存标签失败:', error);
            showError('保存标签失败: ' + error.message);
        }
    }

    // 添加加载聊天记录的函数
    function loadChatHistory() {
        const key = `chat_history_${contactId}_${currentChannel}`;
        const savedHistory = localStorage.getItem(key);
        if (savedHistory) {
            messageHistory = JSON.parse(savedHistory);
            chatMessages.innerHTML = '';
            messageHistory.forEach(msg => {
                if (msg.isUser) {
                    addUserMessage(msg.content);
                } else {
                    addAIMessage(msg.content);
                }
            });
        } else {
            messageHistory = [];
            chatMessages.innerHTML = '';
            addAIMessage(getChannelWelcomeMessage(currentChannel));
        }
    }

    // 添加保存聊天记录的函数
    function saveChatHistory() {
        const key = `chat_history_${contactId}_${currentChannel}`;
        localStorage.setItem(key, JSON.stringify(messageHistory));
    }

    // 添加清除聊天记录的函数
    function clearChatHistory() {
        if (confirm('确定要清除当前频道的聊天记录吗？')) {
            const key = `chat_history_${contactId}_${currentChannel}`;
            localStorage.removeItem(key);
            messageHistory = [];
            chatMessages.innerHTML = '';
            addAIMessage(getChannelWelcomeMessage(currentChannel));
        }
    }

    // 修改切换频道的逻辑
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.channel-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentChannel = btn.dataset.channel;
            loadChatHistory();
        });
    });

    // 获取AI回复
    async function getAIResponse(channel, userMessage) {
        try {
            console.log('准备发送AI请求...', {
                channel,
                messageLength: userMessage.length
            });

            // 测试服务器连接
            const isConnected = await testServerConnection();
            if (!isConnected) {
                throw new Error('服务器连接失败，请检查服务器状态');
            }

            const CHAT_PROMPTS = {
                howToCommunicate: `▎角色定位

你是一位资深沟通策略专家。请基于用户画像、联系人信息、用户和联系人关系，直接给出最佳沟通方案以及策略解读

▎必读信息

1. 用户画像：
   - 性格特征和表达习惯（包括标点符号使用习惯）
   - 社交风格和处事方式
   - 语言表达特点（例如：用词、语气、标点符号等）

2. 联系人特征：
   - MBTI类型特点和关键词
   - 个性标签和行为模式
   - 沟通偏好和决策方式

3. 关系定位：
   - 双方关系属性
   - 互动历史

▎输出内容

1、沟通方案 

[完整对话文本，每句话单独一行]


2、策略解读

1. 每句话的策略和原因：
   - 第1句：[这句话为什么要这样说]
     - MBTI考虑：[基于对方MBTI的考虑]
     - 性格考虑：[基于对方性格标签的考虑]
     - 关系考虑：[基于双方关系的考虑]
     - 预期效果：[这样说的预期效果]
   - 第2句：[这句话为什么要这样说]
     - MBTI考虑：[基于对方MBTI的考虑]
     - 性格考虑：[基于对方性格标签的考虑]
     - 关系考虑：[基于双方关系的考虑]
     - 预期效果：[这样说的预期效果]
   - ...（逐句分析）

2. 整体策略：
   - 表达风格选择：[具体解释]
   - MBTI策略要点：[具体解释]
   - 性格特征应对：[具体解释]
   - 关系处理策略：[具体解释]

▎格式要求
- 每句话必须单独成行
- 每个段落之间空一行
- 不使用任何markdown格式`,

                analyze: `▎角色定位

你是一位专业的对话解析专家。请基于用户画像和联系人信息，输出对方的想要表达的意思以及给用户的社交建议

▎必读信息

1. 用户画像：
   - 理解视角和认知方式
   - 表达习惯（包括标点符号使用习惯）
   - 性格特征和关注点

2. 联系人特征：
   - MBTI类型特点和关键词
   - 个性标签和行为模式
   - 沟通偏好和决策方式

3. 关系定位：
   - 双方关系

▎输出格式

1、意图解读 

[完整的解读内容，每点单独一行]


2、策略分析

1. 每句话的策略和原因：
   - 第1句：[原句内容]
     - 表层含义：[字面意思]
     - 深层含义：[潜台词和暗示]
     - 情感倾向：[情绪和态度]
     - MBTI特征：[体现的MBTI特点]
     - 性格体现：[体现的性格特征]
   - 第2句：[原句内容]
     - 表层含义：[字面意思]
     - 深层含义：[潜台词和暗示]
     - 情感倾向：[情绪和态度]
     - MBTI特征：[体现的MBTI特点]
     - 性格体现：[体现的性格特征]
   - ...（逐句分析）

3、社交建议：基于对方意图与个性、双方关系、用户个性，给出简单的社交建议

▎格式要求
- 每句话必须单独成行
- 每个段落之间空一行
- 不使用任何markdown格式`,

                guessPreference: `▎角色定位

你是一位专业的个性分析师和喜好预测专家，擅长根据用户画像和联系人信息，预测对方偏好和喜欢的东西。

▎必读信息

1. 用户画像：
   - MBTI类型
   - 核心标签
   - 关键属性（年龄/生日）

2. 关系图谱：
   - 亲密程度（领导/恋人等）
   - 社交距离定位

3. 需求场景：
   - 节日
   - 纪念日
   - 特殊场景

4. 关系定位：
   - 双方关系属性
   - 互动历史

▎输出内容

1、礼物建议

提案1：[礼物/偏好名称]

匹配度分析：
- MBTI特征匹配：[从MBTI角度分析为什么合适]
- 性格标签匹配：[从性格特征分析为什么合适]
- 场景适配性：[具体使用场景描述]
- 关系考量：[从关系角度分析合适程度]

提案2：[礼物/偏好名称]

匹配度分析：
- MBTI特征匹配：[从MBTI角度分析为什么合适]
- 性格标签匹配：[从性格特征分析为什么合适]
- 场景适配性：[具体使用场景描述]
- 关系考量：[从关系角度分析合适程度]

提案3：[礼物/偏好名称]

匹配度分析：
- MBTI特征匹配：[从MBTI角度分析为什么合适]
- 性格标签匹配：[从性格特征分析为什么合适]
- 场景适配性：[具体使用场景描述]
- 关系考量：[从关系角度分析合适程度]

2、整体建议

1. 选择策略：
   - 最佳选择：[分析哪个提案最合适]
   - 备选方案：[其他提案的使用场景]
   - 注意事项：[选择和赠送时的注意点]

2. 时机建议：
   - 最佳时机：[什么时候送最合适]
   - 场景选择：[在什么场合送最合适]
   - 表达方式：[如何表达能让对方最受用]

▎格式要求
- 每点之前空行分隔
- 不使用markdown格式`
            };

            // 构建消息历史
            const messages = [
                {
                    role: 'system',
                    content: `${CHAT_PROMPTS[channel]}

▌系统指令
在回复前，你必须：
1. 读取并分析用户的个人画像信息：
   - 性格特征和社交倾向
   - 语言习惯和表达风格
   - 社交风格和处事方式

2. 结合联系人信息：
   - MBTI类型特征
   - 个性标签和行为模式
   - 双方关系定位

3. 根据分析结果：
   - 采用符合用户习惯的表达方式
   - 考虑联系人的接受偏好
   - 平衡双方的关系定位

4. 严格遵守输出格式：
   - 每句话必须单独成行
   - 每个段落之间空一行
   - 不使用任何markdown格式

▌联系人信息
姓名：${currentContact.name}
MBTI：${currentContact.mbti || '未设置'}
性别：${getGenderText(currentContact.gender)}
年龄：${getAge(currentContact.birthday) || '未设置'}
关系：${currentContact.relationship || '未设置'}
个性标签：${currentContact.tags ? currentContact.tags.join('、') : '无'}`
                }
            ];

            // 添加历史消息记录
            messageHistory.forEach(msg => {
                messages.push({
                    role: msg.isUser ? 'user' : 'assistant',
                    content: msg.content
                });
            });

            // 添加当前用户消息
            messages.push({
                role: 'user',
                content: userMessage
            });

            console.log('发送请求数据:', JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                stream: false
            }, null, 2));

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API错误响应:', errorData);
                throw new Error(errorData.error || '请求失败');
            }

            const data = await response.json();
            console.log('API响应数据:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式错误');
            }

            const aiResponse = data.choices[0].message.content;

            // 保存消息到历史记录
            messageHistory.push({ isUser: true, content: userMessage });
            messageHistory.push({ isUser: false, content: aiResponse });

            // 如果历史记录过长，保留最近的20条消息
            if (messageHistory.length > 20) {
                messageHistory = messageHistory.slice(-20);
            }

            return aiResponse;
        } catch (error) {
            console.error('AI响应错误:', error);
            throw new Error(`获取AI响应失败: ${error.message}`);
        }
    }

    // 修改发送消息的逻辑
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            try {
                console.log('开始发送消息...');
                
                // 显示用户消息
                addUserMessage(message);
                messageInput.value = '';
                
                // 显示加载状态
                const loadingMessage = document.createElement('div');
                loadingMessage.className = 'message ai-message';
                loadingMessage.textContent = 'AI思考中...';
                chatMessages.appendChild(loadingMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // 获取AI回复
                const aiResponse = await getAIResponse(currentChannel, message);
                
                // 移除加载状态并显示AI回复
                chatMessages.removeChild(loadingMessage);
                addAIMessage(aiResponse);

                // 保存聊天记录
                saveChatHistory();
                
                console.log('消息发送成功');
            } catch (error) {
                console.error('发送消息失败:', error);
                alert('发送消息失败: ' + error.message);
                // 移除加载状态
                const loadingMessage = document.querySelector('.ai-message:last-child');
                if (loadingMessage && loadingMessage.textContent === 'AI思考中...') {
                    chatMessages.removeChild(loadingMessage);
                }
                addAIMessage('抱歉，发生错误：' + error.message);
            }
        }
    }

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addAIMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        
        // 只有非引导语消息才添加反馈按钮
        if (!message.includes('输入对话诉求') && !message.includes('输入聊天记录') && !message.includes('输入你的需求')) {
            addFeedbackButtons(messageElement);
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getChannelWelcomeMessage(channel) {
        const welcomeMessages = {
            'how-to': `不知道如何沟通？输入对话诉求，AI分析你和TA的沟通风格，推荐最佳应对策略！`,
            'analyze': `想读懂ta的意思？输入聊天记录，AI帮你揭示真实意图和潜在情绪！`,
            'preferences': `想精准投其所好？输入你的需求，让AI挖掘TA的偏好！`
        };
        return welcomeMessages[channel] || '有什么我可以帮您的吗？';
    }

    // 添加反馈按钮相关代码
    function addFeedbackButtons(messageElement) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-buttons';
        feedbackDiv.innerHTML = `
            <button class="feedback-btn satisfied">满意</button>
            <button class="feedback-btn unsatisfied">不满意</button>
        `;
        
        messageElement.appendChild(feedbackDiv);
        
        // 满意按钮点击事件
        feedbackDiv.querySelector('.satisfied').addEventListener('click', function() {
            this.classList.add('selected');
            feedbackDiv.style.display = 'none';
            // 可以在这里添加其他满意后的操作
        });
        
        // 不满意按钮点击事件
        feedbackDiv.querySelector('.unsatisfied').addEventListener('click', async function() {
            const userMessage = messageHistory[messageHistory.length - 2].content;
            // 重新生成回复
            const aiResponse = await getAIResponse(currentChannel, userMessage);
            // 更新最后一条AI消息
            messageHistory.pop();
            messageHistory.push({ isUser: false, content: aiResponse });
            // 更新显示
            messageElement.textContent = aiResponse;
            // 重新添加反馈按钮
            addFeedbackButtons(messageElement);
        });
    }

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
    .feedback-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 8px;
    }

    .feedback-btn {
        padding: 4px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.3s;
    }

    .feedback-btn:hover {
        background: #f5f5f5;
    }

    .feedback-btn.satisfied {
        color: #52c41a;
        border-color: #52c41a;
    }

    .feedback-btn.unsatisfied {
        color: #ff4d4f;
        border-color: #ff4d4f;
    }

    .feedback-btn.selected {
        background: #f6ffed;
    }
    `;

    document.head.appendChild(style);

    // 初始化页面
    loadContact();
    loadChatHistory();

    // 添加清除聊天记录按钮的事件监听
    document.querySelector('.clear-chat-btn').addEventListener('click', clearChatHistory);

    // 消息输入框回车发送
    messageInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    // 发送按钮点击发送
    document.querySelector('.send-btn').addEventListener('click', async () => {
        await sendMessage();
    });

    // 文件上传事件
    document.querySelector('#image-upload').addEventListener('change', e => handleFileUpload(e, 'image'));
    
    // 生成标签按钮点击事件
    generateBtn.addEventListener('click', generateAITags);

    // 添加关闭按钮事件监听
    document.querySelector('.modal-close').addEventListener('click', () => {
        tagModal.classList.remove('active');
        // 清空输入和选中状态
        const tagInput = document.querySelector('.tag-input');
        const generatedTags = document.querySelector('.generated-tags');
        const manualTagsContainer = document.querySelector('.manual-tags-container');
        const imageFiles = document.getElementById('image-files');
        
        if (tagInput) tagInput.value = '';
        if (generatedTags) generatedTags.innerHTML = '';
        if (manualTagsContainer) manualTagsContainer.innerHTML = '';
        if (imageFiles) imageFiles.innerHTML = '';
    });
}); 