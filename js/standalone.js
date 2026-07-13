document.addEventListener('DOMContentLoaded', async () => {
    const contentArea = document.getElementById('page-content');
    const pageName = document.body.dataset.page;

    if (!contentArea || !pageName) {
        return;
    }

    try {
        const response = await fetch(`${pageName}.html`);
        if (!response.ok) {
            throw new Error('頁面載入失敗');
        }

        contentArea.innerHTML = await response.text();

        const script = document.createElement('script');
        script.src = `${pageName}.js`;
        script.onerror = () => {
            contentArea.innerHTML = '<h2>發生錯誤</h2><p>工具程式載入失敗，請重新整理頁面。</p>';
        };
        document.body.appendChild(script);
    } catch (error) {
        contentArea.innerHTML = `<h2>發生錯誤</h2><p>${error.message}</p>`;
        console.error(error);
    }
});
