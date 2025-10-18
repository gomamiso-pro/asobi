/* ====== script.js (設計書描画対応版 完全修正版) ======
   変更点:
   - renderDesignDocs() が ④ のプレビュー（aiCodeInput）を解析し、⑤の designOutputSection 内に
     機能一覧 / テーブル定義 / 遷移図ブロックを自動で作成・出力します（HTMLの編集不要）。
   - 描画クリア、コピー、ダウンロード、全まとめダウンロード機能を追加。
   - generatePageCode / downloadPageCode を実装し、iframe プレビューと個別ファイルDLを提供。

   既存機能はそのまま維持。
*/

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
  inputs.forEach(i => i.addEventListener('change', () => {
    updatePages();
    updateEstimate();
  }));

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

function clearAllPages() {
  document.getElementById('pageContainer').innerHTML = '';
  pageCount = 0;
  pages = [];
  updateEstimate();
}

/* ---------------- pages配列更新 ---------------- */
function updatePages() {
  pages = [];
  const cards = document.querySelectorAll('.page-card');
  cards.forEach(card => {
    const id = card.id.replace('pageCard', '');
    const pageName = (document.getElementById(`pageName${id}`)?.value || `ページ${id}`).trim();
    const pagePurpose = (document.getElementById(`pagePurpose${id}`)?.value || "おまかせ").trim();
    const header = Array.from(card.querySelectorAll(`[id^=header${id}_]:checked`)).map(e => e.value);
    const menu = Array.from(card.querySelectorAll(`[id^=menu${id}_]:checked`)).map(e => e.value);
    const body = Array.from(card.querySelectorAll(`[id^=body${id}_]:checked`)).map(e => e.value);
    const footer = Array.from(card.querySelectorAll(`[id^=footer${id}_]:checked`)).map(e => e.value);
    pages.push({ pageName, pagePurpose, header, menu, body, footer });
  });
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

  document.getElementById('subtotal').textContent = subtotal.toLocaleString();
  document.getElementById('total').textContent = Math.round(subtotal * 1.1).toLocaleString();
}

function downloadEstimate() {
  updateEstimate();
  const el = document.getElementById('estimateTable');
  let text = '見積書\r\n\r\n';
  const rows = el.querySelectorAll('tbody tr');
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    text += `${cells[0].textContent}\t単価:${cells[1].textContent}\t数量:${cells[2].textContent}\t小計:${cells[3].textContent}\r\n`;
  });
  text += `\r\n合計（税抜）: ${document.getElementById('subtotal').textContent}\r\n合計（税込10%）: ${document.getElementById('total').textContent}\r\n`;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '見積書.txt';
  a.click();
}

