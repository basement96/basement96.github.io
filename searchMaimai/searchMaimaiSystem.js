(() => {
  const SCRIPT_VERSION = '0.1.1';

  /**
   * ブックマークレット実行時に実行される非同期関数
   * 楽曲取得方法を選択するダイアログを表示し、選択に応じて処理を分岐させる
   */
  async function selectSearchMethod() {
    const selectedMethod = await switchDialog({
      dialogId: 'searchMaimaiMethodSelector_anlOrNet',
      dialogText: 'どちらを使用しますか？',
      dialogNote: 'レコード→楽曲スコア→カテゴリと進み、楽曲ジャンルにて全ジャンルを指定してから、取得したい難易度を表示させた状態にしてください。\n「あならいざもどき2」を使用する場合は、\nあならいざもどき2を実行したうえで、\nこのスクリプトを実行してください。',
      buttonLabels: ['あならいざもどき2\nモード', 'maimaiDXNet\nモード'],
      returnValues: ['analyzer', 'net']
    });

    if (selectedMethod === 'analyzer') {
      searchMaimaiByAnalyzer();
    } else if (selectedMethod === 'net') {
      searchMaimaiByNet();
    }
  }

  selectSearchMethod();

  function switchDialog({ dialogId, buttonLabels, returnValues, dialogText, dialogNote }) {
    const existingDialog = document.getElementById(dialogId);
    if (existingDialog) {
      existingDialog.remove();
    }

    const dialog = document.createElement('div');
    dialog.id = dialogId;
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
    dialog.style.width = '360px';
    dialog.style.fontFamily = 'sans-serif';
    dialog.style.fontSize = '16px';
    dialog.style.color = '#222';


    if (dialogText) {
      const text = document.createElement('div');
      text.textContent = dialogText;
      text.style.marginBottom = '8px';
      text.style.textAlign = 'center';
      dialog.appendChild(text);
    }

    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'center';

    dialog.appendChild(buttonRow);
    (document.body || document.documentElement).appendChild(dialog);

    buttonRow.style.gap = '8px';

    if (dialogNote) {
      const noteToggle = document.createElement('button');
      noteToggle.type = 'button';
      noteToggle.textContent = '詳しい説明:';
      noteToggle.style.display = 'block';
      noteToggle.style.margin = '5px auto 0';
      noteToggle.style.fontSize = '12px';
      noteToggle.style.padding = '0';
      noteToggle.style.border = 'none';
      noteToggle.style.background = 'none';
      noteToggle.style.color = '#222';
      noteToggle.style.textDecoration = 'underline';
      noteToggle.style.cursor = 'pointer';

      const note = document.createElement('div');
      note.textContent = dialogNote;
      note.style.display = 'none';
      note.style.marginTop = '8px';
      note.style.whiteSpace = 'pre-line';
      note.style.fontSize = '12px';

      noteToggle.addEventListener('click', () => {
        note.style.display = note.style.display === 'none' ? 'block' : 'none';
      });

      dialog.appendChild(noteToggle);
      dialog.appendChild(note);
    }

    return new Promise((resolve) => {
      buttonLabels.forEach((label, index) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.padding = '6px 14px';
        button.style.fontSize = '14px';
        button.style.whiteSpace = 'pre-line';
        button.addEventListener('click', () => {
          dialog.remove();
          resolve(returnValues[index]);
        });
        buttonRow.appendChild(button);
      });
    });


  }


  async function searchMaimaiByAnalyzer() {
    const funcName = searchMaimaiByAnalyzer.name;
    const dataField = document.querySelector('#datafield');

    if (!dataField) {
      const errText = 'id="datafield" が見つかりませんでした。以下を確認の後、再度実行してください。\n・レコード→楽曲スコア→カテゴリと進み、取得したい難易度を表示させた状態にする\n・あならいざもどき2を実行する';
      console.log(`${funcName}: ${errText} at ${Date.now()}`);
      alert(errText);
      return;
    }

    const outerHtml = dataField.outerHTML;

    const playedArgument = await switchDialog({
      dialogId: 'anl_argumentSelector_isPlayedOrAll',
      dialogText: '抽出する楽曲の条件を選択してください',
      dialogNote: '「表示中の楽曲」を選択すると、あならいざもどき2にて絞り込まれた譜面データのうち、プレイ済みの譜面が抽出されます。\n「プレイ済み全楽曲」を選択しても、全難易度の譜面が抽出されるわけではありません。\n開いている難易度のタブの楽曲のみが抽出されます。(MASTERのタブを開いている場合はMASTERの譜面のみが抽出されます)',
      buttonLabels: ['表示中の楽曲', 'プレイ済み全楽曲'],
      returnValues: ['isDisplayed', 'isPlayed']
    });

    const valueArgument = await switchDialog({
      dialogId: 'searchMaimaiValueArgumentSelector',
      dialogText: '譜面データの抽出方法を選択してください。推奨:「正確性重視」',
      dialogNote: '「正確性重視」は、より正確な結果を提供しますが、処理時間がわずかに長くなることがあります。\n「速度重視」は、処理速度を優先するため、結果の精度は多少低下する可能性があります。',
      buttonLabels: ['正確性重視', '速度重視', '速度重視\n(その2)'],
      returnValues: ['both', 'value', 'span']
    });

    const confirmArgument = await switchDialog({
      dialogId: 'searchMaimaiConfirmDialog',
      dialogText: '抽出を開始します。よろしいですか？',
      buttonLabels: ['はい', '最初から', 'キャンセル'],
      returnValues: ['yes', 'no', 'cancel']
    });

    if (confirmArgument === 'no') {
      selectSearchMethod();
      return;
    } else if (confirmArgument === 'cancel') {
      return;
    }

    console.log(`${funcName}: [${playedArgument}, ${valueArgument}] at ${Date.now()}`);

    loadFunction('createMaimaiResultsByAnalyzer.js', 'createMaimaiResultsByAnalyzer', [
      outerHtml,
      playedArgument,
      valueArgument
    ]);


  }

  function searchMaimaiByNet() {
    alert ('申し訳ございません。現在開発中です。あならいざもどき2モードをご使用ください。');
    return;
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
  function loadFunction(fileName, fnName, arg = []) {
    const funcName = loadFunction.name;

    console.log(`loadFunction: ${fileName}, ${fnName}`);
    // 既に読み込み済みならスクリプトタグを追加せず直接実行
    try {
      if (typeof window[fnName] === 'function') {
        window[fnName](...arg);
        return;
      }
    } catch (e) {
      console.error(`${funcName}: ${fnName} の実行中にエラーが発生しました。 at ${Date.now()}`, e);
      return;
    }

    // script要素を作成
    const script = document.createElement('script');
    // const baseURL = 'https://basement96.github.io/searchMaimai/'
    // script.src = baseURL + fileName + '?v=' + SCRIPT_VERSION;
    const baseURL = 'http://localhost:8000/'; // 開発環境用
    script.src = baseURL + fileName + '?' + Date.now(); // 開発環境用

    // 読み込み成功時
    script.onload = () => {
      if (typeof window[fnName] === 'function') {
        try {
          window[fnName](...arg);
        } catch (e) {
          console.error(`${funcName}: ${fnName} の実行中にエラーが発生しました。 at ${Date.now()}`, e);
        }
      } else {
        const errText = `処理に必要な関数 ${fnName} が見つかりませんでした。以下を確認の後、再度実行してください。\n・数分程度間をあける\n・「${baseURL}」のキャッシュを削除する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`
        console.error(`${funcName}: ${errText} at ${Date.now()}`);
        alert(errText);
      }
    };

    // 読み込み失敗時
    script.onerror = () => {
      const errText = `必要な ${fileName} の読み込みに失敗しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・「${baseURL}」のキャッシュを削除する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`;
      console.error(`${funcName}: ${errText} at ${Date.now()}`);
      alert(errText);
    };

    // scriptをHTMLに追加して読み込み開始
    document.head.appendChild(script);


  }


})();
