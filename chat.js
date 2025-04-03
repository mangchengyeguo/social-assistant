document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const contactsGrid = document.querySelector('.contacts-grid');
    const alphabetNav = document.querySelector('.alphabet-nav');
    const addContactBtn = document.querySelector('.add-contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const cancelBtn = document.querySelector('.cancel-btn');

    // 从本地存储加载联系人数据
    let contacts = JSON.parse(localStorage.getItem('contacts')) || [];

    // 初始化字母导航
    function initAlphabetNav() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        alphabetNav.innerHTML = letters.map(letter => 
            `<a href="#${letter}" class="letter-link" data-letter="${letter}">${letter}</a>`
        ).join('');

        // 添加字母导航点击事件
        alphabetNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('letter-link')) {
                e.preventDefault();
                const letter = e.target.dataset.letter;
                const targetCard = document.querySelector(`[data-initial="${letter}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // 获取拼音首字母
    function getInitial(name) {
        if (!name || typeof name !== 'string') {
            return '#';
        }
        // 这里使用一个简单的实现，实际项目中应该使用专门的拼音库
        const firstChar = name.charAt(0).toUpperCase();
        return /[A-Z]/.test(firstChar) ? firstChar : '#';
    }

    // 清理存储空间
    function cleanupStorage() {
        try {
            // 获取所有联系人
            const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
            
            // 如果联系人数量超过50个，删除最早的联系人
            if (contacts.length > 50) {
                contacts.splice(0, contacts.length - 50);
                localStorage.setItem('contacts', JSON.stringify(contacts));
            }
            
            // 清理其他不需要的数据
            for (let key in localStorage) {
                if (key.startsWith('chat_history_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.error('清理存储空间失败:', error);
        }
    }

    // 渲染联系人列表
    function renderContacts() {
        // 按拼音排序
        contacts.sort((a, b) => {
            return a.name.localeCompare(b.name, 'zh-CN');
        });

        // 渲染联系人卡片
        contactsGrid.innerHTML = '';
        
        // 创建卡片容器
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        
        // 渲染联系人卡片
        contacts.forEach(contact => {
            const card = document.createElement('div');
            card.className = 'contact-card';
            card.dataset.id = contact.id;
            card.innerHTML = `
                <img src="${contact.avatar || avatarPreview.src}" alt="${contact.name}" class="contact-avatar">
                <h3 class="contact-name" title="${contact.name}">${contact.name}</h3>
                <div class="contact-info">
                    <div>${contact.relationship || ''}</div>
                    ${contact.mbti ? `<div>${contact.mbti}</div>` : ''}
                </div>
                <button class="delete-btn" data-id="${contact.id}">×</button>
            `;
            cardsContainer.appendChild(card);
        });
        
        contactsGrid.appendChild(cardsContainer);

        // 添加点击事件
        document.querySelectorAll('.contact-card').forEach(card => {
            // 为卡片添加点击事件（跳转到详情页）
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {  // 如果点击的不是删除按钮
                    const contactId = card.dataset.id;
                    const contact = contacts.find(c => c.id === contactId);
                    
                    if (!contact) {
                        alert('未找到联系人信息');
                        return;
                    }
                    
                    try {
                        localStorage.setItem('contacts', JSON.stringify(contacts));
                        window.location.href = `contact-detail.html?id=${contactId}`;
                    } catch (error) {
                        console.error('保存联系人数据失败:', error);
                        alert('跳转失败，请重试');
                    }
                }
            });

            // 为删除按钮添加点击事件
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const confirmDelete = confirm('确定要删除这个联系人吗？');
                if (confirmDelete) {
                    const contactId = deleteBtn.dataset.id;
                    const contactIndex = contacts.findIndex(c => c.id === contactId);
                    if (contactIndex !== -1) {
                        contacts.splice(contactIndex, 1);
                        localStorage.setItem('contacts', JSON.stringify(contacts));
                        renderContacts();
                    }
                }
            });
        });
    }

    // 显示模态框
    addContactBtn.addEventListener('click', () => {
        contactModal.classList.add('active');
        contactForm.reset();
        avatarPreview.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNFOUVDRUYiLz48cGF0aCBkPSJNMjUgMjVDMjguNSAyNSAzMS41IDIyIDMxLjUgMThTMjguNSAxMSAyNSAxMVMyMC41IDE0IDIwLjUgMThTMjEuNSAyNSAyNVpNMzUgMzZDMzUgMzIgMzAgMjggMjUgMjhTMTUgMzIgMTUgMzZWMzhINDVWMzZaIiBmaWxsPSIjQkJCIi8+PC9zdmc+';
    });

    // 隐藏模态框
    cancelBtn.addEventListener('click', () => {
        contactModal.classList.remove('active');
    });

    // 头像上传预览
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 表单提交处理
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('表单提交事件触发');
        
        // 验证必填字段
        const name = contactForm.name.value.trim();
        if (!name) {
            alert('请输入联系人昵称');
            return;
        }

        try {
            // 清理存储空间
            cleanupStorage();
            
            console.log('开始保存联系人数据');
            const contactData = {
                id: Date.now().toString(),
                name: name,
                mbti: contactForm.mbti.value,
                birthday: contactForm.birthday.value,
                gender: contactForm.querySelector('input[name="gender"]:checked')?.value || '',
                relationship: contactForm.relationship.value.trim(),
                avatar: avatarPreview.src,
                tags: []
            };
            console.log('联系人数据:', contactData);

            // 添加新联系人到列表中
            contacts.push(contactData);
            console.log('当前联系人列表:', contacts);

            // 保存到localStorage
            try {
                localStorage.setItem('contacts', JSON.stringify(contacts));
                console.log('数据已保存到localStorage');
                
                // 重新渲染联系人列表
                renderContacts();
                
                // 关闭模态框
                contactModal.classList.remove('active');
                
                // 清空表单
                contactForm.reset();
                avatarPreview.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNFOUVDRUYiLz48cGF0aCBkPSJNMjUgMjVDMjguNSAyNSAzMS41IDIyIDMxLjUgMThTMjguNSAxMSAyNSAxMVMyMC41IDE0IDIwLjUgMThTMjEuNSAyNSAyNVpNMzUgMzZDMzUgMzIgMzAgMjggMjUgMjhTMTUgMzIgMTUgMzZWMzhINDVWMzZaIiBmaWxsPSIjQkJCIi8+PC9zdmc+';
                
                alert('联系人保存成功！');
            } catch (storageError) {
                console.error('存储空间不足，尝试清理后重新保存');
                cleanupStorage();
                localStorage.setItem('contacts', JSON.stringify(contacts));
                alert('联系人保存成功！（已清理部分历史数据）');
            }
        } catch (error) {
            console.error('保存联系人失败:', error);
            alert('保存失败，请重试');
        }
    });

    // 初始化页面
    initAlphabetNav();
    renderContacts();
}); 