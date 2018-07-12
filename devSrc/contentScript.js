import Readability from './lib/Readability';
const addEvents = () => {
    document.addEventListener('keydown', (e) => {
        if(e.shiftKey && e.keyCode == 13) {
            console.log('asdsda');
            let doc = document;
            let body = doc.body.cloneNode(true);
            let article = new Readability(doc).parse();
            console.log(article)
            doc.body = body;
        }
    });
};

window.onload = () => {
    addEvents();
};