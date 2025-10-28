/* ====== script.js ======
   機能:
   - ページ追加/削除、ページ情報保持 (修正対象)
   - 見積自動更新・ダウンロード（テキスト）
   ...
   ================================== */

let pageCount = 0;
let pages = [];

const sectionOptions = {
  header: ["ロゴ","検索ボックス","通知アイコン","言語切替","ログインボタン"],
  menu: ["カテゴリメニュー","ドロップダウン","パンくずリスト","サイドメニュー"],
  body: ["カルーセル","新着商品一覧","特集バナー","記事リスト","フォーム"],
  footer: ["会社情報","SNSリンク","コピーライト","フッターメニュー"]
};
// --- ヒアリング内容をオブジェクト化 ---
function getHearingData() {
    return {
        projectOverview: document.getElementById('projectOverviewInput').value,
        pageType: document.getElementById('pageTypeSelect').value,
        userTarget: document.getElementById('userTargetSelect').value,
        designStyle: document.getElementById('designSelect').value,
        mainFont: document.getElementById('mainFontSelect').value,
        themeColor: document.getElementById('themeColorSelect').value,
        layout: document.getElementById('layoutPatternSelect').value,
        buttonShape: document.getElementById('buttonShapeSelect').value,
        dataRequirement: document.getElementById('dataRequirementInput').value,
        operation: document.getElementById('operationInput').value,
        server: document.getElementById('serverSelect').value,
        database: document.getElementById('databaseSelect').value,
        designFramework: document.getElementById('designFrameworkSelect').value,
        auth: document.getElementById('authSelect').value,
        security: document.getElementById('securityInput').value
    };
}

// --- ダウンロード ---
document.getElementById('downloadHearingBtn').addEventListener('click', function() {
    const data = getHearingData();
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hearing_data.txt';
    a.click();
});

// --- 取り込みボタン ---
document.getElementById('uploadHearingBtn').addEventListener('click', function() {
    document.getElementById('uploadHearingInput').click();
});

// --- ファイル選択時に読み込む ---
document.getElementById('uploadHearingInput').addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = JSON.parse(ev.target.result);

            // ヒアリングシートに反映
            if(data.projectOverview) document.getElementById('projectOverviewInput').value = data.projectOverview;
            if(data.pageType) document.getElementById('pageTypeSelect').value = data.pageType;
            if(data.userTarget) document.getElementById('userTargetSelect').value = data.userTarget;
            if(data.designStyle) document.getElementById('designSelect').value = data.designStyle;
            if(data.mainFont) document.getElementById('mainFontSelect').value = data.mainFont;
            if(data.themeColor) document.getElementById('themeColorSelect').value = data.themeColor;
            if(data.layout) document.getElementById('layoutPatternSelect').value = data.layout;
            if(data.buttonShape) document.getElementById('buttonShapeSelect').value = data.buttonShape;
            if(data.dataRequirement) document.getElementById('dataRequirementInput').value = data.dataRequirement;
            if(data.operation) document.getElementById('operationInput').value = data.operation;
            if(data.server) document.getElementById('serverSelect').value = data.server;
            if(data.database) document.getElementById('databaseSelect').value = data.database;
            if(data.designFramework) document.getElementById('designFrameworkSelect').value = data.designFramework;
            if(data.auth) document.getElementById('authSelect').value = data.auth;
            if(data.security) document.getElementById('securityInput').value = data.security;

            alert('ヒアリング内容が反映されました。');
        } catch(err) {
            alert('ファイルの形式が正しくありません。JSON形式である必要があります。');
        }
    };
    reader.readAsText(file);
});