/* ========================
   設計書生成指示文の作成
======================== */
window.generateInstructions = function() {
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

  // 言語チェックボックス（AI設定用）だけ取得
  const langs = Array.from(document.querySelectorAll('#languageOptions input[type="checkbox"]:checked'))
                     .map(cb => cb.value)
                     .join(", ") || "おまかせ";

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
以下のヒアリング内容をもとに、Webサイト／Webアプリの設計書を作成してください。

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

【出力フォーマット】
1. 機能一覧（分類 / 機能名 / 処理詳細 / 必要なDBテーブル名）
2. テーブル定義書（テーブル名 / 概要 / フィールド名 / 型 / 詳細）
3. 画面遷移図（Mermaid形式 or テキスト）

【重要な追加指示】
- Markdownではなく、最初から **完全なHTMLとして出力** してください。
- HTMLファイル1枚にすべての設計書（機能一覧・テーブル定義書・画面遷移図）をきれいに描画してください。
- 各章は <section> で区切り、タイトルを <h2> で表示。
- CSSを含め、ブラウザで開いたときに整ったデザインで見えるようにしてください。
- コードブロックやエスケープを行わず、純粋なHTML構造で返してください。
  `.trim();

  document.getElementById('aiInstructions').value = instruct;
};

function copyInstructions() {
  const el = document.getElementById('aiInstructions');
  el.select();
  navigator.clipboard.writeText(el.value)
    .then(() => alert('AI指示文をコピーしました！'))
    .catch(() => alert('コピーに失敗しました'));
}

function downloadInstructions() {
  const text = document.getElementById('aiInstructions').value;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'AI指示文.txt';
  a.click();
}

/* ========================
   設計書描画（⑤用 改良版）
   - ④の入力（aiCodeInput）を解析して、⑤のブロックへ出力
   - HTMLのコメントアウトを編集する必要はありません（動的に要素を作成します）
======================== */
function ensureDesignBlock(id, title) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'design-block';
    const section = document.getElementById('designOutputSection') || document.body;
    section.appendChild(el);
  }
  // 先頭にタイトルが無ければ追加
  if (!el.querySelector('h3')) {
    const h = document.createElement('h3');
    h.textContent = title;
    el.insertBefore(h, el.firstChild);
  }
  return el;
}

function renderDesignDocs() {
  let output = document.getElementById("designOutputSection");
  if (!output) {
    const parent = document.getElementById('designImportSection') || document.body;
    output = document.createElement('div');
    output.id = 'designOutputSection';
    output.style.marginTop = '20px';
    output.style.border = '1px solid #ccc';
    output.style.padding = '10px';
    output.style.borderRadius = '6px';
    parent.appendChild(output);
  }
  output.innerHTML = "";

  const rawHtml = (document.getElementById('aiCodeInput')?.value || "").trim();
  if (!rawHtml) {
    output.innerHTML = "<p style='color:crimson;'>⚠️ AIが生成した設計書（HTML）を貼り付けてください。</p>";
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // ① 機能一覧
  let funcContent = '';
  // ② テーブル定義
  let tableContentBasic = '';
  let tableContentPages = '';
  // ③ 画面遷移図
  let transContent = '';
  let current = '';

  doc.body.querySelectorAll('*').forEach(node => {
    if (node.tagName && node.tagName.match(/^H[1-6]$/)) {
      const text = node.textContent.trim();
      if (/機能一覧/.test(text)) current = 'func';
      else if (/テーブル定義/.test(text)) current = 'table';
      else if (/画面遷移/.test(text) || /遷移図/.test(text)) current = 'trans';
      else if (/ページ設定/.test(text)) current = 'tablePage';
    } else {
      if (current === 'func') funcContent += node.outerHTML;
      else if (current === 'table') tableContentBasic += node.outerHTML;
      else if (current === 'tablePage') tableContentPages += node.outerHTML;
      else if (current === 'trans') transContent += node.outerHTML;
    }
  });

  // 機能一覧ブロック
  const funcEl = document.createElement('section');
  funcEl.innerHTML = `<h2>機能一覧</h2>` + (funcContent || '<p>機能一覧が見つかりませんでした。</p>');
  output.appendChild(funcEl);

  // テーブル定義ブロック
  const tableEl = document.createElement('section');
  tableEl.innerHTML = `<h2>テーブル定義書</h2>` +
    `<div class="table-basic"><h3>基本設定</h3>${tableContentBasic || '<p>基本設定情報が見つかりません</p>'}</div>` +
    `<div class="table-pages"><h3>ページ設定</h3>${tableContentPages || '<p>ページ情報が見つかりません</p>'}</div>`;
  output.appendChild(tableEl);

  // ページごとにページ名・目的を見出し化（h4）
  const pages = document.querySelectorAll('.page-card');
  pages.forEach((card, i) => {
    const pageName = document.getElementById(`pageName${i+1}`)?.value || `ページ${i+1}`;
    const pagePurpose = document.getElementById(`pagePurpose${i+1}`)?.value || '目的未設定';
    const div = document.createElement('div');
    div.innerHTML = `<h4>${pageName}</h4><p>${pagePurpose}</p>`;
    tableEl.appendChild(div);
  });

  // 画面遷移図ブロック
  const transEl = document.createElement('section');
  transEl.innerHTML = `<h2>画面遷移図</h2>` + (transContent || '<p>遷移図が見つかりませんでした。</p>');
  output.appendChild(transEl);

  // preview にも元データを表示
  let preview = document.getElementById('designRenderPreview');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'designRenderPreview';
    output.parentNode.insertBefore(preview, output.nextSibling);
  }
  preview.innerHTML = rawHtml;
}

function clearRenderedDesigns() {
  ['generateFunctionList','generateTableDefinition','generateTransitionDiagram'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '';
      el.remove();
    }
  });
  const preview = document.getElementById('designRenderPreview');
  if (preview) preview.innerHTML = '';
}

/* ---------------- コピー・ダウンロード補助 ---------------- */
function copyRendered(id) {
  const el = document.getElementById(id);
  if (!el) { alert('コピー対象が見つかりません: ' + id); return; }
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text).then(() => alert('内容をクリップボードにコピーしました')).catch(() => alert('コピーに失敗しました'));
}

function downloadRendered(kind) {
  // kind: functionList | tableDefinition | transitionDiagram
  const map = {
    functionList: 'generateFunctionList',
    tableDefinition: 'generateTableDefinition',
    transitionDiagram: 'generateTransitionDiagram'
  };
  const id = map[kind];
  const el = document.getElementById(id);
  if (!el) { alert('ダウンロードする内容が見つかりません: ' + kind); return; }
  const html = el.innerHTML || el.textContent || '';
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${kind}.html`;
  a.click();
}

