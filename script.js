/* ====== script.js (最終修正版) ======
   機能:
   - ページ追加/削除、ページ情報保持
   - 見積自動更新・ダウンロード（テキスト）
   - ヒアリング→AI指示文生成・コピー・ダウンロード
   - **実装:** AIが生成したHTML設計書を貼付けて描画 (renderHtmlPreview)
   - **実装:** 抽出した全ページコードの切り替えプレビュー (generatePageCode)
   ================================== */

let pageCount = 0;
let pages = [];
let allExtractedPages = {}; // 抽出した全ページコードを保持するマップ

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
    const langs = Array.from(document.querySelectorAll('#hearingSection input[type="checkbox"]:checked')).map(cb => cb.value).join(", ") || "HTML, CSS, JavaScript";

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
            pageListForCode.push(`- ページ名: ${p.pageName}\n  - 構成: ${sections || "構成未定"}`);
            return `- ${p.pageName}（目的: ${p.pagePurpose}） → ${sections || "構成未定"}`;
        }).join("\n");
    } else {
        // ページ設定がない場合の補完指示を強化 (デフォルトのトップページ構成を例として追加)
        const defaultPage = "- トップ（目的: 最新お知らせ） → ヘッダー:ロゴ, メニュー:パンくずリスト, ボディ:特集バナー, ボディ:記事リスト, フッター:会社情報";
        pageSummary = "ページ設定は未作成です。あなたは**コーポレートサイトの標準構成（トップページ、企業情報、サービス、ニュース一覧、お問い合わせ）**を自動で作成・定義し、設計書に反映させてください。\n\n例:\n" + defaultPage;
        pageListForCode.push("設計書で定義した全ページ（例: トップ、企業情報、サービス、ニュース、お問い合わせ）");
    }

    const instruct = `
あなたは、Webサイトの要件定義と設計に精通した**エキスパートのWebエンジニア**です。
以下のヒアリング内容に基づき、不足している情報は**一般的なWeb標準構成として適切に補完・定義**した上で、Webサイト／Webアプリの設計書（機能一覧、テーブル定義書、画面遷移図）をMarkdown形式で作成してください。

【基本設定】
- プロジェクト概要: ${overview}
- ページ分類: ${pageType}
- ユーザー層・想定デバイス: ${userTarget}
- デザイン方針: ${design}
- 使用言語: ${langs}
- サーバー: ${server}
- データベース: ${db}
- フレームワーク: ${framework}
- 認証方式: ${auth}
- データ・連携・管理要件: ${dataReq}
- 運用・更新: ${operation}
- 公開・セキュリティ・拡張性: ${security}

【ページ設定】
${pageSummary}

【出力フォーマット（必須）】
**厳密にこの形式に従って、以下の3つのセクションを続けて出力してください。**

1) **機能一覧**（分類 / 機能名 / 処理詳細 / 必要なDBテーブル名）: 
    - **必ずMarkdownテーブルとして出力してください。**

2) **テーブル定義書**: 
    - **Markdownテーブル**として出力するか、**CREATE TABLE文**のコードブロックを含めてください。
    - 複数のテーブルがある場合は、テーブルごとに見出し(例: \`#### userテーブル\`)を付けてください。

3) **画面遷移図**: 
    - **必ずMermaid形式**のコードブロック（\`\`\`mermaid... \`\`\`)として出力し、視覚的なフローチャート (\`graph TD\`) を定義してください。

【追加指示（重要）】
上記の設計書 Markdownをもとに、**1つのHTMLファイル内にすべての章（機能一覧・テーブル定義書・画面遷移図）を描画するための完全なHTMLコード**を続けて出力してください。

- HTMLはBootstrapとMermaid.jsを利用し、ブラウザ上で開くだけで全設計書をきれいに閲覧できるようにしてください。
- 各章（機能一覧／テーブル定義書／画面遷移図）はセクション見出し付きで明確に区分し、**美しいデザイン**で仕上げてください。
- 図・表・リスト・見出しのレイアウトが整った完成度の高い設計書HTMLを生成してください。

【最終出力】
1. Markdown形式の設計書（テキスト）
2. 上記内容を1ファイルにまとめたHTML設計書（ブラウザで開いて閲覧可能）
3. **設計書で定義した全ページ**について、以下の内容を含む**Markdownコードブロック**を続けて出力してください。
   - **\`page_codes.txt\`**というファイル名で、全ページのHTMLコード（CSS/JS含む）を一つのテキストファイルとして出力してください。
   - 各ページは以下のフォーマットで記述し、Bootstrapを活用したデザインにしてください。
   
   <pre>
   --- ページ開始: [ページ名] ---
   &lt;!DOCTYPE html&gt;
   &lt;html lang="ja"&gt;
   ... ページのHTML/CSS/JSコード ...
   &lt;/html&gt;
   --- ページ終了: [ページ名] ---
   </pre>
   
   **対象ページ:**
   ${pageListForCode.join("\n")}
   `.trim();

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

/* ---------------- AI生成HTMLプレビュー (実装) ---------------- */
function renderHtmlPreview() {
    const sourceCode = document.getElementById('aiHtmlInput').value;
    
    // HTML設計書のコードブロックを抽出
    // 厳密には「```html」ブロックの次にあるコードブロックだが、ここでは2番目のコードブロックと仮定して抽出
    // 確実なのは、2つ目のコードブロック（HTML設計書）と、3つ目のコードブロック（page_codes.txt）を抽出すること。
    
    const htmlMatch = sourceCode.match(/```html\n([\s\S]*?)```/i); 
    
    if (htmlMatch && htmlMatch.length > 1) {
        // 抽出したHTMLコードをiframeに表示
        document.getElementById('htmlPreview').srcdoc = htmlMatch[1];
        console.log('HTML設計書プレビューを表示しました。');
    } else {
        document.getElementById('htmlPreview').srcdoc = '<h1>AI生成HTML設計書が見つかりません。</h1><p>AIの出力全体が、`aiHtmlInput`に正しく貼り付けられているか確認してください。</p>';
        console.log('HTML設計書コードブロックが見つかりませんでした。');
    }
}

