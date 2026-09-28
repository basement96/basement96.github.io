/**
* maimaiDXNet使用時において、html要素をまとめた配列から楽曲の抽出条件指定して、タブ区切り方式でリザルトの配列をクリップボードに貼り付ける
* @param {Array} targetElements - maimaiDXNet使用時のHtml要素のうち、リザルトに関係する要素を一つずつ配列にしたもの
* @param {String} minLevelArgument - 抽出対象とする譜面の最小レベル (全曲ならプレイ済み楽曲全部)
* @param {String} minRankArgument - 抽出対象とする譜面の最小ランク (全曲ならプレイ済み楽曲全部)
* @returns {void} クリップボードに貼り付けをしてそのまま終了する
*/
function createMaimaiResultsByNet(targetElements, minLevelArgument, minRankArgument) {
  const funcName = createMaimaiResultsByNet.name;
  const startTime = Date.now();
  console.log(`${funcName}実行開始 at ${startTime}`);

  try {
    // 0. 引数の確認
    if (!targetElements || !minLevelArgument || !minRankArgument) {
      throw new Error(`不明なエラーが発生しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }

    const minLevelList = ["isPlayed", "13", "13+", "14", "14+"];
    if (!minLevelList.includes(minLevelArgument)) {
      throw new Error(`最小レベルの引数に不明なエラーが発生しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }
    minLevelList.push("15"); // re:MAS譜面のLv.15が対象譜面に含まれるように処理する(forEach内で処理)

    const minRankList = ["isPlayed", "SS", "SSS", "SSS+", "AP"];
    if (!minRankList.includes(minRankArgument)) {
      throw new Error(`最小レベルの引数に不明なエラーが発生しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }
    minRankList.splice(2, 0, "SS+"); // SSとSSSの間にSS+を追加。SS以上を選択したときにSS+も含まれるように処理する(forEach内で処理)

    // 1. ヘッダー行を定義（タブ区切り）
    const headers = [
      "タイトル:",
      "難易度:",
      "譜面種:",
      "譜面lv:", // 譜面定数は取得できないため、譜面lvを代わりに使用
      "新曲枠:", // 未使用
      "(ver):", // 未使用
      "獲得スコア:",
      "DS:",
      "AP/FC:",
      "ノーツ数:",
      "でらっくスコア:",
      "理論でらっくスコア:",
      "でらっくスコア率:",
      "syncプレイ有無:",
      "ランク:",
    ];

    // targetElements内の各要素の例
    /*
    <div class="w_450 m_15 p_r f_0">
      <div class="music_master_score_back pointer p_3">
        <form action="https://maimaidx.jp/maimai-mobile/record/musicDetail/" method="get" accept-charset="utf-8">
          <img src="https://maimaidx.jp/maimai-mobile/img/diff_master.png" class="h_20 f_l">
          <div class="clearfix"></div>
          <div class="music_lv_block f_r t_c f_14">11</div>
          <div class="music_name_block t_l f_13 break">愛♡スクリ～ム！</div>
          <div class="music_score_block w_112 t_r f_l f_12">100.9883%</div>
          <div class="music_score_block w_190 t_r f_l f_12">
            <img src="https://maimaidx.jp/maimai-mobile/img/deluxscore.png" class="v_b f_l">
            1,548 / 1,620
          </div>
          <img src="https://maimaidx.jp/maimai-mobile/img/music_icon_fdx.png?ver=1.65" class="h_30 f_r">
          <img src="https://maimaidx.jp/maimai-mobile/img/music_icon_ap.png?ver=1.65" class="h_30 f_r">
          <img src="https://maimaidx.jp/maimai-mobile/img/music_icon_sssp.png?ver=1.65" class="h_30 f_r">
          <div class="clearfix"></div>
          <input type="hidden" name="idx"
            value="1f4a7acaa77f6cfbab4084874cb3ae9c8327a71f140c4bcc5a457dcb7682778e3766f9b4ee51490d7703db4a0656356b09bcb44005ad1153ddf954b2c6b324e6IUXwKDzDRnKJzE4/MoxKCT1ACGgu09dkuvZZ22eHcgg=">
        </form>
      </div>
      <img src="https://maimaidx.jp/maimai-mobile/img/music_dx.png" class="music_kind_icon ">
    </div>
    */

    /**
     * 以下のfor文でrowsに順次譜面データを追加していく
     * @type {string[][]}
     */
    const rows = [];

    // 2. targetElementsの各要素から、タイトル等の譜面データを抽出する
    for (block of targetElements) {
      // 2-0. music_score_blockが存在しない場合は未プレイなのでスキップする
      if (!block.querySelector(".music_score_block")) {
        continue; // 今後の処理及びrowsに追加をスキップする
      }

      // 2-1. minLevelArgument, minRankArgumentを確認して絞り込み対象かを決定するためにlevel, rank, apfcを先に定義
      const level = block.querySelector(".music_lv_block").textContent.trim() || "";
      if (minLevelArgument === "isPlayed") {
        // else ifと対応付けるためだけのスコープなので空白
      } else if (minLevelList.indexOf(level) < minLevelList.indexOf(minLevelArgument)) {
        continue; // 今後の処理及びrowsに追加をスキップする
      }

      const _imgSrcs = Array.from(block.querySelectorAll("img")).map((img) => img.src || "");

      let rank = "";
      if (_imgSrcs.some(src => src.includes("music_icon_sssp.png"))) { rank = "SSS+"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_sss.png"))) { rank = "SSS"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_ssp.png"))) { rank = "SS+"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_ss.png"))) { rank = "SS"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_sp.png"))) { rank = "S+"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_s.png"))) { rank = "S"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_aaa.png"))) { rank = "AAA"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_aa.png"))) { rank = "AA"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_a.png"))) { rank = "A"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_bbb.png"))) { rank = "BBB"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_bb.png"))) { rank = "BB"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_b.png"))) { rank = "B"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_c.png"))) { rank = "C"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_d.png"))) { rank = "D"; }

      let apfc = "×";
      if (_imgSrcs.some(src => src.includes("music_icon_app.png"))) { apfc = "AP+"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_ap.png"))) { apfc = "AP"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_fcp.png"))) { apfc = "FC+"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_fc.png"))) { apfc = "FC"; }

      if (minRankArgument === "isPlayed" || apfc.includes("AP")) {
        // else ifと対応付けるためだけのスコープなので空白
      } else if (minRankList.indexOf(rank) < minRankList.indexOf(minRankArgument)) {
        continue; // 今後の処理及びrowsに追加をスキップする
      }

      // 2-2. level, rank, apfc以外の残りの要素について抽出する
      // タイトルを抽出し、改行タグ等を変換し、余分な空白を削除し、(D✪N’T  ST✪P  R✪CKIN’対策)、両端のダブルクォーテーションをexcel,googleスプレッドシートでの文字列扱いにするために二重にする("411Ψ892"対策)
      let title = block.querySelector(".music_name_block").textContent
                    .trim()
                    .replace(/[\t\n]/g, "")
                    .replace(/ {2,}/g, " ")
                    .replace(/^"(.*)"$/, '""$1""') || "";

      let difficulty = 'MAS';
      if (_imgSrcs.some(src => src.includes("diff_remaster.png"))) { difficulty = "Re:MAS"; }
      else if (_imgSrcs.some(src => src.includes("diff_expert.png"))) { difficulty = "EXP"; }
      else if (_imgSrcs.some(src => src.includes("diff_utage.png"))) { difficulty = "U・TA・GE"; }
      else if (_imgSrcs.some(src => src.includes("diff_advanced.png"))) { difficulty = "ADV"; }
      else if (_imgSrcs.some(src => src.includes("diff_basic.png"))) { difficulty = "BAS"; }

      let chartType = 'DX';
      if (_imgSrcs.some(src => src.includes("music_standard.png"))) { chartType = "SD"; }
      else if (_imgSrcs.some(src => src.includes("music_utage.png"))) { chartType = "U・TA・GE"; }

      const score = block.querySelector(".music_score_block.w_112")?.textContent.trim() || "";
      const dxScore = Number(block.querySelector(".music_score_block.w_190")?.textContent.trim().split("/")[0].trim().replace(/,/g, "")) || "";
      const dxMaxScore = Number(block.querySelector(".music_score_block.w_190")?.textContent.trim().split("/")[1].trim().replace(/,/g, "")) || "";
      const notes = dxMaxScore / 3 || "";
      const _rawDxRatio = (dxScore && dxMaxScore) ? ((Math.floor(dxScore / dxMaxScore * 10000)) / 100) : "";
      const dxRatio = (dxScore && dxMaxScore) ? `${_rawDxRatio.toFixed(2)}%` : "";
      let dxStar = 0;
      if (_rawDxRatio >= 97) { dxStar = 5; }
      else if (_rawDxRatio >= 95) { dxStar = 4; }
      else if (_rawDxRatio >= 93) { dxStar = 3; }
      else if (_rawDxRatio >= 90) { dxStar = 2; }
      else if (_rawDxRatio >= 85) { dxStar = 1; }

      let sync = "-";
      if (_imgSrcs.some(src => src.includes("music_icon_sync.png"))) { sync = "SYNC"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_fs.png"))) { sync = "FS"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_fsp.png"))) { sync = "FS+"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_fdx.png"))) { sync = "FDX"; }
      else if (_imgSrcs.some(src => src.includes("music_icon_fdxp.png"))) { sync = "FDX+"; }

      // 2-3. rowsに譜面データを追加する
      rows.push([
        title,
        difficulty,
        chartType,
        level,
        "",
        "",
        score,
        dxStar,
        apfc,
        notes,
        dxScore,
        dxMaxScore,
        dxRatio,
        sync,
        rank
      ]);

    }

    if (rows.length === 0) {
      throw new Error(`対象となる譜面データが存在しません。以下を確認の後、再度実行してください。\n・譜面データの一覧にプレイしたことがある譜面が含まれているかを確認する\n・抽出条件に合う譜面データがあるかを確認する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }

    // 3. rowsをタブ区切り方式でクリップボードに貼り付ける
    const tsv = [headers, ...rows].map(row => row.join("\t")).join("\n");
    try {
      navigator.clipboard.writeText(tsv);
      const alertText = `${rows.length} 件の譜面データをクリップボードにコピーしました！\nExcelやGoogleスプレッドシートにそのまま貼り付けられます。`;
      console.log(`${funcName}: ${alertText}\nat ${Date.now()}`);
      alert(`${alertText}\n(実行時間: ${Date.now() - startTime}ms)`);
      return {status: true, message: alertText, executionTime: Date.now() - startTime, resultTsv: tsv};
    } catch (err) {
      throw new Error(`クリップボードへのコピーに失敗しました。\n(理由: ${err.message})\n以下を確認の後、再度実行してください。\n・ブラウザのセキュリティ制限によるブロック\n・OSのクリップボードの容量を超過している\n・上記を確認しても改善しない場合、お手数ですが、使用OS、ブラウザを明記して制作者にご連絡ください。`)
    }

  } catch (e) {
    console.error(`${funcName}: ${e.message} at ${Date.now()}`);
    alert(`エラーが発生しました。\n(理由: ${e.message}\n(実行時間: ${Date.now() - startTime}ms)`);
    return {status: false, message: e.message, executionTime: Date.now() - startTime};
  }


}
