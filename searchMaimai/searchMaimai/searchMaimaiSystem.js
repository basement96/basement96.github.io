showSearchMethodSelection();


function showSearchMethodSelection() {
  const existingDialog = document.getElementById('searchMaimaiMethodSelector');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('div');
  dialog.id = 'searchMaimaiMethodSelector';
  dialog.style.position = 'fixed';
  dialog.style.top = '20px';
  dialog.style.left = '50%';
  dialog.style.transform = 'translateX(-50%)';
  dialog.style.zIndex = '999999';
  dialog.style.background = '#fff';
  dialog.style.border = '1px solid #ccc';
  dialog.style.borderRadius = '8px';
  dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  dialog.style.padding = '12px 16px';
  dialog.style.fontFamily = 'sans-serif';
  dialog.style.fontSize = '14px';
  dialog.style.color = '#222';

  const message = document.createElement('div');
  message.textContent = 'どちらを使用しますか？';
  message.style.marginBottom = '10px';
  message.style.textAlign = 'center';

  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.justifyContent = 'center';
  buttonRow.style.gap = '8px';

  const buttonA = document.createElement('button');
  buttonA.textContent = 'あならいざもどき2使用時';
  buttonA.style.padding = '6px 14px';
  buttonA.addEventListener('click', () => {
    dialog.remove();
    searchMaimaiByAnalyzer();
  });

  const buttonB = document.createElement('button');
  buttonB.textContent = 'maimaiNet使用時';
  buttonB.style.padding = '6px 14px';
  buttonB.addEventListener('click', () => {
    dialog.remove();
    searchMaimaiByNet();
  });

  buttonRow.appendChild(buttonA);
  buttonRow.appendChild(buttonB);
  dialog.appendChild(message);
  dialog.appendChild(buttonRow);

  if (document.body) {
    document.body.appendChild(dialog);
  } else {
    document.documentElement.appendChild(dialog);
  }
}


function searchMaimaiByAnalyzer() {
  const dataField = document.querySelector('#datafield');

  if (!dataField) {
    alert('id="datafield" が見つかりませんでした。\nあならいざもどき2を実行したうえで、もう一度実行してください。');
    return;
  }

  const outerHtml = dataField.outerHTML;
  console.log(outerHtml);

  showAnalyzerArgumentSelection(
    'プレイ済み判定に使用する属性を選択してください。',
    ['isPlayed', 'all'],
    (playedArgument) => {
      showAnalyzerArgumentSelection(
        '値の取得に使用する属性を選択してください。',
        ['value', 'span', 'both'],
        (valueArgument) => {
          const dialog = document.createElement('div');
          dialog.style.position = 'fixed';
          dialog.style.top = '20px';
          dialog.style.left = '50%';
          dialog.style.transform = 'translateX(-50%)';
          dialog.style.zIndex = '999999';
          dialog.style.background = '#fff';
          dialog.style.border = '1px solid #ccc';
          dialog.style.borderRadius = '8px';
          dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          dialog.style.padding = '12px 16px';
          dialog.style.fontFamily = 'sans-serif';
          dialog.style.fontSize = '14px';
          dialog.style.color = '#222';

          const message = document.createElement('div');
          message.textContent = '実行しますか？';
          message.style.marginBottom = '10px';
          message.style.textAlign = 'center';
          dialog.appendChild(message);

          ['実行', 'キャンセル'].forEach((label) => {
            const button = document.createElement('button');
            button.textContent = label;
            button.style.margin = '0 4px';
            button.style.padding = '6px 14px';
            button.addEventListener('click', () => {
              dialog.remove();
              if (label === '実行') {
                console.log([playedArgument, valueArgument]);
                loadFunction('createMaimaiResultsByAnalyzer', 'createMaimaiResultsByAnalyzer', [
                  outerHtml,
                  playedArgument,
                  valueArgument
                ]);
              }
            });
            dialog.appendChild(button);
          });

          (document.body || document.documentElement).appendChild(dialog);
        }
      );
    }
  );

  

  /*navigator.clipboard.writeText(outerHtml)
    .then(() => {
      alert('クリップボードにコピーしました。');
    })
    .catch((error) => {
      alert('クリップボードへのコピーに失敗しました。\nエラー理由: ' + error);
      console.error('クリップボードへのコピーに失敗しました:', error);
    });*/
}


function showAnalyzerArgumentSelection(messageText, options, callback) {
  const existingDialog = document.getElementById('searchMaimaiArgumentSelector');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('div');
  dialog.id = 'searchMaimaiArgumentSelector';
  dialog.style.position = 'fixed';
  dialog.style.top = '20px';
  dialog.style.left = '50%';
  dialog.style.transform = 'translateX(-50%)';
  dialog.style.zIndex = '999999';
  dialog.style.background = '#fff';
  dialog.style.border = '1px solid #ccc';
  dialog.style.borderRadius = '8px';
  dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  dialog.style.padding = '12px 16px';
  dialog.style.fontFamily = 'sans-serif';
  dialog.style.fontSize = '14px';
  dialog.style.color = '#222';

  const message = document.createElement('div');
  message.textContent = messageText;
  message.style.marginBottom = '10px';
  message.style.textAlign = 'center';
  dialog.appendChild(message);

  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.justifyContent = 'center';
  buttonRow.style.gap = '8px';

  options.forEach((option) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.style.padding = '6px 14px';
    button.addEventListener('click', () => {
      dialog.remove();
      callback(option);
    });
    buttonRow.appendChild(button);
  });

  dialog.appendChild(buttonRow);
  (document.body || document.documentElement).appendChild(dialog);
}


function searchMaimaiByNet() {
  const targetElements = Array.from(document.querySelectorAll('[class*="w_450 m_15 p_r f_0"]'));
  let htmlText = '';

  if (targetElements.length > 0) {
    htmlText = targetElements.map((element) => element.outerHTML).join('\n');
  } else {
    const pageHtml = document.documentElement.outerHTML;
    const startIndex = pageHtml.indexOf('POPS＆アニメ');
    const footerIndex = pageHtml.indexOf('<footer', startIndex);

    if (startIndex !== -1 && footerIndex !== -1) {
      htmlText = pageHtml.slice(startIndex, footerIndex);
    } else {
      alert('対象の要素またはPOPS＆アニメの記述が見つかりませんでした。');
      return;
    }
  }

  createMaimaiResultsByNet(htmlText);

  /*navigator.clipboard.writeText(htmlText)
    .then(() => {
      alert('クリップボードにコピーしました。');
    })
    .catch((error) => {
      alert('クリップボードへのコピーに失敗しました。\nエラー理由: ' + error);
      console.error('クリップボードへのコピーに失敗しました:', error);
    });*/
}




// スクリプトをオンデマンドで読み込んで実行する関数
function loadFunction(fileName, fnName, arg=[]) {
  // 既に読み込み済みならスクリプトタグを追加せず直接実行
  if (typeof window[fnName] === 'function') {
    window[fnName](...arg);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://basement96.github.io/searchMaimai/' + fileName;
  script.onload = () => {
    if (typeof window[fnName] === 'function') {
      window[fnName](...arg);
    } else {
      console.error(`${fnName} が定義されていません`);
    }
  };
  script.onerror = () => console.error(`${fileName} の読み込みに失敗しました`);
  document.head.appendChild(script);
}



