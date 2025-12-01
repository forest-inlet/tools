import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getDatabase, ref as getRef, get, set, push, onValue, remove, onChildAdded, onChildRemoved } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js';

const firebaseConfig = {
	apiKey: 'AIzaSyABPSwHIJTA7DbZmzhf1bMfXiSk9Y6m0Lg',
	authDomain: 'forestinlet-strage.firebaseapp.com',
	databaseURL: 'https://forestinlet-strage-default-rtdb.firebaseio.com',
	projectId: 'forestinlet-strage',
	storageBucket: 'forestinlet-strage.firebasestorage.app',
	messagingSenderId: '15530901863',
	appId: '1:15530901863:web:fd6b77b9f5e07cc697efc2'
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let page;
let files = [];
let data = {};

let previewIndex = 0;

async function setPage() {
	console.log('setPage called');
	let search = window.location.search.substring(1);
	if (search) {
		page = search;
		console.log('Page from URL:', page);
	} else {
		let localStoragePage = localStorage.getItem('fileTransfer_page');
		if (localStoragePage) {
			page = localStoragePage;
			console.log('Page from localStorage:', page);
			window.location.search = '?' + page;
		} else {
			let pathExists = false;
			console.log('Generating new page...');
			while (!pathExists) {
				page = Math.floor(Math.random() * parseInt('zzzzzzzzzz', 36)).toString(36);
				console.log('Trying page:', page);
				let snapshot = await get(getRef(database, 'fileTransfer/' + page));
				console.log('Firebase snapshot for page', page, ':', snapshot);
				if (!snapshot.exists()) {
					pathExists = true;
				} else {
					pathExists = false;
				}
			}
			localStorage.setItem('fileTransfer_page', page);
			console.log('Generated new page:', page);
			window.location.search = '?' + page;
		}
	}
	$('#url').text(window.location.href).prop('href', window.location.href);
	
	let pageTitle = 'File Transfer - ' + page;
	$('title').text(pageTitle);
	$('#pageTitle').text(pageTitle);

	let pageHistory = JSON.parse(localStorage.getItem('fileTransfer_pageHistory') || '[]');
	if (pageHistory.includes(page)) {
		// move this pageId to the first
		pageHistory = pageHistory.filter(id => id !== page);
		pageHistory.unshift(page);
		localStorage.setItem('fileTransfer_pageHistory', JSON.stringify(pageHistory));
	}
}
setPage();

// this function is show page history from localStorage in #historyList as links
function showPageHistory() {
	let history = JSON.parse(localStorage.getItem('fileTransfer_pageHistory') || '[]');
	let historyHtml = '';
	history.forEach(pageId => {
		// add remove button for each pageId
		// if pageId is current page, do not make it a link
		if (pageId === page) {
			historyHtml += '<div>' + pageId + ' <button type="button" class="removeHistoryButton" data-page-id="' + pageId + '">削除</button></div>';
		} else {
			historyHtml += '<div><a href="?' + pageId + '">' + pageId + '</a> <button type="button" class="removeHistoryButton" data-page-id="' + pageId + '">削除</button></div>';
		}
	});
	$('#historyList').html(historyHtml);
}
showPageHistory();

// when removeHistoryButton is clicked, remove the pageId from history in localStorage and update #historyList
$('#historyList').on('click', '.removeHistoryButton', function() {
	let pageId = $(this).data('page-id');
	if (!confirm(`本当にページ「${pageId}」を履歴から削除しますか？`)) {
		return;
	}
	let history = JSON.parse(localStorage.getItem('fileTransfer_pageHistory') || '[]');
	history = history.filter(id => id !== pageId);
	localStorage.setItem('fileTransfer_pageHistory', JSON.stringify(history));
	showPageHistory();
});

$('#changePageButton').on('click', () => {
	$('#newPageError').text('');
	let newPage = $('#newPageInput').val().trim();
	let regex = /^[0-9a-zA-Z-_]{6,20}$/;
	if (regex.test(newPage)) {
		localStorage.setItem('fileTransfer_page', newPage);
		window.location.search = '?' + newPage;
		$('#newPageInput').val('');
	} else {
		$('#newPageError').text('ページ名は6〜20文字の英数字、ハイフン、アンダースコアで構成してください。');
	}
})

// when #newPageInput is focused and Enter is pressed, trigger #changePageButton click
$('#newPageInput').on('keypress', function(e) {
	if (e.which === 13) {
		$('#changePageButton').click();
	}
});

$('#fileInput').on('change', function(e) {
	let fromFiles = Array.from(e.target.files);
	fromFiles.forEach(file =>	files.push(file));
	// show file names in #beforeFiles split by <br>
	// add a button to remove item from files array
	if (files.length > 0) {
		let fileNames = files.map((file, index) => {
			return file.name + ' <button type="button" class="removeFileButton" data-index="' + index + '">削除</button>';
		}).join('<br>');
		$('#beforeFiles').html(fileNames);
	}
	console.log(files);
	$(this).val('');
})

$('#dropArea').on('dragover', e => {
	e.preventDefault();
	e.stopPropagation();
	$('#dropArea').addClass('dragover');
}).on('dragleave', e => {
	e.preventDefault();
	e.stopPropagation();
	$('#dropArea').removeClass('dragover');
}).on('drop', e => {
	e.preventDefault();
	e.stopPropagation();
	$('#dropArea').removeClass('dragover');
	let fromFiles = Array.from(e.originalEvent.dataTransfer.files);
	fromFiles.forEach(file =>	files.push(file));
	// show file names in #beforeFiles split by <br>
	// add a button to remove item from files array
	if (files.length > 0) {
		let fileNames = files.map((file, index) => {
			return file.name + ' <button type="button" class="removeFileButton" data-index="' + index + '">削除</button>';
		}).join('<br>');
		$('#beforeFiles').html(fileNames);
	}
	console.log(files);
});

$('#beforeFiles').on('click', '.removeFileButton', function() {
	let index = $(this).data('index');
	files.splice(index, 1);
	if (files.length > 0) {
		let fileNames = files.map((file, index) => {
			return file.name + ' <button type="button" class="removeFileButton" data-index="' + index + '">削除</button>';
		}).join('<br>');
		$('#beforeFiles').html(fileNames);
	} else {
		$('#beforeFiles').text('アップロード待ちのファイルはありません');
	}
	console.log(files);
});

/* 
* root
*  └ fileTransfer
*      └ {page}
*          └ {fileId}
*              ├ fileName
*              ├ fileSize
*              ├ fileType //if files[].type is empty, set file's extension
*              ├ packetAmount //number of packets. if 1, packets/02 and later do not exist. if fileSize is smaller than 10MB, packetAmount is 1.
*              ├ timestamp
*              └ packets
*                 └ 01: {01pakcetId}
*                 └ 02: {02pakcetId}
*                 └ ...
*          └ packets
*			  └ {packetId}
*			      └ data(base64)
*             └ ...
*
* Note: Each packet is 10MB max.
*       user selected file get large when converted to base64. (about 33% larger)
*       So, split file into 10MB packets after converting to base64.
*/

$('#uploadButton').on('click', async () => {
	if (files.length === 0) {
		alert('アップロードするファイルが選択されていません。');
		return;
	}
	$('#uploadButton').prop('disabled', true);
	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		console.log('Uploading file:', file.name);
		let reader = new FileReader();
		reader.readAsDataURL(file);
		await new Promise((resolve, reject) => {
			reader.onload = async () => {
				let base64Data = reader.result.split(',')[1];
				let packetSize = 10 * 1024 * 1024; //10MB
				let packetAmount = Math.ceil(base64Data.length / packetSize);
				let fileRef = push(getRef(database, 'fileTransfer/' + page));
				let packets = {};
				for (let j = 0; j < packetAmount; j++) {
					let packetData = base64Data.slice(j * packetSize, (j + 1) * packetSize);
					let packetRef = push(getRef(database, 'fileTransfer/' + page + '/packets'));
					let packetId = packetRef.key;
					packets[('0' + (j + 1)).slice(-2)] = packetId;
					await set(getRef(database, 'fileTransfer/' + page + '/packets/' + packetId), {
						data: packetData
					});
				}
				await set(fileRef, {
					fileName: file.name,
					fileSize: file.size,
					fileType: file.type || getFileExtensionAsType(file.name),
					packetAmount: packetAmount,
					timestamp: Date.now(),
					packets: packets
				});
				console.log('Uploaded file:', file.name);
				resolve();
			};
			reader.onerror = () => {
				console.error('Error reading file:', file.name);
				reject();
			};
		});
	}
	$('#beforeFiles').text('アップロード待ちのファイルはありません');
	alert('ファイルのアップロードが完了しました。');
	files = [];
	$('#uploadButton').prop('disabled', false);
});

