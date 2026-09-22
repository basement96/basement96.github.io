alert('Hello, World!');

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
  const baseURL = 'http://localhost:8000/';
  // const baseURL = 'https://basement96.github.io/searchMaimai/'
  // script.src = baseURL + fileName + '?v=' + SCRIPT_VERSION;
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
      const errText = `処理に必要な関数${fnName} が見つかりませんでした。以下を確認の後、再度実行してください。\n・数分程度間をあける\n・「${baseURL}」のキャッシュを削除する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`
      console.error(`${funcName}: ${errText} at ${Date.now()}`);
      alert(errText);
    }
  };

  // 読み込み失敗時
  script.onerror = () => {
    const errText = `必要な${fileName} の読み込みに失敗しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・「${baseURL}」のキャッシュを削除する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`;
    console.error(`${funcName}: ${errText} at ${Date.now()}`);
    alert(errText);
  };

  // scriptをHTMLに追加して読み込み開始
  document.head.appendChild(script);


}

loadFunction('createMaimaiResultsByAnalyzer.js','nope', ['blank']);