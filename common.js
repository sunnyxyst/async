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
