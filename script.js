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
  const langs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
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

/* ========================
   設計書HTML描画処理
======================== */
function renderDesignDocs() {
  const raw = document.getElementById('aiInstructions').value.trim(); // ← aiCodeInput → aiInstructions に変更
  if (!raw) {
    alert('AIが生成した設計書を貼り付けてください。');
    return;
  }

  const preview = document.getElementById('designRenderPreview');
  preview.innerHTML = raw;

  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: true, theme: "default" });
    mermaid.init(undefined, preview.querySelectorAll(".mermaid"));
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

/* ========================
   設計書描画（⑤用 安定版）
   ・④で貼り付けたAI生成HTMLを解析
   ・機能一覧 / テーブル定義 / 画面遷移図に自動分離
======================== */
/* ========================
   設計書描画（⑤用 安定版）
   ・④で貼り付けたAI生成HTMLを解析
   ・機能一覧 / テーブル定義 / 画面遷移図に自動分離
   ・画面遷移図はMermaidで描画
======================== */
function renderDesignDocs() {
  const rawHtml = document.getElementById('aiCodeInput').value.trim();
  if (!rawHtml) {
    alert('AIが生成した設計書（HTML）を貼り付けてください。');
    return;
  }

  // DOMに解析
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  let funcContent = '', tableContent = '', transContent = '';
  let current = '';

  doc.body.querySelectorAll('*').forEach(node => {
    if (node.tagName.match(/^H[1-6]$/)) {
      const text = node.textContent.trim();
      if (/機能一覧/.test(text)) current = 'func';
      else if (/テーブル定義/.test(text)) current = 'table';
      else if (/画面遷移/.test(text)) current = 'trans';
    } else {
      if (current === 'func') funcContent += node.outerHTML;
      else if (current === 'table') tableContent += node.outerHTML;
      else if (current === 'trans') transContent += node.outerHTML;
    }
  });

  // 各ブロックに描画
  document.getElementById('generateFunctionList').innerHTML = funcContent;
  document.getElementById('generateTableDefinition').innerHTML = tableContent;
  document.getElementById('generateTransitionDiagram').innerHTML = transContent;

  // ④プレビューも更新
  document.getElementById('designRenderPreview').innerHTML = rawHtml;

  // Mermaidレンダリング
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    const mermaidBlocks = document.getElementById('generateTransitionDiagram').querySelectorAll('.mermaid');
    mermaidBlocks.forEach(block => {
      try { mermaid.init(undefined, block); } catch(e) { console.error(e); }
    });
  }
}

/* 補助: HTMLエスケープ */
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;')
          .replace(/'/g,'&#39;');
}


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
