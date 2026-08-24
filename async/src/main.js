// Vite가 CSS를 함께 묶어 제공하도록 JavaScript 진입 파일에서 불러옵니다.
import './style.css'

// 신버전 기능은 별도 파일로 분리하고, 여기서는 초기화 함수만 가져옵니다.
import { initNewPrivacyPolicies } from './common.js'

/**
 * 구버전 개인정보 처리방침 화면을 준비합니다.
 *
 * 구버전 파일은 수정하지 않아야 하므로 기존처럼 iframe으로 보여 줍니다.
 * 선택 목록은 별도 HTML 파일이므로 fetch()로 가져온 후 이벤트를 연결합니다.
 */
async function initLegacyPrivacyPolicies() {
  // 여러 함수에서 사용할 주요 화면 요소를 미리 찾아 둡니다.
  const selectorWrap = document.querySelector('#private_sel')
  const policyContent = document.querySelector('#policyContent')
  const oldPolicyFrame = document.querySelector('#privateInfo')

  // 필수 요소가 없으면 null 관련 오류가 이어지므로 여기서 실행을 중단합니다.
  if (!selectorWrap || !policyContent || !oldPolicyFrame) {
    console.error('구버전 개인정보 처리방침 화면을 초기화할 수 없습니다.')
    return
  }

  // 현재 사용 중인 관찰자와 예약된 높이 계산 작업을 기억합니다.
  let frameResizeObserver
  let resizeAnimationFrame

  /**
   * iframe 내부 문서의 실제 높이를 측정해 iframe 높이에 적용합니다.
   * 이 방식으로 각 구버전의 픽셀 높이를 배열에 직접 입력하지 않아도 됩니다.
   */
  function resizeLegacyFrame({ reset = false } = {}) {
    // 짧은 시간에 여러 번 요청되면 이전 요청을 취소하고 마지막 요청만 처리합니다.
    cancelAnimationFrame(resizeAnimationFrame)

    if (reset) {
      // 이전 문서의 큰 iframe 높이가 새 문서 측정값에 포함되지 않도록 초기화합니다.
      oldPolicyFrame.style.height = '0px'
    }

    // 브라우저가 화면 배치를 계산하는 시점에 맞춰 높이를 측정합니다.
    resizeAnimationFrame = requestAnimationFrame(() => {
      try {
        // contentDocument는 iframe 내부 document입니다.
        // 부모 페이지와 iframe이 같은 출처일 때만 접근할 수 있습니다.
        const frameDocument = oldPolicyFrame.contentDocument

        if (!frameDocument) {
          return
        }

        const body = frameDocument.body
        const documentElement = frameDocument.documentElement

        // HTML 구조나 브라우저에 따라 body와 html 높이가 다를 수 있으므로
        // 네 가지 측정값 중 가장 큰 값을 실제 콘텐츠 높이로 사용합니다.
        const contentHeight = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          documentElement?.scrollHeight || 0,
          documentElement?.offsetHeight || 0,
        )

        if (contentHeight > 0) {
          oldPolicyFrame.style.height = `${contentHeight}px`
        }
      } catch (error) {
        console.error('구버전 처리방침 iframe 높이 계산 실패', error)
      }
    })
  }

  /**
   * iframe 문서가 로드된 후 높이를 계산하고 이후 크기 변화도 감시합니다.
   * 이미지 로드나 줄바꿈 때문에 본문 길이가 나중에 바뀌는 경우까지 대응합니다.
   */
  function observeLegacyFrame() {
    // 다른 버전으로 이동했다면 이전 iframe 문서에 연결한 관찰을 먼저 해제합니다.
    frameResizeObserver?.disconnect()
    resizeLegacyFrame({ reset: true })

    const frameDocument = oldPolicyFrame.contentDocument

    if (!frameDocument) {
      return
    }

    // ResizeObserver는 관찰 대상의 크기가 바뀔 때 콜백을 실행하는 브라우저 API입니다.
    frameResizeObserver = new ResizeObserver(() => resizeLegacyFrame())
    frameResizeObserver.observe(frameDocument.documentElement)

    if (frameDocument.body) {
      frameResizeObserver.observe(frameDocument.body)
    }

    // 웹폰트 적용 후 글자 폭과 줄바꿈이 달라질 수 있어 한 번 더 계산합니다.
    frameDocument.fonts?.ready.then(() => resizeLegacyFrame())
  }

  // iframe의 새 문서가 로드되어야 내부 콘텐츠 높이를 정확히 읽을 수 있습니다.
  oldPolicyFrame.addEventListener('load', observeLegacyFrame)

  // 브라우저 너비가 바뀌면 줄바꿈도 바뀌므로 높이를 다시 계산합니다.
  window.addEventListener('resize', () => resizeLegacyFrame())

  // main.js가 실행되기 전에 iframe 로드가 끝난 경우도 놓치지 않도록 확인합니다.
  if (oldPolicyFrame.contentDocument?.readyState === 'complete') {
    observeLegacyFrame()
  }

  try {
    // 별도 파일로 관리되는 구버전 셀렉트 HTML을 비동기로 가져옵니다.
    // await 덕분에 응답을 받은 다음 줄부터 순서대로 실행할 수 있습니다.
    const response = await fetch('/ec/private_select.html')

    // fetch는 404/500 응답을 자동으로 예외 처리하지 않으므로 직접 확인합니다.
    if (!response.ok) {
      throw new Error(`구버전 선택 목록 로드 실패 (${response.status})`)
    }

    // 응답 본문을 문자열로 변환해 비어 있던 선택 영역에 삽입합니다.
    selectorWrap.innerHTML = await response.text()

    // 셀렉트 HTML을 삽입한 이후에야 그 안의 요소를 찾을 수 있습니다.
    const policySelect = selectorWrap.querySelector('#goSelect')
    const policyButton = selectorWrap.querySelector('.input_btn')
    const legacyPolicyGroup = selectorWrap.querySelector('#legacyPolicyGroup')

    if (!policySelect || !policyButton || !legacyPolicyGroup) {
      throw new Error('구버전 선택 목록의 필수 요소를 찾을 수 없습니다.')
    }

    policyButton.addEventListener('click', (event) => {
      // selectedOptions[0]은 현재 사용자가 선택한 option 요소입니다.
      const selectedOption = policySelect.selectedOptions[0]

      // 신버전은 common.js가 처리하므로 구버전 코드에서는 아무 작업도 하지 않습니다.
      if (!selectedOption || selectedOption.dataset.policyType === 'new') {
        return
      }

      // 확인 버튼이 <a href="#">이므로 기본 동작인 # 이동을 막습니다.
      event.preventDefault()

      // 신버전 영역은 숨기고 기존 iframe을 다시 보여 줍니다.
      policyContent.hidden = true
      oldPolicyFrame.hidden = false

      // src가 바뀌면 iframe의 load 이벤트가 발생하고 높이도 자동 계산됩니다.
      oldPolicyFrame.src = selectedOption.value

      // 새 약관을 열 때 사용자가 항상 본문 처음부터 볼 수 있게 합니다.
      window.scrollTo({ top: 0, behavior: 'auto' })
    })

    // 기존 마크업/CSS의 .btn9 구조를 유지하기 위해 버튼을 span으로 감쌉니다.
    const buttonWrap = document.createElement('span')
    buttonWrap.className = 'btn9'
    policyButton.before(buttonWrap)
    buttonWrap.append(policyButton)

    // 셀렉트가 DOM에 준비된 뒤 호출해야 common.js가 필요한 요소를 찾을 수 있습니다.
    initNewPrivacyPolicies()
  } catch (error) {
    // 개발자는 콘솔에서 원인을 보고, 사용자는 화면에서 실패 사실을 확인합니다.
    console.error(error)
    selectorWrap.textContent = '개인정보 처리방침 목록을 불러오지 못했습니다.'
  }
}

// 이 모듈이 브라우저에서 실행되면 구버전 화면 초기화를 시작합니다.
initLegacyPrivacyPolicies()
