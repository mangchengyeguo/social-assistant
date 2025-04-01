document.addEventListener('DOMContentLoaded', () => {
    // 标签切换功能
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 动态加载场景数据
    function createScenarioCard(scenario) {
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.setAttribute('data-scenario', scenario.id);
        
        card.innerHTML = `
            <h3>${scenario.title}</h3>
            <p class="preview">${scenario.preview}</p>
            <div class="tags">
                ${scenario.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;

        card.addEventListener('click', () => showScenarioDetail(scenario));
        return card;
    }

    // 显示场景详情
    function showScenarioDetail(scenario) {
        const modal = document.createElement('div');
        modal.className = 'scenario-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${scenario.title}</h2>
                <div class="situation">
                    <h3>情境描述</h3>
                    <p>${scenario.situation}</p>
                </div>
                <div class="responses">
                    <h3>应对话术</h3>
                    ${Object.entries(scenario.responses).map(([type, response]) => `
                        <div class="response-type">
                            <h4>${type}</h4>
                            <p>${response}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="tips">
                    <h3>注意事项</h3>
                    <ul>
                        ${scenario.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <button class="close-modal">关闭</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    // 加载场景数据到对应区域
    const workplaceGrid = document.getElementById('workplace-scenarios');
    const relationshipGrid = document.getElementById('relationship-scenarios');
    const strangerGrid = document.getElementById('stranger-scenarios');
    const onlineGrid = document.getElementById('online-scenarios');

    // 加载职场场景
    scenarioData.workplace.forEach(scenario => {
        workplaceGrid.appendChild(createScenarioCard(scenario));
    });

    // 加载亲友关系场景
    scenarioData.relationships.forEach(scenario => {
        relationshipGrid.appendChild(createScenarioCard(scenario));
    });

    // 加载陌生人社交场景
    scenarioData.strangers.forEach(scenario => {
        strangerGrid.appendChild(createScenarioCard(scenario));
    });

    // 加载网络社交场景
    scenarioData.online.forEach(scenario => {
        onlineGrid.appendChild(createScenarioCard(scenario));
    });

    // AI回复功能
    const generateBtn = document.querySelector('button.generate-btn');
    const sceneType = document.querySelector('select[name="sceneType"]');
    const relationType = document.querySelector('select[name="relationship"]');
    const roleType = document.querySelector('select[name="role"]');
    const demandType = document.querySelector('select[name="coreNeed"]');
    const situationInput = document.querySelector('textarea.situation-input');
    const responseVersions = document.querySelectorAll('.response-version');

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
    if (sceneType) setupCustomInput(sceneType);
    if (relationType) setupCustomInput(relationType);
    if (roleType) setupCustomInput(roleType);
    if (demandType) setupCustomInput(demandType);

    // 生成回复功能
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            // 验证所有必填字段
            const selects = [sceneType, relationType, roleType, demandType];
            const missingFields = selects.some(select => !select || !select.value);
            
            if (missingFields) {
                alert('请填写所有必填信息');
                return;
            }

            // 获取选中的文本
            const getSelectedText = (select) => {
                if (!select) return '';
                const selectedOption = select.options[select.selectedIndex];
                return selectedOption ? selectedOption.text : select.value;
            };

            try {
                generateBtn.disabled = true;
                generateBtn.textContent = '生成中...';

                // 准备请求数据
                const requestData = {
                    messages: [
                        {
                            role: "system",
                            content: `你是一个专业的社交沟通顾问。基于以下场景信息，请生成3种不同风格的完整回复：
                            场景类型：${getSelectedText(sceneType)}
                            对象关系：${getSelectedText(relationType)}
                            我的角色：${getSelectedText(roleType)}
                            核心诉求：${getSelectedText(demandType)}
                            补充说明：${situationInput?.value || '无'}

                            要求：
                            1. 生成三条完整独立的回复，每条回复都要包含完整的对话内容
                            2. 三种风格分别是：
                               温柔版：多用"或许"、"可能"等缓和语气词，体现理解与共情
                               强势版：引用具体数据，使用逻辑连接词，突出专业性
                               中性版：客观陈述事实，语气平和，不带感情色彩
                            3. 每条回复都要完整表达，包含合适的开场白、具体诉求、结束语
                            4. 禁止使用markdown格式
                            5. 每条回复之间用"---"分隔
                            6. 直接输出回复内容，不要添加标题或分类`
                        },
                        {
                            role: "user",
                            content: "请生成回复方案"
                        }
                    ]
                };

                // 调用API
                const response = await fetch('http://localhost:5001/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    throw new Error('API请求失败');
                }

                const data = await response.json();
                const result = data.choices[0].message.content;

                // 解析并显示结果
                const versions = result.split('---').map(v => v.trim()).filter(v => v);
                const [gentle, strong, neutral] = versions;

                // 显示结果
                responseVersions.forEach(version => {
                    version.classList.remove('hidden');
                    const responseText = version.querySelector('.response-text');
                    if (responseText) {
                        if (version.classList.contains('gentle')) {
                            responseText.textContent = gentle || '生成失败，请重试';
                        } else if (version.classList.contains('strong')) {
                            responseText.textContent = strong || '生成失败，请重试';
                        } else if (version.classList.contains('neutral')) {
                            responseText.textContent = neutral || '生成失败，请重试';
                        }
                    }
                });

            } catch (error) {
                console.error('生成回复失败:', error);
                alert('生成回复失败，请重试');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = '生成回复建议';
            }
        });
    }
}); 