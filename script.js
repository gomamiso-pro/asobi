/* ====== script.js （修正版） ======
   機能追加/改善:
   - 設計書表示を構造化（機能一覧：HTML表、テーブル定義：テーブル表示）
   - 画面遷移図を動的SVGで生成（ページ数に応じて自動レイアウト）
   - 既存のページ生成／見積／AI指示文生成／コード生成機能維持
   - 各設計書のコピー／ダウンロード用ユーティリティあり
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
  // input変化で自動更新
  const inputs = card.querySelectorAll('input, textarea');
  inputs.forEach(i => i.addEventListener('input', () => { updatePages(); updateEstimate(); }));
  // checkbox change
  const boxes = card.querySelectorAll('input[type=checkbox]');
  boxes.forEach(b => b.addEventListener('change', () => { updatePages(); updateEstimate(); }));
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
  // find max existing pageCard ids by scanning container children to be robust against gaps
  const container = document.getElementById('pageContainer');
  const cards = container.querySelectorAll('.page-card');
  cards.forEach(card => {
    const idMatch = card.id.match(/pageCard(\d+)/);
    const idx = idMatch ? Number(idMatch[1]) : null;
    if (!idx) return;
    const pageName = (card.querySelector(`#pageName${idx}`)?.value || `ページ${idx}`).trim();
    const pagePurpose = (card.querySelector(`#pagePurpose${idx}`)?.value || "おまかせ").trim();
    const header = Array.from(card.querySelectorAll(`[id^=header${idx}_]:checked`)).map(e => e.value);
    const menu = Array.from(card.querySelectorAll(`[id^=menu${idx}_]:checked`)).map(e => e.value);
    const body = Array.from(card.querySelectorAll(`[id^=body${idx}_]:checked`)).map(e => e.value);
    const footer = Array.from(card.querySelectorAll(`[id^=footer${idx}_]:checked`)).map(e => e.value);
    pages.push({ pageName, pagePurpose, header, menu, body, footer });
  });
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

/* ---------------- 設計書自動生成（ローカル推定） ----------------
   ユーザーがAIを使わずに、ページ定義から自動的に
   - 機能一覧（表）
   - テーブル定義（表）
   - 画面遷移図（SVG）
   をローカルで生成して描画するユーティリティを追加しました。
*/
function autoGenerateDesignDocs() {
  updatePages();
  const container = document.getElementById('designDocsContainer');
  container.innerHTML = ''; // clear

  // 1) 機能一覧（HTMLテーブル）
  const funcTable = buildFunctionListTable(pages);
  container.appendChild(funcTable);

  // 2) テーブル定義（HTML）
  const tableDefs = buildTableDefinitions(pages);
  container.appendChild(tableDefs);

  // 3) 画面遷移図（SVG）
  const svgBox = document.createElement('div');
  svgBox.innerHTML = `<h3>画面遷移図</h3>`;
  svgBox.appendChild(buildTransitionSVG(pages));
  container.appendChild(svgBox);
}

/* ヘルパ: 機能一覧テーブルを構築 */
function buildFunctionListTable(pagesArr) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<h3>機能一覧</h3>';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.innerHTML = `
    <thead>
      <tr style="background:#e3f2fd">
        <th style="border:1px solid #ddd;padding:8px">ページ</th>
        <th style="border:1px solid #ddd;padding:8px">分類</th>
        <th style="border:1px solid #ddd;padding:8px">機能名</th>
        <th style="border:1px solid #ddd;padding:8px">処理詳細</th>
        <th style="border:1px solid #ddd;padding:8px">必要なDBテーブル名</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  pagesArr.forEach(p => {
    const mapToRows = (items, classification) => {
      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="border:1px solid #ddd;padding:8px">${escapeHtml(p.pageName)}</td>
          <td style="border:1px solid #ddd;padding:8px">${classification}</td>
          <td style="border:1px solid #ddd;padding:8px">${escapeHtml(item)}</td>
          <td style="border:1px solid #ddd;padding:8px">${escapeHtml(guessDetail(item))}</td>
          <td style="border:1px solid #ddd;padding:8px">${escapeHtml(guessDbTable(item))}</td>
        `;
        tbody.appendChild(tr);
      });
    };
    if (p.header.length) mapToRows(p.header, 'ヘッダー');
    if (p.menu.length) mapToRows(p.menu, 'メニュー');
    if (p.body.length) mapToRows(p.body, 'ボディ');
    if (p.footer.length) mapToRows(p.footer, 'フッター');
    // if page has form, add submission function row
    if (p.body.includes('フォーム')) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #ddd;padding:8px">${escapeHtml(p.pageName)}</td>
        <td style="border:1px solid #ddd;padding:8px">ボディ</td>
        <td style="border:1px solid #ddd;padding:8px">フォーム送信</td>
        <td style="border:1px solid #ddd;padding:8px">フォームの入力内容を保存・通知</td>
        <td style="border:1px solid #ddd;padding:8px">contacts / orders</td>
      `;
      tbody.appendChild(tr);
    }
  });

  // controls: copy/download
  const controls = document.createElement('div');
  controls.style.marginTop = '8px';
  controls.innerHTML = `
    <button onclick="copyRenderedTable(this, 'function')">機能一覧をコピー</button>
    <button onclick="downloadRenderedTable('function')">機能一覧をダウンロード</button>
  `;

  wrapper.appendChild(table);
  wrapper.appendChild(controls);
  return wrapper;
}

