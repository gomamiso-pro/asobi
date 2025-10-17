/* ====== script.js ======
   機能:
   - ページ追加/削除、ページ情報保持
   - 見積自動更新・ダウンロード（テキスト）
   - ヒアリング→AI指示文生成・コピー・ダウンロード
   - AIが生成した設計書を貼付けて描画（機能一覧／テーブル定義／画面遷移図）
   - ページ毎の簡易HTMLコード生成・プレビュー・ダウンロード（個別ファイル）
   ================================== */

let pageCount = 0;
let pages = []; // { pageName, pagePurpose, header[], menu[], body[], footer[] }

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
  // input変化で自動更新させる
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

  // 基本設計
  const basic = 50000;
  subtotal += basic;
  tbody.innerHTML += `<tr><td>基本設計</td><td>${basic}</td><td>1</td><td>${basic}</td></tr>`;

  // ページ追加費
  const pageUnit = 30000;
  const pageCountReal = pages.length;
  if (pageCountReal > 0) {
    tbody.innerHTML += `<tr><td>ページ追加</td><td>${pageUnit}</td><td>${pageCountReal}</td><td>${pageUnit * pageCountReal}</td></tr>`;
    subtotal += pageUnit * pageCountReal;
  }

  // セクション追加費
  const sectionUnit = 10000;
  let sectionCount = 0;
  pages.forEach(p => {
    sectionCount += p.header.length + p.menu.length + p.body.length + p.footer.length;
  });
  if (sectionCount > 0) {
    tbody.innerHTML += `<tr><td>セクション追加</td><td>${sectionUnit}</td><td>${sectionCount}</td><td>${sectionUnit * sectionCount}</td></tr>`;
    subtotal += sectionUnit * sectionCount;
  }

  // その他固定費
  const extra = 20000;
  subtotal += extra;
  tbody.innerHTML += `<tr><td>データ・認証・フレームワーク設定</td><td>${extra}</td><td>1</td><td>${extra}</td></tr>`;

  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('total').textContent = Math.round(subtotal * 1.1);
}

