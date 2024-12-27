console.log('内容脚本已加载');
// 优化观察器配置
const observerConfig = {
    childList: true,
    subtree: true,
    attributes: false, // 只关注DOM节点变化
    characterData: false
};
// 声明全局 observer
const observer = new MutationObserver((mutations) => {
    autoClickElement();
});

// 添加标志位
let hasClicked = false;
// 添加状态跟踪
let isSearching = false;
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
    if (hasClicked || isSearching) return;
    
    if (await isAllowedWebsite()) {
        observer.disconnect();
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
function waitForElement(timeout = 1000) {
    return new Promise((resolve) => {
        if (isSearching) {
            resolve(null);
            return;
        }
        
        isSearching = true;
        const startTime = Date.now();
        let lastCheck = 0;
        const THROTTLE_DELAY = 100; // 限制查询频率
        
        function check() {
            const now = Date.now();
            if (now - lastCheck < THROTTLE_DELAY) {
                requestAnimationFrame(check);
                return;
            }
            lastCheck = now;
            
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
                isSearching = false;
                resolve(element);
            } else if (now - startTime < timeout) {
                requestAnimationFrame(check);
            } else {
                isSearching = false;
                resolve(null);
            }
        }
        
        check();
    });
}


// 点击元素的函数// 修改 autoClickElement 函数调用 waitForElement
async function autoClickElement() {
    if (hasClicked) {
        return; // 如果已经点击过，直接返回
    }
    
    const element = await waitForElement();
    if (element) {
        hasClicked = true; // 设置标志位
        try {
            element.click();
            observer.disconnect();
        } catch (error) {
            console.error('点击失败:', error);
        }
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