/* ====== script.js ======
   機能:
   - ページ追加/削除、ページ情報保持
   - 見積自動更新・ダウンロード（テキスト）
   - ヒアリング→AI指示文生成・コピー・ダウンロード
   - AIが生成した設計書を貼付けて描画（機能一覧／テーブル定義／画面遷移図）
   - ページ毎の簡易HTMLコード生成・プレビュー・ダウンロード（個別ファイル）
================================== */

let pageCount = 0;
let pages = [];

const sectionOptions = {
    header: ["ロゴ","検索ボックス","通知アイコン","言語切替","ログインボタン"],
    menu: ["カテゴリメニュー","ドロップダウン","パンくずリスト","サイドメニュー"],
    body: ["カルーセル","新着商品一覧","特集バナー","記事リスト","フォーム"],
    footer: ["会社情報","SNSリンク","コピーライト","フッターメニュー"]
};

/* ---------------- ページ操作 ---------------- */
function addPage() {
    pageCount++;
    const container = document.getElementById('pageContainer');
    const card = document.createElement('div');
    card.className = 'page-card';
    card.id = `pageCard${pageCount}`;
    card.innerHTML = `
        <h3>ページ${pageCount} <button class="delete-btn" onclick="deletePage(${pageCount})">削除</button></h3>
        <label>ページ名</label>
        <input type="text" id="pageName${pageCount}" placeholder="例: トップページ">
        <label>ページの目的</label>
        <textarea id="pagePurpose${pageCount}" placeholder="ページの目的"></textarea>
        ${createSectionCheckboxes("ヘッダー", `header${pageCount}`, sectionOptions.header)}
        ${createSectionCheckboxes("メニュー", `menu${pageCount}`, sectionOptions.menu)}
        ${createSectionCheckboxes("ボディ", `body${pageCount}`, sectionOptions.body)}
        ${createSectionCheckboxes("フッター", `footer${pageCount}`, sectionOptions.footer)}
    `;
    container.appendChild(card);
    const inputs = card.querySelectorAll('input, textarea');
    inputs.forEach(i => i.addEventListener('change', () => { updatePages(); updateEstimate(); }));
    updatePages();
    updateEstimate();
}

function createSectionCheckboxes(title, prefix, opts) {
    let html = `<div class="section-title">${title}</div>`;
    opts.forEach((opt, i) => {
        html += `<label><input type="checkbox" id="${prefix}_${i}" value="${opt}">${opt}</label>`;
    });
    return html;
}

function deletePage(id) {
    const el = document.getElementById(`pageCard${id}`);
    if (el) el.remove();
    updatePages();
    updateEstimate();
}

function clearAllPages(){
    document.getElementById('pageContainer').innerHTML = '';
    pageCount = 0;
    pages = [];
    updateEstimate();
}

/* ---------------- pages配列更新 ---------------- */
function updatePages() {
    pages = [];
    for (let i = 1; i <= pageCount; i++) {
        const card = document.getElementById(`pageCard${i}`);
        if (!card) continue;
        const pageName = (document.getElementById(`pageName${i}`)?.value || `ページ${i}`).trim();
        const pagePurpose = (document.getElementById(`pagePurpose${i}`)?.value || "おまかせ").trim();
        const header = Array.from(card.querySelectorAll(`[id^=header${i}_]:checked`)).map(e => e.value);
        const menu = Array.from(card.querySelectorAll(`[id^=menu${i}_]:checked`)).map(e => e.value);
        const body = Array.from(card.querySelectorAll(`[id^=body${i}_]:checked`)).map(e => e.value);
        const footer = Array.from(card.querySelectorAll(`[id^=footer${i}_]:checked`)).map(e => e.value);
        pages.push({ pageName, pagePurpose, header, menu, body, footer });
    }
}

