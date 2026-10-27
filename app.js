/* Calcula tu Negocio — lógica de la app
   Todo funciona en el navegador: no hay servidor ni base de datos.
   Fórmulas (ver el informe, sección 6):
     CF  = suma de gastos fijos + sueldo propio
     CVu = suma de gastos variables por unidad
     Q   = ventas por día × días trabajados
     IT  = P × Q            CT = CF + CVu × Q          B = IT − CT
     Margen = P − CVu       Costo medio = CT / Q       Q equilibrio = CF / (P − CVu)
     Ahorro mensual A = VF × i / ((1 + i)^n − 1),  i = (1 + TEA)^(1/12) − 1
*/
(function () {
  "use strict";

  const CLAVE = "calcula-tu-negocio-v1";
  const $ = (id) => document.getElementById(id);

  const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const entero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
  const dec1 = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
  const S = (n) => soles.format(n);

  const vacio = () => ({
    negocio: "", unidad: "",
    gastos: [{ nombre: "", monto: "", tipo: "fijo" }],
    sueldo: "", precio: "", ventasDia: "", dias: "",
    metaNombre: "", metaMonto: "", metaMeses: "", metaTasa: "", metaLugar: "casa", credTasa: "", credMeses: "",
    sim: { precio: null, cambio: 0 },
    paso: 1,
  });

  const ejemplo = () => ({
    negocio: "Menú de doña Rosa", unidad: "menú",
    gastos: [
      { nombre: "Alquiler del local", monto: 700, tipo: "fijo" },
      { nombre: "Luz, agua e internet", monto: 500, tipo: "fijo" },
      { nombre: "Insumos por menú", monto: 6, tipo: "variable" },
    ],
    sueldo: "", precio: 10, ventasDia: 40, dias: 25,
    metaNombre: "una cocina industrial", metaMonto: 3000, metaMeses: 12, metaTasa: 4, metaLugar: "caja", credTasa: 50, credMeses: 12,
    sim: { precio: 11, cambio: -10 },
    paso: 1,
  });

  let estado = cargar();

  function cargar() {
    try {
      const t = localStorage.getItem(CLAVE);
      if (t) return Object.assign(vacio(), JSON.parse(t));
    } catch (e) { /* sin almacenamiento: se trabaja en memoria */ }
    return vacio();
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* ignorar */ }
  }

  const num = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const unidad = () => (estado.unidad || "").trim() || "unidad";
  const plural = (u) => (/[aeiouáéíóú]$/i.test(u) ? u + "s" : u + "es");
  const unidades = () => plural(unidad());
  const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // ---------- Cálculos ----------
  function calcular() {
    const cfGastos = estado.gastos.filter((g) => g.tipo === "fijo").reduce((s, g) => s + num(g.monto), 0);
    const sueldo = num(estado.sueldo);
    const CF = cfGastos + sueldo;
    const CVu = estado.gastos.filter((g) => g.tipo === "variable").reduce((s, g) => s + num(g.monto), 0);
    const P = num(estado.precio);
    const dias = Math.min(31, Math.max(0, Math.round(num(estado.dias)))) || 0;
    const Q = num(estado.ventasDia) * dias;
    const IT = P * Q;
    const CT = CF + CVu * Q;
    const B = IT - CT;
    const margen = P - CVu;
    const CMe = Q > 0 ? CT / Q : null;
    const Qeq = margen > 0 ? CF / margen : null;
    return { CF, CVu, sueldo, P, dias, Q, IT, CT, B, margen, CMe, Qeq, tieneCostos: CF > 0 || CVu > 0, tienePrecio: P > 0, tieneVentas: Q > 0 };
  }

  function semaforo(r) {
    if (!r.tienePrecio || !r.tieneCostos) return { e: "vacio", t: "Completa tus datos", x: "Con tu precio y tus ventas te diremos si tu negocio gana o pierde." };
    const u = unidad();
    if (r.margen <= 0) return { e: "rojo", t: "Pierdes con cada venta", x: `Cada ${u} te cuesta ${S(r.CVu)} y lo vendes a ${S(r.P)}. Mientras más vendas, más pierdes: sube tu precio o baja tus costos.` };
    if (!r.tieneVentas) return { e: "amarillo", t: "Falta saber cuánto vendes", x: `Cada ${u} te deja ${S(r.margen)}. Escribe tus ventas por día para saber si cubres tus gastos fijos.` };
    if (r.P < r.CMe - 0.005) return { e: "amarillo", t: "Todavía no cubres tus gastos fijos", x: `Cada ${u} te deja ${S(r.margen)}, pero con lo que vendes hoy no alcanza para pagar tus gastos fijos. Necesitas vender más o subir un poco tu precio.` };
    if (Math.abs(r.P - r.CMe) <= 0.005) return { e: "amarillo", t: "Estás justo en el límite", x: "No ganas ni pierdes. Cualquier baja en las ventas te haría perder." };
    return { e: "verde", t: "Tu precio te deja ganancia", x: `Tu precio (${S(r.P)}) está por encima de lo que te cuesta en promedio cada ${u} (${S(r.CMe)}).` };
  }

  // ---------- Gastos (paso 1) ----------
  const tpl = $("tpl-gasto");
  function pintarGastos() {
    const cont = $("gastos");
    cont.innerHTML = "";
    estado.gastos.forEach((g, i) => {
      const nodo = tpl.content.firstElementChild.cloneNode(true);
      const n = nodo.querySelector(".g-n");
      const m = nodo.querySelector(".g-m");
      const radios = nodo.querySelectorAll('input[type="radio"]');
      const ml = nodo.querySelector(".g-monto-l");
      n.value = g.nombre;
      m.value = g.monto;
      radios.forEach((r) => { r.name = "tipo-" + i; r.checked = r.value === g.tipo; });
      n.id = "g-n-" + i; m.id = "g-m-" + i;
      const etiquetaMonto = () => { ml.textContent = g.tipo === "fijo" ? "Monto al mes" : `Monto por cada ${unidad()}`; };
      etiquetaMonto();
      nodo.querySelector(".g-por").textContent = `Por cada ${unidad()}`;
      n.addEventListener("input", () => { g.nombre = n.value; guardar(); });
      m.addEventListener("input", () => { g.monto = m.value; actualizar(); });
      radios.forEach((r) => r.addEventListener("change", () => { g.tipo = r.value; etiquetaMonto(); actualizar(); }));
      nodo.querySelector(".g-del").addEventListener("click", () => {
        estado.gastos.splice(i, 1);
        if (!estado.gastos.length) estado.gastos.push({ nombre: "", monto: "", tipo: "fijo" });
        pintarGastos(); actualizar();
      });
      cont.appendChild(nodo);
    });
  }
  $("btn-add").addEventListener("click", () => {
    estado.gastos.push({ nombre: "", monto: "", tipo: "fijo" });
    pintarGastos(); actualizar();
    $("g-n-" + (estado.gastos.length - 1)).focus();
  });

  // ---------- Campos simples ----------
  const campos = ["negocio", "unidad", "sueldo", "precio", "ventasDia", "dias", "metaNombre", "metaMonto", "metaMeses", "metaTasa", "credTasa", "credMeses"];
  function pintarCampos() { campos.forEach((c) => { $(c).value = estado[c] ?? ""; }); }
  campos.forEach((c) => $(c).addEventListener("input", () => {
    estado[c] = $(c).value;
    if (c === "precio") estado.sim.precio = null;
    if (c === "unidad") pintarGastos();
    actualizar();
  }));

  // ---------- Simulador ----------
  $("sim-p").addEventListener("input", () => { estado.sim.precio = parseFloat($("sim-p").value); actualizar(); });
  $("sim-d").addEventListener("input", () => { estado.sim.cambio = parseInt($("sim-d").value, 10); actualizar(); });

  // ---------- Plano interactivo (paso 3) ----------
  // Un plano tipo GeoGebra dibujado en <canvas>: zoom, arrastre, lectura de valores y tabla.
  const COL = { tinta: "#1F3C88", gris: "#5C6676", texto: "#18202E", verde: "#2F7D32", rojo: "#B3261E", rejilla: "#E6ECF5", rejillaFuerte: "#CFD9E8" };
  const plano = { u: "dia", view: null, cursor: null, key: "", d: null, ptrs: new Map(), gesto: null };
  const lienzo = $("plano");
  const ctx = lienzo.getContext("2d");

  function pasoBonito(span, n) {
    const bruto = span / n;
    const p = Math.pow(10, Math.floor(Math.log10(bruto)));
    const f = bruto / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  const fmtEje = (v, paso) => {
    const dec = Number.isInteger(paso) ? 0 : paso < 1 ? Math.min(2, Math.ceil(-Math.log10(paso) + 0.3)) : 1;
    return new Intl.NumberFormat("es-PE", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  };

  // Datos según la vista: por día reparte los gastos fijos entre los días trabajados
  function datosPlano(r) {
    const f = plano.u === "dia" ? (r.dias || 1) : 1;
    return {
      CF: r.CF / f, CVu: r.CVu, P: r.P,
      Q: r.Q / f,
      Qeq: r.margen > 0 ? (r.CF / f) / r.margen : null,
      ok: r.tienePrecio && r.tieneCostos,
    };
  }
  const ing = (d, q) => d.P * q;
  const cos = (d, q) => d.CF + d.CVu * q;

  function encuadrar(d) {
    const ref = Math.max(d.Q || 0, d.Qeq || 0, 1);
    const xs = pasoBonito(ref * 1.5, 5);
    const x1 = xs * Math.ceil((ref * 1.5) / xs);
    const y1 = Math.max(ing(d, x1), cos(d, x1)) * 1.12;
    plano.view = { x0: -x1 * 0.08, x1: x1, y0: -y1 * 0.1, y1: y1 };
  }

  function tamLienzo() {
    const ancho = lienzo.parentElement.clientWidth || 600;
    const alto = ancho < 480 ? 320 : 380;
    const dpr = window.devicePixelRatio || 1;
    if (lienzo.width !== Math.round(ancho * dpr) || lienzo.height !== Math.round(alto * dpr)) {
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      lienzo.style.height = alto + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: ancho, H: alto };
  }

  function dibujarPlano() {
    if ($("plano-panel").hidden) return;
    const r = calcular();
    const d = datosPlano(r);
    plano.d = d;
    const clave = JSON.stringify([plano.u, d.CF, d.CVu, d.P, d.Q]);
    if (clave !== plano.key || !plano.view) {
      plano.key = clave;
      encuadrar(d);
      plano.cursor = d.Q > 0 ? Math.round(d.Q) : d.Qeq ? Math.ceil(d.Qeq) : null;
    }
    const { W, H } = tamLienzo();
    if (!W) return;
    const v = plano.view;
    const X = (x) => ((x - v.x0) / (v.x1 - v.x0)) * W;
    const Y = (y) => H - ((y - v.y0) / (v.y1 - v.y0)) * H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    if (!d.ok) {
      ctx.fillStyle = COL.gris; ctx.font = "15px " + getComputedStyle(document.body).fontFamily; ctx.textAlign = "center";
      ctx.fillText("Completa los pasos 1 y 2 para ver el plano", W / 2, H / 2);
      $("lectura").innerHTML = ""; pintarTabla(d); return;
    }

    // Rejilla
    const sx = pasoBonito(v.x1 - v.x0, Math.max(4, W / 90));
    const sy = pasoBonito(v.y1 - v.y0, Math.max(4, H / 60));
    ctx.lineWidth = 1;
    for (const [s, color] of [[sx / 5, COL.rejilla], [sx, COL.rejillaFuerte]]) {
      ctx.strokeStyle = color; ctx.beginPath();
      for (let x = Math.ceil(v.x0 / s) * s; x <= v.x1; x += s) { const px = Math.round(X(x)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, H); }
      ctx.stroke();
    }
    for (const [s, color] of [[sy / 5, COL.rejilla], [sy, COL.rejillaFuerte]]) {
      ctx.strokeStyle = color; ctx.beginPath();
      for (let y = Math.ceil(v.y0 / s) * s; y <= v.y1; y += s) { const py = Math.round(Y(y)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(W, py); }
      ctx.stroke();
    }

    // Zonas de pérdida y ganancia (solo cantidades positivas)
    const xa = Math.max(0, v.x0), xb = v.x1;
    const zona = (desde, hasta, color) => {
      if (hasta <= desde) return;
      ctx.beginPath();
      ctx.moveTo(X(desde), Y(ing(d, desde))); ctx.lineTo(X(hasta), Y(ing(d, hasta)));
      ctx.lineTo(X(hasta), Y(cos(d, hasta))); ctx.lineTo(X(desde), Y(cos(d, desde)));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    };
    if (d.Qeq != null) {
      zona(xa, Math.min(d.Qeq, xb), "rgba(179,38,30,0.10)");
      zona(Math.max(d.Qeq, xa), xb, "rgba(47,125,50,0.12)");
    } else {
      zona(xa, xb, "rgba(179,38,30,0.10)");
    }

    // Ejes
    const ejeY = Math.min(Math.max(X(0), 0), W - 1);
    const ejeX = Math.min(Math.max(Y(0), 0), H - 1);
    ctx.strokeStyle = COL.texto; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(0, Math.round(ejeX) + 0.5); ctx.lineTo(W, Math.round(ejeX) + 0.5);
    ctx.moveTo(Math.round(ejeY) + 0.5, 0); ctx.lineTo(Math.round(ejeY) + 0.5, H);
    ctx.stroke();

    const fuente = getComputedStyle(document.body).fontFamily;
    const texto = (t, x, y, opt = {}) => {
      ctx.font = `${opt.peso || 400} ${opt.tam || 12}px ${fuente}`;
      ctx.textAlign = opt.al || "left"; ctx.textBaseline = opt.base || "alphabetic";
      if (opt.halo !== false) { ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,255,255,0.92)"; ctx.strokeText(t, x, y); }
      ctx.fillStyle = opt.color || COL.gris; ctx.fillText(t, x, y);
    };
    // Números de los ejes
    const etiqX = ejeX > H - 22 ? ejeX - 6 : ejeX + 16;
    for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1; x += sx) {
      if (Math.abs(x) < sx / 1000 || X(x) < 14 || X(x) > W - 18) continue;
      texto(fmtEje(x, sx), X(x), etiqX, { al: "center" });
    }
    const etiqYizq = ejeY < W - 70;
    for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1; y += sy) {
      if (Math.abs(y) < sy / 1000 || Y(y) < 26 || Y(y) > H - 8) continue;
      texto("S/ " + fmtEje(y, sy), etiqYizq ? ejeY + 6 : ejeY - 6, Y(y) + 4, { al: etiqYizq ? "left" : "right" });
    }
    texto("0", ejeY - 5, ejeX + 14, { al: "right" });
    texto(`${mayus(unidades())} ${plano.u === "dia" ? "al día" : "al mes"}`, W - 8, ejeX - 8, { al: "right", peso: 700, color: COL.texto });
    texto(`Soles ${plano.u === "dia" ? "al día" : "al mes"}`, ejeY + 8, 16, { peso: 700, color: COL.texto });

    // Líneas
    const linea = (f, color, ancho, guion) => {
      ctx.beginPath(); ctx.setLineDash(guion || []);
      ctx.moveTo(X(xa), Y(f(xa))); ctx.lineTo(X(xb), Y(f(xb)));
      ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.stroke(); ctx.setLineDash([]);
    };
    linea(() => d.CF, COL.gris, 1.5, [6, 5]);
    linea((q) => cos(d, q), COL.gris, 3);
    linea((q) => ing(d, q), COL.tinta, 3);

    // Puntos con coordenadas, como en GeoGebra
    const punto = (q, y, color, rotulo, abajo) => {
      if (q < v.x0 || q > v.x1 || y < v.y0 || y > v.y1) return;
      ctx.beginPath(); ctx.arc(X(q), Y(y), 6, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = "#FFFFFF"; ctx.stroke();
      const izquierda = X(q) > W - 190;
      texto(rotulo, X(q) + (izquierda ? -10 : 10), Y(y) + (abajo ? 20 : -10), { peso: 700, color, al: izquierda ? "right" : "left" });
    };
    if (d.Qeq != null) punto(d.Qeq, ing(d, d.Qeq), COL.texto, `Equilibrio (${dec1.format(d.Qeq)} ; ${S(ing(d, d.Qeq))})`, true);
    if (d.Q > 0) punto(d.Q, ing(d, d.Q), COL.tinta, `Hoy (${dec1.format(d.Q)} ; ${S(ing(d, d.Q))})`, false);

    // Cursor de lectura
    const c = plano.cursor;
    if (c != null && c >= 0) {
      const yi = ing(d, c), yc = cos(d, c), gana = yi - yc;
      if (X(c) >= 0 && X(c) <= W) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = COL.texto; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(Math.round(X(c)) + 0.5, 0); ctx.lineTo(Math.round(X(c)) + 0.5, H); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(X(c), Y(yi)); ctx.lineTo(X(c), Y(yc));
        ctx.strokeStyle = gana >= 0 ? COL.verde : COL.rojo; ctx.lineWidth = 5; ctx.stroke();
        for (const [y, col] of [[yi, COL.tinta], [yc, COL.gris]]) {
          ctx.beginPath(); ctx.arc(X(c), Y(y), 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        }
        const izq = X(c) > W - 150;
        texto(`${gana >= 0 ? "Ganas" : "Pierdes"} ${S(Math.abs(gana))}`, X(c) + (izq ? -10 : 10), (Y(yi) + Y(yc)) / 2 + 4,
          { peso: 700, color: gana >= 0 ? COL.verde : COL.rojo, al: izq ? "right" : "left" });
      }
      const per = plano.u === "dia" ? "al día" : "al mes";
      const n = Math.round(c);
      $("lectura").innerHTML =
        `<p class="lec-q">Si vendes <strong>${entero.format(n)} ${n === 1 ? unidad() : unidades()} ${per}</strong>:</p>` +
        `<dl><div><dt>Cobras</dt><dd class="c-ing">${S(yi)}</dd></div>` +
        `<div><dt>Gastas</dt><dd class="c-cos">${S(yc)}</dd></div>` +
        `<div><dt>${gana >= 0 ? "Ganas" : "Pierdes"}</dt><dd class="${gana >= 0 ? "c-gan" : "c-per"}">${S(Math.abs(gana))}</dd></div></dl>`;
    }
    lienzo.setAttribute("aria-label", `Plano de ingresos y costos ${plano.u === "dia" ? "por día" : "por mes"}.` +
      (d.Qeq != null ? ` El equilibrio está en ${dec1.format(d.Qeq)} ${unidades()}.` : " No hay punto de equilibrio con este precio."));
    pintarTabla(d);
  }

  function pintarTabla(d) {
    const tb = $("tv").querySelector("tbody");
    $("tv-q").textContent = `Vendes (${unidades()} ${plano.u === "dia" ? "al día" : "al mes"})`;
    if (!d.ok) { tb.innerHTML = `<tr><td colspan="4">Completa los pasos 1 y 2.</td></tr>`; return; }
    const ref = Math.max(d.Q || 0, d.Qeq || 0, 1) * 1.5;
    const s = Math.max(1, pasoBonito(ref, 8));
    const filas = new Map();
    for (let q = 0; q <= ref + 1e-9; q += s) filas.set(Math.round(q), "");
    if (d.Qeq != null) filas.set(Math.ceil(d.Qeq - 1e-9), "Equilibrio");
    if (d.Q > 0) filas.set(Math.round(d.Q), filas.get(Math.round(d.Q)) === "Equilibrio" ? "Hoy y equilibrio" : "Hoy");
    const cur = plano.cursor != null ? Math.round(plano.cursor) : null;
    tb.innerHTML = [...filas.entries()].sort((a, b) => a[0] - b[0]).map(([q, nota]) => {
      const g = ing(d, q) - cos(d, q);
      const clase = [nota ? "marcada" : "", q === cur ? "actual" : ""].join(" ").trim();
      return `<tr data-q="${q}" tabindex="0" class="${clase}">` +
        `<th scope="row">${entero.format(q)}${nota ? ` <span class="nota">${nota}</span>` : ""}</th>` +
        `<td>${S(ing(d, q))}</td><td>${S(cos(d, q))}</td>` +
        `<td class="${g >= 0 ? "c-gan" : "c-per"}">${g >= 0 ? "+" : "−"}${S(Math.abs(g))}</td></tr>`;
    }).join("");
  }

  // --- Interacción ---
  const datoX = (px) => { const b = lienzo.getBoundingClientRect(); const v = plano.view; return v.x0 + ((px - b.left) / b.width) * (v.x1 - v.x0); };
  const datoY = (py) => { const b = lienzo.getBoundingClientRect(); const v = plano.view; return v.y1 - ((py - b.top) / b.height) * (v.y1 - v.y0); };
  function zoomEn(cx, cy, k) {
    const v = plano.view;
    const nx = (v.x1 - v.x0) * k, ny = (v.y1 - v.y0) * k;
    if (nx < 0.5 || nx > 1e7) return;
    v.x0 = cx - (cx - v.x0) * k; v.x1 = v.x0 + nx;
    v.y0 = cy - (cy - v.y0) * k; v.y1 = v.y0 + ny;
    dibujarPlano();
  }
  const ponCursor = (x) => { plano.cursor = Math.max(0, Math.round(x)); dibujarPlano(); };

  lienzo.addEventListener("pointerdown", (e) => {
    if (!plano.view) return;
    lienzo.setPointerCapture(e.pointerId);
    plano.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (plano.ptrs.size === 1) {
      plano.gesto = { tipo: "toque", sx: e.clientX, sy: e.clientY, v0: { ...plano.view } };
    } else if (plano.ptrs.size === 2) {
      const [a, b] = [...plano.ptrs.values()];
      plano.gesto = { tipo: "pellizco", dist: Math.hypot(a.x - b.x, a.y - b.y), cx: datoX((a.x + b.x) / 2), cy: datoY((a.y + b.y) / 2), v0: { ...plano.view } };
    }
  });
  lienzo.addEventListener("pointermove", (e) => {
    if (!plano.view) return;
    if (!plano.ptrs.has(e.pointerId)) {
      if (e.pointerType === "mouse") ponCursor(datoX(e.clientX));
      return;
    }
    plano.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = plano.gesto;
    if (!g) return;
    if (g.tipo === "pellizco" && plano.ptrs.size === 2) {
      const [a, b] = [...plano.ptrs.values()];
      const k = g.dist / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
      plano.view = { ...g.v0 };
      zoomEn(g.cx, g.cy, k);
      return;
    }
    if (g.tipo === "toque" && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 5) g.tipo = "arrastre";
    if (g.tipo === "arrastre") {
      const b = lienzo.getBoundingClientRect();
      const dx = ((e.clientX - g.sx) / b.width) * (g.v0.x1 - g.v0.x0);
      const dy = ((e.clientY - g.sy) / b.height) * (g.v0.y1 - g.v0.y0);
      plano.view = { x0: g.v0.x0 - dx, x1: g.v0.x1 - dx, y0: g.v0.y0 + dy, y1: g.v0.y1 + dy };
      lienzo.classList.add("moviendo");
      dibujarPlano();
    }
  });
  const soltar = (e) => {
    const g = plano.gesto;
    if (g && g.tipo === "toque" && plano.ptrs.size === 1) ponCursor(datoX(e.clientX));
    plano.ptrs.delete(e.pointerId);
    if (plano.ptrs.size === 0) { plano.gesto = null; lienzo.classList.remove("moviendo"); }
    else if (plano.ptrs.size === 1) { const [p] = [...plano.ptrs.values()]; plano.gesto = { tipo: "arrastre", sx: p.x, sy: p.y, v0: { ...plano.view } }; }
  };
  lienzo.addEventListener("pointerup", soltar);
  lienzo.addEventListener("pointercancel", soltar);
  lienzo.addEventListener("wheel", (e) => {
    if (!plano.view) return;
    e.preventDefault();
    zoomEn(datoX(e.clientX), datoY(e.clientY), Math.exp(e.deltaY * 0.0015));
  }, { passive: false });
  lienzo.addEventListener("keydown", (e) => {
    if (!plano.view) return;
    const v = plano.view, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2;
    const paso = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight") { ponCursor((plano.cursor || 0) + paso); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { ponCursor((plano.cursor || 0) - paso); e.preventDefault(); }
    else if (e.key === "+" || e.key === "=") { zoomEn(cx, cy, 0.8); e.preventDefault(); }
    else if (e.key === "-") { zoomEn(cx, cy, 1.25); e.preventDefault(); }
    else if (e.key === "0") { plano.key = ""; dibujarPlano(); }
  });
  const centro = () => { const v = plano.view; return [(v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2]; };
  $("z-in").addEventListener("click", () => { if (plano.view) zoomEn(...centro(), 0.7); });
  $("z-out").addEventListener("click", () => { if (plano.view) zoomEn(...centro(), 1.4); });
  $("z-fit").addEventListener("click", () => { if (plano.d) { encuadrar(plano.d); dibujarPlano(); } });
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    plano.u = b.dataset.u;
    document.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    plano.key = ""; dibujarPlano();
  }));
  $("tv").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-q]"); if (!tr) return;
    irAFila(Number(tr.dataset.q));
  });
  $("tv").addEventListener("keydown", (e) => {
    const tr = e.target.closest("tr[data-q]"); if (!tr || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); irAFila(Number(tr.dataset.q));
  });
  function irAFila(q) {
    const v = plano.view, d = plano.d;
    if (v && (q < v.x0 || q > v.x1)) {
      const span = v.x1 - v.x0; v.x0 = q - span / 2; v.x1 = q + span / 2;
    }
    if (v && d) {
      const y = Math.max(ing(d, q), cos(d, q)), ys = v.y1 - v.y0;
      if (y > v.y1 || y < v.y0) { v.y0 = y - ys * 0.6; v.y1 = v.y0 + ys; }
    }
    plano.cursor = q; dibujarPlano();
    lienzo.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // ---------- Pintar resultados ----------
  function actualizar() {
    guardar();
    const r = calcular();
    const u = unidad(), us = unidades();

    // Paso 1
    $("r1-cf").textContent = S(r.CF);
    $("r1-cvu").textContent = S(r.CVu);
    $("r1-cvu-label").textContent = `Costo por cada ${u}`;
    $("lbl-precio").textContent = `Precio de cada ${u}`;

    // Paso 2
    const sem = semaforo(r);
    $("semaforo").dataset.estado = sem.e;
    $("sem-titulo").textContent = sem.t;
    $("sem-texto").textContent = sem.x;
    $("r2-margen-l").textContent = `Te deja cada ${u}`;
    $("r2-margen").textContent = r.tienePrecio ? S(r.margen) : "—";
    $("r2-cme").textContent = r.CMe != null ? S(r.CMe) : "—";
    $("r2-q").textContent = r.tieneVentas ? entero.format(r.Q) : "—";

    // Paso 3
    const eqBox = $("eq-box");
    eqBox.classList.remove("neg");
    if (r.Qeq != null && r.dias > 0) {
      const porDia = Math.ceil(r.Qeq / r.dias);
      $("eq-dia").textContent = `${entero.format(porDia)} ${porDia === 1 ? u : us} al día`;
      $("eq-mes").textContent = `Son ${entero.format(Math.ceil(r.Qeq))} al mes, trabajando ${r.dias} días.` +
        (r.tieneVentas ? (r.Q >= r.Qeq ? ` Hoy vendes ${entero.format(r.Q / r.dias)} al día: estás por encima.` : ` Hoy vendes ${entero.format(r.Q / r.dias)} al día: te faltan ${entero.format(porDia - r.Q / r.dias)}.`) : "");
    } else if (r.Qeq != null) {
      $("eq-dia").textContent = `${entero.format(Math.ceil(r.Qeq))} al mes`;
      $("eq-mes").textContent = "Escribe cuántos días trabajas para verlo por día.";
    } else if (r.tienePrecio && r.margen <= 0) {
      eqBox.classList.add("neg");
      $("eq-dia").textContent = "No es posible";
      $("eq-mes").textContent = `Tu precio no cubre lo que cuesta cada ${u}. Súbelo por encima de ${S(r.CVu)}.`;
    } else {
      $("eq-dia").textContent = "—";
      $("eq-mes").textContent = "Completa los pasos 1 y 2.";
    }
    if (estado.paso === 3) dibujarPlano();
    $("r3-it").textContent = r.tieneVentas ? S(r.IT) : "—";
    $("r3-ct").textContent = r.tieneVentas ? S(r.CT) : "—";
    $("r3-b").textContent = r.tieneVentas ? S(r.B) : "—";
    $("r3-b-l").textContent = r.B < 0 ? "Tu pérdida del mes" : "Tu ganancia del mes";
    $("r3-b").parentElement.classList.toggle("neg", r.tieneVentas && r.B < 0);

    simulador(r);
    meta(r);
    credito(r);

    // Resumen
    $("res-nombre").textContent = (estado.negocio || "").trim() || "Tu negocio";
    $("s-cf").textContent = S(r.CF);
    $("s-cvu").textContent = S(r.CVu);
    $("s-p").textContent = r.tienePrecio ? S(r.P) : "—";
    $("s-eq").textContent = r.Qeq != null ? (r.dias > 0 ? `${entero.format(Math.ceil(r.Qeq / r.dias))} al día` : `${entero.format(Math.ceil(r.Qeq))} al mes`) : "—";
    $("s-b").textContent = r.tieneVentas ? S(r.B) : "—";
    $("s-b").parentElement.classList.toggle("neg", r.tieneVentas && r.B < 0);
  }

  function simulador(r) {
    const sp = $("sim-p"), sd = $("sim-d");
    const base = r.P || 0;
    sp.max = Math.max(1, Math.ceil(base * 2));
    sp.step = base >= 20 ? 1 : 0.5;
    if (estado.sim.precio == null || !Number.isFinite(estado.sim.precio)) estado.sim.precio = base;
    sp.value = estado.sim.precio;
    sd.value = estado.sim.cambio;
    const P2 = parseFloat(sp.value);
    const d = parseInt(sd.value, 10);
    $("sim-p-out").textContent = S(P2);
    $("sim-d-out").textContent = (d > 0 ? "+" : "") + d + " %";
    const box = $("sim-result");
    if (!r.tienePrecio || !r.tieneVentas || !r.tieneCostos) {
      box.dataset.tono = "neutro";
      box.innerHTML = "<p>Completa los pasos 1 y 2 para usar el simulador.</p>";
      return;
    }
    const Q2 = r.Q * (1 + d / 100);
    const B2 = P2 * Q2 - (r.CF + r.CVu * Q2);
    const dif = B2 - r.B;
    const u = unidad();
    let elast = "";
    const dP = (P2 - r.P) / r.P;
    if (Math.abs(dP) > 0.0001 && d !== 0) {
      const E = Math.abs((d / 100) / dP);
      const tipo = E < 0.995 ? "tus clientes son poco sensibles al precio (demanda inelástica)" : E > 1.005 ? "tus clientes son muy sensibles al precio (demanda elástica)" : "tus ventas cambian en la misma proporción que el precio (elasticidad unitaria)";
      elast = `<p>Elasticidad: ${dec1.format(E)}. Quiere decir que ${tipo}.</p>`;
    }
    const eq2 = P2 - r.CVu > 0 ? ` Tu nuevo punto de equilibrio sería ${entero.format(Math.ceil(r.CF / (P2 - r.CVu)))} ${unidades()} al mes.` : " Con ese precio pierdes con cada venta.";
    box.dataset.tono = Math.abs(dif) < 0.005 ? "neutro" : dif > 0 ? "mejor" : "peor";
    box.innerHTML = `<p><strong>Ganarías ${S(B2)} al mes</strong> (${dif >= 0 ? "+" : "−"}${S(Math.abs(dif))} que ahora), vendiendo ${entero.format(Q2)} a ${S(P2)} cada ${u}.${eq2}</p>${elast}`;
  }

  // ---------- Meta de ahorro (paso 4) ----------
  const LUGARES = {
    casa: { nombre: "En casa o alcancía", tasa: 0 },
    banco: { nombre: "Banco grande", tasa: 1 },
    caja: { nombre: "Caja municipal", tasa: 4 },
  };
  const tasaElegida = () => (LUGARES[estado.metaLugar] ? LUGARES[estado.metaLugar].tasa : num(estado.metaTasa));
  const tem = (teaPct) => Math.pow(1 + teaPct / 100, 1 / 12) - 1;
  const cuotaAhorro = (VF, n, teaPct) => { const i = tem(teaPct); return i > 0 ? (VF * i) / (Math.pow(1 + i, n) - 1) : VF / n; };
  const pct = (v) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(v) + " %";

  document.querySelectorAll('input[name="lugar"]').forEach((rb) => rb.addEventListener("change", () => {
    estado.metaLugar = rb.value;
    if (rb.value === "otra") $("metaTasa").focus();
    actualizar();
  }));
  $("metaTasa").addEventListener("focus", () => {
    if (estado.metaLugar !== "otra") { estado.metaLugar = "otra"; pintarLugar(); actualizar(); }
  });
  function pintarLugar() {
    document.querySelectorAll('input[name="lugar"]').forEach((rb) => { rb.checked = rb.value === (estado.metaLugar || "casa"); });
  }

  function meta(r) {
    pintarLugar();
    const VF = num(estado.metaMonto), n = Math.round(num(estado.metaMeses));
    const tasa = tasaElegida();
    const box = $("meta-box");
    box.classList.remove("neg");
    const nombre = (estado.metaNombre || "").trim() || "tu meta";
    const vaciar = () => {
      $("meta-a").textContent = "—";
      $("meta-sub").textContent = "Escribe cuánto cuesta y en cuántos meses lo quieres.";
      $("barra-meta").hidden = true;
      $("r4-pct").textContent = "—"; $("meta-consejo").textContent = ""; $("comp-nota").textContent = "";
      $("comp").querySelector("tbody").innerHTML = `<tr><td colspan="3">Completa tu meta para comparar.</td></tr>`;
      $("crono").querySelector("tbody").innerHTML = "";
    };
    if (!(VF > 0 && n > 0)) { vaciar(); return; }

    const i = tem(tasa);
    const A = cuotaAhorro(VF, n, tasa);
    const aporte = A * n, intereses = VF - aporte;
    $("meta-a").textContent = S(A);
    $("meta-sub").textContent = `Durante ${n} ${n === 1 ? "mes" : "meses"}, para comprar ${nombre} (${S(VF)}), guardando tu dinero a ${pct(tasa)} al año (${pct(i * 100)} al mes).`;

    $("barra-meta").hidden = false;
    $("bm-tu").style.width = (aporte / VF) * 100 + "%";
    $("bm-int").style.width = (intereses / VF) * 100 + "%";
    $("r4-aporte").textContent = S(aporte);
    $("r4-int").textContent = S(intereses);

    if (r.tieneVentas && r.B > 0) {
      const p = (A / r.B) * 100;
      $("r4-pct").textContent = dec1.format(p) + " %";
      $("meta-consejo").textContent = p <= 30
        ? `Es el ${dec1.format(p)} % de tu ganancia del mes: una meta alcanzable.`
        : p <= 100
          ? `Es el ${dec1.format(p)} % de tu ganancia del mes. Es posible, pero te queda poco para tus gastos personales; prueba con más meses.`
          : "Separar eso cuesta más que tu ganancia del mes. Alarga el plazo o elige una meta más pequeña.";
      if (p > 100) box.classList.add("neg");
    } else {
      $("r4-pct").textContent = "—";
      $("meta-consejo").textContent = r.tieneVentas ? "Hoy tu negocio no tiene ganancia: primero ajusta tu precio o tus costos." : "Completa el paso 2 para comparar con tu ganancia.";
    }

    // Comparación entre lugares
    const filas = Object.entries(LUGARES).map(([k, l]) => ({ k, nombre: l.nombre, tasa: l.tasa }));
    if (estado.metaLugar === "otra") filas.push({ k: "otra", nombre: "Tu tasa", tasa });
    const enCasa = cuotaAhorro(VF, n, 0);
    $("comp").querySelector("tbody").innerHTML = filas.map((f) => {
      const a = cuotaAhorro(VF, n, f.tasa);
      const sel = f.k === (estado.metaLugar || "casa");
      return `<tr class="${sel ? "actual" : ""}"><th scope="row">${f.nombre} <span class="nota">${pct(f.tasa)}</span></th><td>${S(a)}</td><td>${S(VF - a * n)}</td></tr>`;
    }).join("");
    const ahorroMes = enCasa - A;
    $("comp-nota").textContent = tasa > 0
      ? `Con ${pct(tasa)} al año separas ${S(ahorroMes)} menos cada mes que guardando en casa, porque los intereses ponen ${S(intereses)} por ti. En plazos cortos la diferencia es pequeña; mientras más largo el plazo y más alta la tasa, más te ayudan los intereses.`
      : "Guardando en casa, todo el dinero lo pones tú. En un banco o una caja, los intereses ponen una parte por ti.";

    // Mes por mes: depositas al final de cada mes y el saldo gana intereses
    let saldo = 0, html = "";
    for (let m = 1; m <= n; m++) {
      const int = saldo * i;
      saldo = saldo + int + A;
      html += `<tr><th scope="row">${m}</th><td>${S(A)}</td><td>${S(int)}</td><td>${S(saldo)}</td></tr>`;
    }
    $("crono").querySelector("tbody").innerHTML = html;
  }

  // ---------- Crédito y capacidad de pago (paso 4) ----------
  // Cuota fija (método francés): R = M · i / (1 − (1 + i)^−n), con i = (1 + TCEA)^(1/12) − 1
  function cuotaCredito(M, n, tceaPct) {
    const i = tem(tceaPct);
    return i > 0 ? (M * i) / (1 - Math.pow(1 + i, -n)) : M / n;
  }
  function credito(r) {
    const box = $("credito");
    const M = num(estado.metaMonto);
    const n = Math.round(num(estado.credMeses)) || Math.round(num(estado.metaMeses));
    const tasa = estado.credTasa === "" || estado.credTasa == null ? null : num(estado.credTasa);
    const sinDatos = (msg) => {
      box.dataset.estado = "vacio";
      ["c-cuota", "c-total", "c-int"].forEach((k) => { $(k).textContent = "—"; });
      $("c-cap-t").textContent = "Capacidad de pago";
      $("c-cap-x").textContent = msg;
      $("c-comp").textContent = "";
      return null;
    };
    if (!(M > 0 && n > 0)) return sinDatos("Completa tu meta (qué quieres comprar y cuánto cuesta).");
    if (tasa == null) return sinDatos("Escribe la tasa del crédito (TCEA) que te ofrece la entidad.");
    const R = cuotaCredito(M, n, tasa);
    const total = R * n, interes = total - M;
    $("c-cuota").textContent = S(R);
    $("c-total").textContent = S(total);
    $("c-int").textContent = S(interes);

    let est, t, x;
    const pct = r.tieneVentas && r.B > 0 ? (R / r.B) * 100 : null;
    if (!r.tieneVentas) { est = "vacio"; t = "Capacidad de pago"; x = "Completa el paso 2 para saber si tu negocio puede pagar esta cuota."; }
    else if (r.B <= 0) { est = "rojo"; t = "Hoy no podrías pagar la cuota"; x = "Tu negocio no tiene ganancia este mes. Primero ajusta tu precio o tus costos."; }
    else if (pct <= 30) { est = "verde"; t = "Cuota cómoda"; x = `La cuota es el ${dec1.format(pct)} % de tu ganancia del mes (${S(r.B)}). Te queda margen para imprevistos.`; }
    else if (pct <= 50) { est = "amarillo"; t = "Cuota ajustada"; x = `La cuota es el ${dec1.format(pct)} % de tu ganancia del mes. Si un mes vendes menos, te costará pagarla; prueba un plazo más largo.`; }
    else { est = "rojo"; t = "Cuota muy alta para tu negocio"; x = `La cuota es el ${dec1.format(pct)} % de tu ganancia del mes. Es riesgoso: alarga el plazo, elige algo más barato o ahorra primero.`; }
    box.dataset.estado = est;
    $("c-cap-t").textContent = t;
    $("c-cap-x").textContent = x;

    const nA = Math.round(num(estado.metaMeses));
    if (nA > 0) {
      const tasaAh = tasaElegida();
      const A = cuotaAhorro(M, nA, tasaAh);
      const intAh = M - A * nA;
      $("c-comp").textContent = `Comparación: ahorrando separas ${S(A)} al mes y lo compras en ${nA} ${nA === 1 ? "mes" : "meses"}; los intereses te ayudan con ${S(intAh)}. ` +
        `Con el crédito lo tienes hoy, pero pagas ${S(interes)} de intereses. El crédito conviene si lo que compras te ayuda a ganar más de lo que cuesta.`;
    } else {
      $("c-comp").textContent = "";
    }
    return { R, total, interes, n, tasa, pct, est, t };
  }

  // ---------- Marca blanca (versión para entidades) ----------
  // Para una entidad real, se completa CONFIG.entidad con su nombre y colores.
  // Para ver una demostración, abre index.html?entidad=demo
  const CONFIG = { entidad: null, anuncios: true };
  const ENTIDADES_DEMO = { demo: { nombre: "Caja Demo", color: "#0B6E4F", colorSuave: "#E2F1E9" } };
  try {
    const q = new URLSearchParams(location.search).get("entidad");
    if (q && ENTIDADES_DEMO[q]) { CONFIG.entidad = ENTIDADES_DEMO[q]; CONFIG.anuncios = false; }
  } catch (e) { /* sin parámetros */ }

  function aplicarMarca() {
    const ent = CONFIG.entidad;
    document.body.classList.toggle("sin-anuncios", !CONFIG.anuncios);
    if (!ent) return;
    const raiz = document.documentElement.style;
    raiz.setProperty("--tinta", ent.color);
    raiz.setProperty("--tinta-suave", ent.colorSuave);
    COL.tinta = ent.color;
    const of = $("ofrecido"); of.hidden = false; of.textContent = `Ofrecido por ${ent.nombre}`;
    $("lnk-entidades").hidden = true;
    $("cta-tit").textContent = `¿Quieres que ${ent.nombre} te ayude a financiar tu negocio?`;
    $("cta-txt").textContent = `Un asesor de ${ent.nombre} puede revisar contigo estos números y mostrarte opciones de crédito o ahorro.`;
    $("btn-contacto").textContent = `Quiero que ${ent.nombre} me contacte`;
    $("dlg-intro").textContent = `Déjanos tus datos y un asesor de ${ent.nombre} te contactará con tu resumen ya calculado.`;
    $("c-ok-txt").textContent = `Autorizo a ${ent.nombre} a usar mis datos y mi resumen para contactarme con información sobre sus productos, según la Ley N.° 29733 de Protección de Datos Personales.`;
    $("dlg-ok-txt").textContent = `En la versión real, tu solicitud y tu resumen llegarían a ${ent.nombre}. En esta demostración no se envió nada.`;
    document.title = `Calcula tu Negocio · ${ent.nombre}`;
  }

  // ---------- Solicitud de contacto (con consentimiento) ----------
  const dlg = $("dlg-contacto");
  $("btn-contacto").addEventListener("click", () => {
    $("form-contacto").hidden = false; $("dlg-ok").hidden = true;
    $("form-contacto").reset();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  });
  $("dlg-cancelar").addEventListener("click", () => dlg.close());
  $("dlg-cerrar").addEventListener("click", () => dlg.close());
  $("form-contacto").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("form-contacto").reportValidity()) return;
    // Demostración: no se envía ni se guarda ningún dato personal.
    $("form-contacto").reset();
    $("form-contacto").hidden = true; $("dlg-ok").hidden = false;
  });

  // ---------- Resumen imprimible / PDF ----------
  function construirReporte() {
    const r = calcular();
    const u = unidad(), us = unidades();
    const ent = CONFIG.entidad;
    const fecha = new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(new Date());
    const fila = (a, b) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`;
    const nombre = (estado.negocio || "").trim() || "Mi negocio";
    const gastos = estado.gastos.filter((g) => num(g.monto) > 0)
      .map((g) => fila(g.nombre || "Gasto", `${S(num(g.monto))} ${g.tipo === "fijo" ? "al mes (fijo)" : `por ${u} (variable)`}`)).join("");
    const sem = semaforo(r);
    const VF = num(estado.metaMonto), nA = Math.round(num(estado.metaMeses));
    const meta = VF > 0 && nA > 0 ? fila("Meta de ahorro", `${(estado.metaNombre || "Meta").trim()}: ${S(VF)} en ${nA} meses`) +
      fila("Ahorro mensual necesario", `${S(cuotaAhorro(VF, nA, tasaElegida()))} (tasa ${tasaElegida()} % al año)`) : "";
    const c = credito(r);
    const cred = c ? fila("Crédito simulado", `${S(VF)} a ${c.n} meses, TCEA ${c.tasa} %`) + fila("Cuota mensual", S(c.R)) +
      fila("Intereses del crédito", S(c.interes)) + fila("Capacidad de pago", c.pct != null ? `${c.t} (${dec1.format(c.pct)} % de la ganancia)` : c.t) : "";
    $("reporte").innerHTML = `
      <header><p class="rp-marca">Calcula tu Negocio${ent ? ` · ${ent.nombre}` : ""}</p><h1>Resumen de ${nombre}</h1><p>${fecha}</p></header>
      <h2>Costos</h2><table>${gastos || fila("Gastos", "Sin datos")}${fila("Sueldo propio (costo de oportunidad)", S(r.sueldo))}${fila("Gastos fijos al mes", S(r.CF))}${fila(`Costo variable por ${u}`, S(r.CVu))}</table>
      <h2>Precio y resultados</h2><table>${fila(`Precio por ${u}`, r.tienePrecio ? S(r.P) : "—")}${fila("Ventas al mes", r.tieneVentas ? `${entero.format(r.Q)} ${us}` : "—")}
        ${fila(`Margen por ${u}`, r.tienePrecio ? S(r.margen) : "—")}${fila("Costo medio", r.CMe != null ? S(r.CMe) : "—")}
        ${fila("Punto de equilibrio", r.Qeq != null ? `${entero.format(Math.ceil(r.Qeq))} ${us} al mes${r.dias ? ` (${entero.format(Math.ceil(r.Qeq / r.dias))} al día)` : ""}` : "No existe con este precio")}
        ${fila("Ingreso del mes", r.tieneVentas ? S(r.IT) : "—")}${fila("Costo total del mes", r.tieneVentas ? S(r.CT) : "—")}${fila(r.B < 0 ? "Pérdida del mes" : "Ganancia del mes", r.tieneVentas ? S(r.B) : "—")}
        ${fila("Semáforo del precio", sem.t)}</table>
      ${meta || cred ? `<h2>Meta y financiamiento</h2><table>${meta}${cred}</table>` : ""}
      <p class="rp-aviso">Resumen elaborado por el propio emprendedor con datos declarados. Es referencial: no constituye una evaluación crediticia ni una oferta de crédito.</p>`;
  }
  const imprimir = () => { construirReporte(); window.print(); };
  $("btn-imprimir").addEventListener("click", imprimir);
  $("btn-imprimir2").addEventListener("click", imprimir);
  window.addEventListener("beforeprint", construirReporte);

  // ---------- Gráfico plegable (paso 3) ----------
  $("btn-plano").addEventListener("click", () => {
    const panel = $("plano-panel"), b = $("btn-plano");
    const abrir = panel.hidden;
    panel.hidden = !abrir;
    b.setAttribute("aria-expanded", String(abrir));
    $("btn-plano-sub").textContent = abrir ? "Toca para ocultar el gráfico" : "Toca para ver el gráfico interactivo y la tabla de valores";
    if (abrir) { plano.key = ""; dibujarPlano(); }
  });

  // ---------- Navegación ----------
  const nombresPaso = { 1: "Mis costos", 2: "Mi precio", 3: "Equilibrio", 4: "Mi meta" };
  function irA(p, foco) {
    estado.paso = Math.min(4, Math.max(1, p));
    document.querySelectorAll(".page").forEach((s) => {
      const activo = Number(s.dataset.step) === estado.paso;
      s.hidden = !activo;
      if (activo) { s.classList.remove("enter"); void s.offsetWidth; s.classList.add("enter"); }
    });
    document.querySelectorAll(".steps button").forEach((b) => {
      const n = Number(b.dataset.go);
      if (n === estado.paso) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.classList.toggle("done", n < estado.paso);
    });
    $("btn-back").disabled = estado.paso === 1;
    $("btn-next").textContent = estado.paso === 4 ? "Volver al inicio" : `Siguiente: ${nombresPaso[estado.paso + 1]}`;
    if (estado.paso === 3) dibujarPlano();
    guardar();
    if (foco) { window.scrollTo({ top: 0 }); const h = document.querySelector(`.page[data-step="${estado.paso}"] h1`); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  document.querySelectorAll(".steps button").forEach((b) => b.addEventListener("click", () => irA(Number(b.dataset.go), true)));
  $("btn-back").addEventListener("click", () => irA(estado.paso - 1, true));
  $("btn-next").addEventListener("click", () => irA(estado.paso === 4 ? 1 : estado.paso + 1, true));

  $("btn-ejemplo").addEventListener("click", () => { estado = ejemplo(); iniciar(); irA(1, true); });
  $("btn-reiniciar").addEventListener("click", () => {
    if (!confirmarReinicio()) return;
    estado = vacio(); iniciar(); irA(1, true);
  });
  function confirmarReinicio() {
    const b = $("btn-reiniciar");
    if (b.dataset.confirmar === "1") { b.dataset.confirmar = ""; b.textContent = "Empezar de cero"; return true; }
    b.dataset.confirmar = "1"; b.textContent = "Toca otra vez para borrar todo";
    setTimeout(() => { b.dataset.confirmar = ""; b.textContent = "Empezar de cero"; }, 4000);
    return false;
  }

  let tResize;
  window.addEventListener("resize", () => { clearTimeout(tResize); tResize = setTimeout(() => { if (estado.paso === 3) dibujarPlano(); }, 120); });

  function iniciar() { pintarCampos(); pintarGastos(); actualizar(); }
  aplicarMarca();

  // Exponer cálculos para pruebas
  window.__calcula = { calcular, estado: () => estado };

  iniciar();
  irA(estado.paso || 1, false);
})();
