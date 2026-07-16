// ============================================================
// デバッグ用ログの切り替え
// 動作確認したい場合は true にして拡張機能を再読み込みしてください。
// edge://extensions → 対象拡張機能の「Service Worker」リンクから
// コンソールログを確認できます。
// ============================================================
const DEBUG = false;

function log(...args) {
  if (DEBUG) console.log("[BookmarkMiddleClickActivator]", ...args);
}

// 新しいタブが作成されたときだけ動作する（常駐キャッシュ・定期処理は一切なし）
chrome.tabs.onCreated.addListener((tab) => {
  try {
    if (!tab || typeof tab.id !== "number") {
      log("tab.id が取得できないため終了:", tab);
      return;
    }

    // すでにアクティブなら何もしない（対象は背面で開かれたタブのみ）
    if (tab.active) {
      log("既にアクティブなタブのため対象外:", tab.id);
      return;
    }

    const url = tab.url || tab.pendingUrl;
    if (!url) {
      log("URLが未確定のため終了:", tab.id);
      return;
    }

    // そのURLがブックマークに完全一致するかをその都度だけ問い合わせる
    // （ブラウザ側のインデックスを使うため、全件走査やメモリ常駐は不要）
    chrome.bookmarks.search({ url }, (results) => {
      if (chrome.runtime.lastError) {
        log("bookmarks.search でエラー:", chrome.runtime.lastError.message);
        return;
      }

      if (results && results.length > 0) {
        log("ブックマークに一致 → アクティブ化します:", url);
        chrome.tabs.update(tab.id, { active: true }, () => {
          if (chrome.runtime.lastError) {
            // タブが既に閉じられている場合などに発生しうるが無視して問題ない
            log("tabs.update でエラー（無視可）:", chrome.runtime.lastError.message);
          }
        });
      } else {
        log("ブックマークに一致しないため対象外:", url);
      }
    });
  } catch (err) {
    console.error("[BookmarkMiddleClickActivator] 予期しないエラー:", err);
  }
});
