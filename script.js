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
  let html = `<h3>機能一覧</h3>`;
  html += `<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr><th>分類</th><th>機能名</th><th>詳細</th></tr>
    </thead><tbody>`;
  
  pages.forEach(p => {
    const addRows = (area, name, suffix) => {
      area.forEach(item => {
        html += `<tr><td>${name}</td><td>${item}</td><td>${item}${suffix}</td></tr>`;
      });
    };
    addRows(p.header, "ヘッダー", "操作");
    addRows(p.menu, "メニュー", "操作");
    addRows(p.body, "ボディ", "表示/操作");
    addRows(p.footer, "フッター", "表示");
  });

  html += `</tbody></table>`;
  return html;
}


// テーブル定義書
function generateTableDefinition() {
  const tables = {
    users: [
      { field: "id", type: "INT", detail: "主キー" },
      { field: "name", type: "VARCHAR", detail: "ユーザー名" },
      { field: "email", type: "VARCHAR", detail: "メールアドレス" },
      { field: "password", type: "VARCHAR", detail: "ハッシュ化されたパスワード" },
    ],
    products: [
      { field: "id", type: "INT", detail: "主キー" },
      { field: "name", type: "VARCHAR", detail: "商品名" },
      { field: "price", type: "INT", detail: "価格（円）" },
      { field: "stock", type: "INT", detail: "在庫数" },
      { field: "category_id", type: "INT", detail: "カテゴリ外部キー" },
    ],
    orders: [
      { field: "id", type: "INT", detail: "主キー" },
      { field: "user_id", type: "INT", detail: "ユーザーID外部キー" },
      { field: "total_price", type: "INT", detail: "合計金額" },
      { field: "status", type: "VARCHAR", detail: "注文ステータス" },
      { field: "created_at", type: "DATETIME", detail: "注文日時" },
    ],
  };

  let html = `<h3>テーブル定義書</h3>`;
  for (const [tableName, fields] of Object.entries(tables)) {
    html += `<h4>${tableName} テーブル</h4>`;
    html += `<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
      <thead><tr><th>フィールド名</th><th>型</th><th>詳細</th></tr></thead><tbody>`;
    fields.forEach(f => {
      html += `<tr><td>${f.field}</td><td>${f.type}</td><td>${f.detail}</td></tr>`;
    });
    html += `</tbody></table><br>`;
  }
  return html;
}


// 画面遷移図
function generateTransitionDiagram() {
  const screens = ["トップページ", "商品ページ", "カートページ", "注文確認ページ", "注文完了ページ"];
  
  let html = `<h3>画面遷移図</h3>`;
  html += `<div style="display: flex; gap: 20px; overflow-x: auto; padding: 10px;">`;

  screens.forEach((screen, index) => {
    const next = screens[index + 1];
    html += `
      <div style="min-width: 200px; border: 1px solid #ccc; padding: 16px; border-radius: 8px; background: #f9f9f9; box-shadow: 0 0 4px #ccc;">
        <h4>${screen}</h4>
        ${next ? `<div style="text-align: center; margin-top: 10px;">↓ 遷移</div>` : ""}
        ${next ? `<div style="margin-top: 10px;">→ <strong>${next}</strong></div>` : ""}
      </div>`;
  });

  html += `</div>`;
  return html;
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
