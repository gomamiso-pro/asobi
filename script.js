let pageCount = 0;

const sectionOptions = {
  header: ["ロゴ","検索ボックス","通知アイコン","言語切替","ログインボタン"],
  menu: ["カテゴリメニュー","ドロップダウン","パンくずリスト","サイドメニュー"],
  body: ["カルーセル","新着商品一覧","特集バナー","記事リスト","フォーム"],
  footer: ["会社情報","SNSリンク","コピーライト","フッターメニュー"]
};

function createSectionCheckboxes(sectionName, idPrefix, options){
  let html = `<div class="section-title">${sectionName}</div>`;
  options.forEach((opt,i)=>{
    html += `<label><input type="checkbox" id="${idPrefix}_${i}" value="${opt}">${opt}</label>`;
  });
  return html;
}

function addPage(){
  pageCount++;
  const container = document.getElementById('pageContainer');
  const card = document.createElement('div');
  card.className = 'page-card';
  card.id = `pageCard${pageCount}`;
  card.innerHTML = `
    <h3>ページ${pageCount} <button class="delete-btn" onclick="deletePage(${pageCount})">削除</button></h3>
    <label>ページ名</label><input type="text" id="pageName${pageCount}" placeholder="例: トップページ">
    <label>ページ目的</label><textarea id="pagePurpose${pageCount}" placeholder="ページの目的を入力"></textarea>
    ${createSectionCheckboxes("ヘッダー", `header${pageCount}`, sectionOptions.header)}
    ${createSectionCheckboxes("メニュー", `menu${pageCount}`, sectionOptions.menu)}
    ${createSectionCheckboxes("ボディ", `body${pageCount}`, sectionOptions.body)}
    ${createSectionCheckboxes("フッター", `footer${pageCount}`, sectionOptions.footer)}
  `;
  container.appendChild(card);
  updateEstimate();
}

function deletePage(id){
  const card = document.getElementById(`pageCard${id}`);
  if(card) card.remove();
  updateEstimate();
}

