let pages = [];

// ---------------- ページ管理 ----------------
function addPage() {
    const pageIndex = pages.length;
    const page = {
        pageName: "新規ページ" + (pageIndex + 1),
        pagePurpose: "",
        header: [],
        menu: [],
        body: [],
        footer: []
    };
    pages.push(page);
    renderPages();
}

function clearAllPages() {
    if(confirm("すべてのページを削除しますか？")) {
        pages=[];
        renderPages();
    }
}

function renderPages() {
    const container = document.getElementById("pageContainer");
    container.innerHTML = "";
    pages.forEach((p,i)=>{
        const div = document.createElement("div");
        div.className = "page-card";
        div.innerHTML = `
            <input type="text" value="${p.pageName}" placeholder="ページ名" oninput="pages[${i}].pageName=this.value">
            <input type="text" value="${p.pagePurpose}" placeholder="ページ目的" oninput="pages[${i}].pagePurpose=this.value">
            <button class="delete-btn" onclick="pages.splice(${i},1); renderPages();">削除</button>
        `;
        container.appendChild(div);
    });
}

// ---------------- 見積書 ----------------
function downloadEstimate() {
    let text = "見積書\n\n";
    text += "※ここに計算ロジック追加可\n";
    const blob = new Blob([text], {type:"text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download="estimate.txt";
    a.click();
}

// ---------------- AI 指示文生成 ----------------
function generateInstructions() {
    const overview = document.getElementById("projectOverviewInput").value || "一般的なコーポレートサイト";
    const pageType = document.getElementById("pageTypeSelect").value;
    const userTarget = document.getElementById("userTargetSelect").value;
    const design = document.getElementById("designSelect").value;
    const dataReq = document.getElementById("dataRequirementInput").value || "顧客データ管理・問い合わせデータ記録";
    const operation = document.getElementById("operationInput").value || "静的コンテンツ更新・ニュース運用";
    const server = document.getElementById("serverSelect").value;
    const db = document.getElementById("databaseSelect").value;
    const framework = document.getElementById("designFrameworkSelect").value;
    const auth = document.getElementById("authSelect").value;
    const security = document.getElementById("securityInput").value || "SSL/TLS暗号化・定期バックアップ";
    const langs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).join(", ") || "HTML, CSS, JS";

    let pageSummary = '', pageListForCode = [];
    if (pages.length>0) {
        pageSummary = pages.map(p=>{
            const sections = [].concat(p.header.map(x=>"ヘッダー:"+x),p.menu.map(x=>"メニュー:"+x),p.body.map(x=>"ボディ:"+x),p.footer.map(x=>"フッター:"+x)).join(", ");
            pageListForCode.push(`- ページ名: ${p.pageName}\n  - 構成: ${sections||"構成未定"}`);
            return `- ${p.pageName}（目的:${p.pagePurpose}） → ${sections||"構成未定"}`;
        }).join("\n");
    } else {
        pageSummary="ページ設定未作成。コーポレートサイト標準構成を自動で作成してください。";
        pageListForCode.push("トップ/企業情報/サービス/ニュース/お問い合わせ");
    }

    const instruct = `
あなたはWebサイト設計の専門家です。以下内容に従い、毎回同じテンプレートで設計書Markdown（機能一覧/テーブル定義/画面遷移図）を作成してください。
出力内容:
1. Markdown形式設計書
2. そのMarkdownからHTML設計書（Bootstrap＋Mermaidで描画、プレビュー可能）
3. ページ単位HTML（1ページ1ファイル、全ページプレビュー可能）
4. ページ一覧:
${pageListForCode.join("\n")}

【プロジェクト設定】
- 概要: ${overview}
- ページ分類: ${pageType}
- ユーザー層: ${userTarget}
- デザイン: ${design}
- 使用言語: ${langs}
- サーバー: ${server}
- DB: ${db}
- フレームワーク: ${framework}
- 認証: ${auth}
- データ要件: ${dataReq}
- 運用: ${operation}
- セキュリティ: ${security}

【ページ構成】
${pageSummary}

指示文は常に同じテンプレートを維持し、毎回ブレない形で生成してください。
    `;
    document.getElementById("aiInstructions").value = instruct;
}

function copyInstructions() {
    const area = document.getElementById("aiInstructions");
    area.select();
    document.execCommand("copy");
    alert("コピーしました！");
}

function downloadInstructions() {
    const text = document.getElementById("aiInstructions").value;
    const blob = new Blob([text], {type:"text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download="ai_instructions.txt";
    a.click();
}

// ---------------- HTMLプレビュー ----------------
function renderHtmlPreview() {
    const code = document.getElementById("aiHtmlInput").value;
    const iframe = document.getElementById("htmlPreview");
    iframe.srcdoc = code;
}

function clearHtmlPreview() {
    document.getElementById("aiHtmlInput").value="";
    document.getElementById("htmlPreview").srcdoc="";
}

// ---------------- ページHTML生成 ----------------
function generatePageCode() {
    if(pages.length===0) { alert("ページがありません"); return; }
    const iframe = document.getElementById("pagePreview");
    const firstPage = pages[0];
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${firstPage.pageName}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>${firstPage.pageName}</h1>
<p>目的: ${firstPage.pagePurpose}</p>
</body>
</html>`;
    iframe.srcdoc = html;
}

// ---------------- ページコードダウンロード ----------------
function downloadPageCode() {
    if(pages.length===0) { alert("ページがありません"); return; }
    pages.forEach((p,i)=>{
        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.pageName}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>${p.pageName}</h1>
<p>目的: ${p.pagePurpose}</p>
</body>
</html>`;
        const blob = new Blob([html], {type:"text/html"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${p.pageName}.html`;
        a.click();
    });
}

// ---------------- 設計書Markdown描画 ----------------
function renderDesignDocs() {
    const md = document.getElementById("aiCodeInput").value;
    if(!md) return;
    const funcDiv = document.getElementById("generateFunctionList");
    const tableDiv = document.getElementById("generateTableDefinition");
    const diagramDiv = document.getElementById("generateTransitionDiagram");

    // 簡易分割（--- で区切り想定）
    const parts = md.split(/-{3,}/);
    funcDiv.innerHTML = parts[0]||"";
    tableDiv.innerHTML = parts[1]||"";
    diagramDiv.innerHTML = parts[2]||"";

    mermaid.init(undefined, diagramDiv);
}

function clearRenderedDesigns() {
    document.getElementById("aiCodeInput").value="";
    document.getElementById("generateFunctionList").innerHTML="";
    document.getElementById("generateTableDefinition").innerHTML="";
    document.getElementById("generateTransitionDiagram").innerHTML="";
}
