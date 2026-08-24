import './style.css'
import { initNewPrivacyPolicies } from './common.js'

async function initLegacyPrivacyPolicies() {
	const selectorWrap = document.querySelector('#private_sel')
	const policyContent = document.querySelector('#policyContent')
	const oldPolicyFrame = document.querySelector('#privateInfo')

	if (!selectorWrap || !policyContent || !oldPolicyFrame) {
		console.error('구버전 개인정보 처리방침 화면을 초기화할 수 없습니다.')
		return
	}

	let frameResizeObserver
	let resizeAnimationFrame

	function resizeLegacyFrame({ reset = false } = {}) {
		cancelAnimationFrame(resizeAnimationFrame)

		if (reset) {
			// 이전 문서의 큰 iframe 높이가 새 문서의 scrollHeight에 반영되지 않게 초기화합니다.
			oldPolicyFrame.style.height = '0px'
		}

		resizeAnimationFrame = requestAnimationFrame(() => {
			try {
				const frameDocument = oldPolicyFrame.contentDocument

				if (!frameDocument) {
					return
				}

				const body = frameDocument.body
				const documentElement = frameDocument.documentElement
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

	function observeLegacyFrame() {
		frameResizeObserver?.disconnect()
		resizeLegacyFrame({ reset: true })

		const frameDocument = oldPolicyFrame.contentDocument

		if (!frameDocument) {
			return
		}

		frameResizeObserver = new ResizeObserver(() => resizeLegacyFrame())
		frameResizeObserver.observe(frameDocument.documentElement)

		if (frameDocument.body) {
			frameResizeObserver.observe(frameDocument.body)
		}

		// 웹폰트 적용 후 줄바꿈으로 높이가 바뀌는 경우까지 반영합니다.
		frameDocument.fonts?.ready.then(() => resizeLegacyFrame())
	}

	oldPolicyFrame.addEventListener('load', observeLegacyFrame)
	window.addEventListener('resize', () => resizeLegacyFrame())

	if (oldPolicyFrame.contentDocument?.readyState === 'complete') {
		observeLegacyFrame()
	}

	try {
		const response = await fetch('/ec/private_select.html')

		if (!response.ok) {
			throw new Error(`구버전 선택 목록 로드 실패 (${response.status})`)
		}

		selectorWrap.innerHTML = await response.text()

		const policySelect = selectorWrap.querySelector('#goSelect')
		const policyButton = selectorWrap.querySelector('.input_btn')
		const legacyPolicyGroup = selectorWrap.querySelector('#legacyPolicyGroup')

		if (!policySelect || !policyButton || !legacyPolicyGroup) {
			throw new Error('구버전 선택 목록의 필수 요소를 찾을 수 없습니다.')
		}

		policyButton.addEventListener('click', (event) => {
			const selectedOption = policySelect.selectedOptions[0]

			// 신버전 선택은 common.js의 fetch 로직에서 처리합니다.
			if (!selectedOption || selectedOption.dataset.policyType === 'new') {
				return
			}

			event.preventDefault()

			policyContent.hidden = true
			oldPolicyFrame.hidden = false
			oldPolicyFrame.src = selectedOption.value

			window.scrollTo({ top: 0, behavior: 'auto' })
		})

		const buttonWrap = document.createElement('span')
		buttonWrap.className = 'btn9'
		policyButton.before(buttonWrap)
		buttonWrap.append(policyButton)

		initNewPrivacyPolicies()
	} catch (error) {
		console.error(error)
		selectorWrap.textContent = '개인정보 처리방침 목록을 불러오지 못했습니다.'
	}
}

initLegacyPrivacyPolicies()
