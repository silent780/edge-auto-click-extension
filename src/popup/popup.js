document.addEventListener('DOMContentLoaded', async () => {
    // 加载已保存的网站列表
    const result = await chrome.storage.local.get('allowedSites');
    const allowedSites = result.allowedSites || [];
    
    // 显示当前网站列表
    displaySites(allowedSites);
    
    // 添加新网站
    document.getElementById('addSite').addEventListener('click', async () => {
        const newSite = document.getElementById('siteInput').value;
        if (newSite) {
            allowedSites.push(newSite);
            await chrome.storage.local.set({ allowedSites });
            displaySites(allowedSites);
            // 通知内容脚本更新
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'updateAllowedSites'});
            });
        }
    });
});

function displaySites(sites) {
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';
    sites.forEach(site => {
        const div = document.createElement('div');
        div.textContent = site;
        siteList.appendChild(div);
    });
}