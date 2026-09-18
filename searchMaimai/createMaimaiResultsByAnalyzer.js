
function createMaimaiResultsByAnalyzer(outerHtml, filType, anlType) {
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

  // containerの例
  /*
    <div class="w_450 p_3 music_score_back master hidden">
        <div class="lv_block_new f_r t_c f_12">14</div>
        <div value="000,master,dx,14,0F5B2E,A53,B58,8ADFB7,0,1,E,2" class="music_name_block t_l music_title_back_dx">
            <span class="t_l f_12 break music_title_dx">超ナイト・オブ・ナイツ</span></div>
        <div class="clearfix"></div>
        <div class="music_score_block record_block achi2 f_l"><span class="f_r">100.6382%</span></div>
        <div class="music_score_block dxsc f_l"><span class="dxsc2 f_l">2643/2904</span><span
                class="dxscratio2 f_r">91.01%☆2.33</span><span class="dxscdiff2 f_r">(-261)</span></div><img
            src="https://maimaidx.jp/maimai-mobile/img/music_icon_back.png" class="lampfsdx f_r"><img
            src="https://maimaidx.jp/maimai-mobile/img/music_icon_fc.png" class="lampfcap f_r"><img
            src="https://maimaidx.jp/maimai-mobile/img/music_icon_sssp.png" class="lamprank f_r"><img
            src="https://maimaidx.jp/maimai-mobile/img/music_icon_dxstar_2.png" class="dxscstar f_r">
        <div class="clearfix"></div>
    </div>  
  */

  // music_name_blockの例
  /* <div value="000,master,dx,14,0F5B2E,A53,B58,8ADFB7,0,1,E,2" class="music_name_block t_l music_title_back_dx">
    // 000: 曲番号 (未使用)
    // master: 難易度
    // dx: 譜面種 (standard / dx)
    // 14: 譜面lv (14pなど)
    // 0F5B2E: 獲得スコア * 10000
    // A53: 獲得でらっくスコア
    // B58: 理論でらっくスコア (ノーツ数 * 3)
    // 8ADFB7: 獲得でらっくスコアの割合 (A53 / B58 * 10000000)
    // 0: syncプレイ有無 (0:なし, 1:sync play, 2:full sync, 3:full sync+, 4:full sync DX, 5:full sync DX+)
    // 1: AP/FC (0:なし, 1:FC, 2:FC+, 3:AP, 4:AP+)
    // E: ランク (E:SSS+, D:SSS, C:SS+, B:SS, A:S+, 9:S, 8:AAA, 7:AA, 6:A, 5:BBB, 4:BB, 3:B, 2:C, 1:D)
    // 2: DX星数 (★の数 8ADFB7に応じて算出される 1:85％~ 2:90%~ 3:93%~ 4:95%~ 5:97％~)

  */
  // 変換用関数群

    // 難易度表記の変換マッピング
    const diffMap = {
      basic: "BAS",
      advanced: "ADV",
      expert: "EXP",
      master: "MAS",
      remaster: "Re:MAS"
    };

    // 譜面種表記の変換マッピング
    const typeMap = {
      standard: "SD",
      dx: "DX"
    };

    // AP/FC表記の変換マッピング
    const vl_apfcMap = {
      "0": "×",
      "1": "FC",
      "2": "FC+",
      "3": "AP",
      "4": "AP+"
    };

    // ランク表記の変換マッピング
    const vl_rankMap = {
      "E": "SSS+",
      "D": "SSS",
      "C": "SS+", 
      "B": "SS",
      "A": "S+",
      "9": "S",
      "8": "AAA",
      "7": "AA",
      "6": "A",
      "5": "BBB",
      "4": "BB",
      "3": "B",
      "2": "C",
      "1": "D"
    };

    // AP / FC 画像URLから表記への変換関数
    function sp_parseApFc(container) {
      // コンテナ内の全img要素を取得
      const imgs = container.querySelectorAll("img");
      for (const img of imgs) {
        const src = img.src || "";
        if (src.includes("music_icon_app.png")) return "AP+";
        if (src.includes("music_icon_ap.png")) return "AP";
        if (src.includes("music_icon_fcp.png")) return "FC+";
        if (src.includes("music_icon_fc.png")) return "FC";
      }
      return "×"; // 該当なし（back.png等）
    }

    // DXスコア（★）文字列からDS（★のあとの数値の小数点切り捨て）を取り出す関数
    function sp_parseDS(container) {
      const dxscRatioEl = container.querySelector(".dxscratio2");
      if (!dxscRatioEl) return "";
    
      const text = dxscRatioEl.innerText; // 例: "93.36%☆3.18"
      const starMatch = text.match(/☆([\d.]+)/);
      if (starMatch && starMatch[1]) {
        return Math.floor(parseFloat(starMatch[1])).toString(); // 3.18 -> "3"
      }
      return "";
    }

    // 獲得スコアを取り出す関数
    function sp_parseScore(container) {
      const achiEl = container.querySelector(".achi2, .music_score_block");
      if (!achiEl) return "";
      const scoreSpan = achiEl.querySelector(".f_r");
      return scoreSpan ? scoreSpan.innerText.trim() : "";
    }

    // タイトルを取り出す関数
    /*function parseTitle(container) {
      const titleEl = container.querySelector(".music_title_dx, .music_title_standard, .music_title");
      return titleEl ? titleEl.innerText.trim() : "";
    }*/
    function parseTitle(container) {
  const titleEl = container.querySelector(
    ".music_title_dx, .music_title_standard, .music_title"
  );

  console.log(
    "TITLE DEBUG:",
    {
      found: !!titleEl,
      innerText: titleEl ? titleEl.innerText : null,
      textContent: titleEl ? titleEl.textContent : null,
      html: titleEl ? titleEl.outerHTML : null
    }
  );

  return titleEl ? titleEl.textContent.trim() : "";
}

    // value用 獲得スコアを取り出す関数
    function vl_parseScore(rawScore) {
      return rawScore ? (parseInt(rawScore, 16) / 10000).toFixed(4) : "";
    }

    // value用 でらっくスコアを取り出す関数
    function vl_parseDxScore(rawDxScore) {
      return rawDxScore ? parseInt(rawDxScore, 16) : "";
    }

    // value用 でらっくスコア率を取り出す関数
    function vl_parseDxRatio(rawDxRatio) {
      return rawDxRatio ? (parseInt(rawDxRatio, 16) / 10000000).toFixed(4) : "";
    }




  

  // 2. filTypeごとに楽曲データを抽出
    // filType: "all" -> 全ての楽曲を抽出
    // filType: "isPlayed" -> プレイ済みの楽曲のみ抽出
  let scoreBlocks = document.querySelectorAll(".music_score_back");
  if (filType === "isPlayed") {
    scoreBlocks = Array.from(scoreBlocks).filter((block) => {
      const achiEl = block.querySelector(".achi2, .music_score_block");
      return achiEl && achiEl.querySelector(".f_r");
    });
  }
  const rows = [headers.join("\t")]; // ヘッダー行を追加

  scoreBlocks.forEach((block) => {
    // --- タイトル ---
    const title = parseTitle(block);

    // --- value属性の取得と解析 ---
    const nameBlock = block.querySelector(".music_name_block");


    let difficulty = "";
    let chartType = "";
    let level = "";
    let score = "";
    let notes = "";
    let dxScore = "";
    let dxMaxScore = "";
    let dxRatio = "";
    let sync = "";
    let apfc = "";
    let rank = "";
    let dxStar = "";

    switch (anlType) {

      case "value": {
        // valueの場合はclass内のvalue属性(parts)を使用
        const valAttr = nameBlock ? nameBlock.getAttribute("value") : null;
        if (!valAttr) {
          console.warn("value属性が見つかりません:", block);
        }
        const parts = valAttr ? valAttr.split(",") : [];
        const rawDiff = parts[1] || "";
        const rawType = parts[2] || "";
        const rawLevel = parts[3] || "";
        const rawScore = parts[4] || "";
        const rawDxScore = parts[5] || "";
        const rawDxMaxScore = parts[6] || "";
        const rawDxRatio = parts[7] || "";
        const rawSync = parts[8] || "";
        const rawApFc = parts[9] || "";
        const rawRank = parts[10] || "";
        const rawDxStar = parts[11] || "";

        difficulty = diffMap[rawDiff.toLowerCase()] || rawDiff.toUpperCase();
        chartType = typeMap[rawType.toLowerCase()] || rawType.toUpperCase();
        level = rawLevel || "";
        score = vl_parseScore(rawScore);
        dxScore = vl_parseDxScore(rawDxScore);
        dxMaxScore = vl_parseDxScore(rawDxMaxScore);
        notes = vl_parseDxScore(rawDxMaxScore) / 3 || "";
        dxRatio = vl_parseDxRatio(rawDxRatio);
        sync = rawSync || "";
        apfc = vl_apfcMap[rawApFc] || rawApFc;
        rank = vl_rankMap[rawRank] || rawRank;
        dxStar = rawDxStar || "";

        break;
      }

      case "span": {
        // spanの場合はvalue属性を使用しない（クラス名およびspan文章判定）

        let rawDiff = "master"; // デフォルト値
        if (block.classList.contains("remaster")) rawDiff = "remaster";
        else if (block.classList.contains("expert")) rawDiff = "expert";
        else if (block.classList.contains("advanced")) rawDiff = "advanced";
        else if (block.classList.contains("basic")) rawDiff = "basic";

        const rawLevel = block.querySelector(".lv_block_new") || "";

        let rawType = "dx"; // デフォルト値
        if (block.querySelector(".music_title_back_standard")) rawType = "standard";

        const rawScore = sp_parseScore(block);
        const rawDxScore = block.querySelector(".dxsc2") ? block.querySelector(".dxsc2").innerText.split("/")[0] : "";
        const rawDxMaxScore = block.querySelector(".dxsc2") ? block.querySelector(".dxsc2").innerText.split("/")[1] : "";
        const rawDxRatio = block.querySelector(".dxscratio2") ? block.querySelector(".dxscratio2").innerText.split("☆")[0].replace("%", "") : "";
        const rawSync = ""; // sync情報はspanからは取得できないため空文字
        const rawApFc = sp_parseApFc(block);
        const rawRank = block.querySelector(".lamprank") ? block.querySelector(".lamprank").className.split(" ")[1].replace("music_icon_", "").toUpperCase() : "";
        const rawDxStar = block.querySelector(".dxscstar") ? block.querySelector(".dxscstar").className.split(" ")[1].replace("music_icon_dxstar_", "") : "";

        difficulty = diffMap[rawDiff.toLowerCase()] || rawDiff.toUpperCase();
        chartType = typeMap[rawType.toLowerCase()] || rawType.toUpperCase();
        level = rawLevel ? rawLevel.innerText.trim() : "";
        score = rawScore || "";
        dxScore = rawDxScore || "";
        dxMaxScore = rawDxMaxScore || "";
        notes = rawDxMaxScore ? parseInt(rawDxMaxScore) / 3 : "";
        dxRatio = rawDxRatio || "";
        sync = rawSync || ""; // 空文字
        apfc = rawApFc || "";
        rank = rawRank.replace("p", "+") || ""; // "p"を"+"に置換
        dxStar = rawDxStar || "";

        break;
      }

      case "hybrid":
        // hybridの場合はvalue属性を使用しつつ、クラス名やspan文章も判定（一致しない場合は警告）
        // 後で作ります
        break;

      default:
        console.warn("不明な解析タイプ:", anlType);
    
    }


    // 1曲分のデータを配列表記にする
    /*
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
  ];*/
    const rowData = [
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
    ];

    // エスケープ処理（タイトルにタブや改行が入っていた場合の対策）
    const formattedRow = rowData.map((val) => {
      const str = val ?? "";
      const text = String(str);
      if (text.includes("\t") || text.includes("\n") || text.includes('"')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    });

    rows.push(formattedRow.join("\t"));
  });

  // 3. クリップボードへのコピー実行
  const resultTsv = rows.join("\n");
  try {
    navigator.clipboard.writeText(resultTsv);
    console.log(`抽出完了: 計 ${scoreBlocks.length} 件のデータを出力しました。`);
    alert(`${scoreBlocks.length}件の楽曲データをクリップボードにコピーしました！\nExcelやGoogleスプレッドシートにそのまま貼り付けられます。`);
  } catch (err) {
    console.error("クリップボードへのコピーに失敗しました:", err);
  }
}