/* ---------------- ページ操作 ---------------- */
function addPage() {
  pageCount++; // 新しい一意のIDを生成するためにインクリメント
  const container = document.getElementById('pageContainer');
  const card = document.createElement('div');
  card.className = 'page-card';
  // DOM要素のIDは一意な連番で保持する (削除対象の特定に利用)
  const cardId = `pageCard${pageCount}`;
  card.id = cardId; 
  
  // ★★★ 修正: ページ内の要素から冗長な連番IDを削除し、querySelectorで取得できるようにする ★★★
  card.innerHTML = `
    <h3>ページ ${pageCount} <button class="delete-btn" onclick="deletePage('${cardId}')">削除</button></h3>
    <label>ページ名</label>
    <input type="text" class="page-name-input" placeholder="例: トップページ">
    <label>ページの目的</label>
    <textarea class="page-purpose-input" placeholder="ページの目的"></textarea>
    ${createSectionCheckboxes("ヘッダー", `header`, sectionOptions.header)}
    ${createSectionCheckboxes("メニュー", `menu`, sectionOptions.menu)}
    ${createSectionCheckboxes("ボディ", `body`, sectionOptions.body)}
    ${createSectionCheckboxes("フッター", `footer`, sectionOptions.footer)}
  `;
  container.appendChild(card);
  
  // ★★★ 修正: ページ内のすべての入力要素（テキスト、テキストエリア、チェックボックス）に対してイベントリスナーを設定 ★★★
  const controls = card.querySelectorAll('input, textarea'); 
  controls.forEach(i => i.addEventListener('change', () => { updatePages(); updateEstimate(); }));
  // ★★★ 修正箇所 終 ★★★
  
  updatePages(); // 新しいカードを追加したのでpages配列を更新
  updateEstimate();
}

function createSectionCheckboxes(title, prefix, opts) {
  let html = `<div class="section-title">${title}</div>`;
  opts.forEach((opt, i) => {
    html += `<label><input type="checkbox" data-section="${prefix}" value="${opt}">${opt}</label>`;
  });
  return html;
}

// ページIDではなく、要素のID文字列を引数で受け取るように修正
function deletePage(cardId) {
  const el = document.getElementById(cardId);
  if (el) el.remove();
  // DOM要素の削除後、pages配列を再構成し、見積もりを更新
  updatePages();
  updateEstimate();
}

function clearAllPages(){
  document.getElementById('pageContainer').innerHTML = '';
  pageCount = 0;
  pages = [];
  updateEstimate();
}