function downloadAllDesigns() {
  const blocks = ['generateFunctionList','generateTableDefinition','generateTransitionDiagram'];
  let any = false;
  blocks.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      any = true;
      const blob = new Blob([el.innerHTML], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${id}.html`;
      a.click();
    }
  });
  if (!any) alert('ダウンロードできる設計書が見つかりません。');
}

/* ---------------- ページ毎の HTML 生成・プレビュー・ダウンロード ---------------- */
function buildSinglePageHtml(pageObj) {
  const css = `
    body{ font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif; padding:20px; line-height:1.6; }
    header, nav, main, footer{ padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e6e6e6; background:#fff; }
    header{ background:linear-gradient(145deg,#82b1ff,#64b5f6); color:#fff; }
    nav{ background:#f7fbff; }
    .section-title{ font-weight:700; color:#1976d2; margin-bottom:6px; }
  `;
  const makeList = (arr) => arr && arr.length ? `<ul>${arr.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` : '<p>なし</p>';
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

function generatePageCode() {
  updatePages();
  if (!pages || pages.length === 0) { alert('ページがありません。ページを追加してください。'); return; }
  const generated = pages.map(p => ({ name: p.pageName, html: buildSinglePageHtml(p) }));
  window.generatedPages = generated; // 保存
  // プレビュー: 最初のページを iframe に表示
  const iframe = document.getElementById('pagePreview');
  if (iframe) {
    iframe.srcdoc = generated[0].html;
  }
  alert('ページコードを生成しました（プレビューは最初のページ）。');
}

function downloadPageCode() {
  if (!window.generatedPages || window.generatedPages.length === 0) { alert('生成されたページコードがありません。まず「ページコード生成」を実行してください。'); return; }
  window.generatedPages.forEach(pg => {
    const blob = new Blob([pg.html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safeName = pg.name.replace(/[^a-zA-Z0-9\-_\u3000-\u303F\u4E00-\u9FFF]/g, '_');
    a.download = `${safeName}.html`;
    a.click();
  });
}

/* ---------------- 補助関数 ---------------- */
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;')
          .replace(/'/g,'&#39;');
}

/* ---------------- 初期化 ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  updatePages();
  updateEstimate();
});

// EOF
