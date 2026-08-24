import './style.css'
import { initNewPrivacyPolicies } from './common.js'

// 실제 적용 시 기존 운영 코드의 35개 높이값을 그대로 사용합니다.
const legacyPolicyHeights = ['9492']

window.jQuery(() => {
  window.jQuery.ajax({
    type: 'get',
    url: '/ec/private_select.html',
    dataType: 'html',
    success(data) {
      const $ = window.jQuery

      $('#private_sel').append(data)

      $('.input_btn').on('click', (event) => {
        const selectedOption = $('#goSelect option:selected')

        // 신버전 선택은 common.js의 fetch 로직에서 처리합니다.
        if (selectedOption.data('policy-type') === 'new') {
          return
        }

        event.preventDefault()

        const legacyIndex = $('#legacyPolicyGroup option').index(selectedOption)

        $('#policyContent').prop('hidden', true)
        $('#privateInfo')
          .prop('hidden', false)
          .css('height', legacyPolicyHeights[legacyIndex])
          .attr('src', selectedOption.val())

        $('html, body').stop().animate({ scrollTop: 0 }, 0)
      })

      $('.input_btn').wrap('<span class="btn9"></span>')
      initNewPrivacyPolicies()
    },
    error(_xhr, _status, error) {
      console.error('구버전 선택 목록 로드 실패', error)
    },
  })
})