function clearHtmlPreview() {
    document.getElementById('aiHtmlInput').value = '';
    document.getElementById('htmlPreview').srcdoc = '';
    document.getElementById('pagePreview').srcdoc = '';
    document.getElementById('pageSelectorContainer').style.display = 'none'; // ページセレクターを非表示
    alert('貼り付け内容とプレビューをクリアしました。');
}


/* ---------------- ページコード抽出・プレビュー・切り替え ---------------- */

/**
 * page_codes.txt形式のテキストから全ページのHTMLコードを抽出し、マップに格納する
 */
function extractAllPages(pageCodesText) {
    const pagesMap = {};
    const regex = /--- ページ開始: (.*?)\s*---\s*([\s\S]*?)--- ページ終了: \1\s*---/g;
    let match;
    
    // 正規表現を使って全てのページブロックを抽出
    while ((match = regex.exec(pageCodesText)) !== null) {
        const pageName = match[1].trim();
        const pageHtml = match[2].trim();
        pagesMap[pageName] = pageHtml;
    }
    return pagesMap;
}

/**
 * ページコード生成ボタンの処理 (全ページ抽出と切り替えUI生成を含む)
 * @param {HTMLButtonElement} button - クリックされたボタン
 */
function generatePageCode() {
    const sourceCode = document.getElementById('aiHtmlInput').value;

    if (!sourceCode) {
        alert('AI生成コードが貼り付けられていません。');
        return;
    }

    // 'page_codes.txt' の Markdown コードブロックを抽出
    const match = sourceCode.match(/```(?:txt|text)\n([\s\S]*?page_codes\.txt[\s\S]*?)```/i);
    if (!match || match.length < 2) {
        alert('「page_codes.txt」のコードブロックが見つかりませんでした。AI出力全体を正しく貼り付けてください。');
        return;
    }

    // page_codes.txt の中身を抽出（ファイルのヘッダー行も含む）
    const pageCodesText = match[1];
    
    // 全ページを抽出し、グローバル変数に格納
    allExtractedPages = extractAllPages(pageCodesText);
    const pageNames = Object.keys(allExtractedPages);

    if (pageNames.length === 0) {
        alert('「page_codes.txt」から抽出されたページコードがありません。フォーマットが正しいか確認してください。');
        return;
    }

    // ページ切り替えUIを動的に生成
    const selectorContainer = document.getElementById('pageSelectorContainer');
    let selectElement = document.getElementById('pageSelector');
    
    // セレクトボックスのオプションを更新
    selectElement.innerHTML = '';
    pageNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selectElement.appendChild(option);
    });
    
    // コンテナを表示
    selectorContainer.style.display = 'flex';

    // 最初のページをプレビューに表示
    const firstPageName = pageNames[0];
    document.getElementById('pagePreview').srcdoc = allExtractedPages[firstPageName];
    
    alert(`全 ${pageNames.length} ページのコードを抽出し、切り替えプレビュー機能を有効にしました。`);
}

/**
 * ページ切り替えセレクトボックスのONCHANGEハンドラ
 */
function switchPagePreview(selectElement) {
    const pageName = selectElement.value;
    if (pageName && allExtractedPages[pageName]) {
        document.getElementById('pagePreview').srcdoc = allExtractedPages[pageName];
    }
}


function downloadPageCode() {
    const sourceCode = document.getElementById('aiHtmlInput').value;

    // 'page_codes.txt' の Markdown コードブロックを抽出
    const match = sourceCode.match(/```(?:txt|text)\n([\s\S]*?page_codes\.txt[\s\S]*?)```/i);
    
    if (!match || match.length < 2) {
        alert('「page_codes.txt」のコードブロックが見つかりませんでした。');
        return;
    }

    const pageCodesText = match[1];

    if (pageCodesText.trim().length === 0) {
        alert('ダウンロードするコードが空です。');
        return;
    }

    const blob = new Blob([pageCodesText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'page_codes_for_download.txt';
    a.click();
    alert('全ページコード（page_codes_for_download.txt）のダウンロードを開始しました。');
}

/* ---------------- 初期化 ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // 初期表示用のページを一つ追加 (任意)
  addPage(); 
  document.getElementById('projectOverviewInput').value = '野球';
  document.getElementById('dataRequirementInput').value = '顧客データの管理、問い合わせデータの記録';
  document.getElementById('operationInput').value = '静的コンテンツの定期的な更新とニュース機能の運用';
  document.getElementById('securityInput').value = '一般的なSSL/TLSによる通信暗号化、定期的なバックアップ';

  // 初期ページ設定の補完 (ヘッダーの選択など)
  const card = document.getElementById('pageCard1');
  if(card) {
    document.getElementById('pageName1').value = 'トップ';
    document.getElementById('pagePurpose1').value = '最新お知らせ';
    // ヘッダー:ロゴ
    document.getElementById('header1_0').checked = true;
    // メニュー:パンくずリスト
    document.getElementById('menu1_2').checked = true;
    // ボディ:特集バナー, 記事リスト
    document.getElementById('body1_2').checked = true;
    document.getElementById('body1_3').checked = true;
    // フッター:会社情報
    document.getElementById('footer1_0').checked = true;
  }

  updatePages();
  updateEstimate();
});
