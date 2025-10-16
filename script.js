let pageCount = 0;
const sectionOptions = {
  header: ["ロゴ", "検索ボックス", "通知アイコン", "言語切替", "ログインボタン"],
  menu: ["カテゴリメニュー", "ドロップダウン", "パンくずリスト", "サイドメニュー"],
  body: ["カルーセル", "新着商品一覧", "特集バナー", "記事リスト", "フォーム"],
  footer: ["会社情報", "SNSリンク", "コピーライト", "フッターメニュー"]
};

function createSectionCheckboxes(sectionName, idPrefix, options){
  let html = `<div class="section-title">${sectionName}</div>`;
  options.forEach((opt, i) => {
    html += `<label><input type="checkbox" id="${idPrefix}_${i}" value="${opt}">${opt}</label>`;
  });
  return html;
}

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
    <textarea id="pagePurpose${pageCount}" placeholder="ページの目的を入力"></textarea>
    ${createSectionCheckboxes("ヘッダー", `header${pageCount}`, sectionOptions.header)}
    ${createSectionCheckboxes("メニュー", `menu${pageCount}`, sectionOptions.menu)}
    ${createSectionCheckboxes("ボディ", `body${pageCount}`, sectionOptions.body)}
    ${createSectionCheckboxes("フッター", `footer${pageCount}`, sectionOptions.footer)}
  `;
  container.appendChild(card);
  updateEstimate();
}

function deletePage(id) {
  const card = document.getElementById(`pageCard${id}`);
  if(card) card.remove();
  updateEstimate();
}

function showPreview() {
  const pages = [];
  for(let i=1;i<=pageCount;i++){
    const card = document.getElementById(`pageCard${i}`);
    if(!card) continue;
    const pageName = document.getElementById(`pageName${i}`).value || `ページ${i}`;
    const pagePurpose = document.getElementById(`pagePurpose${i}`).value || "おまかせ";
    const header = Array.from(card.querySelectorAll(`[id^=header${i}_]:checked`)).map(e => e.value);
    const menu = Array.from(card.querySelectorAll(`[id^=menu${i}_]:checked`)).map(e => e.value);
    const body = Array.from(card.querySelectorAll(`[id^=body${i}_]:checked`)).map(e => e.value);
    const footer = Array.from(card.querySelectorAll(`[id^=footer${i}_]:checked`)).map(e => e.value);
    pages.push({pageName, pagePurpose, header, menu, body, footer});
  }

  // 簡易プレビュー表示
  let html = '';
  pages.forEach(p => {
    html += `<h2>${p.pageName}</h2>`;
    html += `<div><strong>目的:</strong> ${p.pagePurpose}</div>`;
    html += `<div><strong>ヘッダー:</strong> ${p.header.join(", ") || "なし"}</div>`;
    html += `<div><strong>メニュー:</strong> ${p.menu.join(", ") || "なし"}</div>`;
    html += `<div><strong>ボディ:</strong> ${p.body.join(", ") || "なし"}</div>`;
    html += `<div><strong>フッター:</strong> ${p.footer.join(", ") || "なし"}</div><hr>`;
  });
  document.getElementById('iframePreview').srcdoc = html;

  // JSON出力
  const output = {
    projectOverview: document.getElementById('projectOverviewInput').value || "おまかせ",
    pageType: document.getElementById('pageTypeSelect').value,
    userTarget: document.getElementById('userTargetSelect').value,
    design: document.getElementById('designSelect').value,
    dataRequirement: document.getElementById('dataRequirementInput').value || "おまかせ",
    operation: document.getElementById('operationInput').value || "おまかせ",
    languages: Array.from(document.querySelectorAll('[id^=lang_]:checked')).map(e => e.value),
    server: document.getElementById('serverSelect').value,
    database: document.getElementById('databaseSelect').value,
    designFramework: document.getElementById('designFrameworkSelect').value,
    auth: document.getElementById('authSelect').value,
    security: document.getElementById('securityInput').value || "おまかせ",
    pages: pages,
    // 設計書サンプル
    designDocuments: {
      systemStructureDiagram: pages.map(p => p.pageName + "構造図"),
      functionList: pages.map(p => p.pageName + "機能一覧"),
      tableDefinition: pages.map(p => p.pageName + "テーブル定義書"),
      screenTransitionDiagram: pages.map(p => p.pageName + "画面遷移図")
    }
  };

  document.getElementById('jsonOutput').textContent = JSON.stringify(output, null, 2);
  updateEstimate();
}

function updateEstimate(){
  const tbody = document.querySelector('#estimateTable tbody');
  tbody.innerHTML = '';
  let subtotal = 0;

  // 基本設計
  const basic = 50000;
  subtotal += basic;
  tbody.innerHTML += `<tr><td>基本設計</td><td>${basic}</td><td>1</td><td>${basic}</td></tr>`;

  // ページ追加
  const pageUnit = 30000;
  const pages = document.querySelectorAll('.page-card').length;
  subtotal += pageUnit * pages;
  if(pages>0) tbody.innerHTML += `<tr><td>ページ追加</td><td>${pageUnit}</td><td>${pages}</td><td>${pageUnit*pages}</td></tr>`;

  // 各セクション 1セクション1万円
  const sectionUnit = 10000;
  let sectionCount = 0;
  for(let i=1;i<=pageCount;i++){
    const card = document.getElementById(`pageCard${i}`);
    if(!card) continue;
    sectionCount += card.querySelectorAll('input[type=checkbox]:checked').length;
  }
  subtotal += sectionUnit * sectionCount;
  if(sectionCount>0) tbody.innerHTML += `<tr><td>セクション追加</td><td>${sectionUnit}</td><td>${sectionCount}</td><td>${sectionUnit*sectionCount}</td></tr>`;

  // データ・認証・フレームワークまとめて 2万円
  const extraUnit = 20000;
  subtotal += extraUnit;
  tbody.innerHTML += `<tr><td>データ・認証・フレームワーク設定</td><td>${extraUnit}</td><td>1</td><td>${extraUnit}</td></tr>`;

  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('total').textContent = Math.round(subtotal*1.1);
}