// 見積書ダウンロード（簡易TXT）
function downloadEstimate() {
  updateEstimate();
  const el = document.getElementById('estimateTable');
  // 表のテキストを作る
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
  // 基本入力を取得
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

  // ページ概要テキスト
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

以上をMarkdownで出力してください。
  `.trim();

  document.getElementById('aiInstructions').value = instruct;
}

// コピー・DL指示文
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

/* ---------------- 設計書描画 ----------------
   ユーザーがAIから得た出力（Markdown / JSON / plain）を貼り付けることを想定。
   簡易パーサーで '機能一覧', 'テーブル定義', '画面遷移' を抽出して描画する。
*/
function renderDesignDocs() {
  const raw = document.getElementById('aiCodeInput').value.trim();
  if (!raw) {
    alert('AIが生成した設計書を貼り付けてください。');
    return;
  }

  // simple split by headings
  const lower = raw.toLowerCase();
  let funcPart = '', tablePart = '', transPart = '';

  // try to split by common Japanese headings
  const markers = {
    func: ['機能一覧', '機能リスト', 'functions', 'feature list'],
    table: ['テーブル定義', 'テーブル定義書', 'table definition', 'tables'],
    trans: ['画面遷移', '画面遷移図', '遷移図', 'diagram', 'flow']
  };

  // if contains explicit markers, we try to extract via regex
  const lines = raw.split(/\r?\n/);
  let current = 'other';
  lines.forEach(line => {
    const l = line.trim();
    if (!l) return;
    const check = (arr) => arr.some(m => l.indexOf(m) !== -1);
    if (check(markers.func)) { current = 'func'; return; }
    if (check(markers.table)) { current = 'table'; return; }
    if (check(markers.trans)) { current = 'trans'; return; }
    // assign
    if (current === 'func') funcPart += line + '\n';
    else if (current === 'table') tablePart += line + '\n';
    else if (current === 'trans') transPart += line + '\n';
    else {
      // if none started, heuristically distribute: first chunk -> func, second -> table, third -> trans
      if (!funcPart) funcPart += line + '\n';
      else if (!tablePart) tablePart += line + '\n';
      else transPart += line + '\n';
    }
  });

  // Fallback: if any part empty, put whole raw
  if (!funcPart) funcPart = raw;
  if (!tablePart) tablePart = raw;
  if (!transPart) transPart = raw;

  // Render into DOM (preformatted)
  const fEl = document.getElementById('generateFunctionList');
  const tEl = document.getElementById('generateTableDefinition');
  const dEl = document.getElementById('generateTransitionDiagram');

  fEl.innerHTML = `<h3>機能一覧（AI出力より）</h3><pre>${escapeHtml(funcPart)}</pre>`;
  tEl.innerHTML = `<h3>テーブル定義書（AI出力より）</h3><pre>${escapeHtml(tablePart)}</pre>`;
  dEl.innerHTML = `<h3>画面遷移図（AI出力より）</h3><pre>${escapeHtml(transPart)}</pre>`;
}

// HTMLエスケープ
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// コピー / ダウンロード 個別
function copyRendered(id) {
  const el = document.getElementById(id);
  if (!el) return alert('対象が見つかりません');
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text).then(() => alert('コピーしました！'), () => alert('コピーに失敗しました'));
}

function downloadRendered(kind) {
  let el, filename;
  if (kind === 'functionList') { el = document.getElementById('generateFunctionList'); filename = '機能一覧.txt'; }
  else if (kind === 'tableDefinition') { el = document.getElementById('generateTableDefinition'); filename = 'テーブル定義書.txt'; }
  else if (kind === 'transitionDiagram') { el = document.getElementById('generateTransitionDiagram'); filename = '画面遷移図.txt'; }
  else {
    // generic
    el = document.getElementById('generateFunctionList');
    filename = '設計書.txt';
  }
  if (!el) return alert('ダウンロード対象が見つかりません。まず設計書を描画してください。');
  const text = el.innerText || el.textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// まとめてダウンロード（設計書3点）
function downloadAllDesigns() {
  // create combined txt
  const f = document.getElementById('generateFunctionList')?.innerText || '';
  const t = document.getElementById('generateTableDefinition')?.innerText || '';
  const d = document.getElementById('generateTransitionDiagram')?.innerText || '';
  const combined = `--- 機能一覧 ---\n${f}\n\n--- テーブル定義書 ---\n${t}\n\n--- 画面遷移図 ---\n${d}\n`;
  const blob = new Blob([combined], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '設計書_まとめ.txt';
  a.click();
}

/* ---------------- ページコード生成・プレビュー ----------------
   各ページに対し簡易的なHTMLを生成（ヘッダー/メニュー/ボディ/フッターの表示を行う）
   - プレビューは最初のページをiframeに表示
   - ダウンロードは各ページごとに .html ファイルを作成して順次ダウンロード
*/
function generatePageCode() {
  updatePages();
  if (pages.length === 0) {
    alert('ページがまだありません。ページを追加してください。');
    return;
  }
  // generate HTML for each page
  const results = pages.map((p, idx) => {
    const html = buildSinglePageHtml(p, idx + 1);
    return { filename: `${sanitizeFilename(p.pageName || 'page')}.html`, content: html };
  });

  // show first page in iframe preview
  if (results.length > 0) {
    const first = results[0];
    document.getElementById('pagePreview').srcdoc = first.content;
    // store temporary in window for download later
    window.__generatedPages = results;
    alert('ページコードを生成しました。プレビューは最初のページです。');
  }
}

function buildSinglePageHtml(pageObj, pageIndex) {
  // minimal CSS to make preview look ok (embedding)
  const css = `
    body{ font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif; padding:20px; line-height:1.6; }
    header, nav, main, footer{ padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e6e6e6; background:#fff; }
    header{ background:linear-gradient(145deg,#82b1ff,#64b5f6); color:#fff; }
    nav{ background:#f7fbff; }
    .section-title{ font-weight:700; color:#1976d2; margin-bottom:6px; }
  `;
  // assemble sections as lists
  const makeList = (arr) => arr && arr.length ? `<ul>${arr.map(a => `<li>${a}</li>`).join('')}</ul>` : '<p>なし</p>';
  const html = `
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
  return html;
}

function sanitizeFilename(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
}

// ダウンロード：生成した全ページを順にダウンロード（ブラウザの設定によりブロックされる場合あり）
function downloadPageCode() {
  const pages = window.__generatedPages;
  if (!pages || !pages.length) {
    alert('まず「ページコード生成」を押してください。');
    return;
  }
  pages.forEach(p => {
    const blob = new Blob([p.content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = p.filename;
    a.click();
  });
  alert('ダウンロードを開始しました。ブラウザの設定で複数ダウンロードがブロックされる場合があります。');
}

/* ---------------- 補助 ---------------- */
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 初期化：既存のページがあれば再描画
document.addEventListener('DOMContentLoaded', () => {
  updatePages();
  updateEstimate();
});
