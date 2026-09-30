(() => {
  const SCRIPT_VERSION = '0.3.1'; // Fixed several potential issues related to error handling.
  const IS_DEVMODE = false;

  /**
   * ブックマークレット実行時に実行される非同期関数
   * 楽曲取得方法を選択するダイアログを表示し、選択に応じて処理を分岐させる
   * @param {void}
   * @returns {Function} 次に実行する関数名
   */
  async function selectSearchMethod() {
    const selectedMethod = await switchDialog({
      dialogId: 'searchMaimaiMethodSelector_anlOrNet',
      dialogText: 'どちらを使用しますか？',
      dialogNote: `レコード→楽曲スコア→カテゴリと進み、楽曲ジャンルにて全ジャンルを指定してから、取得したい難易度を表示させた状態にしてください。\n「あならいざもどき2」を使用する場合は、\nあならいざもどき2を実行したうえで、\nこのスクリプトを実行してください。\n\n(本スクリプトのバージョン: ${SCRIPT_VERSION})`,
      buttonLabels: ['あならいざもどき2\nモード', 'maimaiDXNet\nモード'],
      returnValues: ['analyzer', 'net'],
      subButtonLabels: ['', 'キャンセル'],
      subReturnValues: ['', 'cancel']
    });

    if (selectedMethod === '') {
      return selectSearchMethod();
    }
    if (selectedMethod === 'cancel') {
      return;
    }
    if (selectedMethod === 'analyzer') {
      return searchMaimaiByAnalyzer();
    }
    if (selectedMethod === 'net') {
      return searchMaimaiByNet();
    }
  }

  selectSearchMethod();


  /**
   * ボタンを含むダイアログを表示させて、選択したボタンに設定された文字列を返す
   * 
   * selectSearchMethod(), searchMaimaiByAnalyzer(), searchMaimaiByNet() で使用する
   * @param {Object} options - 引数となるオブジェクト
   * @param {String} options.dialogId - ダイアログのdivに設定するId名
   * @param {Array} options.buttonLabels - 各ボタン内に表示する文章 (左から順にボタンになる)
   * @param {Array} options.returnValues - 各ボタンを押下したときに返り値にする文字列
   * @param {Array} options.subButtonLabels - メインのボタンの下に配置されるボタンに表示される文章 (省略可)
   * @param {Array} options.subReturnValues - 各サブボタンを押下したときに返り値にする文字列 (省略可)
   * @param {String} options.dialogText - ボタンの上に表示する文章 (省略可)
   * @param {String} options.dialogNote - (サブ)ボタンの下に「詳しい説明:」というボタンを設置し、それを押下すると表示される文章 (省略可)
   * 
   * @returns {String} returnValues, subReturnValues内のうち、ボタンによって選択された文字列
   */
  function switchDialog({ dialogId, buttonLabels, returnValues, subButtonLabels, subReturnValues, dialogText, dialogNote }) {
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

    const subButtonRow = document.createElement('div');
    subButtonRow.style.display = 'flex';
    subButtonRow.style.justifyContent = 'space-between';
    subButtonRow.style.marginTop = '4px';
    dialog.appendChild(subButtonRow);

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
        button.style.backgroundColor = '#fff';
        button.style.border = 'none';
        button.addEventListener('click', () => {
          dialog.remove();
          resolve(returnValues[index]);
        });
        buttonRow.appendChild(button);
      });

      if (subButtonLabels && (subButtonLabels.length !== 0)) {
        subButtonLabels.forEach((sLabel, sIndex) => {
          const sButton = document.createElement('button');
          sButton.textContent = sLabel;
          sButton.style.padding = '3px 8px';
          sButton.style.fontSize = '12px';
          sButton.style.whiteSpace = 'pre-line';
          sButton.style.backgroundColor = '#fff';
          sButton.style.border = 'none';
          sButton.addEventListener('click', () => {
            dialog.remove();
            resolve(subReturnValues[sIndex]);
          });
          subButtonRow.appendChild(sButton);
        })
      }

    });


  }

  /**
   * selectSearchMethod()によってあならいざもどき2モードが指定されたときに実行する非同期関数
   * DOMから使用する要素を抽出した後、ダイアログを複数表示させて、createMaimaiResultsByAnalyzerに渡す引数を決定してloadFunctionを通して実行する
   * @param {void}
   * @returns {void}
   */
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

    while (true) {
      const filTypeArgument = await switchDialog({
        dialogId: 'anl_argumentSelector_filType',
        dialogText: '抽出する楽曲の条件を選択してください',
        dialogNote: '「表示中の楽曲」を選択すると、あならいざもどき2にて絞り込まれた譜面データのうち、プレイ済みの譜面が抽出されます。\n「プレイ済み全楽曲」を選択しても、全難易度の譜面が抽出されるわけではありません。\n開いている難易度のタブの楽曲のみが抽出されます。(MASTERのタブを開いている場合はMASTERの譜面のみが抽出されます)',
        buttonLabels: ['表示中の楽曲', 'プレイ済み全楽曲'],
        returnValues: ['isDisplayed', 'isPlayed'],
        subButtonLabels: ['最初から', 'キャンセル'],
        subReturnValues: ['restart', 'cancel']
      });
      if (filTypeArgument === 'restart') {
        return selectSearchMethod();
      }
      if (filTypeArgument === 'cancel') {
        return;
      }

      const anlTypeArgument = await switchDialog({
        dialogId: 'anl_argumentSelector_anlType',
        dialogText: '譜面データの抽出方法を選択してください。',
        dialogNote: '基本的に「正確性重視(推奨)」を使用してください。\n「正確性重視」は、「速度重視」の2手法を組み合わせ、その手法ごとに結果が異なった場合に警告を表示するため、より正確な結果を提供しますが、処理時間が数ms程度長くなります。\n「速度重視」は、処理速度を優先するため、結果の精度は多少低下する可能性があります。',
        buttonLabels: ['正確性重視\n(推奨)', '速度重視', '速度重視\n(その2)'],
        returnValues: ['both', 'value', 'span'],
        subButtonLabels: ['最初から', '抽出条件から', 'キャンセル'],
        subReturnValues: ['restart', 'reset', 'cancel']
      });
      if (anlTypeArgument === 'restart') {
        return selectSearchMethod();
      }
      if (anlTypeArgument === 'reset') {
        continue; // 抽出楽曲の条件の選択画面に戻す
      }
      if (anlTypeArgument === 'cancel') {
        return;
      }

      const confirmArgument = await switchDialog({
        dialogId: 'anl_searchMaimaiConfirmDialog',
        dialogText: `「あならいざもどき2」モードで抽出を開始します。よろしいですか？`,
        buttonLabels: ['はい', '抽出条件から'],
        returnValues: ['yes', 'reset'],
        subButtonLabels: ['最初から', 'キャンセル'],
        subReturnValues: ['restart', 'cancel']
      });
      if (confirmArgument === 'restart') {
        return selectSearchMethod();
      }
      if (confirmArgument === 'reset') {
        continue; // 抽出楽曲の条件の選択画面に戻す
      }
      if (confirmArgument === 'cancel') {
        return;
      }

      console.log(`${funcName}: [${filTypeArgument}, ${anlTypeArgument}] at ${Date.now()}`);

      try {
        const result = await loadFunction('createMaimaiResultsByAnalyzer.js', 'createMaimaiResultsByAnalyzer', [
          outerHtml,
          filTypeArgument,
          anlTypeArgument
        ]);
      } catch (error) {
        console.error(`${funcName}: ${error.message} at ${Date.now()}`);
      }

      if (result.status && result.resultTsv) {

        const download = await switchDialog({
          dialogId: 'anl_downloadTSVConfirmDialog',
          dialogText: `抽出が完了しました。tsvファイルをダウンロードしますか？`,
          buttonLabels: ['はい', 'いいえ'],
          returnValues: ['yes', 'no']
        });

        if (download === 'yes') {

          const now = new Date();
          const formatter = new Intl.DateTimeFormat('ja-JP', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24時間表記を強制
          });
          const parts = formatter.formatToParts(now);
          const dateTime = parts.filter(p => p.type !== 'literal').map(p => p.value).join('');

          downloadTSV(result.resultTsv, `myMaiResultsByAnl_${dateTime}_${filTypeArgument}_${anlTypeArgument}.tsv`);
        }

      }

      return;
    }


  }


  /**
   * selectSearchMethod()によってmaimaiDXNetモードが指定されたときに実行する非同期関数
   * DOMから使用する要素を抽出し配列を作成させた後、ダイアログを複数表示させて、createMaimaiResultsByNetで抽出条件として使用する引数を決定してloadFunctionを通して実行する
   * @param {void}
   * @returns {void}
   */
  async function searchMaimaiByNet() {
    const funcName = searchMaimaiByNet.name;
    // 1. 譜面データが格納されている要素を全抽出 (失敗時はif内で再度取得を試みる)
    let targetElements = Array.from(document?.querySelectorAll?.('.w_450.m_15.p_r.f_0') || []);

    if (targetElements.length === 0) {
      console.warn(`${funcName}: targetElementsの取得再試行 at ${Date.now()}`);
      let sheet = document.querySelector('.screw_block')?.nextElementSibling; // 1番上に表示されている譜面 もしくは undifined

      if (!sheet) {
        const errText = `譜面データが見つかりませんでした。以下を確認の後、再度実行してください。\n・レコード→楽曲スコア→カテゴリと進み、取得したい難易度を表示させた状態にする\n・あならいざもどき2実行済の場合、ページをリロードする`;
        console.error(`${funcName}: ${errText} at ${Date.now()}`);
        alert(errText);
        return;
      }
      // フッダー要素にたどり着く or 要素がなくなる まで繰り返す (譜面データを取得)
      do {
        // スクロールポイントおよびジャンルタグ部分は省いて、残った部分(譜面データ)をtargetElementsに入れる
        if (sheet.tagName !== 'P' && !sheet.classList.contains('screw_block')) {
          targetElements.push(sheet);
        }
        sheet = sheet.nextElementSibling;
      } while (sheet && sheet.tagName !== 'FOOTER');
    }

    // 2. オプションを指定するダイアログを追加
    while (true) {
      const minLevelArgument = await switchDialog({
        dialogId: 'net_argumentSelector_minLevel',
        dialogText: `抽出する譜面データの最小レベルを選択してください。`,
        dialogNote: `Lv. 13未満のレベルを表示させるには「全曲」を選択してください。\n注意: 取得したい難易度を表示させた状態にしてください。(例: BASIC譜面が表示されている状態で「14+」を選択しても何も出ません)`,
        buttonLabels: ['全曲', '13', '13+', '14', '14+'],
        returnValues: ['isPlayed', '13', '13+', '14', '14+'],
        subButtonLabels: ['最初から', 'キャンセル'],
        subReturnValues: ['restart', 'cancel']
      });
      if (minLevelArgument === 'restart') {
        return selectSearchMethod();
      }
      if (minLevelArgument === 'cancel') {
        return;
      }

      const minRankArgument = await switchDialog({
        dialogId: 'net_argumentSelector_minRank',
        dialogText: `抽出する譜面データの最小スコアを選択してください。`,
        dialogNote: `SS未満のスコアを表示させるには「全曲」を選択してください。`,
        buttonLabels: ['全曲', '99.0%\nSS', '100.0%\nSSS', '100.5%\nSSS+', 'AP'],
        returnValues: ['isPlayed', 'SS', 'SSS', 'SSS+', 'AP'],
        subButtonLabels: ['最初から', 'レベル選択から', 'キャンセル'],
        subReturnValues: ['restart', 'reset', 'cancel']
      });
      if (minRankArgument === 'restart') {
        return selectSearchMethod();
      }
      if (minRankArgument === 'reset') {
        continue;
      }
      if (minRankArgument === 'cancel') {
        return;
      }

      const confirmArgument = await switchDialog({
        dialogId: 'net_searchMaimaiConfirmDialog',
        dialogText: `「maimaiDXNet」モードで抽出を開始します。よろしいですか？`,
        buttonLabels: ['はい', 'レベル選択から'],
        returnValues: ['yes', 'reset'],
        subButtonLabels: ['最初から', 'キャンセル'],
        subReturnValues: ['restart', 'cancel']
      });
      if (confirmArgument === 'restart') {
        return selectSearchMethod();
      }
      if (confirmArgument === 'reset') {
        continue;
      }
      if (confirmArgument === 'cancel') {
        return;
      }

      console.log(`${funcName}: [${minLevelArgument}, ${minRankArgument}] at ${Date.now()}`);

      try {
        // 指定された関数をロードして実行
        const result = await loadFunction('createMaimaiResultsByNet.js', 'createMaimaiResultsByNet', [
          targetElements,
          minLevelArgument,
          minRankArgument
        ]);
      } catch (error) {
        console.error(`${funcName}: ${error.message} at ${Date.now()}`);
      }

      // 結果が正常に返ってきた場合、tsvファイルをダウンロードするか確認するダイアログを表示
      if (result.status && result.resultTsv) {

        const download = await switchDialog({
          dialogId: 'net_downloadTSVConfirmDialog',
          dialogText: `抽出が完了しました。tsvファイルをダウンロードしますか？`,
          buttonLabels: ['はい', 'いいえ'],
          returnValues: ['yes', 'no']
        });
        if (download === 'yes') {

          const now = new Date();
          const formatter = new Intl.DateTimeFormat('ja-JP', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24時間表記を強制
          });
          const parts = formatter.formatToParts(now);
          const dateTime = parts.filter(p => p.type !== 'literal').map(p => p.value).join('');

          downloadTSV(result.resultTsv, `myMaiResultsByNet_${dateTime}_${minLevelArgument}_${minRankArgument}.tsv`);
        }

      }

      return;

    }


  }


  /**
   * スクリプトをオンデマンドで読み込んで実行する関数 (promise処理)
   * IS_DEVMODEによってbaseURLを変更し、(trueでローカルサーバー, falseでgithub)、baseURL上にあるfileNameを読み込み、そのファイル内のfnNameをarg内の要素を引数として実行する
   * 既に読み込まれたファイルが指定された場合、そのまま実行する
   * @param {String} fileName - baseURL+fileNameの形式でURLを作成する。「.js」を忘れてはいけない
   * @param {String} fnName - 呼び出す関数名
   * @param {Array} arg - 関数の引数 (省略可)
   * @returns {void}
   */
  function loadFunction(fileName, fnName, arg = []) {
    const funcName = loadFunction.name;

    return new Promise((resolve, reject) => {

      console.log(`loadFunction: ${fileName}, ${fnName}`);
      // 既に読み込み済みならスクリプトタグを追加せず直接実行
      try {
        if (typeof window[fnName] === 'function') {
          const result = window[fnName](...arg);
          resolve(result);
          return;
        }
      } catch (e) {
        console.error(`${funcName}: ${fnName} の実行中にエラーが発生しました。 at ${Date.now()}`, e);

        reject(e);
        return;
      }

      // script要素を作成
      const script = document.createElement('script');
      let baseURL = 'https://basement96.github.io/searchMaimai/';
      script.src = `${baseURL}${fileName}?v=${SCRIPT_VERSION}`;
      if (IS_DEVMODE) {
        baseURL = 'http://localhost:8000/'; // 開発環境用
        script.src = baseURL + fileName + '?' + Date.now(); // 開発環境用
      }

      // 読み込み成功時
      script.onload = () => {
        if (typeof window[fnName] === 'function') {
          try {
            const result = window[fnName](...arg);
            resolve(result);
          } catch (e) {
            console.error(`${funcName}: ${fnName} の実行中にエラーが発生しました。 at ${Date.now()}`, e);
            reject(e);
          }
        } else {
          const errText = `処理に必要な関数 ${fnName} が見つかりませんでした。以下を確認の後、再度実行してください。\n・数分程度間をあける\n・「${baseURL}」のキャッシュを削除する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`
          console.error(`${funcName}: ${errText} at ${Date.now()}`);
          alert(errText);
          reject(new Error(errText));
        }
      };

      // 読み込み失敗時
      script.onerror = () => {
        const errText = `必要な ${fileName} の読み込みに失敗しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・「${baseURL}」のキャッシュを削除する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`;
        console.error(`${funcName}: ${errText} at ${Date.now()}`);
        alert(errText);
        reject(new Error(errText));
      };

      // scriptをHTMLに追加して読み込み開始
      document.head.appendChild(script);

    });


  }

  function downloadTSV(tsv, filename = 'data.tsv') {
    const funcName = downloadTSV.name;
    console.log(`${funcName}: ${filename} をダウンロードします。 at ${Date.now()}`);
    try {
      // BOM（BOMありUTF-8）を付与してExcelでの文字化けを防ぐ
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, tsv], { type: 'text/tab-separated-values;charset=utf-8;' });

      // ダウンロード用のリンクを生成
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // DOMに一時追加してクリックし、すぐに削除
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`tsvファイルのダウンロード中にエラーが発生しました。\n(理由: ${error.message})\n以下を確認の後、再度実行してください。\n・ブラウザ、OSのセキュリティ制限によるブロック\n・上記を確認しても改善しない場合、お手数ですが、使用OS、ブラウザを明記して制作者にご連絡ください。`);
      console.error(`${funcName}: ${filename} のダウンロード中にエラーが発生しました。 at ${Date.now()}`, error);
    }
  }


})();
