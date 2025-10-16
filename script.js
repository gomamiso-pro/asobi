let pageCount=0;
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

function addPage() {
  pageCount++;
  const container=document.getElementById('pageContainer');
  const card=document.createElement('div');
  card.className='page-card';
  card.id=`pageCard${pageCount}`;
  card.innerHTML=`
    <h3>ページ${pageCount} <button class="delete-btn" onclick="deletePage(${pageCount})">削除</button></h3>
    <label>ページ名</label>
    <input type="text" id="pageName${pageCount}" placeholder="例: トップページ">
    ${createSectionCheckboxes("ヘッダー", `header${pageCount}`, sectionOptions.header)}
    ${createSectionCheckboxes("メニュー", `menu${pageCount}`, sectionOptions.menu)}
    ${createSectionCheckboxes("ボディ", `body${pageCount}`, sectionOptions.body)}
    ${createSectionCheckboxes("フッター", `footer${pageCount}`, sectionOptions.footer)}
  `;
  container.appendChild(card);
  updateEstimate();
}

function deletePage(id){const card=document.getElementById(`pageCard${id}`);if(card) card.remove();updateEstimate();}

function showPreview(){
  const pages=[];
  for(let i=1;i<=pageCount;i++){
    const card=document.getElementById(`pageCard${i}`);
    if(!card) continue;
    const pageName=document.getElementById(`pageName${i}`).value||`ページ${i}`;
    const header=Array.from(card.querySelectorAll(`[id^=header${i}_]:checked`)).map(e=>e.value);
    const menu=Array.from(card.querySelectorAll(`[id^=menu${i}_]:checked`)).map(e=>e.value);
    const body=Array.from(card.querySelectorAll(`[id^=body${i}_]:checked`)).map(e=>e.value);
    const footer=Array.from(card.querySelectorAll(`[id^=footer${i}_]:checked`)).map(e=>e.value);
    pages.push({pageName,header,menu,body,footer});
  }
  let html='';
  pages.forEach(p=>{html+=`<h2>${p.pageName}</h2><div><strong>ヘッダー:</strong> ${p.header.join(", ")||"なし"}</div><div><strong>メニュー:</strong> ${p.menu.join(", ")||"なし"}</div><div><strong>ボディ:</strong> ${p.body.join(", ")||"なし"}</div><div><strong>フッター:</strong> ${p.footer.join(", ")||"なし"}</div><hr>`;});
  document.getElementById('iframePreview').srcdoc=html;

  const output={
    projectOverview: document.getElementById('projectOverviewInput').value||"おまかせ",
    pageType: document.getElementById('pageTypeSelect').value,
    pagePurpose: document.getElementById('pagePurposeInput').value||"おまかせ",
    userTarget: document.getElementById('userTargetSelect').value,
    design: document.getElementById('designSelect').value,
    dataRequirement: document.getElementById('dataRequirementInput').value||"おまかせ",
    operation: document.getElementById('operationInput').value||"おまかせ",
    languages: Array.from(document.querySelectorAll('[id^=lang_]:checked')).map(e=>e.value),
    server: document.getElementById('serverSelect').value,
    database: document.getElementById('databaseSelect').value,
    designFramework: document.getElementById('designFrameworkSelect').value,
    auth: document.getElementById('authSelect').value,
    security: document.getElementById('securityInput').value||"おまかせ",
    pages: pages
  };
  document.getElementById('jsonOutput').textContent=JSON.stringify(output,null,2);
  updateEstimate();
}

function updateEstimate(){
  const tbody=document.querySelector('#estimateTable tbody');tbody.innerHTML='';let subtotal=0;
  const basic=50000;subtotal+=basic;tbody.innerHTML+=`<tr><td>基本設計</td><td>${basic}</td><td>1</td><td>${basic}</td></tr>`;
  const pageUnit=30000;const pages=document.querySelectorAll('.page-card').length;subtotal+=pageUnit*pages;if(pages>0) tbody.innerHTML+=`<tr><td>ページ追加</td><td>${pageUnit}</td><td>${pages}</td><td>${pageUnit*pages}</td></tr>`;
  const sectionUnit=10000;let sectionCount=0;for(let i=1;i<=pageCount;i++){const card=document.getElementById(`pageCard${i}`);if(!card) continue;sectionCount+=card.querySelectorAll('input[type=checkbox]:checked').length;}
  subtotal+=sectionUnit*sectionCount;if(sectionCount>0) tbody.innerHTML+=`<tr><td>セクション追加</td><td>${sectionUnit}</td><td>${sectionCount}</td><td>${sectionUnit*sectionCount}</td></tr>`;
const extraUnit = 20000; 
  subtotal += extraUnit; 
  tbody.innerHTML += `<tr><td>データ・認証・フレームワーク設定</td><td>${extraUnit}</td><td>1</td><td>${extraUnit}</td></tr>`;

  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('total').textContent = Math.round(subtotal * 1.1); // 税込10%
}
