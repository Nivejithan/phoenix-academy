# Phoenix Rising Academy — Management Dashboard

Management system for teacher monthly memberships and operational expenses.

---

## 🚀 How to Link MongoDB (Recommended)

### 1. Get a Free MongoDB Atlas Database
1. Go to **[mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)** and sign up for free.
2. Select **M0 Free Cluster** (Shared) and click **Create Deployment**.
3. Under **Security Quickstart**:
   - Create a database user (e.g., Username: `phoenix`, Password: `YourSecretPassword123`).
   - Add IP Address `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect** → choose **Drivers** (Node.js).
5. Copy your connection string:
   ```
   mongodb+srv://phoenix:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Add to `.env`
Open `.env` in this directory and replace `MONGODB_URI`:
```env
MONGODB_URI=mongodb+srv://phoenix:YourSecretPassword123@cluster0.xxxx.mongodb.net/phoenix_academy?retryWrites=true&w=majority
ADMIN_PASSWORD=Phoenix@2024
PORT=3000
```

### 3. Deploy for Free to Render or Railway
To host it online with MongoDB for free:
1. Push this folder to a GitHub repository.
2. Go to **[render.com](https://render.com)** → New **Web Service** → Connect your GitHub repo.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add Environment Variables:
   - `MONGODB_URI`: your MongoDB Atlas URI
   - `ADMIN_PASSWORD`: your admin password
6. Render gives you a live URL like `https://phoenix-rising-academy.onrender.com`!

---

## 🔥 How to Link Firebase (Alternative, No Server Required)

If you prefer Firebase without needing any backend server:
1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** → Add project.
2. Build → **Realtime Database** → Create in Test Mode.
3. Project Settings (⚙️) → Your Apps → `</>` Web → Copy `firebaseConfig`.
4. Paste it in `index.html` lines 624–632.
5. Drag and drop `index.html` to **[netlify.com/drop](https://app.netlify.com/drop)** — instant live site!