function showPreview(){
  const pages = [];
  for(let i=1;i<=pageCount;i++){
    const card = document.getElementById(`pageCard${i}`);
    if(!card) continue;
    const pageName = document.getElementById(`pageName${i}`).value || `ページ${i}`;
    const pagePurpose = document.getElementById(`pagePurpose${i}`).value || "おまかせ";
    const header = Array.from(card.querySelectorAll(`[id^=header${i}_]:checked`)).map(e=>e.value);
    const menu = Array.from(card.querySelectorAll(`[id^=menu${i}_]:checked`)).map(e=>e.value);
    const body = Array.from(card.querySelectorAll(`[id^=body${i}_]:checked`)).map(e=>e.value);
    const footer = Array.from(card.querySelectorAll(`[id^=footer${i}_]:checked`)).map(e=>e.value);
    pages.push({pageName, pagePurpose, header, menu, body, footer});
  }

  // プレビュー表示
  let html = '';
  pages.forEach(p=>{
    html += `<h2>${p.pageName}</h2>
             <div><strong>目的:</strong> ${p.pagePurpose}</div>
             <div><strong>ヘッダー:</strong> ${p.header.join(", ") || "なし"}</div>
             <div><strong>メニュー:</strong> ${p.menu.join(", ") || "なし"}</div>
             <div><strong>ボディ:</strong> ${p.body.join(", ") || "なし"}</div>
             <div><strong>フッター:</strong> ${p.footer.join(", ") || "なし"}</div><hr>`;
  });
  document.getElementById('iframePreview').srcdoc = html;

// 機能一覧
function generateFeatureList(pages) {
  let funcHtml = `<h3>機能一覧</h3>`;
  pages.forEach(p => {
    funcHtml += `<div>${p.pageName}機能:<ul>`;
    if (p.header.length) p.header.forEach(h => funcHtml += `<li>${h}操作</li>`);
    if (p.menu.length) p.menu.forEach(m => funcHtml += `<li>${m}操作</li>`);
    if (p.body.length) p.body.forEach(b => funcHtml += `<li>${b}表示/操作</li>`);
    if (p.footer.length) p.footer.forEach(f => funcHtml += `<li>${f}表示</li>`);
    funcHtml += `</ul></div>`;
  });
  return funcHtml;
}

// テーブル定義書
function generateTableDefinition() {
  let tableHtml = `<h3>テーブル定義書</h3>`;
  tableHtml += `<div><strong>users:</strong> id, name, email, password<br>
                 <strong>products:</strong> id, name, price, stock, category_id<br>
                 <strong>orders:</strong> id, user_id, total_price, status, created_at</div>`;
  return tableHtml;
}

// 画面遷移図
function generateTransitionDiagram() {
  let transHtml = `<h3>画面遷移図</h3>`;
  transHtml += `<svg width="100%" height="120">
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#2196f3" />
      </marker>
    </defs>
    <line x1="50" y1="20" x2="250" y2="20" stroke="#2196f3" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="250" y1="20" x2="450" y2="20" stroke="#2196f3" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="450" y1="20" x2="650" y2="20" stroke="#2196f3" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="50" y="15" fill="#000">トップページ</text>
    <text x="250" y="15" fill="#000">商品ページ</text>
    <text x="450" y="15" fill="#000">カートページ</text>
    <text x="650" y="15" fill="#000">注文確認ページ</text>
  </svg>`;
  return transHtml;
}
// 各設計書の処理を呼び出し
function generateDesignDocs() {
  const designContainer = document.getElementById('designDocsContainer');
  designContainer.innerHTML = generateSystemDiagram(pages) + generateFeatureList(pages);

  const tableDefinitionContainer = document.getElementById('tableDefinitionContainer');
  tableDefinitionContainer.innerHTML = generateTableDefinition();

  const transitionDiagramContainer = document.getElementById('transitionDiagramContainer');
  transitionDiagramContainer.innerHTML = generateTransitionDiagram();
}

// 設計書の生成を実行
generateDesignDocs();
  // JSON生成
  const output = {
    projectOverview: document.getElementById('projectOverviewInput').value || "おまかせ",
    pageType: document.getElementById('pageTypeSelect').value,
    userTarget: document.getElementById('userTargetSelect').value,
    design: document.getElementById('designSelect').value,
    dataRequirement: document.getElementById('dataRequirementInput').value || "おまかせ",
    operation: document.getElementById('operationInput').value || "おまかせ",
    languages: Array.from(document.querySelectorAll('[id^=lang_]:checked')).map(e=>e.value),
    server: document.getElementById('serverSelect').value,
    database: document.getElementById('databaseSelect').value,
    designFramework: document.getElementById('designFrameworkSelect').value,
    auth: document.getElementById('authSelect').value,
    security: document.getElementById('securityInput').value || "おまかせ",
    pages: pages
  };
  document.getElementById('jsonOutput').textContent = JSON.stringify(output,null,2);

  // AI指示文作成
  document.getElementById('aiInstructions').value = `このプロジェクトに基づき、HTML/CSS/JSでウェブサイトを構築してください。\n
ページ構成: ${pages.map(p=>p.pageName).join(", ")}\n
機能: ${pages.map(p=>[...p.header,...p.menu,...p.body,...p.footer].join(", ")).join("; ")}\n
デザイン方針: ${output.design}\n
使用言語: ${output.languages.join(", ")}\n
サーバ/DB/認証: ${output.server}/${output.database}/${output.auth}`;
  
  updateEstimate();
}

function updateEstimate(){
  const tbody = document.querySelector('#estimateTable tbody');
  tbody.innerHTML='';
  let subtotal = 0;

  const basic = 50000;
  subtotal += basic;
  tbody.innerHTML += `<tr><td>基本設計</td><td>${basic}</td><td>1</td><td>${basic}</td></tr>`;

  const pageUnit = 30000;
  const pages = document.querySelectorAll('.page-card').length;
  subtotal += pageUnit * pages;
  if(pages>0) tbody.innerHTML += `<tr><td>ページ追加</td><td>${pageUnit}</td><td>${pages}</td><td>${pageUnit*pages}</td></tr>`;

  const sectionUnit = 10000;
  let sectionCount = 0;
  for(let i=1;i<=pageCount;i++){
    const card = document.getElementById(`pageCard${i}`);
    if(!card) continue;
    sectionCount += card.querySelectorAll('input[type=checkbox]:checked').length;
  }
  subtotal += sectionUnit * sectionCount;
  if(sectionCount>0) tbody.innerHTML += `<tr><td>セクション追加</td><td>${sectionUnit}</td><td>${sectionCount}</td><td>${sectionUnit*sectionCount}</td></tr>`;

  const extraUnit = 20000;
  subtotal += extraUnit;
  tbody.innerHTML += `<tr><td>データ・認証・フレームワーク設定</td><td>${extraUnit}</td><td>1</td><td>${extraUnit}</td></tr>`;

  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('total').textContent = Math.round(subtotal*1.1);
}

// コピー機能
function copyInstructions(){
  const instr = document.getElementById('aiInstructions');
  instr.select();
  navigator.clipboard.writeText(instr.value);
  alert("指示文をコピーしました！");
}
