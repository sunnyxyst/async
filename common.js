/**
 * `policySelectorReady`는 브라우저가 기본으로 제공하는 이벤트가 아니라
 * 이 화면에서 이름을 정해 만든 커스텀 이벤트입니다.
 *
 * 구버전 셀렉트(`#goSelect`)는 처음부터 HTML에 존재하지 않고,
 * index.html의 AJAX 요청이 `private_select.html`을 불러온 뒤에 생성됩니다.
 * 따라서 DOMContentLoaded 시점에 아래 코드를 바로 실행하면
 * 아직 `#goSelect`, `.input_btn` 등을 찾을 수 없습니다.
 *
 * 처리 순서:
 * 1. index.html이 `private_select.html`을 AJAX로 불러옵니다.
 * 2. 응답 HTML을 `#private_sel` 안에 삽입합니다.
 * 3. index.html에서 아래 코드로 커스텀 이벤트를 발생시킵니다.
 *    document.dispatchEvent(new CustomEvent("policySelectorReady"));
 * 4. 여기서 그 이벤트를 수신한 뒤 신버전 처리방침 기능을 초기화합니다.
 *
 * 즉, 이 이벤트는 "비동기로 불러오는 셀렉트가 DOM에 준비되었다"는 사실을
 * index.html에서 common.js로 알려주는 신호 역할을 합니다.
 */
document.addEventListener("policySelectorReady", () => {
  const policyWrap = document.querySelector(".privacy-policy");
  const policySelect = document.querySelector("#goSelect");
  const policyButton = document.querySelector(".input_btn");
  const policyContent = document.querySelector("#policyContent");
  const oldPolicyFrame = document.querySelector("#privateInfo");
  const currentPolicyGroup = document.querySelector("#currentPolicyGroup");

  if (!policyWrap || !policySelect || !policyButton || !policyContent || !oldPolicyFrame || !currentPolicyGroup) {
    return;
  }

  const policyType = policyWrap.dataset.policyType;
  const policyBasePath = `./privacy-policy/${policyType}/`;

  async function fetchText(url, errorMessage) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${errorMessage} (${response.status})`);
    }

    return response.text();
  }

  function showError(error) {
    console.error(error);
    oldPolicyFrame.hidden = true;
    policyContent.hidden = false;
    policyContent.textContent =
      "개인정보 처리방침을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  async function loadNewPolicy(url) {
    policyContent.hidden = false;
    oldPolicyFrame.hidden = true;
    policyContent.setAttribute("aria-busy", "true");

    try {
      policyContent.innerHTML = await fetchText(
          url,
          "신버전 개인정보 처리방침 파일 로드 실패"
        );
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (error) {
      showError(error);
    } finally {
      policyContent.removeAttribute("aria-busy");
    }
  }

  async function addNewPolicyOptions() {
    try {
      const json = await fetchText(
        `${policyBasePath}policies.json`,
        "신버전 목록 로드 실패"
      );
      const policies = JSON.parse(json);

      policies.forEach((policy) => {
        const option = document.createElement("option");
        option.value = `${policyBasePath}${policy.file}`;
        option.dataset.policyType = "new";
        option.textContent =
          policy.label || `개인정보 처리방침 ${policy.version} 보기`;
        currentPolicyGroup.append(option);
      });

      const latestPolicy = currentPolicyGroup.querySelector('option[data-policy-type="new"]');
      
      if (latestPolicy) {
        latestPolicy.selected = true;
        await loadNewPolicy(latestPolicy.value);
      }
    } catch (error) {
      showError(error);
    }
  }

  policyButton.addEventListener("click", (event) => {
      const selectedOption = policySelect.selectedOptions[0];

      if (selectedOption?.dataset.policyType !== "new") {
        return;
      }

      event.preventDefault();
      loadNewPolicy(selectedOption.value);
  });

  addNewPolicyOptions();
});
