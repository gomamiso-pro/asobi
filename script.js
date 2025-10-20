let pageCount = 0;
let pages = [];

const sectionOptions = {
  header: ["ロゴ","検索ボックス","通知アイコン","言語切替","ログインボタン"],
  menu: ["カテゴリメニュー","ドロップダウン","パンくずリスト","サイドメニュー"],
  body: ["カルーセル","新着商品一覧","特集バナー","記事リスト","フォーム"],
  footer: ["会社情報","SNSリンク","コピーライト","フッターメニュー"]
};

// ---------------- ページ操作 ----------------
function addPage() {
  pageCount++;
  pages.push({
    pageName: `ページ${pageCount}`,
    pagePurpose: "",
    header: [],
    menu: [],
    body: [],
    footer: []
  });
  renderPages();
}

function renderPages() {
  const container = document.getElementById("pageContainer");
  container.innerHTML = "";
  pages.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "page-card";
    card.innerHTML = `
      <h3>ページ${i+1} <button class="delete-btn" onclick="deletePage(${i})">削除</button></h3>
      <label>ページ名</label>
      <input type="text" value="${p.pageName}" oninput="pages[${i}].pageName=this.value">
      <label>ページの目的</label>
      <textarea oninput="pages[${i}].pagePurpose=this.value">${p.pagePurpose}</textarea>
      ${createSectionCheckboxes("ヘッダー", `header${i}`, sectionOptions.header, i)}
      ${createSectionCheckboxes("メニュー", `menu${i}`, sectionOptions.menu, i)}
      ${createSectionCheckboxes("ボディ", `body${i}`, sectionOptions.body, i)}
      ${createSectionCheckboxes("フッター", `footer${i}`, sectionOptions.footer, i)}
    `;
    container.appendChild(card);
  });
}

function createSectionCheckboxes(title, prefix, opts, pageIndex) {
  let html = `<div class="section-title">${title}</div>`;
  opts.forEach((opt, idx) => {
    const checked = pages[pageIndex][title.toLowerCase()]?.includes(opt) ? "checked" : "";
    html += `<label><input type="checkbox" ${checked} onchange="updateSection(${pageIndex}, '${title.toLowerCase()}', '${opt}', this.checked)">${opt}</label>`;
  });
  return html;
}

function updateSection(pageIndex, section, value, checked) {
  const arr = pages[pageIndex][section];
  if(checked) {
    if(!arr.includes(value)) arr.push(value);
  } else {
    const idx = arr.indexOf(value);
    if(idx>=0) arr.splice(idx,1);
  }
}

function deletePage(index) {
  pages.splice(index, 1);
  renderPages();
}

function clearAllPages() {
  if(confirm("全ページを削除しますか？")) {
    pages = [];
    pageCount = 0;
    renderPages();
  }
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
  if(pages.length>0){
    pageSummary = pages.map(p=>{
      const sections = [].concat(
        p.header.map(x=>"ヘッダー:"+x),
        p.menu.map(x=>"メニュー:"+x),
        p.body.map(x=>"ボディ:"+x),
        p.footer.map(x=>"フッター:"+x)
      ).join(", ");
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

// ---------------- HTMLプレビュー ----------------
function renderHtmlPreview() {
  const code = document.getElementById("aiHtmlInput").value;
  document.getElementById("htmlPreview").srcdoc = code;
}

function clearHtmlPreview() {
  document.getElementById("aiHtmlInput").value="";
  document.getElementById("htmlPreview").srcdoc="";
}
