(function() {
  var script = document.currentScript;
  var baseUrl = script.src.replace('/booking-widget.js', '');
  var salonId = script.getAttribute('data-salon-id') || 'default';
  var primaryColor = script.getAttribute('data-color') || 'c83232';

  // Create floating button
  var btn = document.createElement('button');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Prenota';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:linear-gradient(135deg,#' + primaryColor + ',#6b3fa0);color:white;border:none;padding:14px 24px;border-radius:16px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(0,0,0,0.2);font-family:-apple-system,BlinkMacSystemFont,sans-serif;transition:transform 0.2s';
  btn.onmouseenter = function() { btn.style.transform = 'scale(1.05)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };

  // Create modal overlay
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;padding:16px';

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/booking?salonId=' + salonId;
  iframe.style.cssText = 'width:100%;max-width:440px;height:80vh;max-height:700px;border:none;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.3)';

  // Create close button
  var close = document.createElement('button');
  close.innerHTML = '&times;';
  close.style.cssText = 'position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.9);border:none;width:36px;height:36px;border-radius:50%;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#333';

  overlay.appendChild(iframe);
  overlay.appendChild(close);

  btn.onclick = function() { overlay.style.display = 'flex'; };
  close.onclick = function() { overlay.style.display = 'none'; };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };

  document.body.appendChild(btn);
  document.body.appendChild(overlay);
})();
