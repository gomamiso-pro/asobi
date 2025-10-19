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
  tbody.innerHTML += `<tr><td>基本設計</td><td>${basic}</td><td>1</td><td>${basic}</td></tr>`;

  const pageUnit = 30000;
  const pageCountReal = pages.length;
  if (pageCountReal > 0) {
    tbody.innerHTML += `<tr><td>ページ追加</td><td>${pageUnit}</td><td>${pageCountReal}</td><td>${pageUnit * pageCountReal}</td></tr>`;
    subtotal += pageUnit * pageCountReal;
  }

  const sectionUnit = 10000;
  let sectionCount = 0;
  pages.forEach(p => {
    sectionCount += p.header.length + p.menu.length + p.body.length + p.footer.length;
  });
  if (sectionCount > 0) {
    tbody.innerHTML += `<tr><td>セクション追加</td><td>${sectionUnit}</td><td>${sectionCount}</td><td>${sectionUnit * sectionCount}</td></tr>`;
    subtotal += sectionUnit * sectionCount;
  }

  const extra = 20000;
  subtotal += extra;
  tbody.innerHTML += `<tr><td>データ・認証・フレームワーク設定</td><td>${extra}</td><td>1</td><td>${extra}</td></tr>`;

  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('total').textContent = Math.round(subtotal * 1.1);
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
  const overview = document.getElementById("projectOverviewInput").value || "おまかせ";
  const pageType = document.getElementById("pageTypeSelect").value;
  const userTarget = document.getElementById("userTargetSelect").value;
  const design = document.getElementById("designSelect").value;
  const dataReq = document.getElementById("dataRequirementInput").value || "おまかせ";
  const operation = document.getElementById("operationInput").value || "おまかせ";
  const server = document.getElementById("serverSelect").value;
  const db = document.getElementById("databaseSelect").value;
  const framework = document.getElementById("designFrameworkSelect").value;
  const auth = document.getElementById("authSelect").value;
  const security = document.getElementById("securityInput").value || "おまかせ";
  const langs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).join(", ") || "おまかせ";

  const pageSummary = pages.length > 0 ? pages.map(p => {
    const sections = [].concat(
      p.header.map(x => `ヘッダー:${x}`),
      p.menu.map(x => `メニュー:${x}`),
      p.body.map(x => `ボディ:${x}`),
      p.footer.map(x => `フッター:${x}`)
    ).join(", ");
    return `- ${p.pageName}（目的: ${p.pagePurpose}） → ${sections || "構成未定"}`;
  }).join("\n") : "ページ設定は未作成です。";

  const instruct = `
以下のヒアリング内容をもとに、Webサイト／Webアプリの設計書（機能一覧、テーブル定義書、画面遷移図）をMarkdown形式で作成してください。
出力は表（Markdown表）あるいはコードブロックのHTMLでお願いします。必要に応じてテーブル定義はCREATE TABLE風の表も可。

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
1) 機能一覧（分類 / 機能名 / 処理詳細 / 必要なDBテーブル名）
2) テーブル定義書（テーブル名 / 概要 / フィールド名 / 型 / 詳細）
3) 画面遷移図（テキスト説明 or Mermaid形式）

【追加指示（重要）】
上記の設計書をもとに、**1つのHTMLファイル内にすべての章（機能一覧・テーブル定義書・画面遷移図）を描画**してください。

- HTMLはブラウザ上で開くだけで、全設計書をきれいに閲覧できるようにしてください。
- 各章（機能一覧／テーブル定義書／画面遷移図）はセクション見出し付きで明確に区分してください。
- フォント、表の体裁、見出しデザイン、配色を統一し、読みやすいWeb設計書として仕上げてください。
- MarkdownをHTMLに整形し、Mermaid記法が含まれる場合は \`<script type="module">\` で正しく描画できるようにしてください。
- 図・表・リスト・見出しのレイアウトが整った完成度の高い設計書HTMLを生成してください。

【最終出力】
- Markdown形式の設計書（テキスト）
- 上記内容を1ファイルにまとめたHTML設計書（ブラウザで開いて閲覧可能）
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

/* ---------------- 設計書描画 ---------------- */
function renderDesignDocs() {
    const raw = document.getElementById('aiCodeInput').value.trim();
    if (!raw) {
        alert('AIが生成した設計書を貼り付けてください。');
        return;
    }

    let funcPart = '', tablePart = '', transPart = '';
    const markers = {
        func: ['機能一覧', 'functions', 'feature list'],
        table: ['テーブル定義', 'table definition'],
        trans: ['画面遷移', 'diagram', 'flow']
    };

    const lines = raw.split(/\r?\n/);
    let current = 'other';
    lines.forEach(line => {
        const l = line.trim();
        if (!l) return;
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

    // 1. 機能一覧: Markdown表 または 生のHTMLテーブルに対応
    let funcHtml = funcPart;
    // Markdown表（| で始まる行）を処理するための簡易的な処理
    if (funcPart.trim().startsWith('|')) {
        funcHtml = convertMarkdownTableToHtml(funcPart);
    }
    // AIが出力したHTMLテーブルコードもそのままレンダリングされる (エスケープしないため)
    document.getElementById('generateFunctionList').innerHTML = `<h3>機能一覧</h3>${funcHtml}`;


    // 2. テーブル定義書: Markdown表 または 生のHTMLテーブルに対応
    let tableHtml = tablePart;
    if (tablePart.trim().startsWith('|') || tablePart.trim().toLowerCase().startsWith('create table')) {
        // テーブル定義書は複数の表を含む可能性が高いため、ここは簡易的にMarkdown表変換を適用
        tableHtml = convertMarkdownTableToHtml(tablePart); 
    }
    document.getElementById('generateTableDefinition').innerHTML = `<h3>テーブル定義書</h3>${tableHtml}`;


    // 3. 画面遷移図: Mermaidコードブロックを<pre class="mermaid">で囲む
    let transHtml = transPart;
    if (transPart.trim().toLowerCase().startsWith('graph')) {
        // Mermaid記法（graph TD など）で始まっている場合、<pre class="mermaid">で囲む
        transHtml = `<div class="mermaid-container"><pre class="mermaid">${transPart.trim()}</pre></div>`;
        
        // Mermaidの再実行を試みる (HTML内にscript moduleがあれば実行されるはずだが、再描画の保険)
        if (typeof mermaid !== 'undefined') {
             mermaid.init();
        }
    } else {
        // Mermaid以外は生のテキストとして表示
        transHtml = `<pre>${escapeHtml(transPart)}</pre>`;
    }
    document.getElementById('generateTransitionDiagram').innerHTML = `<h3>画面遷移図</h3>${transHtml}`;
}

// 簡易 Markdown Table -> HTML Table 変換関数
// AIのMarkdown表（|で区切られたもの）をHTMLテーブルに変換します。
function convertMarkdownTableToHtml(markdown) {
    let html = '<table class="table table-bordered table-sm">';
    const lines = markdown.split(/\r?\n/).filter(line => line.trim().startsWith('|'));
    
    if (lines.length < 2) return markdown; // 表として認識できない場合はそのまま返す

    // 1行目: ヘッダー
    const headerCells = lines[0].split('|').map(c => c.trim()).filter(c => c);
    if (headerCells.length > 0) {
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += `<th scope="col">${cell.replace(/\*\*/g, '')}</th>`; // ** を除去
        });
        html += '</tr></thead><tbody>';
    }

    // 2行目は区切り線なのでスキップ (lines[1])

    // 3行目以降: ボディ
    for (let i = 2; i < lines.length; i++) {
        const bodyCells = lines[i].split('|').map(c => c.trim()).filter(c => c);
        if (bodyCells.length > 0) {
            html += '<tr>';
            bodyCells.forEach(cell => {
                html += `<td>${cell.replace(/\*\*/g, '<strong>')}</td>`; // ** を <strong> に変換
            });
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';

    // 複数テーブル定義が混ざっている可能性があるため、元のテキストも念のため含めておく
    if (markdown.indexOf('テーブル:') !== -1) {
        return markdown; // 複数テーブル定義を完璧に処理できないため、生のMarkdownも残す
    }
    
    return html;
}

/* ---------------- 補助 ---------------- */
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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

/* ---------------- 補助 ---------------- */
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
  updatePages();
  updateEstimate();
});

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
