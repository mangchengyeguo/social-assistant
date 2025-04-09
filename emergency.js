document.addEventListener('DOMContentLoaded', () => {
    // 获取所有选项卡容器
    const tabContainers = document.querySelectorAll('.tab-container');
    const generateBtn = document.querySelector('button.generate-btn');
    const situationInput = document.querySelector('textarea.situation-input');
    const responseContent = document.querySelector('.response-content');

    // 为每个选项卡容器添加点击事件
    tabContainers.forEach(container => {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-item')) {
                // 移除同一容器中其他选项的active类
                container.querySelectorAll('.tab-item').forEach(item => {
                    item.classList.remove('active');
                });
                // 为点击的选项添加active类
                e.target.classList.add('active');

                // 处理自定义选项
                if (e.target.dataset.value === 'custom') {
                    const customValue = prompt('请输入自定义选项：');
                    if (customValue && customValue.trim()) {
                        // 创建新的选项卡
                        const newTab = document.createElement('div');
                        newTab.className = 'tab-item active';
                        newTab.dataset.value = customValue;
                        newTab.textContent = customValue;
                        // 将新选项插入到自定义选项之前
                        container.insertBefore(newTab, e.target);
                        // 移除自定义选项的active类
                        e.target.classList.remove('active');
                    } else {
                        e.target.classList.remove('active');
                    }
                }
            }
        });
    });

    // 生成回复建议
    generateBtn.addEventListener('click', async () => {
        // 获取所有选中的选项
        const sceneType = document.querySelector('.scene-type .tab-item.active')?.dataset.value;
        const relationType = document.querySelector('.relation-type .tab-item.active')?.dataset.value;
        const roleType = document.querySelector('.role-type .tab-item.active')?.dataset.value;
        const goalType = document.querySelector('.goal-type .tab-item.active')?.dataset.value;

        // 验证所有必填字段
        if (!sceneType || !relationType || !roleType || !goalType) {
            alert('请选择所有必填项');
            return;
        }

        // 获取选中选项的文本内容
        const getSelectedText = (container) => {
            return container.querySelector('.tab-item.active')?.textContent || '';
        };

        try {
            // 显示加载状态
            responseContent.innerHTML = '正在生成回复建议...';
            generateBtn.disabled = true;

            // 准备请求数据
            const requestBody = {
                model: API_CONFIG.MODEL,
                messages: [
                    {
                        role: "system",
                        content: `你是一个专业的社交沟通顾问。请基于以下场景信息，生成三种不同风格的完整回复。

场景信息：
- 场景类型：${getSelectedText(document.querySelector('.scene-type'))}
- 对象关系：${getSelectedText(document.querySelector('.relation-type'))}
- 我的角色：${getSelectedText(document.querySelector('.role-type'))}
- 核心诉求：${getSelectedText(document.querySelector('.goal-type'))}
- 补充说明：${situationInput?.value || '无'}

请直接生成三种不同风格的完整回复：
【温和版】
直接输出完整回复内容

【专业版】
直接输出完整回复内容

【圆滑版】
直接输出完整回复内容`
                    },
                    {
                        role: "user",
                        content: "请根据以上场景信息，直接生成三种风格的完整回复。"
                    }
                ],
                temperature: API_CONFIG.TEMPERATURE,
                max_tokens: API_CONFIG.MAX_TOKENS,
                stream: false
            };

            // 调用API获取回复
            const response = await fetch(API_CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + API_CONFIG.API_KEY
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API请求失败');
            }

            const result = await response.json();
            const aiResponse = result.choices[0].message.content;
            
            // 格式化并显示响应
            responseContent.innerHTML = aiResponse.replace(/\n/g, '<br>');
            generateBtn.disabled = false;

        } catch (error) {
            console.error('Error:', error);
            responseContent.innerHTML = '生成回复建议时出错，请稍后重试';
            generateBtn.disabled = false;
        }
    });
}); 