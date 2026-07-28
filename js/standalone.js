function copyStandaloneUrl(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            if (!document.execCommand('copy')) {
                throw new Error('瀏覽器不支援自動複製');
            }
            resolve();
        } catch (error) {
            reject(error);
        } finally {
            textArea.remove();
        }
    });
}

function addStandaloneShareButton(contentArea) {
    const shareIcon = `
        <svg class="share-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a3 3 0 1 0-2.83-4A3 3 0 0 0 15 5c0 .2.02.39.06.57L8.91 9.08A3 3 0 0 0 7 8.4a3 3 0 1 0 1.91 5.52l6.15 3.51A3 3 0 0 0 15 18a3 3 0 1 0 .83-2.07l-6.15-3.51c.04-.28.04-.56 0-.84l6.15-3.51A3 3 0 0 0 18 8Z"/>
        </svg>
    `;
    const copiedIcon = `
        <svg class="share-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9.2 16.2-4.4-4.4-1.6 1.6 6 6L21 7.6 19.4 6Z"/>
        </svg>
    `;
    const shareBar = document.createElement('div');
    shareBar.className = 'share-tool-bar';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn share-tool-button';
    button.innerHTML = shareIcon;
    button.setAttribute('aria-label', '複製此功能網址');
    button.title = '複製此功能網址';

    const standaloneUrl = new URL('index.html', window.location.href).href;
    button.dataset.shareUrl = standaloneUrl;
    button.addEventListener('click', async () => {
        try {
            await copyStandaloneUrl(standaloneUrl);
            button.innerHTML = copiedIcon;
            button.setAttribute('aria-label', '已複製網址');
            button.title = '已複製網址';
            button.classList.add('is-copied');
        } catch (error) {
            window.prompt('請複製以下網址：', standaloneUrl);
        }

        window.setTimeout(() => {
            button.innerHTML = shareIcon;
            button.setAttribute('aria-label', '複製此功能網址');
            button.title = '複製此功能網址';
            button.classList.remove('is-copied');
        }, 2000);
    });

    shareBar.appendChild(button);
    contentArea.prepend(shareBar);
}

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
        addStandaloneShareButton(contentArea);

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
