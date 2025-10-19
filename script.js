/* ---------------- ページ管理 ---------------- */
let pageCount = 0;

function addPage() {
    pageCount++;
    const div = document.createElement('div');
    div.className = 'page-block';
    div.id = 'page_' + pageCount;
    div.innerHTML = `
        <label>ページ名：</label>
        <input type="text" placeholder="例: トップページ">
        <label>目的・内容：</label>
        <textarea rows="2" placeholder="ページ内容を簡単に"></textarea>
        <button onclick="removePage('${div.id}')">ページ削除</button>
        <hr>
    `;
    document.getElementById('pageContainer').appendChild(div);
}

function removePage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function clearAllPages() {
    document.getElementById('pageContainer').innerHTML = '';
    pageCount = 0;
}

/* ---------------- AI指示文生成 ---------------- */
function generateInstructions() {
    const overview = document.getElementById('projectOverviewInput').value || '未入力';
    const instructions = `ここにヒアリング情報を基にしたAI指示文が表示されます。\n\n■ 概要:\n${overview}\n\n■ 作業内容:\n1. ページ構成の設計\n2. 機能一覧の整理\n3. データベース・テーブル定義\n4. 画面遷移設計\n5. デザイン指示\n\n■ 注意点:\n- 分かりやすく簡潔に\n- Markdown形式で表記\n- コード例を添付`;
    document.getElementById('aiInstructions').value = instructions;
}

function copyInstructions() {
    const t = document.getElementById('aiInstructions');
    t.select();
    navigator.clipboard.writeText(t.value);
    alert('コピーしました');
}

function downloadInstructions() {
    const t = document.getElementById('aiInstructions').value;
    const blob = new Blob([t], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ai_instructions.txt';
    a.click();
}

/* ---------------- 設計書描画 ---------------- */
function renderDesignDocs() {
    const raw = document.getElementById('aiCodeInput')?.value.trim();
    if (!raw) {
        alert('AI生成設計書を貼付けてください');
        return;
    }

    const markers = { func: ['機能一覧'], table: ['テーブル定義'], trans: ['画面遷移'] };
    let funcPart = '', tablePart = '', transPart = '';
    let current = 'other';

    raw.split(/\r?\n/).forEach(line => {
        const l = line.trim();
        if (!l) return;
        if (markers.func.some(m => l.includes(m))) { current = 'func'; return; }
        if (markers.table.some(m => l.includes(m))) { current = 'table'; return; }
        if (markers.trans.some(m => l.includes(m))) { current = 'trans'; return; }

        if (current === 'func') funcPart += line + '\n';
        if (current === 'table') tablePart += line + '\n';
        if (current === 'trans') transPart += line + '\n';
    });

    const toHtml = txt => txt.trim().startsWith('|') ? convertMarkdownTableToHtml(txt) : `<pre>${escapeHtml(txt)}</pre>`;

    let html = '';
    html += `<h3>機能一覧</h3>${toHtml(funcPart)}`;
    html += `<h3>テーブル定義書</h3>${toHtml(tablePart)}`;

    if (transPart.trim().startsWith('graph')) {
        html += `<h3>画面遷移図</h3><pre class="mermaid">${transPart.trim()}</pre>`;
        if (typeof mermaid !== 'undefined') mermaid.init();
    } else {
        html += `<h3>画面遷移図</h3><pre>${escapeHtml(transPart)}</pre>`;
    }

    document.getElementById('designPreview').innerHTML = html;
}

function clearRenderedDesigns() {
    document.getElementById('designPreview').innerHTML = '';
}

/* ---------------- Markdown Table -> HTML ---------------- */
function convertMarkdownTableToHtml(markdown) {
    let html = '<table>';
    const lines = markdown.split(/\r?\n/).filter(l => l.trim().startsWith('|'));
    if (lines.length < 2) return markdown;

    const headers = lines[0].split('|').map(c => c.trim()).filter(c => c);
    html += '<thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    for (let i = 2; i < lines.length; i++) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
        if (cells.length > 0) {
            html += '<tr>';
            cells.forEach(c => html += `<td>${c}</td>`);
            html += '</tr>';
        }
    }

    html += '</tbody></table>';
    return html;
}

/* ---------------- HTMLエスケープ ---------------- */
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

/* ---------------- 見積 ---------------- */
function downloadEstimate() {
    alert('見積書ダウンロード機能は未実装です');
}

/* ---------------- ページコード生成／プレビュー ---------------- */
function generatePageCode() {
    const container = document.getElementById('pageContainer');
    const pages = container.querySelectorAll('.page-block');

    if (pages.length === 0) { alert('ページを追加してください'); return; }

    let previewHTML = '';
    pages.forEach((p, idx) => {
        const name = p.querySelector('input[type=text]').value || `ページ${idx + 1}`;
        const content = p.querySelector('textarea').value || '';
        previewHTML += `<section><h1>${name}</h1><p>${content}</p></section>\n`;
    });

    const iframe = document.getElementById('pagePreview');
    iframe.srcdoc = previewHTML;
    alert('プレビューを生成しました');
}

function downloadPageCode() {
    const container = document.getElementById('pageContainer');
    const pages = container.querySelectorAll('.page-block');
    if (pages.length === 0) { alert('ページを追加してください'); return; }

    let allCode = '';
    pages.forEach((p, idx) => {
        const name = p.querySelector('input[type=text]').value || `ページ${idx + 1}`;
        const content = p.querySelector('textarea').value || '';
        allCode += `<section><h1>${name}</h1><p>${content}</p></section>\n`;
    });

    const blob = new Blob([allCode], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pages.html';
    a.click();
}
