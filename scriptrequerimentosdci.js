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

  function normalizeText(text) {
    return (text || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  async function postInTopic(message) {
    const replyUrl = "/post?t=37262&mode=reply";

    const openResponse = await fetch(replyUrl, {
      method: "GET",
      credentials: "same-origin"
    });

    const openHtml = await openResponse.text();

    if (!openResponse.ok) {
      throw new Error("Não foi possível abrir a página de resposta do tópico.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(openHtml, "text/html");

    const form = Array.from(doc.forms).find((f) =>
      f.querySelector('[name="message"]')
    );

    if (!form) {
      console.error("HTML retornado ao abrir resposta:", openHtml);
      throw new Error("Não foi possível localizar o formulário de resposta do tópico.");
    }

    const body = new URLSearchParams();

    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;
      if ((field.type === "checkbox" || field.type === "radio") && !field.checked) return;
      body.append(field.name, field.value || "");
    });

    body.set("message", message);

    if (body.has("post")) {
      body.set("post", "1");
    } else {
      body.append("post", "1");
    }

    const actionUrl = form.getAttribute("action") || replyUrl;

    const sendResponse = await fetch(actionUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: body.toString()
    });

    const responseText = await sendResponse.text();
    const normalized = normalizeText(responseText);

    const successHints = [
      "sua mensagem foi enviada",
      "mensagem enviada",
      "sua mensagem foi publicada",
      "your message has been entered successfully",
      "message posted successfully"
    ];

    const errorHints = [
      "erro",
      "error",
      "flood",
      "você não pode",
      "you cannot"
    ];

    if (!sendResponse.ok) {
      console.error("Resposta HTTP ao postar no tópico:", sendResponse.status, responseText);
      throw new Error("Falha HTTP ao postar no tópico.");
    }

    const hasSuccess = successHints.some((hint) => normalized.includes(hint));
    const hasError = errorHints.some((hint) => normalized.includes(hint));

    if (hasError && !hasSuccess) {
      console.error("Erro retornado pelo fórum:", responseText);
      throw new Error("O fórum retornou um erro ao tentar publicar a resposta.");
    }

    return true;
  }

  function gerarMensagemForum(form) {
    const dados = new FormData(form);
    const tituloForm = form.getAttribute("data-title") || "Requerimento";

    let mensagem = `[b]${tituloForm}[/b]\n\n`;

    for (const [nome, valor] of dados.entries()) {
      const texto = String(valor).trim();
      if (!texto) continue;

      const campo = form.querySelector(`[name="${nome}"]`);
      let label = nome;

      if (campo) {
        const labelElemento = form.querySelector(`label[for="${campo.id}"]`);
        if (labelElemento) {
          label = labelElemento.textContent.trim();
        }
      }

      mensagem += `[b]${label}:[/b] ${texto}\n`;
    }

    return mensagem.trim();
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

      formAtual = form;
      modal.classList.add("show");
    });
  });

  // botão SIM
  btnSim.addEventListener("click", async function () {
    modal.classList.remove("show");

    if (!formAtual) return;

    const textoOriginal = btnSim.textContent;
    btnSim.disabled = true;
    btnSim.textContent = "Enviando...";

    try {
      const mensagem = gerarMensagemForum(formAtual);

      await postInTopic(mensagem);

      alert("Requerimento postado com sucesso no fórum.");

      formAtual.reset();
      limparErros(formAtual);
    } catch (error) {
      console.error(error);
      alert("Erro ao postar no fórum: " + error.message);
    } finally {
      btnSim.disabled = false;
      btnSim.textContent = textoOriginal;
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