/* ---------------- 見積 ---------------- */
function updateEstimate() {
    updatePages();
    const tbody = document.querySelector('#estimateTable tbody');
    tbody.innerHTML = '';
    let subtotal = 0;

    const basic = 50000;
    subtotal += basic;
    tbody.innerHTML += `<tr><td>基本設計</td><td>${basic.toLocaleString()}</td><td>1</td><td>${basic.toLocaleString()}</td></tr>`;

    const pageUnit = 30000;
    const pageCountReal = pages.length;
    if (pageCountReal > 0) {
        tbody.innerHTML += `<tr><td>ページ追加</td><td>${pageUnit.toLocaleString()}</td><td>${pageCountReal}</td><td>${(pageUnit * pageCountReal).toLocaleString()}</td></tr>`;
        subtotal += pageUnit * pageCountReal;
    }

    const sectionUnit = 10000;
    let sectionCount = 0;
    pages.forEach(p => {
        sectionCount += p.header.length + p.menu.length + p.body.length + p.footer.length;
    });
    if (sectionCount > 0) {
        tbody.innerHTML += `<tr><td>セクション追加</td><td>${sectionUnit.toLocaleString()}</td><td>${sectionCount}</td><td>${(sectionUnit * sectionCount).toLocaleString()}</td></tr>`;
        subtotal += sectionUnit * sectionCount;
    }

    const extra = 20000;
    subtotal += extra;
    tbody.innerHTML += `<tr><td>データ・認証・フレームワーク設定</td><td>${extra.toLocaleString()}</td><td>1</td><td>${extra.toLocaleString()}</td></tr>`;

    document.getElementById('subtotal').textContent = subtotal.toLocaleString();
    document.getElementById('total').textContent = Math.round(subtotal * 1.1).toLocaleString();
}

