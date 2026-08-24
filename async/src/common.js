/**
 * 신버전 개인정보 처리방침 목록과 본문을 준비합니다.
 *
 * 신버전은 iframe을 사용하지 않고 fetch()로 HTML을 가져와
 * 현재 페이지의 #policyContent 안에 직접 표시합니다.
 * export한 이유는 main.js가 셀렉트를 만든 다음 정확한 시점에 호출하기 위해서입니다.
 */
export function initNewPrivacyPolicies() {
  // 화면 동작에 필요한 요소를 한 번 찾아 변수에 저장합니다.
  const policyWrap = document.querySelector('.privacy-policy')
  const policySelect = document.querySelector('#goSelect')
  const policyButton = document.querySelector('.input_btn')
  const policyContent = document.querySelector('#policyContent')
  const oldPolicyFrame = document.querySelector('#privateInfo')
  const currentPolicyGroup = document.querySelector('#currentPolicyGroup')

  // 필요한 요소가 없으면 null을 조작하다 오류가 발생하므로 초기화를 중단합니다.
  if (!policyWrap || !policySelect || !policyButton || !policyContent || !oldPolicyFrame || !currentPolicyGroup) {
    console.error('개인정보 처리방침 화면을 초기화할 수 없습니다.')
    return
  }

  // data-policy-type="personal"을 읽어 처리방침 종류별 폴더 경로를 만듭니다.
  // 나중에 corp 같은 유형이 추가돼도 같은 함수를 재사용할 수 있습니다.
  const policyType = policyWrap.dataset.policyType
  const policyBasePath = `/privacy-policy/${policyType}/`

  /**
   * 반복되는 "URL 요청 → 오류 확인 → 문자열 변환"을 하나로 묶은 함수입니다.
   * 목록 JSON과 본문 HTML 요청의 오류 처리 방식을 동일하게 유지할 수 있습니다.
   */
  async function fetchText(url, errorMessage) {
    const response = await fetch(url)

    // fetch는 HTTP 404/500을 자동으로 예외 처리하지 않으므로 response.ok를 확인합니다.
    if (!response.ok) {
      throw new Error(`${errorMessage} (${response.status})`)
    }

    return response.text()
  }

  // 개발자는 콘솔에서 원인을 확인하고 사용자는 화면에서 안내를 볼 수 있게 합니다.
  function showError(error) {
    console.error(error)
    oldPolicyFrame.hidden = true
    policyContent.hidden = false
    policyContent.textContent = '개인정보 처리방침을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  /** 선택한 신버전 HTML을 가져와 화면에 표시합니다. */
  async function loadNewPolicy(url) {
    // 신버전과 구버전이 동시에 보이지 않도록 표시 영역을 전환합니다.
    policyContent.hidden = false
    oldPolicyFrame.hidden = true

    // 보조기기에 현재 콘텐츠가 로딩 중임을 알리는 접근성 속성입니다.
    policyContent.setAttribute('aria-busy', 'true')

    try {
      // 이 프로젝트에서 관리하는 신뢰 가능한 약관 HTML을 실제 요소로 삽입합니다.
      policyContent.innerHTML = await fetchText(url, '신버전 개인정보 처리방침 파일 로드 실패')
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch (error) {
      showError(error)
    } finally {
      // 성공과 실패 어느 쪽이든 로딩 상태를 해제해야 하므로 finally를 사용합니다.
      policyContent.removeAttribute('aria-busy')
    }
  }

  /** policies.json을 읽어 신버전 option 요소를 자동으로 생성합니다. */
  async function addNewPolicyOptions() {
    try {
      const json = await fetchText(`${policyBasePath}policies.json`, '신버전 목록 로드 실패')

      // fetchText() 결과는 문자열이므로 반복 가능한 JavaScript 배열로 변환합니다.
      const policies = JSON.parse(json)

      policies.forEach((policy) => {
        // JSON에 버전을 추가하기만 해도 셀렉트 옵션이 만들어지게 합니다.
        const option = document.createElement('option')
        option.value = `${policyBasePath}${policy.file}`

        // 클릭할 때 main.js의 구버전 처리와 구별하기 위한 표시입니다.
        option.dataset.policyType = 'new'
        option.textContent = policy.label || `개인정보 처리방침 V${policy.version} 보기`
        currentPolicyGroup.append(option)
      })

      // JSON 배열의 첫 항목을 최신 버전으로 간주해 처음 화면에 표시합니다.
      const latestPolicy = currentPolicyGroup.querySelector('option[data-policy-type="new"]')

      if (latestPolicy) {
        latestPolicy.selected = true
        await loadNewPolicy(latestPolicy.value)
      }
    } catch (error) {
      showError(error)
    }
  }

  // main.js와 같은 확인 버튼을 사용하지만 신버전이 선택된 경우에만 처리합니다.
  policyButton.addEventListener('click', (event) => {
    const selectedOption = policySelect.selectedOptions[0]

    // 구버전은 main.js가 iframe으로 처리하므로 여기서는 그대로 종료합니다.
    if (selectedOption?.dataset.policyType !== 'new') {
      return
    }

    event.preventDefault()
    loadNewPolicy(selectedOption.value)
  })

  // 이벤트 연결 후 JSON을 읽어 초기 목록과 최신 본문을 표시합니다.
  addNewPolicyOptions()
}