/* ---------------- pages配列更新 (最重要修正箇所) ---------------- */
function updatePages() {
    pages = [];
    // DOMから現在のすべてのページカードを直接取得する
    const pageCards = document.querySelectorAll('.page-card');
    
    pageCards.forEach((card, index) => {
        // 現在のカード内の要素からデータを取得
        const pageName = (card.querySelector('input[type="text"]') ? card.querySelector('input[type="text"]').value : `ページ ${index + 1}`).trim();
        const pagePurpose = (card.querySelector('textarea')?.value || "おまかせ").trim();

        // ページ番号を再割り当てして、ページタイトルと削除ボタンを更新
        const h3 = card.querySelector('h3');
        if (h3) {
            h3.innerHTML = `ページ ${index + 1} <button class="delete-btn" onclick="deletePage('${card.id}')">削除</button>`;
        }

        // セクションチェックボックスの取得は値の配列で一括処理する（updatePagesを堅牢にするため）
        const checkedValues = Array.from(card.querySelectorAll('input[type="checkbox"]:checked')).map(e => e.value);
        
        // ページ構成情報を格納
        const pageData = { 
            pageName, 
            pagePurpose, 
            header: [], 
            menu: [], 
            body: [], 
            footer: [] 
        };
        
        // セクションオプションと照合して、どのセクションに属するかを特定
        checkedValues.forEach(value => {
            if (sectionOptions.header.includes(value)) pageData.header.push(value);
            else if (sectionOptions.menu.includes(value)) pageData.menu.push(value);
            else if (sectionOptions.body.includes(value)) pageData.body.push(value);
            else if (sectionOptions.footer.includes(value)) pageData.footer.push(value);
        });

        pages.push(pageData);
    });
    
    // 存在するページの数でpageCountを更新 (オプション。必須ではないが整合性のため)
    // pageCount = pages.length; 
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

/* ---------------- AI指示文生成 (強化版修正版) ---------------- */
function generateInstructions() {
    updatePages(); // pages配列を最新化

    // 基本設定の取得（未入力の場合はデフォルト値を設定）
    const overview = document.getElementById("projectOverviewInput")?.value.trim() || "一般的なコーポレートサイト";
    const pageType = document.getElementById("pageTypeSelect")?.value || "コーポレート／ブランド";
    const userTarget = document.getElementById("userTargetSelect")?.value || "一般ユーザー（20〜40代）";
    const design = document.getElementById("designSelect")?.value || "高級・スタイリッシュ";
    const mainFont = document.getElementById("mainFontSelect")?.options[document.getElementById("mainFontSelect").selectedIndex].text || "ゴシック体 (標準)";
    const themeColor = document.getElementById("themeColorSelect")?.options[document.getElementById("themeColorSelect").selectedIndex].text || "ブルー (ビジネス・信頼)";
    const layoutPattern = document.getElementById("layoutPatternSelect")?.value || "full-hero";
    const buttonShape = document.getElementById("buttonShapeSelect")?.value || "medium-round";
    const dataReq = document.getElementById("dataRequirementInput")?.value.trim() || "顧客データの管理、および問い合わせデータの記録";
    const operation = document.getElementById("operationInput")?.value.trim() || "静的コンテンツの定期的な更新とニュース機能の運用";
    const server = document.getElementById("serverSelect")?.value || "さくらレンタルサーバー";
    const db = document.getElementById("databaseSelect")?.value || "MySQL";
    const framework = document.getElementById("designFrameworkSelect")?.value || "Bootstrap";
    const auth = document.getElementById("authSelect")?.value || "メール認証";
    const security = document.getElementById("securityInput")?.value.trim() || "一般的なSSL/TLSによる通信暗号化、定期的なバックアップ";

    // 使用言語の取得
    const langs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .join(", ") || "HTML, CSS, JavaScript (フロントエンド) / PHP (バックエンド)";

    // ページ設定のまとめ
    let pageSummary = "";
    let pageListForCode = [];

    if (Array.isArray(pages) && pages.length > 0) {
        pageSummary = pages.map(p => {
            const sections = [].concat(
                p.header || [],
                p.menu || [],
                p.body || [],
                p.footer || []
            ).map(s => s ? `${s.type || ""}:${s.name || s}` : "").filter(Boolean).join(", ");
            pageListForCode.push(`- ページ名: ${p.pageName || "未定"}\n  - 構成: ${sections || "構成未定"}`);
            return `- ${p.pageName || "未定"}（目的: ${p.pagePurpose || "目的未定"}） → ${sections || "構成未定"}`;
        }).join("\n");
    } else {
        pageSummary = "ページ設定は未作成です。あなたは**コーポレートサイトの標準構成（トップページ、企業情報、サービス、ニュース一覧、お問い合わせ）**を自動で作成・定義し、設計書に反映させてください。";
        pageListForCode.push("設計書で定義した標準構成ページ（トップ、企業情報、サービス、ニュース、お問い合わせ）");
    }

    // AI指示文の生成
    const instruct = `
あなたは、Webサイトの要件定義と設計に精通した**エキスパートのWebエンジニア**です。
以下のヒアリング内容に基づき、不足している情報は**一般的なWeb標準構成として適切に補完・定義**した上で、Webサイト／Webアプリの設計書（機能一覧、テーブル定義書、画面遷移図）をMarkdown形式で作成してください。

【基本設定】
- プロジェクト概要: ${overview}
- ページ分類: ${pageType}
- ユーザー層・想定デバイス: ${userTarget}
- デザイン方針: ${design}
- メインフォント: ${mainFont}
- テーマカラー: ${themeColor}
- レイアウトパターン: ${layoutPattern}
- ボタン形状: ${buttonShape}
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
- **必ずMarkdownテーブルとして出力してください。**（**CREATE TABLE文は出力しないでください**）
- カラム名、データ型、NULL許可、キー、説明の5列を厳守してください。
- 複数のテーブルがある場合は、テーブルごとに見出し(例: \\#### userテーブル\\)を付けてください。
3) **画面遷移図**:         
- **必ずMermaid形式**で出力し、ブラウザで描画できるように、次の形式を厳守してください。  
- コードブロック（\```mermaid```）は使用せず、**必ず \`<div class="mermaid"> ... </div>\` タグ形式**で出力してください。  
- **サブグラフを積極的に活用し、関連する画面群（例：購入フロー、会員機能、公開ページ）をグループ化して、整理された見やすいレイアウト**にしてください。
- 主要なフロー（例：購入や認証）は線（エッジ）を明確にし、視覚的な流れをわかりやすくしてください。
- Mermaid構文は**v10以降の仕様に準拠**し、**サブグラフ識別子とノードIDはすべて英数字**を使用してください。
- ノードの表示ラベルは \`["日本語ラベル"]\` 形式で指定してください（例：\`A1["トップページ"]\`）。
- **線のラベル（エッジのテキスト）に日本語を使用する場合は、二重引用符 \`"日本語ラベル"\` で囲む形式を推奨**します。（例：\`A1 -->|"お問い合わせ"| A7\`）
- **ノードの定義には、角丸や円形などのノード形状を積極的に使用し、日本語ラベルを \`["日本語ラベル"]\` 形式で統一**してください。
- **出力はブラウザ上でMermaid.jsが正しく描画できる構文であることを保証し、特に特殊文字や予約語の混入を厳しく避けてください。**
【追加指示（重要）】  
- 上記設計書 Markdownをもとに、**1つのHTMLファイル内にすべての章（機能一覧・テーブル定義書・画面遷移図）を描画する完全なHTMLコード**を続けて出力してください。  
- HTMLはBootstrapとMermaid.jsを利用し、ブラウザ上で開くだけで全設計書をきれいに閲覧可能としてください。  
- 各章（機能一覧／テーブル定義書／画面遷移図）はセクション見出し付きで明確に区分し、**美しいデザイン**で出力してください。

【追加指示（Webページプレビューのデザイン）】
- ヘッダー・メニュー・ボディ・フッター構成を厳守
- Bootstrapグリッド・ユーティリティ活用、レスポンシブで美しいデザイン
- デザイン詳細設定（フォント: ${mainFont}, テーマカラー: ${themeColor}, レイアウト: ${layoutPattern}, ボタン: ${buttonShape}）を反映してください。
- ヘッダー：ロゴ左、ログインボタン右
- メニュー：**カテゴリメニューは水平リストとし、グローバルナビゲーションとして視認性を高く配置してください。**
- ボディ：トップはフォーム中心、商品紹介はカルーセル中心
- フッター：フッターメニューや会社情報を横並び

【ページコード生成指示】
- 設計書で定義した全ページを **page_codes.txt** にまとめる
- フォーマット：
<pre>
--- ページ開始: [ページ名] ---
&lt;!DOCTYPE html&gt;
&lt;html lang="ja"&gt;
... ページのHTML/CSS/JSコード（Bootstrap使用） ...
&lt;/html&gt;
--- ページ終了: [ページ名] ---
</pre>
- 対象ページ:
${pageListForCode.join("\n")}

【最終出力】
1. Markdown形式設計書
2. HTML設計書（ブラウザで閲覧可能）
3. page_codes.txt（全ページコード統合）
`.trim();

    // AI指示文をtextareaやinputにセット
    const aiInstructionsElement = document.getElementById('aiInstructions');
    if(aiInstructionsElement) {
        aiInstructionsElement.value = instruct;
    } else {
        console.warn("AI指示文を表示する要素が見つかりません。");
    }
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
// HTMLにこのIDを持つ要素がないため、この機能は動作しませんが、関数定義は保持します。
function renderDesignDocs() {
    const raw = document.getElementById('aiCodeInput').value.trim();
    if (!raw) {
        alert('AIが生成した設計書を貼り付けてください。');
        return;
    }

    // Mermaidの描画を一旦リセット
    const transContainer = document.getElementById('generateTransitionDiagram');
    if (transContainer) {
      transContainer.innerHTML = '';
    }
    
    let funcPart = '', tablePart = '', transPart = '';
    let inMermaidBlock = false; // Mermaidコードブロック内フラグ

    const markers = {
        func: ['機能一覧', 'functions', 'feature list'],
        table: ['テーブル定義', 'table definition'],
        trans: ['画面遷移', 'diagram', 'flow']
    };

    const lines = raw.split(/\r?\n/);
    let current = 'other';
    lines.forEach(line => {
        const l = line.trim();
        // Mermaidコードブロックの開始/終了を検出
        if (l.startsWith('```mermaid')) {
          inMermaidBlock = true;
          return; // コードブロック開始行自体はスキップ
        }
        if (l.startsWith('```')) {
          inMermaidBlock = false;
          return; // コードブロック終了行はスキップ
        }

        if (inMermaidBlock) {
          transPart += line + '\n';
          return;
        }
        
        const check = (arr) => arr.some(m => line.toLowerCase().indexOf(m.toLowerCase()) !== -1);
        
        // セクションの見出しを検出
        if (check(markers.func)) { current = 'func'; return; }
        if (check(markers.table)) { current = 'table'; return; }
        if (check(markers.trans)) { current = 'trans'; return; }

        if (current === 'func') funcPart += line + '\n';
        else if (current === 'table') tablePart += line + '\n';
        else if (current === 'trans') transPart += line + '\n';
    });

    // --- 各セクションのHTML変換処理 ---

    // HTMLに該当するIDがないため、コメントアウト
    // const funcHtml = convertMarkdownTableToHtml(funcPart, '機能一覧');
    // document.getElementById('generateFunctionList').innerHTML = funcHtml;

    // const tableHtml = convertMarkdownTableToHtml(tablePart, 'テーブル定義書');
    // document.getElementById('generateTableDefinition').innerHTML = tableHtml;

    // let finalTransHtml = `<h3>画面遷移図</h3>`;
    // const mermaidCode = transPart.trim();
    
    // if (mermaidCode.toLowerCase().startsWith('graph') || mermaidCode.toLowerCase().startsWith('flowchart')) {
    //     finalTransHtml += `<div class="mermaid-container"><pre class="mermaid">${mermaidCode}</pre></div>`;
    // } else {
    //     finalTransHtml += `<pre>${escapeHtml(mermaidCode || transPart)}</pre>`;
    // }
    // document.getElementById('generateTransitionDiagram').innerHTML = finalTransHtml;
    
    // if (typeof mermaid !== 'undefined') {
    //     const elements = document.getElementById('generateTransitionDiagram').querySelectorAll('.mermaid');
    //     elements.forEach(el => el.removeAttribute('data-processed'));
    //     mermaid.init(undefined, elements);
    // }
}

// 簡易 Markdown Table -> HTML Table 変換関数 (タイトル処理を追加)
function convertMarkdownTableToHtml(markdown, mainTitle) {
    const lines = markdown.split(/\r?\n/).filter(line => line.trim());
    let html = '';
    let currentTable = '';

    const processTable = (tableLines) => {
        if (tableLines.length < 2 || !tableLines[0].trim().startsWith('|')) return ''; // 表ではない

        let tableHtml = '<table class="table table-bordered table-sm mt-3">';
        
        // ヘッダー
        const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(c => c);
        if (headerCells.length > 0) {
            tableHtml += '<thead><tr>';
            headerCells.forEach(cell => {
                tableHtml += `<th scope="col">${cell.replace(/\*\*/g, '').trim()}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
        }

        // ボディ (2行目: 区切り線スキップ, 3行目から)
        for (let i = 2; i < tableLines.length; i++) {
            const bodyCells = tableLines[i].split('|').map(c => c.trim()).filter(c => c);
            if (bodyCells.length > 0) {
                tableHtml += '<tr>';
                bodyCells.forEach(cell => {
                    // **を<strong>、`を<code>に変換
                    tableHtml += `<td>${cell.replace(/\*\*/g, '<strong>').replace(/`/g, '<code>')}</td>`;
                });
                tableHtml += '</tr>';
            }
        }
        
        tableHtml += '</tbody></table>';
        return tableHtml;
    };
    
    html += `<h3>${mainTitle}</h3>`;

    let tableLines = [];
    for (const line of lines) {
        const l = line.trim();
        if (l.startsWith('####')) { // 小見出し
            html += processTable(tableLines);
            tableLines = [];
            html += `<h4>${l.replace('####', '').trim()}</h4>`;
        } else if (l.startsWith('|')) { // 表の行
            tableLines.push(line);
        } else if (l.toLowerCase().startsWith('create table')) { // SQLコード
            html += processTable(tableLines);
            tableLines = [];
            html += `<div class="sql-code"><pre><code>${escapeHtml(l)}</code></pre></div>`;
        } else if (l.startsWith('---') || l.startsWith('***')) {
            // 区切り線はスキップ
        }
    }
    // 最後に残ったテーブルを処理
    html += processTable(tableLines);

    return html;
}


/* ---------------- 補助 ---------------- */
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// HTMLにこのIDを持つ要素がないため、この機能は動作しませんが、関数定義は保持します。
function clearRenderedDesigns() {
    // document.getElementById('aiCodeInput').value = ''; // HTMLにaiCodeInputのIDなし
    // document.getElementById('generateFunctionList').innerHTML = '';
    // document.getElementById('generateTableDefinition').innerHTML = '';
    // document.getElementById('generateTransitionDiagram').innerHTML = '';
    alert('描画内容をクリアしました。');
}

// ... 既存の他の関数（updatePages, generateInstructionsなど）は変更しないでください ...
/* ---------------- HTML生成 ---------------- */
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

/* ---------------- AI生成HTMLプレビュー ---------------- */
function renderHtmlPreview() {
    const html = document.getElementById('aiHtmlInput').value.trim();
    if (!html) {
        alert('AI生成HTMLを貼り付けてください');
        return;
    }
    const iframe = document.getElementById('htmlPreview');
    iframe.srcdoc = html;
}

function clearHtmlPreview() {
    const iframe = document.getElementById('htmlPreview');
    iframe.srcdoc = '';
    document.getElementById('aiHtmlInput').value = '';
}

function previewAiPageHtml() {
    const code = document.getElementById('aiPageHtmlInput').value.trim();
    if (!code) { 
        alert('AI生成HTMLコードを貼り付けてください'); 
        return; 
    }
    const iframe = document.getElementById('pagePreview');
    iframe.srcdoc = code;
}

function clearPagePreview() {
    document.getElementById('aiPageHtmlInput').value = '';
    document.getElementById('pagePreview').srcdoc = '';
}
document.addEventListener('DOMContentLoaded', function() {
    const qrCodeButton = document.getElementById('qrCodeButton');
    // qrcode.jsライブラリがないため、QRコード関連の処理はコメントアウト
    /*
    // QRコード表示用のモーダル要素を動的に作成
    const qrModal = document.createElement('div');
    qrModal.id = 'qrCodeModal';
    qrModal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.6);
        justify-content: center;
        align-items: center;
    `;
    document.body.appendChild(qrModal);

    const qrModalContent = document.createElement('div');
    qrModalContent.style.cssText = `
        background-color: #fefefe;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
        max-width: 300px;
        text-align: center;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        position: relative;
    `;
    qrModal.appendChild(qrModalContent);

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        color: #aaa;
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    `;
    closeButton.onclick = function() {
        qrModal.style.display = 'none';
    };
    qrModalContent.appendChild(closeButton);

    const qrTitle = document.createElement('h3');
    qrTitle.textContent = 'Web制作アシスタント';
    qrTitle.style.marginTop = '10px';
    qrModalContent.appendChild(qrTitle);

    const qrImageContainer = document.createElement('div');
    qrImageContainer.id = 'qrcode'; // qrcode.jsが描画する場所
    qrImageContainer.style.margin = '15px auto';
    qrModalContent.appendChild(qrImageContainer);

    const qrLink = document.createElement('p');
    qrLink.innerHTML = `<a href="https://gomamiso-pro.github.io/asobi/" target="_blank">アクセスする</a>`;
    qrModalContent.appendChild(qrLink);

       // QRコードを生成して表示
    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
        new QRCode(qrContainer, {
            text: "https://gomamiso-pro.github.io/asobi/",
            width: 200,
            height: 200
        });
    }


    qrCodeButton.addEventListener('click', function() {
        qrModal.style.display = 'flex'; // モーダルを表示
        // qrcode.jsを使用してQRコードを生成
        // 既存のQRコードがあればクリア
        qrImageContainer.innerHTML = ''; 
        new QRCode(document.getElementById("qrcode"), {
            text: "https://gomamiso-pro.github.io/asobi/",
            width: 180,
            height: 180,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    });

    // モーダル外をクリックで閉じる
    window.addEventListener('click', function(event) {
        if (event.target == qrModal) {
            qrModal.style.display = 'none';
        }
    });
    */
});
/**
 * ⑥番目のAIコードプレビュー機能
 * ユーザーが貼り付けたHTMLをアレンジ版プレビューエリアに表示します。
 */
function previewAiPageHtmlArrangement() {
    const aiHtml = document.getElementById('aiPageHtmlInputArrangement').value;
    const iframe = document.getElementById('pagePreviewArrangement');
    iframe.srcdoc = aiHtml;
}

/**
 * ⑥番目のプレビュークリア
 * テキストエリアとプレビューエリアをクリアし、デザインベースのプレビューを再表示します。
 */
function clearPagePreviewArrangement() {
    document.getElementById('aiPageHtmlInputArrangement').value = '';
    const iframe = document.getElementById('pagePreviewArrangement');
    iframe.srcdoc = ''; // コンテンツをクリア
    // クリア後、現在のデザイン設定に基づくデフォルトプレビューを再表示
    updateDesignPreview();
}

/**
 * ⑥番目のアレンジ版HTML生成用AI指示文を生成する関数 (更新版)
 * デザインとUXの品質を強く要求する指示文を生成します。
 */
function generateAiInstructionForArrangement() {
    // 選択肢の表示名を取得
    const pageType = document.getElementById('pageTypeSelect')?.options[document.getElementById('pageTypeSelect').selectedIndex].text || '未定義';
    const userTarget = document.getElementById('userTargetSelect')?.options[document.getElementById('userTargetSelect').selectedIndex].text || '未定義';
    const designStyle = document.getElementById('designSelect')?.options[document.getElementById('designSelect').selectedIndex].text || '未定義';
    const font = document.getElementById('mainFontSelect')?.options[document.getElementById('mainFontSelect').selectedIndex].text || '未定義';
    const color = document.getElementById('themeColorSelect')?.options[document.getElementById('themeColorSelect').selectedIndex].text || '未定義';
    const layout = document.getElementById('layoutPatternSelect')?.options[document.getElementById('layoutPatternSelect').selectedIndex].text || '未定義';
    const shape = document.getElementById('buttonShapeSelect')?.options[document.getElementById('buttonShapeSelect').selectedIndex].text || '未定義';

    // --- ページ構成の概要を取得・生成するロジックを追加 ---
    // ここでは、generateInstructions() と同様に標準構成を定義し、その概要を抽出します。
    // （元の generateInstructions() 関数のロジックと重複しますが、独立性のために再実装します）
    const defaultPages = [
        { pageName: "トップページ", sections: "フルヒーロー, 3カラムサービス, ニュースリスト" },
        { pageName: "企業情報ページ", sections: "会社概要, 沿革" },
        { pageName: "サービス紹介ページ", sections: "詳細セクション（カルーセル）" },
        { pageName: "ニュース一覧ページ", sections: "ニュースリスト, ページネーション" },
        { pageName: "お問い合わせページ", sections: "問い合わせフォーム" },
    ];
    
    let currentPages = pages;
    if (!Array.isArray(pages) || pages.length === 0) {
        currentPages = defaultPages;
    }

    const pageSummaryArrangement = currentPages.map(p => 
        `- ${p.pageName || "未定"} (構成要素: ${p.sections || "未定義"})`
    ).join("\n");
    // ----------------------------------------------------


    const instructionText = `
--- 🌟 AIコード生成依頼: 最高品質のWeb体験を要求 🌟 ---

現在の設計設定に基づき、**ターゲットユーザーを魅了する、最先端のレスポンシブWebページHTML**を生成してください。

### 【コアデザイン設定】
* **Webページ分類**: ${pageType}
* **ユーザー層・想定デバイス**: ${userTarget}
* **デザイン方針**: ${designStyle}
* **メインフォント**: ${font}
* **テーマカラー**: ${color}
* **レイアウトパターン**: ${layout}
* **ボタン形状**: ${shape}

### 【現在のプロジェクトページ構成 (参考情報)】
**この設定は、AIがWebサイト全体のデザイン文脈を理解するために使用してください。**
${pageSummaryArrangement}

### 【デザイン・レイアウト仕様の厳守事項】
1.  **視覚的な魅力 (Visual Appeal)**: 設定されたデザイン方針を最大限に活かし、**ユーザーがすぐに「使いたい」「見たい」と感じるような、美しく洗練されたレイアウト**を構築してください。
2.  **ユーザビリティ (Usability)**: 生成されるコードは、全デバイスで**直感的かつスムーズに操作できる、最高のユーザー体験（UX）**を提供しなければなりません。特に**モバイルでの使いやすさ**を重視してください。
3.  **パフォーマンス**: 不必要なCSS/JSは排除し、**読み込み速度を意識したクリーンな構造**を維持してください。
4.  **技術要件**: 外部ライブラリ（Bootstrap/Tailwindなど）は**一切使用せず**、**内部CSSのみでデザインを完結**させた、単一ファイルのHTMLコードを出力してください。

ユーザーは、この指示文の後に**具体的なWebページ構成やコンテンツの要件**を追記して、最終的なAIコード生成依頼とします。

**（追記例：モダンなヒーローセクション、3カラムのサービス紹介、フッターなど）**
    `.trim();

    const aiInstructionForArrangementElement = document.getElementById('aiInstructionForArrangement');
    if (aiInstructionForArrangementElement) {
        aiInstructionForArrangementElement.value = instructionText;
    } else {
        console.warn("ID 'aiInstructionForArrangement' の要素が見つかりません。");
    }

    // ユーザーへの通知
    alert('✨ アレンジ版AI指示文のベースが、ハイレベルなデザイン要求を含む形で生成されました。\n\nこの後に具体的なページ構造を追記して、最高のコードを生成させてください。');
    
    return instructionText;
}
document.addEventListener('DOMContentLoaded', () => {
  updatePages();
  updateEstimate();
// ★★★ ここからがボタンの機能を追加する部分（HTML IDと一致するように修正） ★★★

    // ① ページ操作
    // HTML ID: addPageButton, clearAllPagesButton
    const addButton = document.getElementById('addPageButton');
    if(addButton) addButton.addEventListener('click', addPage);
    
    const clearButton = document.getElementById('clearAllPagesButton');
    if(clearButton) clearButton.addEventListener('click', clearAllPages);

    // ② 見積書
    // HTML ID: downloadEstimateButton
    const downloadEstButton = document.getElementById('downloadEstimateButton');
    if(downloadEstButton) downloadEstButton.addEventListener('click', downloadEstimate);

    // ③ AI指示文
    // HTML ID: generateInstructionsButton, copyInstructionsButton, downloadInstructionsButton
    const generateInstButton = document.getElementById('generateInstructionsButton');
    if(generateInstButton) generateInstButton.addEventListener('click', generateInstructions);
    
    const copyInstButton = document.getElementById('copyInstructionsButton');
    if(copyInstButton) copyInstButton.addEventListener('click', copyInstructions);

    const downloadInstButton = document.getElementById('downloadInstructionsButton');
    if(downloadInstButton) downloadInstButton.addEventListener('click', downloadInstructions);

    // ④ 設計書描画（AI生成設計書HTMLプレビュー）
    // HTML ID: renderHtmlPreviewButton, clearHtmlPreviewButton
    // HTMLのセクション④のボタンIDに合わせて renderHtmlPreview / clearHtmlPreview を使用
    const renderHtmlButton = document.getElementById('renderHtmlPreviewButton');
    if(renderHtmlButton) renderHtmlButton.addEventListener('click', renderHtmlPreview);

    const clearHtmlButton = document.getElementById('clearHtmlPreviewButton');
    if(clearHtmlButton) clearHtmlButton.addEventListener('click', clearHtmlPreview);
    
    // (renderDesignDocs / clearRenderedDesigns は HTML上のIDと対応しないため、ここでは無視)

    // ⑤ 個別ページHTMLプレビュー (AIコードをプレビュー, プレビューをクリア)
    // HTML ID: previewAiPageBtn, clearPagePreviewButton (これはHTMLに存在しないため、clearPagePreviewButtonを使用)
    // HTML上は <button id="previewAiPageBtn"> と <button id="clearPagePreviewButton"> に修正済みと仮定
    const previewAiPageBtn = document.getElementById('previewAiPageBtn');
    if(previewAiPageBtn) previewAiPageBtn.addEventListener('click', previewAiPageHtml);

    const clearPageBtn = document.getElementById('clearPagePreviewButton');
    if(clearPageBtn) clearPageBtn.addEventListener('click', clearPagePreview);
    
    // ⑥ アレンジ版プレビュー
    // HTML ID: generateAiInstructionForArrangementButton, previewAiPageBtnArrangement, clearPagePreviewArrangementButton
    const generateArrangementButton = document.getElementById('generateAiInstructionForArrangementButton');
    if(generateArrangementButton) generateArrangementButton.addEventListener('click', generateAiInstructionForArrangement);

    const previewArrangementButton = document.getElementById('previewAiPageBtnArrangement');
    if(previewArrangementButton) previewArrangementButton.addEventListener('click', previewAiPageHtmlArrangement);

    const clearArrangementButton = document.getElementById('clearPagePreviewArrangementButton');
    if(clearArrangementButton) clearArrangementButton.addEventListener('click', clearPagePreviewArrangement);
});
// ★★★ ここまでが修正箇所 ★★★
