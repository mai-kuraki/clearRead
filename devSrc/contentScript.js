import Readability from './lib/Readability';
class ClearRead {
    constructor() {
        this.tpl = null;
        this.active = false;
        this.addEvents();
    }

    addReadPage() {
        if(!this.tpl) {
            let article = new Readability(document).parse();
            this.tpl = `<div class="center-area" id="clearReadCenterArea">
                            <div class="article">
                                <h1 class="title">${article.title}</h1>
                                <div class="content">${article.content}</div>
                            </div>
                        </div>`;
        }
        let div = document.createElement('div');
        div.id = 'clearRead';
        div.setAttribute('class', 'clearread-mode');
        div.innerHTML = this.tpl;
        document.body.appendChild(div);
        document.body.style.overflow = 'hidden';
        let imgs = div.getElementsByTagName('img');
        let areaWidth = document.getElementById('clearReadCenterArea').clientWidth;
        for(let i = 0; i < imgs.length; i++) {
            let width = imgs[i].naturalWidth;
            if(width) {
                let centerAreaWidth = areaWidth;
                if(width < (centerAreaWidth - 140)) {
                    imgs[i].setAttribute('class', 'img-c')
                }
            }
            imgs[i].onload = function () {
                let width = this.naturalWidth;
                let centerAreaWidth = areaWidth;
                if(width < (centerAreaWidth - 140)) {
                    this.setAttribute('class', 'img-c')
                }
            }
        }
        this.active = true;
        setTimeout(() => {
            div.setAttribute('class', 'clearread-mode clearread-mode-show');
            document.getElementById('clearReadCenterArea').setAttribute('class', 'center-area center-area-show');
        });
    }

    removeReadPage() {
        let clearRead = document.getElementById('clearRead');
        let clearReadCenterArea = document.getElementById('clearReadCenterArea');
        clearReadCenterArea.setAttribute('class', 'center-area');
        setTimeout(() => {
            clearRead.setAttribute('class', 'clearread-mode');
            setTimeout(() => {
                document.body.style.overflow = '';
                let parentNode = clearRead.parentNode;
                parentNode.removeChild(clearRead);
                this.active = false;
            }, 250);
        }, 100);
    }

    addEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.keyCode == 13) {
                console.log(this.active);
                if(!this.active) {
                    this.addReadPage();
                }
            }else if(e.keyCode == 27) {
                console.log(this.active);
                if(this.active) {
                    this.removeReadPage();
                }
            }
        });
    }
}
const clearRead = new ClearRead();