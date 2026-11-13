// Moved out of os.html (S333) so the page's Content-Security-Policy can refuse inline script.
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('os-ready');
});
