'use strict';
const agree = document.getElementById('agree');
const accept = document.getElementById('accept');
const error = document.getElementById('error');
agree.addEventListener('change', () => { accept.disabled = !agree.checked; });
document.getElementById('decline').addEventListener('click', async () => { await window.brightdeskTerms.decline(); });
accept.addEventListener('click', async () => {
  if (!agree.checked) return;
  accept.disabled = true;
  try { await window.brightdeskTerms.accept(); }
  catch (e) { error.textContent = `Could not save your agreement: ${e.message}`; accept.disabled = false; }
});
window.brightdeskTerms.getText().then(text => { document.getElementById('terms').textContent = text; }).catch(e => { document.getElementById('terms').textContent = 'The Terms and Conditions could not be loaded. Installation cannot continue.'; error.textContent = e.message; });