function getFileExtensionAsType(fileName) {
	let extension = fileName.split('.').pop().toLowerCase();
	return extension;
}

// This function is to show all uploaded files for this page in #files.
// show download button for each file, and when clicked, download the file by combining all packets.
// show filename and filesize. when filesize is large, show in MB or GB. when filename is clicked, show preview if possible.
// show remove button for each file, and when clicked, remove the file from firebase.
// packets should also be removed.
// peckets are loaded when downloading or showing preview as to reduce data transfer.
async function showUploadedFiles() {
	let filesRef = getRef(database, 'fileTransfer/' + page);
	let snapshot = await get(filesRef);
	if (snapshot.exists()) {
		let filesData = snapshot.val();
		let fileEntries = Object.entries(filesData).filter(([key, value]) => key !== 'packets');
		let fileListHtml = '';
		for (let [fileId, fileData] of fileEntries) {
			let fileSize = fileData.fileSize;
			let fileSizeDisplay = '';
			if (fileSize < 1024) {
				fileSizeDisplay = fileSize + ' bytes';
			} else if (fileSize < 1024 * 1024) {
				fileSizeDisplay = (fileSize / 1024).toFixed(2) + ' KB';
			} else if (fileSize < 1024 * 1024 * 1024) {
				fileSizeDisplay = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
			} else {
				fileSizeDisplay = (fileSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
			}
			fileListHtml += '<div class="fileItem" data-file-id="' + fileId + '">';
			fileListHtml += '<span class="fileName">' + fileData.fileName + '</span> (' + fileSizeDisplay + ') ';
			fileListHtml += '<button type="button" class="downloadFileButton" data-file-id="' + fileId + '">ダウンロード</button> ';
			fileListHtml += '<button type="button" class="removeFileButton" data-file-id="' + fileId + '">削除</button>';
			fileListHtml += '</div>';
		}
		$('#files').html(fileListHtml);

		// changing storage or show files once, this pageId is added to history in localStorage
		let history = JSON.parse(localStorage.getItem('fileTransfer_pageHistory') || '[]');
		if (!history.includes(page)) {
			// add this pageId to the first
		history.unshift(page);
		localStorage.setItem('fileTransfer_pageHistory', JSON.stringify(history));
		}
		showPageHistory();
	} else {
		$('#files').html('アップロードされたファイルはありません。');
	}
}
showUploadedFiles();

// when new file is added or removed, update the file list
onChildAdded(getRef(database, 'fileTransfer/' + page), snapshot => {
	showUploadedFiles();
});
onChildRemoved(getRef(database, 'fileTransfer/' + page), snapshot => {
	showUploadedFiles();
});

// pressing the download button downloads the file
$('#files').on('click', '.downloadFileButton', async function() {
	let fileId = $(this).data('file-id');
	let fileSnapshot = await get(getRef(database, 'fileTransfer/' + page + '/' + fileId));
	if (fileSnapshot.exists()) {
		let fileData = fileSnapshot.val();
		let fileSize = fileData.fileSize;
		let filename = fileData.filename;
		let fileSizeDisplay = '';
		if (fileSize < 1024) {
			fileSizeDisplay = fileSize + ' bytes';
		} else if (fileSize < 1024 * 1024) {
			fileSizeDisplay = (fileSize / 1024).toFixed(2) + ' KB';
		} else if (fileSize < 1024 * 1024 * 1024) {
			fileSizeDisplay = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
		} else {
			fileSizeDisplay = (fileSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
		}
		let base64Data = '';
		if (data[fileId]) {
			base64Data = data[fileId];
		} else {
			if (!confirm(`${filename}(${fileSizeDisplay})をダウンロードします。よろしいですか？`)) {
				return;
			}
			base64Data = '';
			for (let j = 1; j <= fileData.packetAmount; j++) {
				let packetId = fileData.packets[('0' + j).slice(-2)];
				let packetSnapshot = await get(getRef(database, 'fileTransfer/' + page + '/packets/' + packetId));
				if (packetSnapshot.exists()) {
					let packetData = packetSnapshot.val();
					base64Data += packetData.data;
				}
			}
			// base64 data is loaded once, hold it in memory for next preview or download
			data[fileId] = base64Data;
			console.log(data);
		}
		let link = document.createElement('a');
		link.href = 'data:' + fileData.fileType + ';base64,' + base64Data;
		link.download = fileData.fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
});

// pressing the remove button removes the file and its packets from firebase
$('#files').on('click', '.removeFileButton', async function() {
	if (!confirm(`本当に「${$(this).parent().find('.fileName').text()}」を削除しますか？この操作は元に戻せません。`)) {
		return;
	}
	let fileId = $(this).data('file-id');
	let fileSnapshot = await get(getRef(database, 'fileTransfer/' + page + '/' + fileId));
	if (fileSnapshot.exists()) {
		let fileData = fileSnapshot.val();
		// remove packets
		for (let j = 1; j <= fileData.packetAmount; j++) {
			let packetId = fileData.packets[('0' + j).slice(-2)];
			await remove(getRef(database, 'fileTransfer/' + page + '/packets/' + packetId));
		}
		// remove file entry
		await remove(getRef(database, 'fileTransfer/' + page + '/' + fileId));
	}
});

// when filename is clicked, show preview if possible
$('#files').on('click', '.fileName', async function() {
	let fileId = $(this).parent().data('file-id');
	let fileSnapshot = await get(getRef(database, 'fileTransfer/' + page + '/' + fileId));
	if (fileSnapshot.exists()) {
		let fileData = fileSnapshot.val();
		let filesize = fileData.fileSize;
		let filename = fileData.fileName;
		let filesizeDisplay = '';
		if (filesize < 1024) {
			filesizeDisplay = filesize + ' bytes';
		} else if (filesize < 1024 * 1024) {
			filesizeDisplay = (filesize / 1024).toFixed(2) + ' KB';
		} else if (filesize < 1024 * 1024 * 1024) {
			filesizeDisplay = (filesize / (1024 * 1024)).toFixed(2) + ' MB';
		} else {
			filesizeDisplay = (filesize / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
		}
		let base64Data = '';
		if (data[fileId]) {
			base64Data = data[fileId];
		} else {
			base64Data = '';
			if (!confirm(`${filename}(${filesizeDisplay})をプレビュー表示します。よろしいですか？`)){
				return;
			}
			for (let j = 1; j <= fileData.packetAmount; j++) {
				let packetId = fileData.packets[('0' + j).slice(-2)];
				let packetSnapshot = await get(getRef(database, 'fileTransfer/' + page + '/packets/' + packetId));
				if (packetSnapshot.exists()) {
					let packetData = packetSnapshot.val();
					base64Data += packetData.data;
				}
			}
			// base64 data is loaded once, hold it in memory for next preview or download
			data[fileId] = base64Data;
			console.log(data);
		}
		$('#previewFileName').text(filename);
		// preview in #previewArea > #previewContent
		// if code, show in <pre> and highlight with highlight.js
		let previewContent = '';

		// image
		if (fileData.fileType.startsWith('image/')) {
			previewContent = '<img src="data:' + fileData.fileType + ';base64,' + base64Data + '" alt="' + fileData.fileName + '">';
		}
		
		// video
		else if (fileData.fileType.startsWith('video/')) {
			previewContent = '<video controls src="data:' + fileData.fileType + ';base64,' + base64Data + '"></video>';
		}
		
		// audio
		else if (fileData.fileType.startsWith('audio/')) {
			previewContent = '<audio controls src="data:' + fileData.fileType + ';base64,' + base64Data + '"></audio>';
		}
		
		// PDF
		else if (fileData.fileType === 'application/pdf') {
			previewContent = '<embed src="data:' + fileData.fileType + ';base64,' + base64Data + '" type="application/pdf" width="100%" height="600px">';
		}
		
		// plain text
		else if (fileData.fileType === 'text/plain') {
			let textData = new TextDecoder('utf-8').decode(new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0))));
			previewContent = `<pre><code class="plaintext">${$('<div>').text(textData).html()}</code></pre>`;
		}
		
		// html
		else if (fileData.fileType === 'text/html') {
			// possible to switch to iframe to show page and pre to show code
			let htmlData = new TextDecoder('utf-8').decode(new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0))));
			let escapedHtml = $('<div>').text(htmlData).html();
			let switchBtn = '<button id="switchPreviewModeButton">プレビュー表示に切り替え</button>';
			let codeView = `<div id="htmlPreviewContainer">
								<pre><code class="html">${escapedHtml}</code></pre>
							</div>`;
			$('#previewContent').html(switchBtn + codeView)
			// highlight with highlight.js
			hljs.highlightElement($('#htmlPreviewContainer code')[0]);
			// then set up click event for switchBtn
			// when switchBtn is clicked, switch between iframe and pre
			$(document).off('click', '#switchPreviewModeButton').on('click', '#switchPreviewModeButton', function() {
				let container = $('#htmlPreviewContainer');
				if (container.find('iframe').length) {
					// switch to pre
					// use lighlight.js to highlight code
					let escaped = $('<div>').text(htmlData).html();
					container.html(`<pre><code class="html">${escaped}</code></pre>`)
					hljs.highlightElement(container.find('code')[0]);
					$(this).text('プレビュー表示に切り替え')
				} else {
					// switch to iframe
					let htmlSafe = htmlData.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
					container.html(`<iframe srcdoc="${htmlSafe}"></iframe>`);
					$(this).text('コード表示に切り替え');
				}
			});

			$('#previewOverlay').css('display', 'flex');
        	previewIndex = $('.fileItem').index($(this).closest('.fileItem'));
        	return;
		}
		
		// other code
		else if (fileData.fileType === 'text/css' || fileData.fileType === 'application/javascript' || fileData.fileType === 'application/json' || fileData.fileType === 'text/xml' || fileData.fileType === 'less' || fileData.fileType === 'java' || fileData.fileType === 'dart' || fileData.fileType === 'text/x-java' || fileData.fileType === 'text/x-csrc' || fileData.fileType === 'text/x-c++src' || fileData.fileType === 'cpp' || fileData.fileType === 'cc' || fileData.fileType === 'text/x-python') {
			let codeData = new TextDecoder('utf-8').decode(new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0))));
			let langClass = '';
			switch (fileData.fileType) {
				case 'text/css':
					langClass = 'css';
					break;
				case 'application/javascript':
					langClass = 'javascript';
					break;
				case 'application/json':
					langClass = 'json';
					break;
				case 'text/xml':
					langClass = 'xml';
					break;
				case 'less':
					langClass = 'less';
					break;
				case 'java':
				case 'text/x-java':
					langClass = 'java';
					break;
				case 'text/x-csrc':
				case 'cc':
					langClass = 'c';
					break;
				case 'text/x-c++src':
				case 'cpp':
					langClass = 'cpp';
					break;
				case 'text/x-python':
					langClass = 'python';
					break;
				default:
					langClass = '';
			}
			previewContent = '<pre><code class="' + langClass + '">' + $('<div>').text(codeData).html() + '</code></pre>';
		} else {
			previewContent = 'このファイルタイプのプレビューはサポートされていません。';
		}
		$('#previewContent').html(previewContent);
		let block = $('#previewContent pre code')[0];
		console.log(block);
		if (block) {
			if (block.className) {
				hljs.highlightElement(block);
			}
		}
		// show preview overlay with display flex
		$('#previewOverlay').css('display', 'flex');
		previewIndex = $('.fileItem').index($(this).closest('.fileItem'));
	}
});

