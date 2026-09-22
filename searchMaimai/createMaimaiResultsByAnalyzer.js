function createMaimaiResultsByAnalyzer(outerHtml, filType, anlType) {
  const funcName = createMaimaiResultsByAnalyzer.name;
  const startTime = Date.now();
  console.log(`${funcName}実行開始 at ${startTime}`);

  try {
    // 0. 引数の確認
    if (!outerHtml || !filType || !anlType) {
      throw new Error(`不明なエラーが発生しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }
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
            value="001,master,dx,14p,000000,000,000,000000,0,0,0,0"
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
      remaster: "Re:MAS",
      utage: "U・TA・GE"
    };

    // 譜面種表記の変換マッピング
    const typeMap = {
      standard: "SD",
      dx: "DX"
    };


    // 獲得スコアを取り出す関数
    function parseTitle(container) {
      const titleEl = container.querySelector(".music_title_dx, .music_title_standard, .music_title");
      return titleEl ? titleEl.textContent.trim() : "";
    }

    // 2. filTypeごとに楽曲データを抽出
    // filType: "isPlayed" -> プレイ済みの楽曲のみ抽出
    // filType: "isDisplayed" -> 表示されている楽曲(hiddenクラスがない)のみ抽出
    if (filType !== "isPlayed" && filType !== "isDisplayed") {
      throw new Error(`不明なエラーが発生しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(outerHtml, "text/html");

    let scoreBlocks = Array.from(
      doc.querySelectorAll(".music_score_back")
    );

    if (filType === "isPlayed") {
      scoreBlocks = scoreBlocks.filter((block) => {
        const achiEl = block.querySelector(".achi2, .music_score_block");
        return achiEl && achiEl.querySelector(".f_r");
      });
    } else if (filType === "isDisplayed") {
      scoreBlocks = scoreBlocks.filter((block) => {
        return !block.classList.contains("hidden");
      });
    }

    if (scoreBlocks.length === 0) {
      throw new Error(`対象となる譜面データが存在しません。以下を確認の後、再度実行してください。\n・「プレイ済み楽曲」を指定している場合は、プレイしたことがある譜面が含まれているかを確認する\n・譜面データが一覧で表示されているのを確認する\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);
    }

    const rows = [headers.join("\t")]; // ヘッダー行を追加

    const warnSheets = []; // 'both'使用時や'value'使用時に不一致データが見つかったときに格納する

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

      function createBlock(analysisType = anlType) {
        switch (analysisType) {

          case "value": {

            // valueの場合はclass内のvalue属性(parts)を使用
            const rawValue = nameBlock ? nameBlock.getAttribute("value") : null;
            if (!rawValue) {
              console.warn("value属性が見つかりません:", block);
            }
            const parts = rawValue ? rawValue.split(",") : [];
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
            level = rawLevel ? rawLevel.replace("p", "+") : "";
            const scoreFormat = new Intl.NumberFormat('ja-JP', {
              style: 'percent',
              minimumFractionDigits: 4, // 小数点以下の最小桁数
              maximumFractionDigits: 4, // 小数点以下の最大桁数
            });
            score = rawScore ? scoreFormat.format(parseInt(rawScore, 16) / 1000000) : "";
            dxScore = rawDxScore ? parseInt(rawDxScore, 16) : "";
            dxMaxScore = rawDxMaxScore ? parseInt(rawDxMaxScore, 16) : "";
            notes = dxMaxScore / 3 || "";
            dxRatio = rawDxRatio ? (Math.floor(parseInt(rawDxRatio, 16) / 1000) / 100) + "%": "";

            // 特定の譜面(でらスコ理論値が4095以上)に対して、処理後に警告を表示させる
            const dxMaxScoreOverFlow = [
              ["Xaleid◆scopiX", "Re:MAS"],
              ["系ぎて", "Re:MAS"],
              ["Xaleid◆scopiX", "MAS"],
              ["Latent Kingdom", "MAS"],
              ["ラストピースに祝福と栄光を", "MAS"]
            ];

            if (dxMaxScoreOverFlow.some(([overflowTitle, overflowDifficulty]) =>
              overflowTitle === title && overflowDifficulty === difficulty
            )) {
              warnSheets.push(`タイトル: 「${title}」   難易度: ${difficulty}\n   理由: ノーツ数が非常に多いため、ノーツ数、獲得でらスコ、でらスコ理論値が実際の値と異なる可能性がある`);
              console.warn("でらスコ理論値が4096以上の譜面です:", {
                title,
                difficulty,
                dxMaxScore
              });

              dxMaxScore += 4096;
              dxMaxScore / 3;
            }

            // sync表記の変換マッピング 
            const vl_syncMap = {
              "0": "-",
              "1": "SYNC",
              "2": "FS",
              "3": "FS+",
              "4": "FDX",
              "5": "FDX+"
            };
            sync = vl_syncMap[rawSync] || "";
            // AP/FC表記の変換マッピング
            const vl_apfcMap = {
              "0": "×",
              "1": "FC",
              "2": "FC+",
              "3": "AP",
              "4": "AP+"
            };
            apfc = vl_apfcMap[rawApFc] || rawApFc;
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
            rank = vl_rankMap[rawRank] || rawRank;
            dxStar = Number(rawDxStar) || "";

            break;
          }

          case "span": {
            // AP / FC 画像URLから表記への変換関数
            function sp_parseApFc(imgs) {
              for (const img of imgs) {
                const src = img.src || "";
                if (src.includes("music_icon_app.png")) return "AP+";
                if (src.includes("music_icon_ap.png")) return "AP";
                if (src.includes("music_icon_fcp.png")) return "FC+";
                if (src.includes("music_icon_fc.png")) return "FC";
              }
              return "×";
            }

            // 画像URLからSYNC情報を取り出す関数
            function sp_parseSync(imgs) {
              for (const img of imgs) {
                const src = img.src || "";
                if (src.includes("music_icon_fdxp.png")) return "FDX+";
                if (src.includes("music_icon_fdx.png")) return "FDX";
                if (src.includes("music_icon_fsp.png")) return "FS+";
                if (src.includes("music_icon_fs.png")) return "FS";
                if (src.includes("music_icon_sync.png")) return "SYNC";
              }
              return "-";
            }

            // 画像URLからランクを取り出す関数
            function sp_parseRank(imgs) {
              for (const img of imgs) {
                const src = img.src || "";
                if (src.includes("music_icon_sssp.png")) return "SSS+";
                if (src.includes("music_icon_sss.png")) return "SSS";
                if (src.includes("music_icon_ssp.png")) return "SS+";
                if (src.includes("music_icon_ss.png")) return "SS";
                if (src.includes("music_icon_sp.png")) return "S+";
                if (src.includes("music_icon_s.png")) return "S";
                if (src.includes("music_icon_aaa.png")) return "AAA";
                if (src.includes("music_icon_aa.png")) return "AA";
                if (src.includes("music_icon_a.png")) return "A";
                if (src.includes("music_icon_bbb.png")) return "BBB";
                if (src.includes("music_icon_bb.png")) return "BB";
                if (src.includes("music_icon_b.png")) return "B";
                if (src.includes("music_icon_c.png")) return "C";
                if (src.includes("music_icon_d.png")) return "D";
              }
              return "";
            }

            // DXスコア（★）文字列からDSを取り出す関数
            function sp_parseDS(container) {
              const dxscRatioEl = container.querySelector(".dxscratio2");
              if (!dxscRatioEl) return "";
              const text = dxscRatioEl.textContent;
              const starMatch = text.match(/☆([\d.]+)/);
              if (starMatch && starMatch[1]) {
                return Math.floor(parseFloat(starMatch[1]));
              }
              return "";
            }

            // 獲得スコアを取り出す関数
            function sp_parseScore(container) {
              const achiEl = container.querySelector(".achi2, .music_score_block");
              if (!achiEl) return "";
              const scoreSpan = achiEl.querySelector(".f_r");
              return scoreSpan ? scoreSpan.textContent.trim() : "";
            }


            // spanの場合はvalue属性を使用しない（クラス名およびspan文章判定）

            const imgs = block.querySelectorAll("img");

            let rawDiff = "master"; // デフォルト値
            if (block.classList.contains("remaster")) rawDiff = "remaster";
            else if (block.classList.contains("expert")) rawDiff = "expert";
            else if (block.classList.contains("advanced")) rawDiff = "advanced";
            else if (block.classList.contains("basic")) rawDiff = "basic";
            else if (block.classList.contains("utage")) rawDiff = "U・TA・GE";

            const rawLevel = block.querySelector(".lv_block_new") || "";

            let rawType = "dx"; // デフォルト値
            if (block.querySelector(".music_title_back_standard")) rawType = "standard";

            const rawScore = sp_parseScore(block);
            const rawDxScore = block.querySelector(".dxsc2") ? block.querySelector(".dxsc2").textContent.split("/")[0] : "";
            const rawDxMaxScore = block.querySelector(".dxsc2") ? block.querySelector(".dxsc2").textContent.split("/")[1] : "";
            const rawDxRatio = block.querySelector(".dxscratio2") ? block.querySelector(".dxscratio2").textContent.split("☆")[0]: "";
            const rawSync = sp_parseSync(imgs);
            const rawApFc = sp_parseApFc(imgs);
            const rawRank = sp_parseRank(imgs);
            const rawDxStar = sp_parseDS(block);
            difficulty = diffMap[rawDiff.toLowerCase()] || rawDiff.toUpperCase();
            chartType = typeMap[rawType.toLowerCase()] || rawType.toUpperCase();
            level = rawLevel ? rawLevel.textContent.trim() : "";
            score = rawScore || "";
            dxScore = Number(rawDxScore) || "";
            dxMaxScore = Number(rawDxMaxScore) || "";
            notes = rawDxMaxScore ? dxMaxScore / 3 : "";
            dxRatio = rawDxRatio || "";
            sync = rawSync || "";
            apfc = rawApFc || "";
            rank = rawRank || "";
            dxStar = Number(rawDxStar) || "";

            break;
          }

          case "both": {
            // bothの場合はvalue属性を使用しつつ、クラス名やspan文章も判定（一致しない場合は警告）
            const valueResult = createBlock("value");
            const spanResult = createBlock("span");
            const fields = [
              "difficulty", "chartType", "level", "score", "notes",
              "dxScore", "dxMaxScore", "dxRatio", "sync", "apfc", "rank", "dxStar"
            ];

            fields.forEach((field) => {
              if (valueResult[field] !== spanResult[field]) {
                warnSheets.push(`タイトル: 「${title}」   難易度: ${spanResult["difficulty"]}\n   理由: 抽出方法によって解析結果が異なる`);
                console.warn("valueとspanの解析結果が異なります:", {
                  field,
                  value: valueResult[field],
                  span: spanResult[field],
                  block
                });
              }
            });

            // 相違がある場合もspan側の値を優先する
            return spanResult;
          }
          default:
            throw new Error(`不明なエラーが発生しました。以下を確認の後、再度実行してください。\n・インターネット接続を確認する\n・数分程度間をあける\n・上記を試しても改善しない場合、バグの可能性があります。お手数ですが、制作者にご連絡ください。`);

        }

        return {
          difficulty,
          chartType,
          level,
          score,
          notes,
          dxScore,
          dxMaxScore,
          dxRatio,
          sync,
          apfc,
          rank,
          dxStar
        };
      }

      ({
        difficulty,
        chartType,
        level,
        score,
        notes,
        dxScore,
        dxMaxScore,
        dxRatio,
        sync,
        apfc,
        rank,
        dxStar
      } = createBlock());


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
      let alertText = `${scoreBlocks.length}件の譜面データをクリップボードにコピーしました！\nExcelやGoogleスプレッドシートにそのまま貼り付けられます。`;
      if (warnSheets.length !== 0) {
        alertText += `\n警告: いくつかの譜面データの情報が正確でない可能性があります。以下に示す譜面について、貼り付け後、攻略wiki等で情報を再確認してください。\n${warnSheets.join('\n')}`;
      }
      console.log(`${funcName}: ${alertText} at ${Date.now()}`);
      alert(`${alertText} (実行時間: ${Date.now() - startTime}ms)`);
    } catch (err) {
      throw new Error(`クリップボードへのコピーに失敗しました。以下を確認の後、再度実行してください。\n・ブラウザのセキュリティ制限によるブロック\n・OSのクリップボードの容量を超過している\n・上記を確認しても改善しない場合、お手数ですが、使用OS、ブラウザを明記して制作者にご連絡ください。`)
    }

  } catch (e) {
    console.error(`${e.message} at ${Date.now()}`);
    alert(`${e.message} (実行時間: ${Date.now() - startTime}ms)`);
  }
}

