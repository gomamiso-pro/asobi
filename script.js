let pageCount = 0;
let pages = []; // ページ情報を保持する配列

const sectionOptions = {
	header: ["ロゴ","検索ボックス","通知アイコン","言語切替","ログインボタン"],
	menu: ["カテゴリメニュー","ドロップダウン","パンくずリスト","サイドメニュー"],
	body: ["カルーセル","新着商品一覧","特集バナー","記事リスト","フォーム"],
	footer: ["会社情報","SNSリンク","コピーライト","フッターメニュー"]
};

// セクションのチェックボックスを作成
function createSectionCheckboxes(sectionName, idPrefix, options) {
	let html = `<div class="section-title">${sectionName}</div>`;
	options.forEach((opt, i) => {
		html += `<label>
			<input type="checkbox" id="${idPrefix}_${i}" value="${opt}">${opt}
		</label>`;
	});
	return html;
}

// ページを追加
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
		<label>ページ目的</label>
		<textarea id="pagePurpose${pageCount}" placeholder="ページの目的を入力"></textarea>
		${createSectionCheckboxes("ヘッダー", `header${pageCount}`, sectionOptions.header)}
		${createSectionCheckboxes("メニュー", `menu${pageCount}`, sectionOptions.menu)}
		${createSectionCheckboxes("ボディ", `body${pageCount}`, sectionOptions.body)}
		${createSectionCheckboxes("フッター", `footer${pageCount}`, sectionOptions.footer)}
	`;
	container.appendChild(card);

	updatePages();
	generateDesignDocs();
	updateEstimate();
}

// ページを削除
function deletePage(id) {
	const card = document.getElementById(`pageCard${id}`);
	if (card) {
		card.remove();
	}

	updatePages();
	generateDesignDocs();
	updateEstimate();
}

// pages 配列を最新に更新
function updatePages() {
	pages = [];
	for (let i = 1; i <= pageCount; i++) {
		const card = document.getElementById(`pageCard${i}`);
		if (card) {
			const pageName = document.getElementById(`pageName${i}`).value || `ページ${i}`;
			const pagePurpose = document.getElementById(`pagePurpose${i}`).value || "おまかせ";
			const header = Array.from(card.querySelectorAll(`[id^=header${i}_]:checked`)).map(e => e.value);
			const menu = Array.from(card.querySelectorAll(`[id^=menu${i}_]:checked`)).map(e => e.value);
			const body = Array.from(card.querySelectorAll(`[id^=body${i}_]:checked`)).map(e => e.value);
			const footer = Array.from(card.querySelectorAll(`[id^=footer${i}_]:checked`)).map(e => e.value);
			pages.push({ pageName, pagePurpose, header, menu, body, footer });
		}
	}
}

// プレビュー表示
function showPreview() {
	updatePages();

	if (pages.length === 0) {
		alert("ページが1件もありません。まずページを追加してください。");
		return;
	}

	let html = '';
	pages.forEach(p => {
		html += `<h2>${p.pageName}</h2>
		<div><strong>目的:</strong> ${p.pagePurpose}</div>
		<div><strong>ヘッダー:</strong> ${p.header.join(", ") || "なし"}</div>
		<div><strong>メニュー:</strong> ${p.menu.join(", ") || "なし"}</div>
		<div><strong>ボディ:</strong> ${p.body.join(", ") || "なし"}</div>
		<div><strong>フッター:</strong> ${p.footer.join(", ") || "なし"}</div>
		<hr>`;
	});
	document.getElementById('iframePreview').srcdoc = html;
}

// 設計書（機能一覧）生成
function generateFunctionList(pages) {
	let html = `<h3>機能一覧</h3>`;
	html += `<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
	<thead>
		<tr><th>分類</th><th>機能名</th><th>詳細</th></tr>
	</thead><tbody>`;

// 設計書（機能一覧）生成
function generateFunctionList(pages) {
	if (pages.length === 0) {
		return "<p>ページが追加されていません。</p>";
	}

	let html = `<h3>機能一覧</h3>`;
	html += `<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
	<thead>
		<tr><th>分類</th><th>機能名</th><th>詳細</th></tr>
	</thead><tbody>`;

	// ページごとに処理
	pages.forEach(p => {
		const addRows = (area, name) => {
			area.forEach(item => {
				let detail = "";
				switch(name){
					case "ヘッダー":
						if(item==="ロゴ") detail="トップページリンク付きロゴ";
						else if(item==="検索ボックス") detail="サイト内検索ボックス設置";
						else if(item==="通知アイコン") detail="通知アイコン表示";
						else detail=item+"表示";
						break;
					case "メニュー":
						if(item==="ドロップダウン") detail="カテゴリ別ドロップダウンメニュー";
						else if(item==="パンくずリスト") detail="ページ階層表示";
						else detail=item+"機能";
						break;
					case "ボディ":
						if(item==="カルーセル") detail="トップページメインビジュアルカルーセル";
						else if(item==="フォーム") detail="ユーザー入力フォーム設置";
						else detail=item+"表示/操作";
						break;
					case "フッター":
						if(item==="SNSリンク") detail="フッターにSNSリンク";
						else if(item==="コピーライト") detail="著作権情報表示";
						else detail=item+"表示";
						break;
				}
				html += `<tr><td>${name}</td><td>${item}</td><td>${detail}</td></tr>`;
			});
		};
		addRows(p.header, "ヘッダー");
		addRows(p.menu, "メニュー");
		addRows(p.body, "ボディ");
		addRows(p.footer, "フッター");
	});
	html += `</tbody></table>`;
	return html;
}

// テーブル定義書生成
function generateTableDefinition(pages) {
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

// 画面遷移図生成
function generateTransitionDiagram() {
	const screens = ["トップページ", "商品ページ", "カートページ", "注文確認ページ", "注文完了ページ"];

	let html = `<h3>画面遷移図</h3>`;
	html += `<div style="display: flex; gap: 20px; overflow-x: auto; padding: 10px;">`;

	screens.forEach((screen, index) => {
		const next = screens[index + 1];
		html += `<div style="min-width: 200px; border: 1px solid #ccc; padding: 16px; border-radius: 8px; background: #f9f9f9; box-shadow: 0 0 4px #ccc;">
			<h4>${screen}</h4>`;
		if (next) {
			html += `<div style="text-align: center; margin-top: 10px;">↓ 遷移</div>`;
			html += `<div style="margin-top: 10px;">→ <strong>${next}</strong></div>`;
		}
		html += `</div>`;
	});

	html += `</div>`;
	return html;
}

// 設計書生成
function generateDesignDocs() {
	if (!document.getElementById('pageContainer')) {
		return;
	}

	updatePages();

	const functionListContainer = document.getElementById('generateFunctionList');
	functionListContainer.innerHTML = generateFunctionList(pages);

	const tableDefinitionContainer = document.getElementById('generateTableDefinition');
	tableDefinitionContainer.innerHTML = generateTableDefinition(pages);

	const transitionDiagramContainer = document.getElementById('generateTransitionDiagram');
	transitionDiagramContainer.innerHTML = generateTransitionDiagram(pages);
}

// 見積もり更新
function updateEstimate() {
	const tbody = document.querySelector('#estimateTable tbody');
	tbody.innerHTML = '';
	let subtotal = 0;

	// 1. 基本設計費
	const basic = 50000;
	subtotal += basic;
	tbody.innerHTML += `<tr>
		<td>基本設計</td>
		<td>${basic}</td>
		<td>1</td>
		<td>${basic}</td>
	</tr>`;

	// 2. ページ追加費
	const pageUnit = 30000;
	const pageCountReal = document.querySelectorAll('.page-card').length;
	subtotal += pageUnit * pageCountReal;
	if (pageCountReal > 0) {
		tbody.innerHTML += `<tr>
			<td>ページ追加</td>
			<td>${pageUnit}</td>
			<td>${pageCountReal}</td>
			<td>${pageUnit * pageCountReal}</td>
		</tr>`;
	}

	// 3. セクション追加費
	const sectionUnit = 10000;
	let sectionCount = 0;
	for (let i = 1; i <= pageCount; i++) {
		const card = document.getElementById(`pageCard${i}`);
		if (card) {
			sectionCount += card.querySelectorAll('input[type=checkbox]:checked').length;
		}
	}
	subtotal += sectionUnit * sectionCount;
	if (sectionCount > 0) {
		tbody.innerHTML += `<tr>
			<td>セクション追加</td>
			<td>${sectionUnit}</td>
			<td>${sectionCount}</td>
			<td>${sectionUnit * sectionCount}</td>
		</tr>`;
	}

	// 4. データ・認証・フレームワーク設定費
	const extraUnit = 20000;
	subtotal += extraUnit;
	tbody.innerHTML += `<tr>
		<td>データ・認証・フレームワーク設定</td>
		<td>${extraUnit}</td>
		<td>1</td>
		<td>${extraUnit}</td>
	</tr>`;

	// 5. 合計表示
	document.getElementById('subtotal').textContent = subtotal;
	document.getElementById('total').textContent = Math.round(subtotal * 1.1);
}

// AI指示文コピー
function copyInstructions() {
	const instr = document.getElementById('aiInstructions');
	instr.select();
	navigator.clipboard.writeText(instr.value);
	alert("指示文をコピーしました！");
}

// 初期実行はページがある場合のみ
if (pageCount > 0) {
	generateDesignDocs();
	updateEstimate();
}