// Close preview button
$('#closePreviewButton').on('click', () => {
	$('#previewOverlay').hide();
	$('#previewContent').html('');
});

// Previous and Next preview buttons
// cycle through files in #files
$('#prevPreviewButton').on('click', () => {
	// click the filename of the ${previewIndex - 1} file in #files
	previewIndex = previewIndex - 1;
	if (previewIndex < 0) {
		previewIndex = $('.fileItem').length - 1;
	}
	$('.fileItem').eq(previewIndex).find('.fileName').click();
});
$('#nextPreviewButton').on('click', () => {
	// click the filename of the ${previewIndex + 1} file in #files
	previewIndex = previewIndex + 1;
	if (previewIndex >= $('.fileItem').length) {
		previewIndex = 0;
	}
	$('.fileItem').eq(previewIndex).find('.fileName').click();
});

// when previewArea is shown, pressing arrow left or right keys trigger prev or next preview buttons or pressing escape key closes preview
$(document).on('keydown', e => {
	if ($('#previewOverlay').is(':visible')) {
		if (e.key === 'ArrowLeft') {
			$('#prevPreviewButton').click();
		} else if (e.key === 'ArrowRight') {
			$('#nextPreviewButton').click();
		} else if (e.key === 'Escape') {
			$('#closePreviewButton').click();
		}
	}
});