/* ヘルパ: テーブル定義を構築（ベースの users/products/orders, contacts を追加） */
function buildTableDefinitions(pagesArr) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<h3>テーブル定義書</h3>';
  // base tables
  const tables = [];

  tables.push({
    name: 'users',
    summary: 'ユーザー情報（会員）',
    columns: [
      { name: 'id', type: 'INT PK', detail: '主キー、自動採番' },
      { name: 'name', type: 'VARCHAR(100)', detail: '表示名' },
      { name: 'email', type: 'VARCHAR(200)', detail: 'メールアドレス（ログイン）' },
      { name: 'password', type: 'VARCHAR(255)', detail: 'ハッシュ化されたパスワード' },
      { name: 'created_at', type: 'DATETIME', detail: '作成日時' }
    ]
  });

  tables.push({
    name: 'products',
    summary: '商品マスタ（EC用）',
    columns: [
      { name: 'id', type: 'INT PK', detail: '主キー' },
      { name: 'name', type: 'VARCHAR(200)', detail: '商品名' },
      { name: 'description', type: 'TEXT', detail: '商品説明' },
      { name: 'price', type: 'DECIMAL(10,2)', detail: '価格' },
      { name: 'stock', type: 'INT', detail: '在庫数' },
      { name: 'category_id', type: 'INT FK', detail: 'カテゴリID' }
    ]
  });

  tables.push({
    name: 'orders',
    summary: '注文情報',
    columns: [
      { name: 'id', type: 'INT PK', detail: '主キー' },
      { name: 'user_id', type: 'INT FK', detail: '注文者（users）' },
      { name: 'total_price', type: 'DECIMAL(10,2)', detail: '合計金額' },
      { name: 'status', type: 'VARCHAR(30)', detail: '注文ステータス' },
      { name: 'created_at', type: 'DATETIME', detail: '注文日時' }
    ]
  });

  // If any page contains "フォーム", add contacts table
  const needsContacts = pagesArr.some(p => p.body.includes('フォーム'));
  if (needsContacts) {
    tables.push({
      name: 'contacts',
      summary: 'お問い合わせ（フォーム送信用）',
      columns: [
        { name: 'id', type: 'INT PK', detail: '主キー' },
        { name: 'name', type: 'VARCHAR(100)', detail: '送信者名' },
        { name: 'email', type: 'VARCHAR(200)', detail: '送信者メール' },
        { name: 'message', type: 'TEXT', detail: '送信内容' },
        { name: 'created_at', type: 'DATETIME', detail: '送信日時' }
      ]
    });
  }

  tables.forEach(tbl => {
    const tblDiv = document.createElement('div');
    tblDiv.style.marginBottom = '12px';
    tblDiv.innerHTML = `<h4>${escapeHtml(tbl.name)} <small style="color:#666">- ${escapeHtml(tbl.summary)}</small></h4>`;
    const t = document.createElement('table');
    t.style.width = '100%';
    t.style.borderCollapse = 'collapse';
    t.innerHTML = `
      <thead>
        <tr style="background:#f1f8e9">
          <th style="border:1px solid #ddd;padding:8px">フィールド名</th>
          <th style="border:1px solid #ddd;padding:8px">型</th>
          <th style="border:1px solid #ddd;padding:8px">詳細</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tb = t.querySelector('tbody');
    tbl.columns.forEach(col => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #ddd;padding:8px">${escapeHtml(col.name)}</td>
        <td style="border:1px solid #ddd;padding:8px">${escapeHtml(col.type)}</td>
        <td style="border:1px solid #ddd;padding:8px">${escapeHtml(col.detail)}</td>
      `;
      tb.appendChild(tr);
    });

    // add CREATE TABLE style block
    const createSql = generateCreateTableSQL(tbl);
    const pre = document.createElement('pre');
    pre.textContent = createSql;

    tblDiv.appendChild(t);
    tblDiv.appendChild(pre);
    wrapper.appendChild(tblDiv);
  });

  // controls
  const controls = document.createElement('div');
  controls.style.marginTop = '8px';
  controls.innerHTML = `
    <button onclick="copyRenderedTable(this, 'table')">テーブル定義をコピー</button>
    <button onclick="downloadRenderedTable('table')">テーブル定義をダウンロード</button>
  `;
  wrapper.appendChild(controls);

  return wrapper;
}

function generateCreateTableSQL(table) {
  const cols = table.columns.map(c => `  ${c.name} ${c.type}`).join(',\n');
  return `CREATE TABLE ${table.name} (\n${cols}\n);`;
}

