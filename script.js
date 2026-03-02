document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("uploadForm");
  const message = document.getElementById("message");
  const fileList = document.getElementById("fileList");

  // Upload
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    message.textContent = data.message;

    loadFiles();
    form.reset();
  });

  // Load Files
  async function loadFiles() {
    const response = await fetch("/files");
    const files = await response.json();

    fileList.innerHTML = "";

    files.forEach(file => {
      const li = document.createElement("li");
      li.textContent = file.originalname;
      fileList.appendChild(li);
    });
  }

  loadFiles();
});
