document.addEventListener('DOMContentLoaded', () => {
    // AI回复功能
    const generateBtn = document.querySelector('button.generate-btn');
    const sceneType = document.querySelector('select[name="sceneType"]');
    const relationType = document.querySelector('select[name="relationship"]');
    const roleType = document.querySelector('select[name="role"]');
    const goalType = document.querySelector('select[name="goal"]');
    const situationInput = document.querySelector('textarea.situation-input');
    const responseContent = document.querySelector('.response-content');

    // 处理自定义输入
    function setupCustomInput(select) {
        if (!select) return;
        
        select.addEventListener('change', function() {
            if (this.value === 'custom') {
                const customValue = prompt('请输入自定义选项：');
                if (customValue && customValue.trim()) {
                    // 创建新选项并插入
                    const newOption = new Option(customValue, customValue);
                    const customOptionIndex = Array.from(this.options).findIndex(opt => opt.value === 'custom');
                    this.add(newOption, customOptionIndex);
                    this.value = customValue;
                } else {
                    this.value = ''; // 如果用户取消，重置为默认选项
                }
            }
        });
    }

    // 为所有下拉框设置自定义输入功能
    [sceneType, relationType, roleType, goalType].forEach(select => {
        if (select) setupCustomInput(select);
    });

    // 生成回复功能
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            // 验证所有必填字段
            const selects = [sceneType, relationType, roleType, goalType];
            const missingFields = selects.some(select => !select || !select.value);
            
            if (missingFields) {
                showMessage('请填写所有必填信息', 'error');
                return;
            }

            // 获取选中的文本
            const getSelectedText = (select) => {
                if (!select) return '';
                const selectedOption = select.options[select.selectedIndex];
                return selectedOption ? selectedOption.text : select.value;
            };

            try {
                // 更新按钮状态
                generateBtn.disabled = true;
                generateBtn.textContent = 'AI思考中...';
                generateBtn.classList.add('loading');
                
                // 清空之前的回复
                responseContent.innerHTML = '';
                responseContent.classList.add('loading');

                // 获取用户画像
                let userProfile = '暂无用户画像信息';
                try {
                    const profileResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_PROFILE}`);
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        userProfile = `
- MBTI性格：${profileData.mbti || '未知'}
- 性格特点：${profileData.traits || '未知'}
- 表达风格：${profileData.style || '未知'}
- 沟通偏好：${profileData.preferences || '未知'}`;
                    }
                } catch (error) {
                    console.error('获取用户画像失败:', error);
                }

                // 准备请求数据
                const requestData = {
                    messages: [
                        {
                            role: "system",
                            content: `你是一个专业的社交沟通顾问。请基于用户的个性特征和场景信息，生成三种不同风格的回复方案。

用户画像：
${userProfile}

场景信息：
- 场景类型：${getSelectedText(sceneType)}
- 对象关系：${getSelectedText(relationType)}
- 我的角色：${getSelectedText(roleType)}
- 核心诉求：${getSelectedText(goalType)}
- 补充说明：${situationInput?.value || '无'}

要求：
1. 生成三种不同风格的完整回复：

【温柔版】
- 体现理解与共情，多用"或许"、"可能"等缓和语气词
- 适合处理感性话题或需要建立情感连接的场合
- 语言要温暖自然，富有人情味
- 要体现用户的性格特点和沟通偏好

【中性版】
- 客观理性表达，语气平和专业
- 适合正式场合或需要保持适当距离的情况
- 用语要得体大方，不偏不倚
- 要融入用户的表达风格和专业特点

【强势版】
- 逻辑清晰，引用数据和事实
- 适合需要展示专业权威或捍卫立场的场合
- 语言要坚定有力，富有说服力
- 要结合用户的MBTI特质和领导风格

2. 格式要求：
- 每个版本都输出一段完整的对话内容，不要分点列出
- 用"【温柔版】"等标题标识不同版本
- 版本之间用换行分隔
- 每个版本的回复都要自然流畅，像真实对话一样

3. 注意事项：
- 充分融入用户的性格特点和表达习惯
- 根据场景和角色调整语气和用语
- 确保每个版本都符合用户的沟通风格
- 保持专业性的同时体现个性化
- 避免生硬或公式化的表达`
                        },
                        {
                            role: "user",
                            content: "请基于以上要求，结合用户画像生成三个版本的个性化回复方案"
                        }
                    ]
                };

                // 调用API
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '生成回复失败，请稍后重试');
                }

                const result = await response.json();
                const aiResponse = result.choices[0].message.content;

                // 显示回复
                responseContent.innerHTML = `<div class="ai-response">${aiResponse}</div>`;
                showMessage('回复生成成功！', 'success');

            } catch (error) {
                console.error('生成回复错误:', error);
                showMessage(error.message || '生成回复失败，请稍后重试', 'error');
            } finally {
                // 恢复按钮状态
                generateBtn.disabled = false;
                generateBtn.textContent = '生成回复建议';
                generateBtn.classList.remove('loading');
                responseContent.classList.remove('loading');
            }
        });
    }

    // 显示消息提示
    function showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        
        const responseArea = document.querySelector('.response-area');
        responseArea.insertBefore(messageDiv, responseContent);

        // 3秒后自动消失
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}); 