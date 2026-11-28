const WHATSAPP_NUMBER = '573023969157';

function placeholderSvg(color, label) {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='${encodeURIComponent(color)}'/><text x='50%25' y='50%25' font-family='Playfair Display,serif' font-size='22' fill='white' text-anchor='middle' dominant-baseline='middle'>${encodeURIComponent(label)}</text></svg>`;
}

let products = [
  { id:1, nombre:'Serum Glow', categoria:'Cuidado facial', precio:45000, stock:12, descripcion:'Serum iluminador para un brillo natural y duradero.', imagen:'assets/images/image.png', enlacePago:'https://pay.example.com/serum-glow' },
  { id:2, nombre:'Base Velvet', categoria:'Maquillaje', precio:62000, stock:8, descripcion:'Base de cobertura media con acabado aterciopelado.', imagen:'assets/images/image.png', enlacePago:'https://pay.example.com/base-velvet' },
  { id:3, nombre:'Labial Rosa', categoria:'Maquillaje', precio:28000, stock:0, descripcion:'Labial mate de larga duración en tono rosa.', imagen:'assets/images/image.png', enlacePago:'https://pay.example.com/labial-rosa' },
  { id:4, nombre:'Paleta Sunset', categoria:'Maquillaje', precio:75000, stock:5, descripcion:'Paleta de sombras cálidas.', imagen:'assets/images/image.png', enlacePago:'https://pay.example.com/paleta' },
];

let cart = JSON.parse(localStorage.getItem('yv_cart') || '[]');
function saveCart(){ localStorage.setItem('yv_cart', JSON.stringify(cart)); }
function formatPrice(n){ return '$' + n.toLocaleString('es-CO'); }

function renderProducts(){
  const grid = document.getElementById('productGrid');
  const html = products.map(p => `
    <div class="card" data-id="${p.id}">
      <img class="card-img" src="${p.imagen || p.img}" alt="${p.nombre || p.name}" loading="lazy" />
      <div class="card-body">
        <div class="card-name">${p.nombre || p.name}</div>
        <div class="card-price">${formatPrice(p.precio || p.price)}</div>
        <div class="card-stock">${(p.stock || 0) > 0 ? 'Disponibles: ' + (p.stock || 0) + ' unidades' : 'Agotado'}</div>
        <div class="card-row">
          <button class="btn-buy" data-add="${p.id}" ${(p.stock || 0) <= 0 ? 'disabled' : ''}>Comprar</button>
          <button class="btn-buy" data-view="${p.id}" style="background:#D1C4E9;color:#333;">Ver</button>
        </div>
      </div>
    </div>
  `).join('');
  grid.innerHTML = html + html;
  // event delegation
  grid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    const viewBtn = e.target.closest('[data-view]');
    if (addBtn) { e.stopPropagation(); addToCart(+addBtn.dataset.add); return; }
    if (viewBtn) { e.stopPropagation(); openModal(+viewBtn.dataset.view); return; }
    const card = e.target.closest('.card');
    if (card) openModal(+card.dataset.id);
  });
  initScroller();
}

function addToCart(id){
  const item = cart.find(c => c.id === id);
  if (item) item.qty += 1;
  else { const p = products.find(x => x.id === id); cart.push({ id, name: p.nombre || p.name, price: p.precio || p.price, img: p.imagen || p.img, qty: 1 }); }
  saveCart(); updateCartUI(); pulseCart();
  showToast('Agregado al carrito');
}
function removeFromCart(id){ cart = cart.filter(c => c.id !== id); saveCart(); updateCartUI(); }
function changeQty(id, delta){
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); }
}
function updateCartUI(){
  const count = cart.reduce((s,c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = count;
  const itemsEl = document.getElementById('cartItems');
  if (cart.length === 0) itemsEl.innerHTML = '<div class="empty">Tu carrito está vacío.</div>';
  else {
    itemsEl.innerHTML = cart.map(c => `
      <div class="cart-item">
        <img src="${c.img}" alt="${c.name}" />
        <div class="cart-item-info">
          <div class="cart-item-name">${c.name}</div>
          <div class="cart-item-price">${formatPrice(c.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-dec="${c.id}">−</button>
            <span class="qty-val">${c.qty}</span>
            <button class="qty-btn" data-inc="${c.id}">+</button>
            <button class="qty-btn" data-rem="${c.id}" style="margin-left:auto;">×</button>
          </div>
        </div>
      </div>
    `).join('');
    itemsEl.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => changeQty(+b.dataset.dec, -1)));
    itemsEl.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => changeQty(+b.dataset.inc, 1)));
    itemsEl.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => removeFromCart(+b.dataset.rem)));
  }
  const total = cart.reduce((s,c) => s + c.price * c.qty, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}
function pulseCart(){
  const b = document.getElementById('cartBtn');
  b.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}], {duration:260});
}
function openModal(id){
  const p = products.find(x => x.id === id);
  document.getElementById('modalBody').innerHTML = `
    <img src="${p.imagen || p.img}" alt="${p.nombre || p.name}" />
    <h3>${p.nombre || p.name}</h3>
    <div class="price">${formatPrice(p.precio || p.price)}</div>
    <div class="desc">${p.descripcion || p.desc}</div>
    <div class="modal-actions">
      <button class="btn btn-pink" id="modalAdd">Agregar al carrito</button>
      <a class="btn btn-pink-outline" href="${waLink('Hola, me interesa: ' + p.name)}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
    </div>
  `;
  document.getElementById('modalAdd').addEventListener('click', () => { addToCart(p.id); closeModal(); });
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modal').classList.add('open');
}
function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modal').classList.remove('open');
}
function waLink(msg){ return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg); }
function checkout(){
  if (cart.length === 0) return;
  const lines = cart.map(c => `• ${c.name} x${c.qty} — ${formatPrice(c.price * c.qty)}`).join('\n');
  const total = cart.reduce((s,c) => s + c.price * c.qty, 0);
  const msg = 'Hola, quiero hacer este pedido:\n\n' + lines + '\n\nTotal: ' + formatPrice(total);
  window.open(waLink(msg), '_blank');
}

/* Scroller */
let scrollerX = 0;
let scrollerPaused = false;
let dragging = false, dragStartX = 0, dragStartScroll = 0;
function initScroller(){
  const track = document.getElementById('productGrid');
  const scroller = document.getElementById('productScroller');
  let halfWidth = track.scrollWidth / 2;
  function step(){
    if (!scrollerPaused && !dragging) {
      scrollerX -= 0.6;
      if (Math.abs(scrollerX) >= halfWidth) scrollerX = 0;
      track.style.transform = `translateX(${scrollerX}px)`;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  scroller.addEventListener('mouseenter', () => scrollerPaused = true);
  scroller.addEventListener('mouseleave', () => { scrollerPaused = false; dragging = false; });
  scroller.addEventListener('mousedown', (e) => { dragging = true; dragStartX = e.clientX; dragStartScroll = scrollerX; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    scrollerX = dragStartScroll + (e.clientX - dragStartX);
    if (scrollerX > 0) scrollerX = -halfWidth + (scrollerX % halfWidth);
    if (Math.abs(scrollerX) >= halfWidth) scrollerX += halfWidth;
    track.style.transform = `translateX(${scrollerX}px)`;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  // touch
  scroller.addEventListener('touchstart', (e) => { dragging = true; dragStartX = e.touches[0].clientX; dragStartScroll = scrollerX; }, {passive:true});
  scroller.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    scrollerX = dragStartScroll + (e.touches[0].clientX - dragStartX);
    if (Math.abs(scrollerX) >= halfWidth) scrollerX = scrollerX % halfWidth;
    track.style.transform = `translateX(${scrollerX}px)`;
  }, {passive:true});
  scroller.addEventListener('touchend', () => { dragging = false; });
}
document.getElementById('cartBtn').addEventListener('click', () => {
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
});
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
function closeDrawer(){
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}
document.getElementById('modalOverlay').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('checkoutBtn').addEventListener('click', checkout);

document.getElementById('waContact').href = waLink('Hola, quisiera más información.');
document.getElementById('fabWa').href = waLink('Hola, quisiera más información.');

// Dynamic load from productos.json
async function loadProducts() {
  try {
    const res = await fetch('productos.json?v=' + Date.now());
    products = await res.json();
  } catch (e) { /* keep defaults */ }
  renderProducts();
  updateCartUI();
}

// 7-click hidden trigger on logo
let logoClicks = 0;
let logoTimer = null;
document.querySelector('.logo').addEventListener('click', (e) => {
  e.preventDefault();
  logoClicks++;
  if (logoTimer) clearTimeout(logoTimer);
  logoTimer = setTimeout(() => { logoClicks = 0; }, 4000);
  if (logoClicks >= 7) {
    logoClicks = 0;
    openAdminLogin();
  }
});

function openAdminLogin() {
  document.getElementById('adminLoginOverlay').classList.add('open');
  document.getElementById('adminLoginModal').classList.add('open');
}
function closeAdminLogin() {
  document.getElementById('adminLoginOverlay').classList.remove('open');
  document.getElementById('adminLoginModal').classList.remove('open');
}
document.getElementById('adminLoginClose').addEventListener('click', closeAdminLogin);
document.getElementById('adminLoginOverlay').addEventListener('click', closeAdminLogin);

const WORKER_URL = 'https://yoosi-vanity-api.miguelluquesuares.workers.dev';

document.getElementById('adminLoginBtn').addEventListener('click', async () => {
  const pwd = document.getElementById('adminPwd').value;
  const msg = document.getElementById('adminLoginMsg');
  msg.textContent = 'Verificando...';
  try {
    const res = await fetch(WORKER_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    const data = await res.json();
    if (!res.ok) { msg.textContent = data.error || 'Error'; return; }
    sessionStorage.setItem('yv_token', data.token);
    closeAdminLogin();
    openAdminPanel();
  } catch (e) { msg.textContent = 'Error de red'; }
});

function openAdminPanel() {
  document.getElementById('adminPanelOverlay').classList.add('open');
  document.getElementById('adminPanel').classList.add('open');
  renderAdmin();
}
function closeAdminPanel() {
  document.getElementById('adminPanelOverlay').classList.remove('open');
  document.getElementById('adminPanel').classList.remove('open');
}
document.getElementById('adminLogout').addEventListener('click', () => {
  sessionStorage.removeItem('yv_token');
  closeAdminPanel();
});

function renderAdmin() {
  const body = document.getElementById('adminBody');
  body.innerHTML = products.map((p, i) => `
    <div class="admin-row" data-i="${i}">
      <input value="${p.nombre}" data-f="nombre" placeholder="Nombre" />
      <input value="${p.categoria}" data-f="categoria" placeholder="Categoría" />
      <input type="number" value="${p.precio}" data-f="precio" placeholder="Precio" />
      <input type="number" value="${p.stock}" data-f="stock" placeholder="Stock" />
      <input value="${p.imagen}" data-f="imagen" placeholder="Ruta imagen" />
      <input value="${p.enlacePago}" data-f="enlacePago" placeholder="Enlace pago" />
      <textarea data-f="descripcion" placeholder="Descripción">${p.descripcion}</textarea>
      <div class="admin-row-actions">
        <input type="file" accept="image/*" data-file="${i}" />
        <button class="btn-buy" data-del="${i}" style="background:#ff6b6b;color:#fff;">Eliminar</button>
      </div>
    </div>
  `).join('') + `<button class="btn btn-pink" id="adminAdd">+ Nuevo producto</button>`;
  body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    products.splice(+b.dataset.del, 1);
    renderAdmin();
  }));
  body.querySelectorAll('input[data-file]').forEach(input => {
    input.addEventListener('change', async () => {
      const i = +input.dataset.file;
      const file = input.files[0];
      if (!file) return;
      const token = sessionStorage.getItem('yv_token');
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const status = document.getElementById('adminStatus');
        status.textContent = 'Subiendo imagen...';
        try {
          const res = await fetch(WORKER_URL + '/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ filename: file.name, content: base64 }),
          });
          const data = await res.json();
          if (!res.ok) { status.textContent = data.error || 'Error al subir'; return; }
          products[i].imagen = data.path;
          status.textContent = 'Imagen subida: ' + data.path;
          renderAdmin();
        } catch (e) { status.textContent = 'Error de red'; }
      };
      reader.readAsDataURL(file);
    });
  });
  body.querySelectorAll('input[data-f],textarea[data-f]').forEach(inp => {
    inp.addEventListener('change', () => {
      const row = inp.closest('.admin-row');
      const i = +row.dataset.i;
      const f = inp.dataset.f;
      products[i][f] = (f === 'precio' || f === 'stock') ? Number(inp.value) : inp.value;
    });
  });
  document.getElementById('adminAdd').addEventListener('click', () => {
    products.push({ id: Date.now(), nombre: '', categoria: '', precio: 0, stock: 0, descripcion: '', imagen: '', enlacePago: '' });
    renderAdmin();
  });
}

document.getElementById('adminSave').addEventListener('click', async () => {
  const status = document.getElementById('adminStatus');
  const token = sessionStorage.getItem('yv_token');
  status.textContent = 'Guardando en GitHub...';
  try {
    const res = await fetch(WORKER_URL + '/update-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ products }),
    });
    const data = await res.json();
    if (!res.ok) { status.textContent = data.error || 'Error'; return; }
    status.textContent = data.message || 'Catálogo actualizado.';
    renderProducts();
  } catch (e) { status.textContent = 'Error de red'; }
});

document.getElementById('adminPanelOverlay').addEventListener('click', closeAdminPanel);

// override products decl (make mutable)
// products already declared with let? check
loadProducts();