/* ヘルパ: 画面遷移図SVGを構築 */
function buildTransitionSVG(pagesArr) {
  // create container svg element
  const svgNS = "http://www.w3.org/2000/svg";
  // compute layout
  const width = Math.max(600, pagesArr.length * 200);
  const height = 160;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // defs (arrow)
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#1976d2"></path>
    </marker>
  `;
  svg.appendChild(defs);

  const nodeW = 140;
  const nodeH = 44;
  const marginX = 40;
  const gap = (width - marginX * 2 - nodeW) / Math.max(1, pagesArr.length - 1);

  // place nodes horizontally centered
  pagesArr.forEach((p, idx) => {
    const x = marginX + idx * gap;
    const y = 30;
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', nodeW);
    rect.setAttribute('height', nodeH);
    rect.setAttribute('rx', 8);
    rect.setAttribute('ry', 8);
    rect.setAttribute('fill', '#64b5f6');
    rect.setAttribute('stroke', '#1976d2');
    rect.setAttribute('stroke-width', '1');
    svg.appendChild(rect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', x + nodeW / 2);
    text.setAttribute('y', y + nodeH / 2 + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '14');
    text.setAttribute('fill', '#fff');
    text.textContent = p.pageName;
    svg.appendChild(text);

    // arrows to next
    if (idx < pagesArr.length - 1) {
      const x1 = x + nodeW;
      const y1 = y + nodeH / 2;
      const x2 = marginX + (idx + 1) * gap;
      const y2 = y + nodeH / 2;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1 + 8);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2 - 8);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#1976d2');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrow)');
      svg.appendChild(line);
    }
  });

  return svg;
}

/* 推測関数: コンポーネント名から処理詳細を返す */
function guessDetail(item) {
  if (/検索|サーチ|検索ボックス/.test(item)) return '入力キーワードでDB検索を行い結果を表示';
  if (/カテゴリ|メニュー/.test(item)) return 'カテゴリ別に一覧表示、選択でフィルタ';
  if (/カルーセル|バナー/.test(item)) return '画像やリンクで訴求、クリックでリンク遷移';
  if (/フォーム/.test(item)) return 'ユーザー入力を受け取り、サーバへ送信';
  if (/ログイン/.test(item)) return '認証処理（メール/パスワードまたはOAuth）';
  if (/通知|SNS|コピーライト/.test(item)) return '表示のみ';
  return '表示または簡易操作';
}

/* 推測関数: コンポーネントから必要DBテーブルを推定 */
function guessDbTable(item) {
  if (/商品|新着|price|product|商品/.test(item)) return 'products';
  if (/カート|注文|order|注文/.test(item)) return 'orders';
  if (/ログイン|会員|ユーザー|user/.test(item)) return 'users';
  if (/フォーム|問い合わせ|contact/.test(item)) return 'contacts';
  return '-';
}

/* ---------------- 描画のコピー・DLユーティリティ ---------------- */
function copyRenderedTable(btn, kind) {
  // copy innerText of corresponding container
  let el;
  if (kind === 'function') el = btn.parentElement.previousSibling; // rough mapping
  if (kind === 'table') el = btn.parentElement.previousSibling;
  // fallback: copy whole designDocsContainer text
  if (!el) el = document.getElementById('designDocsContainer');
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text).then(() => alert('コピーしました！'), () => alert('コピーに失敗しました'));
}

function downloadRenderedTable(kind) {
  let content = '';
  let filename = '設計書.txt';
  if (kind === 'function') {
    content = document.querySelector('#designDocsContainer')?.querySelector('h3')?.nextElementSibling?.outerText || document.getElementById('designDocsContainer').innerText;
    filename = '機能一覧.txt';
  } else if (kind === 'table') {
    content = document.getElementById('designDocsContainer')?.innerText || '';
    filename = 'テーブル定義書.txt';
  } else {
    content = document.getElementById('designDocsContainer')?.innerText || '';
  }
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ---------------- ページコード生成・プレビュー ----------------
   各ページに対し簡易的なHTMLを生成（ヘッダー/メニュー/ボディ/フッターの表示を行う）
*/
function generatePageCode() {
  updatePages();
  if (pages.length === 0) {
    alert('ページがまだありません。ページを追加してください。');
    return;
  }
  const results = pages.map((p, idx) => {
    const html = buildSinglePageHtml(p, idx + 1);
    return { filename: `${sanitizeFilename(p.pageName || 'page')}.html`, content: html };
  });

  if (results.length > 0) {
    const first = results[0];
    // show in codePreview iframe if exists, and pagePreview if exists
    const codePreview = document.getElementById('codePreview');
    if (codePreview) codePreview.srcdoc = first.content;
    // store for download
    window.__generatedPages = results;
    alert('ページコードを生成しました。プレビューは最初のページです。');
  }
}

function buildSinglePageHtml(pageObj, pageIndex) {
  const css = `
    body{ font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif; padding:20px; line-height:1.6; background:#f6f9ff;}
    header, nav, main, footer{ padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e6e6e6; background:#fff; }
    header{ background:linear-gradient(145deg,#82b1ff,#64b5f6); color:#fff; }
    nav{ background:#f7fbff; }
    .section-title{ font-weight:700; color:#1976d2; margin-bottom:6px; }
  `;
  const makeList = (arr) => arr && arr.length ? `<ul>${arr.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` : '<p>なし</p>';
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
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  updatePages();
  updateEstimate();
});
