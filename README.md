# Vault Backend

Express + MongoDB + Multer backend for the Vault project.

---

## Folder Structure

```
vault-backend/
├── public/              ← PUT your frontend files here (index.html, style.css, app.js)
├── uploads/             ← uploaded files saved here (auto created)
├── config/
│   ├── db.js            ← MongoDB connection
│   └── multer.js        ← file upload config
├── models/
│   └── Entry.js         ← MongoDB schema
├── routes/
│   └── entryRoutes.js   ← all API routes
├── server.js            ← main entry point
├── package.json
├── .env                 ← your secrets (never commit this)
└── .gitignore
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Check if server is running |
| POST | /api/submit | Submit form data + optional file |
| GET | /api/entries | Get all entries |
| GET | /api/entries/:id | Get single entry |
| DELETE | /api/entries/:id | Delete entry |

---

## Run Locally (Windows/Mac)

### 1. Install MongoDB
Download from https://www.mongodb.com/try/download/community
Start it — it runs on port 27017 by default.

Or use MongoDB Atlas (free cloud) — get connection string from atlas.mongodb.com

### 2. Setup Project
```bash
# Clone or copy project
cd vault-backend

# Install dependencies
npm install

# Create .env file (already created — just edit MONGO_URI if needed)
# For local MongoDB:   MONGO_URI=mongodb://localhost:27017/vaultdb
# For Atlas:           MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/vaultdb
```

### 3. Add Your Frontend Files
Copy your index.html, style.css, app.js into the /public folder

### 4. Run
```bash
# Development (auto restart on file change)
npm run dev

# Production
npm start
```

Open http://localhost:5000

---

## Run on EC2

### 1. Install MongoDB on EC2
```bash
# Add MongoDB repo
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

# Install
sudo yum install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
```

### 2. Upload Your Project to EC2
```bash
# On your Windows PC (Git Bash) — copy project to EC2
scp -i ~/Documents/vault-key.pem -r ./vault-backend ec2-user@YOUR_EC2_IP:~/
```

### 3. Setup on EC2
```bash
# SSH into EC2
ssh -i ~/Documents/vault-key.pem ec2-user@YOUR_EC2_IP

# Go to project
cd ~/vault-backend

# Install dependencies
npm install

# Copy frontend files to public folder
# (if your frontend is separate)
cp ~/your-frontend/*.html public/
cp ~/your-frontend/*.css public/
cp ~/your-frontend/*.js public/
```

### 4. Start with PM2
```bash
pm2 start server.js --name vault-backend
pm2 save
pm2 startup
```

### 5. Test
```bash
curl http://localhost:5000/health
```

---

## How to Call API from Frontend (app.js)

Replace your localStorage calls with these fetch calls:

```js
// SAVE entry
async function saveEntry(name, email, message, file) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('message', message);
  if (file) formData.append('file', file);

  const res = await fetch('/api/submit', {
    method: 'POST',
    body: formData   // don't set Content-Type, browser sets it automatically
  });

  const data = await res.json();
  console.log(data);
}

// GET all entries
async function getEntries() {
  const res  = await fetch('/api/entries');
  const data = await res.json();
  console.log(data.data); // array of entries
}

// DELETE entry
async function deleteEntry(id) {
  await fetch(`/api/entries/${id}`, { method: 'DELETE' });
}
```
