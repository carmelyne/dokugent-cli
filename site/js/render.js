function loadPage(file) {
  fetch(`docs/${file}`)
    .then(res => res.text())
    .then(md => {
      document.getElementById('content').innerHTML = marked.parse(md);
    })
    .catch(err => {
      document.getElementById('content').innerHTML = `<p>Failed to load: ${file}</p>`;
      console.error(err);
    });
}
