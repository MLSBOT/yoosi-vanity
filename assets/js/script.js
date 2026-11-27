const WHATSAPP_NUMBER = '573023969157';

function placeholderSvg(color, label) {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='${encodeURIComponent(color)}'/><text x='50%25' y='50%25' font-family='Playfair Display,serif' font-size='22' fill='white' text-anchor='middle' dominant-baseline='middle'>${encodeURIComponent(label)}</text></svg>`;
}

const products = [
  { id:1, name:'Serum Glow', price:45000, desc:'Serum iluminador para un brillo natural y duradero.', img:placeholderSvg('#F48FB1','Serum Glow') },
  { id:2, name:'Base Velvet', price:62000, desc:'Base de cobertura media con acabado aterciopelado.', img:placeholderSvg('#D1C4E9','Base Velvet') },
  { id:3, name:'Labial Rosa', price:28000, desc:'Labial mate de larga duración en tono rosa.', img:placeholderSvg('#F8BBD0','Labial Rosa') },
  { id:4, name:'Paleta Sunset', price:75000, desc:'Paleta de sombras cálidas inspirada en el atardecer.', img:placeholderSvg('#FCE4EC','Paleta Sunset') },
];

let cart = JSON.parse(localStorage.getItem('yv_cart') || '[]');
function saveCart(){ localStorage.setItem('yv_cart', JSON.stringify(cart)); }
function formatPrice(n){ return '$' + n.toLocaleString('es-CO'); }

function renderProducts(){
  const grid = document.getElementById('productGrid');
  const html = products.map(p => `
    <div class="card" data-id="${p.id}">
      <img class="card-img" src="${p.img}" alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-price">${formatPrice(p.price)}</div>
        <div class="card-row">
          <button class="btn-buy" data-add="${p.id}">Comprar</button>
          <button class="btn-buy" data-view="${p.id}" style="background:#D1C4E9;color:#333;">Ver</button>
        </div>
      </div>
    </div>
  `).join('');
  grid.innerHTML = html + html;
  grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(+btn.dataset.add); }));
  grid.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); openModal(+btn.dataset.view); }));
  grid.querySelectorAll('.card').forEach(card => card.addEventListener('click', () => openModal(+card.dataset.id)));
  initScroller();
}

function addToCart(id){
  const item = cart.find(c => c.id === id);
  if (item) item.qty += 1;
  else { const p = products.find(x => x.id === id); cart.push({ id, name: p.name, price: p.price, img: p.img, qty: 1 }); }
  saveCart(); updateCartUI(); pulseCart();
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
function pulseCart(){
  const b = document.getElementById('cartBtn');
  b.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}], {duration:260});
}
function openModal(id){
  const p = products.find(x => x.id === id);
  document.getElementById('modalBody').innerHTML = `
    <img src="${p.img}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <div class="price">${formatPrice(p.price)}</div>
    <div class="desc">${p.desc}</div>
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

renderProducts();
updateCartUI();