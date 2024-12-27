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
        // 确保先断开之前的监听
        observer.disconnect();
        // 重新开始监听
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
        autoClickElement();
    } else {
        console.log('当前网站未在允许列表中');
    }
}
function waitForElement(timeout = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        function check() {
            const selectors = [
                'button.swal2-confirm.swal2-styled',
                '.swal2-confirm',
                'button[class*="swal2-confirm"]'
            ];
            
            let element = null;
            for (const selector of selectors) {
                element = document.querySelector(selector);
                if (element) break;
            }

            if (element) {
                console.log('找到目标元素:', element);
                resolve(element);
            } else if (Date.now() - startTime < timeout) {
                console.log('未找到元素，继续查找...');
                requestAnimationFrame(check);
            } else {
                console.log('查找超时，未找到目标元素');
                resolve(null);
            }
        }
        
        check();
    });
}

// 点击元素的函数// 修改 autoClickElement 函数调用 waitForElement
async function autoClickElement() {
    const element = await waitForElement();
    if (element) {
        element.click();
        console.log('已执行点击操作');
        // 停止监听
        observer.disconnect();
        console.log('已停止监听DOM变化');
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