function downloadEstimate() {
    updateEstimate();
    const el = document.getElementById('estimateTable');
    let text = '見積書\n\n';
    const rows = el.querySelectorAll('tbody tr');
    rows.forEach(r => {
        const cells = r.querySelectorAll('td');
        text += `${cells[0].textContent}\t単価:${cells[1].textContent}\t数量:${cells[2].textContent}\t小計:${cells[3].textContent}\n`;
    });
    text += `\n合計（税抜）: ${document.getElementById('subtotal').textContent}\n合計（税込10%）: ${document.getElementById('total').textContent}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '見積書.txt';
    a.click();
}

/* ---------------- AI指示文生成 ---------------- */
function generateInstructions() {
    updatePages();
    const overview = document.getElementById("projectOverviewInput").value || "一般的なコーポレートサイト";
    const pageType = document.getElementById("pageTypeSelect").value;
    const userTarget = document.getElementById("userTargetSelect").value;
    const design = document.getElementById("designSelect").value;
    const dataReq = document.getElementById("dataRequirementInput").value || "顧客データの管理、および問い合わせデータの記録";
    const operation = document.getElementById("operationInput").value || "静的コンテンツの定期的な更新とニュース機能の運用";
    const server = document.getElementById("serverSelect").value;
    const db = document.getElementById("databaseSelect").value;
    const framework = document.getElementById("designFrameworkSelect").value;
    const auth = document.getElementById("authSelect").value;
    const security = document.getElementById("securityInput").value || "一般的なSSL/TLSによる通信暗号化、定期的なバックアップ";
    const langs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).join(", ") || "HTML, CSS, JavaScript (フロントエンド) / PHP (バックエンド)";

    let pageSummary;
    let pageListForCode = [];
    if (pages.length > 0) {
        pageSummary = pages.map(p => {
            const sections = [].concat(
                p.header.map(x => `ヘッダー:${x}`),
                p.menu.map(x => `メニュー:${x}`),
                p.body.map(x => `ボディ:${x}`),
                p.footer.map(x => `フッター:${x}`)
            ).join(", ");
            pageListForCode.push(`- ページ名: ${p.pageName}\n  - 構成: ${sections || "構成未定"}`);
            return `- ${p.pageName}（目的: ${p.pagePurpose}） → ${sections || "構成未定"}`;
        }).join("\n");
    } else {
        pageSummary = "ページ設定は未作成です。標準構成（トップ、企業情報、サービス、ニュース、お問い合わせ）を補完してください。";
        pageListForCode.push("設計書で定義した標準構成ページ（トップ、企業情報、サービス、ニュース、お問い合わせ）");
    }

    const instruct = `...`; // 前回の長いAI指示文は省略せずセットしてください
    document.getElementById('aiInstructions').value = instruct;
}

function copyInstructions() {
    const el = document.getElementById('aiInstructions');
    el.select();
    navigator.clipboard.writeText(el.value).then(() => alert('AI指示文をコピーしました！'), () => alert('コピーに失敗しました'));
}

function downloadInstructions() {
    const text = document.getElementById('aiInstructions').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'AI指示文.txt';
    a.click();
}

/* ---------------- 設計書描画 ---------------- */
function renderDesignDocs() {
    const raw = document.getElementById('aiCodeInput').value.trim();
    if (!raw) { alert('AIが生成した設計書を貼り付けてください。'); return; }

    const transContainer = document.getElementById('generateTransitionDiagram');
    if (transContainer) transContainer.innerHTML = '';

    let funcPart = '', tablePart = '', transPart = '';
    let inMermaidBlock = false;

    const markers = {
        func: ['機能一覧', 'functions', 'feature list'],
        table: ['テーブル定義', 'table definition'],
        trans: ['画面遷移', 'diagram', 'flow']
    };

    const lines = raw.split(/\r?\n/);
    let current = 'other';
    lines.forEach(line => {
        const l = line.trim();
        if (l.startsWith('```mermaid')) { inMermaidBlock = true; return; }
        if (l.startsWith('```')) { inMermaidBlock = false; return; }

        if (inMermaidBlock) { transPart += line + '\n'; return; }

        const check = (arr) => arr.some(m => line.toLowerCase().indexOf(m.toLowerCase()) !== -1);
        if (check(markers.func)) { current = 'func'; return; }
        if (check(markers.table)) { current = 'table'; return; }
        if (check(markers.trans)) { current = 'trans'; return; }

        if (current === 'func') funcPart += line + '\n';
        else if (current === 'table') tablePart += line + '\n';
        else if (current === 'trans') transPart += line + '\n';
    });

    document.getElementById('generateFunctionList').innerHTML = convertMarkdownTableToHtml(funcPart, '機能一覧');
    document.getElementById('generateTableDefinition').innerHTML = convertMarkdownTableToHtml(tablePart, 'テーブル定義書');

    let finalTransHtml = `<h3>画面遷移図</h3>`;
    const mermaidCode = transPart.trim();
    if (mermaidCode.toLowerCase().startsWith('graph') || mermaidCode.toLowerCase().startsWith('flowchart')) {
        finalTransHtml += `<div class="mermaid-container"><pre class="mermaid">${mermaidCode}</pre></div>`;
    } else { finalTransHtml += `<pre>${escapeHtml(mermaidCode || transPart)}</pre>`; }
    document.getElementById('generateTransitionDiagram').innerHTML = finalTransHtml;

    if (typeof mermaid !== 'undefined') {
        const elements = document.getElementById('generateTransitionDiagram').querySelectorAll('.mermaid');
        elements.forEach(el => el.removeAttribute('data-processed'));
        mermaid.init(undefined, elements);
    }
}

