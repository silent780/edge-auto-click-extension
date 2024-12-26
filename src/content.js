console.log('内容脚本已加载');

// 声明全局 observer
const observer = new MutationObserver((mutations) => {
    autoClickElement();
});
// 检查当前网站是否在允许列表中
async function isAllowedWebsite() {
    const currentHost = window.location.hostname;
    console.log('当前网站:', currentHost);

    try {
        const result = await chrome.storage.local.get('allowedSites');
        const allowedSites = result.allowedSites || [];
        console.log('允许的网站列表:', allowedSites);
        return allowedSites.some(site => currentHost.includes(site));
    } catch (error) {
        console.error('读取允许的网站列表失败:', error);
        return false;
    }
}


// 检查并执行自动点击
async function checkAndAutoClick() {
    if (await isAllowedWebsite()) {
        autoClickElement();
    } else {
        console.log('当前网站未在允许列表中');
    }
}
function waitForElement(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let attempts = 0; // 添加计数器
        const maxAttempts = 2; // 最大尝试次数
        
        const checkElement = () => {
            attempts++; // 增加计数
            console.log(`第 ${attempts} 次尝试查找按钮`);
            
            const elements = document.querySelectorAll('button.swal2-confirm.swal2-styled');
            const targetButton = Array.from(elements).find(button => {
                console.log('检查按钮:', button.outerHTML);
                return (
                    button.classList.contains('swal2-confirm') && 
                    button.classList.contains('swal2-styled') &&
                    button.getAttribute('type') === 'button' &&
                    (button.innerText === 'OK' ||
                     button.innerText === '确定' || 
                     button.innerText === '确认')
                );
            });

            if (targetButton) {
                console.log('找到目标确认按钮:', targetButton.outerHTML);
                resolve(targetButton);
            } else if (attempts >= maxAttempts) {
                console.error(`已尝试 ${attempts} 次，停止查找`);
                observer.disconnect(); // 停止观察
                reject(new Error('达到最大尝试次数'));
            } else if (Date.now() - startTime >= timeout) {
                console.error('等待超时，未找到确认按钮');
                observer.disconnect(); // 停止观察
                reject(new Error('元素查找超时'));
            } else {
                setTimeout(checkElement, 500);
            }
        };

        checkElement();
    });
}

// 点击元素的函数
async function autoClickElement() {
    try {
        const element = await waitForElement();
        element.click();
        console.log('元素点击成功');
        observer.disconnect();
    } catch (error) {
        console.error('点击失败:', error);
    }
}

// 初始化时检查并执行
checkAndAutoClick();

// 监听来自popup的更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateXPath') {
        checkAndAutoClick();
    }
    // 添加网站列表更新的监听
    if (request.action === 'updateAllowedSites') {
        checkAndAutoClick();
    }
});

// 启动观察器
observer.observe(document.body, {
    childList: true,
    subtree: true
});