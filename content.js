/*********************************************************************
 *  YouTube Shorts Blocker v1.2
 *  - Mini-Guide, Full-Guide 어떤 레이아웃이든 Shorts 줄 숨김 처리
 *  - 홈/검색/구독 등 Shorts 섹션 제거
 *  - MutationObserver + yt-navigate-finish 이벤트 대응
 *********************************************************************/

/* ---------- 공통 함수 ---------- */
function insertPlaceholder(oldEl, text = 'Shorts Removed') {
    const ph = document.createElement('div');
    ph.className = 'ysb-placeholder';
    ph.textContent = text;
    ph.style.cssText = `
      padding: 8px 12px;
      font-size: 14px;
      color: #888;
      opacity: 0.4;
      user-select: none;
    `;
    oldEl.replaceWith(ph);
  }
  
  /* 텍스트가 진짜 “Shorts”인지 확인 (다국어 YouTube 대응은 필요하면 추가) */
  function isShortsTitle(node) {
    return (
      node &&
      node.textContent &&
      node.textContent.trim().toLowerCase() === 'shorts'
    );
  }
  
  /* ---------- 사이드바 처리 ---------- */
  function removeShortsSidebar() {
    /* ① Mini-Guide (왼쪽 접힌 메뉴) */
    document
      .querySelectorAll(
        'ytd-mini-guide-entry-renderer[aria-label="Shorts"], ' +
        'ytd-mini-guide-entry-renderer a[href^="/shorts"]'
      )
      .forEach(el => {
        const container = el.closest('ytd-mini-guide-entry-renderer');
        if (container && !container.classList.contains('ysb-placeholder')) {
          insertPlaceholder(container);
        }
      });
  
    /* ② Full-Guide (펼친 메뉴) – 뷰포트에 따라 표시 */
    document.querySelectorAll('ytd-guide-entry-renderer').forEach(render => {
      if (render.classList.contains('ysb-placeholder')) return; // 이미 대체됐으면 패스
  
      /* 다양한 패턴 체크:
         - aria-label="Shorts"
         - 내부 a[href^="/shorts"]
         - anchor title="Shorts"
         - title 텍스트 노드 == “Shorts”
      */
      const match =
        render.getAttribute('aria-label') === 'Shorts' ||
        render.querySelector('a[href^="/shorts"]') ||
        render.querySelector('a[title="Shorts"]') ||
        Array.from(render.querySelectorAll('.title, #endpoint, tp-yt-paper-item'))
          .some(isShortsTitle);
  
      if (match) insertPlaceholder(render);
    });
  }
  
  /* ---------- 피드(홈·검색 등) 처리 ---------- */
  function removeShortsFeed() {
    /* 홈의 ‘Shorts’ 카드 제거 */
    document.querySelectorAll('ytd-rich-section-renderer').forEach(section => {
      const title = section.querySelector('#title')?.textContent?.trim()?.toLowerCase();
      if (title === 'shorts') section.remove();
    });
  
    /* 탐색/검색 결과 Shorts 그리드 제거 */
    document.querySelectorAll('ytd-rich-shelf-renderer').forEach(shelf => {
      if (shelf.hasAttribute('is-shorts') || shelf.getAttribute('is-shorts') !== null) {
        shelf.remove();
      }
    });
  
    /* 남은 단일 Shorts 썸네일 제거 */
    document.querySelectorAll('a[href^="/shorts"]').forEach(a => {
      a.closest(
        'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer'
      )?.remove();
    });
  }
  
  /* ---------- 메인 루틴 ---------- */
  function nukeShortsEverywhere() {
    removeShortsSidebar();
    removeShortsFeed();
  }
  
  /* DOM 변동 실시간 감시 */
  const obs = new MutationObserver(nukeShortsEverywhere);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  
  /* YouTube SPA 내비게이션 대응 */
  window.addEventListener('yt-navigate-finish', nukeShortsEverywhere);
  
  /* 최초 실행 */
  nukeShortsEverywhere();
  