/* ---------------- Markdown Table → HTML ---------------- */
function convertMarkdownTableToHtml(markdown, mainTitle) {
    const lines = markdown.split(/\r?\n/).filter(line => line.trim());
    let html = '';
    let tableLines = [];

    const processTable = (tableLines) => {
        if (tableLines.length < 2 || !tableLines[0].trim().startsWith('|')) return '';
        let tableHtml = '<table class="table table-bordered table-sm mt-3">';
        const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(c => c);
        if (headerCells.length > 0) {
            tableHtml += '<thead><tr>';
            headerCells.forEach(cell => tableHtml += `<th scope="col">${cell.replace(/\*\*/g, '').trim()}</th>`);
            tableHtml += '</tr></thead><tbody>';
        }
        for (let i = 2; i < tableLines.length; i++) {
            const bodyCells = tableLines[i].split('|').map(c => c.trim()).filter(c => c);
            if (bodyCells.length > 0) {
                tableHtml += '<tr>';
                bodyCells.forEach(cell => tableHtml += `<td>${cell.replace(/\*\*/g, '<strong>').replace(/`/g, '<code>')}</td>`);
                tableHtml += '</tr>';
            }
        }
        tableHtml += '</tbody></table>';
        return tableHtml;
    };

    html += `<h3>${mainTitle}</h3>`;
    for (const line of lines) {
        const l = line.trim();
        if (l.startsWith('####')) { html += processTable(tableLines); tableLines = []; html += `<h4>${l.replace('####', '').trim()}</h4>`; }
        else if (l.startsWith('|')) { tableLines.push(line); }
        else if (l.toLowerCase().startsWith('create table')) { html += processTable(tableLines); tableLines = []; html += `<div class="sql-code"><pre><code>${escapeHtml(l)}</code></pre></div>`; }
    }
    html += processTable(tableLines);
    return html;
}

/* ---------------- 補助関数 ---------------- */
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function clearRenderedDesigns() {
    document.getElementById('aiCodeInput').value = '';
    document.getElementById('generateFunctionList').innerHTML = '';
    document.getElementById('generateTableDefinition').innerHTML = '';
    document.getElementById('generateTransitionDiagram').innerHTML = '';
    alert('描画内容をクリアしました。');
}

/* ---------------- HTML生成・プレビュー ---------------- */
function buildSinglePageHtml(pageObj) {
    const css = `
        body{ font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif; padding:20px; line-height:1.6; }
        header, nav, main, footer{ padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e6e6e6; background:#fff; }
        header{ background:linear-gradient(145deg,#82b1ff,#64b5f6); color:#fff; }
        nav{ background:#f7fbff; }
        .section-title{ font-weight:700; color:#1976d2; margin-bottom:6px; }
    `;
    const makeList = (arr) => arr && arr.length ? `<ul>${arr.map(a => `<li>${a}</li>`).join('')}</ul>` : '<p>なし</p>';
    return `
    <!doctype html>
    <html lang="ja">
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>${escapeHtml(pageObj.pageName)}</title>
        <style>${css}</style>
    </head>
    <body>
        <header>
            <h1>${escapeHtml(pageObj.pageName)}</h1>
            <p>${escapeHtml(pageObj.pagePurpose)}</p>
        </header>

        <nav>
            <div class="section-title">ヘッダー</div>
            ${makeList(pageObj.header)}
            <div class="section-title">メニュー</div>
            ${makeList(pageObj.menu)}
        </nav>

        <main>
            <div class="section-title">ボディ構成</div>
            ${makeList(pageObj.body)}
        </main>

        <footer>
            <div class="section-title">フッター</div>
            ${makeList(pageObj.footer)}
        </footer>
    </body>
    </html>
    `;
}

function generateAllPagePreviews() {
    updatePages();
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';
    pages.forEach((p, idx) => {
        const htmlContent = buildSinglePageHtml(p);
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.innerHTML = `
            <h3>${p.pageName} プレビュー</h3>
            <iframe srcdoc="${htmlContent.replace(/"/g, '&quot;')}" width="100%" height="400px"></iframe>
            <button onclick="downloadPageHtml(${idx})">HTMLをダウンロード</button>
        `;
        container.appendChild(card);
    });
}

function downloadPageHtml(idx) {
    const pageObj = pages[idx];
    if (!pageObj) return;
    const htmlContent = buildSinglePageHtml(pageObj);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${pageObj.pageName}.html`;
    a.click();
}

/* ---------------- 初期化 ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addPageBtn')?.addEventListener('click', addPage);
    document.getElementById('clearAllPagesBtn')?.addEventListener('click', clearAllPages);
    document.getElementById('updateEstimateBtn')?.addEventListener('click', updateEstimate);
    document.getElementById('downloadEstimateBtn')?.addEventListener('click', downloadEstimate);
    document.getElementById('generateInstructionsBtn')?.addEventListener('click', generateInstructions);
    document.getElementById('copyInstructionsBtn')?.addEventListener('click', copyInstructions);
    document.getElementById('downloadInstructionsBtn')?.addEventListener('click', downloadInstructions);
    document.getElementById('renderDesignDocsBtn')?.addEventListener('click', renderDesignDocs);
    document.getElementById('clearRenderedDesignsBtn')?.addEventListener('click', clearRenderedDesigns);
    document.getElementById('generatePagePreviewBtn')?.addEventListener('click', generateAllPagePreviews);
});
