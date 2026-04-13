document.addEventListener("DOMContentLoaded", function () {
  const dropdownBtn = document.querySelector(".dropdown-btn");
  const dropdownContent = document.querySelector(".dropdown-content");
  const selectedText = document.querySelector(".selected-text");
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  const forms = document.querySelectorAll("form");
  const enviarBtns = document.querySelectorAll(".enviar-btn");

  const modal = document.getElementById("confirmation-modal");
  const btnSim = document.getElementById("btn-sim");
  const btnNao = document.getElementById("btn-nao");

  let formAtual = null;

  function esconderFormularios() {
    forms.forEach((form) => {
      form.style.display = "none";
    });
  }

  function limparErros(form) {
    const campos = form.querySelectorAll("input, select, textarea");
    const erros = form.querySelectorAll(".erro-validacao");

    campos.forEach((campo) => {
      campo.classList.remove("campo-invalido");
    });

    erros.forEach((erro) => {
      erro.style.display = "none";
    });
  }

  function validar(form) {
    let valido = true;

    const campos = form.querySelectorAll("input, select, textarea");

    campos.forEach((campo) => {
      const erro = campo.parentElement.querySelector(".erro-validacao");

      campo.classList.remove("campo-invalido");
      if (erro) erro.style.display = "none";

      if (campo.hasAttribute("required") && campo.value.trim() === "") {
        campo.classList.add("campo-invalido");
        if (erro) erro.style.display = "block";
        valido = false;
      }

      if (campo.type === "number") {
        const min = campo.getAttribute("min");
        if (min && Number(campo.value) < Number(min)) {
          campo.classList.add("campo-invalido");
          if (erro) erro.style.display = "block";
          valido = false;
        }
      }
    });

    return valido;
  }

  // abrir dropdown
  dropdownBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdownContent.classList.toggle("show");
  });

  // fechar clicando fora
  document.addEventListener("click", function () {
    dropdownContent.classList.remove("show");
  });

  // selecionar tipo
  dropdownItems.forEach((item) => {
    item.addEventListener("click", function () {
      const tipo = item.getAttribute("data-form");

      esconderFormularios();

      const form = document.getElementById(tipo + "-form");

      if (form) {
        form.style.display = "block";
        limparErros(form);
        formAtual = form;
      }

      selectedText.textContent = item.textContent.trim();
      dropdownContent.classList.remove("show");
    });
  });

  // botão enviar
  enviarBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tipo = btn.getAttribute("data-form");
      const form = document.getElementById(tipo + "-form");

      if (!form) return;

      limparErros(form);

      if (!validar(form)) return;

      modal.classList.add("show");
    });
  });

  // botão SIM
  btnSim.addEventListener("click", function () {
    modal.classList.remove("show");

    if (formAtual) {
      formAtual.reset();
      limparErros(formAtual);
    }
  });

  // botão NÃO
  btnNao.addEventListener("click", function () {
    modal.classList.remove("show");

    esconderFormularios();

    selectedText.textContent = "Selecione um tipo de requerimento";
    formAtual = null;
  });
});
