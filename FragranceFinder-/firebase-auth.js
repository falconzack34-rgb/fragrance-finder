import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const cfg = window.FIREBASE_CONFIG;
const successMsg = document.getElementById("successMsg");

function show(msg, ok=true){
  successMsg.hidden = false;
  successMsg.textContent = msg;
  successMsg.style.borderColor = ok ? "rgba(62,230,177,.45)" : "rgba(255,100,100,.45)";
  successMsg.style.background = ok ? "rgba(62,230,177,.12)" : "rgba(255,100,100,.12)";
}

if (!cfg || !cfg.apiKey) {
  // Site still works without auth, but signup will show this
  console.warn("Firebase not configured yet.");
}

const app = cfg?.apiKey ? initializeApp(cfg) : null;
const auth = app ? getAuth(app) : null;

// Modal open/close
const modal = document.getElementById("modal");
const backdrop = document.getElementById("modalBackdrop");
const signupBtn = document.getElementById("signupBtn");
const closeModalBtn = document.getElementById("closeModal");

function openModal(){ modal.hidden = false; backdrop.hidden = false; successMsg.hidden = true; }
function closeModal(){ modal.hidden = true; backdrop.hidden = true; }

signupBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);

// Signup submit
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!auth) {
    show("❌ Firebase not set up yet. Add your Firebase config first.", false);
    return;
  }

  const email = document.getElementById("email").value.trim().toLowerCase();
  const email2 = document.getElementById("email2").value.trim().toLowerCase();
  const pw = document.getElementById("password").value;
  const pw2 = document.getElementById("password2").value;
  const coc = document.getElementById("cocAgree").checked;

  if (!coc) return show("❌ You must agree to the Code of Conduct.", false);
  if (email !== email2) return show("❌ Emails do not match.", false);
  if (pw !== pw2) return show("❌ Passwords do not match.", false);
  if (pw.length < 8) return show("❌ Password must be at least 8 characters.", false);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    await sendEmailVerification(cred.user);
    show("✅ Account created! Check your email and verify your address.");
  } catch (err) {
    show(`❌ Signup failed: ${err.message}`, false);
  }
});
